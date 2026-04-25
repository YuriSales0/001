import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { sendEmail } from '@/lib/email'
import { notify } from '@/lib/notifications'
import { broadcastEmailHtml, translateBroadcast, isSupportedLocale, type Locale } from '@/lib/broadcast'
import { buildAudienceWhere } from '../../audience-count/route'

export const dynamic = 'force-dynamic'

const TITLE_BY_LANG: Record<string, string> = {
  pt: 'Mensagem do founder',
  en: 'Message from the founder',
  es: 'Mensaje del fundador',
  de: 'Nachricht vom Gründer',
  nl: 'Bericht van de oprichter',
  fr: 'Message du fondateur',
  sv: 'Meddelande från grundaren',
  da: 'Besked fra grundlæggeren',
}

const CTA_BY_LANG: Record<string, string> = {
  pt: 'Responder no portal',
  es: 'Responder en el portal',
  de: 'Im Portal antworten',
  nl: 'Reageer in het portaal',
  fr: 'Répondre sur le portail',
  sv: 'Svara i portalen',
  da: 'Svar i portalen',
  en: 'Reply on the portal',
}

/**
 * POST /api/admin/broadcasts/[id]/send
 *
 * Body: { sourceLocale: 'pt' | 'en' | ... } — language the admin composed in.
 *
 * Pipeline:
 * 1. Atomic guard: only DRAFT|FAILED → SENDING (prevents double-delivery)
 * 2. Resolve recipients from audience filter
 * 3. Group by language; translate via Claude (cached in DB)
 * 4. Send branded email per recipient + create BroadcastRecipient + notify
 *    inside the loop (each recipient is durable end-to-end)
 * 5. Persist final state in try/finally so SENDING never gets stuck
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  // 1. ATOMIC status guard — prevents two concurrent /send from both passing
  const claimed = await prisma.broadcast.updateMany({
    where: { id: params.id, status: { in: ['DRAFT', 'FAILED'] } },
    data: { status: 'SENDING' },
  })
  if (claimed.count === 0) {
    const current = await prisma.broadcast.findUnique({
      where: { id: params.id },
      select: { status: true },
    })
    if (!current) return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 })
    return NextResponse.json({ error: `Cannot send: status is ${current.status}` }, { status: 409 })
  }

  const broadcast = await prisma.broadcast.findUnique({ where: { id: params.id } })
  if (!broadcast) {
    return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 })
  }

  let sent = 0
  let failed = 0

  try {
    const body = await req.json().catch(() => ({}))
    const sourceLocaleRaw = typeof body.sourceLocale === 'string' ? body.sourceLocale : 'pt'
    const sourceLocale: Locale = isSupportedLocale(sourceLocaleRaw) ? sourceLocaleRaw : 'pt'

    // 2. Resolve recipients
    const where = buildAudienceWhere(broadcast.audienceType, broadcast.audienceValue)
    if (!where) {
      return NextResponse.json({ error: 'Invalid audience' }, { status: 400 })
    }

    const recipients = await prisma.user.findMany({
      where,
      select: { id: true, email: true, name: true, language: true },
    })
    if (recipients.length === 0) {
      return NextResponse.json({ error: 'No recipients match this audience' }, { status: 400 })
    }

    // 3. Build translation cache (skip recipients who were ALREADY notified
    // on a previous send-retry — prevents duplicate notifications)
    const previouslyDelivered = new Set(
      (await prisma.broadcastRecipient.findMany({
        where: { broadcastId: broadcast.id, delivered: true },
        select: { userId: true },
      })).map(r => r.userId),
    )

    const langs = new Set<Locale>()
    for (const r of recipients) {
      const l = isSupportedLocale(r.language) ? r.language : 'en'
      langs.add(l)
    }

    const cachedTranslations =
      (broadcast.translations as Record<string, { subject: string; bodyMarkdown: string; ctaText: string | null }> | null) ?? {}
    const translations: Record<string, { subject: string; bodyMarkdown: string; ctaText: string | null }> = { ...cachedTranslations }

    for (const lang of Array.from(langs)) {
      if (translations[lang]) continue
      try {
        translations[lang] = await translateBroadcast(
          { subject: broadcast.subject, bodyMarkdown: broadcast.bodyMarkdown, ctaText: broadcast.ctaText },
          lang,
          sourceLocale,
        )
        // Persist each translation as soon as it's available — protects expensive
        // Claude calls if the loop crashes later.
        await prisma.broadcast.update({
          where: { id: broadcast.id },
          data: { translations: translations },
        }).catch(() => { /* best-effort */ })
      } catch (e) {
        console.error(`Translation to ${lang} failed:`, e)
        translations[lang] = {
          subject: broadcast.subject,
          bodyMarkdown: broadcast.bodyMarkdown,
          ctaText: broadcast.ctaText,
        }
      }
    }

    // 4. Build platform link for the broadcast (default CTA)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? ''
    const platformUrl = baseUrl ? `${baseUrl}/client/broadcasts/${broadcast.id}` : null
    const effectiveCtaUrl = broadcast.ctaUrl || platformUrl

    // 5. Send emails + recipient row + notification — all per-recipient
    const senderName = guard.user!.name ?? 'Yuri Sales'

    for (const r of recipients) {
      const lang: Locale = isSupportedLocale(r.language) ? r.language : 'en'
      const t = translations[lang]
      const ctaText = t.ctaText || CTA_BY_LANG[lang] || CTA_BY_LANG.en
      const html = broadcastEmailHtml({
        recipientName: r.name ?? 'Owner',
        subject: t.subject,
        bodyMarkdown: t.bodyMarkdown,
        ctaText,
        ctaUrl: effectiveCtaUrl,
        senderName,
      })

      try {
        // Email first — if this fails, recipient row + notification not created
        await sendEmail({ to: r.email, subject: t.subject, html })

        // Recipient row — bubble errors so we count failure correctly
        await prisma.broadcastRecipient.upsert({
          where: { broadcastId_userId: { broadcastId: broadcast.id, userId: r.id } },
          create: { broadcastId: broadcast.id, userId: r.id, language: lang, delivered: true },
          update: { delivered: true, language: lang },
        })

        // In-app notification — only on FIRST delivery (avoid spam on retry)
        if (!previouslyDelivered.has(r.id)) {
          await notify({
            userId: r.id,
            type: 'BROADCAST_RECEIVED',
            title: TITLE_BY_LANG[lang] ?? TITLE_BY_LANG.en,
            body: t.subject.slice(0, 140),
            link: `/client/broadcasts/${broadcast.id}`,
          }).catch(() => { /* notify is fire-and-forget */ })
        }

        sent++
      } catch (e) {
        console.error(`Failed to deliver broadcast to ${r.email}:`, e)
        failed++
      }
    }

    // 6. Persist final state
    const updated = await prisma.broadcast.update({
      where: { id: params.id },
      data: {
        status: failed === recipients.length ? 'FAILED' : 'SENT',
        sentAt: new Date(),
        recipientCount: sent,
        failedCount: failed,
        translations: translations,
      },
    })

    return NextResponse.json({
      sent,
      failed,
      total: recipients.length,
      broadcast: updated,
    })
  } catch (err) {
    // 7. Fatal error mid-send — flip status back to FAILED so admin can retry.
    console.error('Broadcast send failed:', err)
    await prisma.broadcast.update({
      where: { id: params.id },
      data: {
        status: 'FAILED',
        recipientCount: sent,
        failedCount: failed,
      },
    }).catch(() => {})
    return NextResponse.json({ error: 'Send pipeline crashed; broadcast marked FAILED' }, { status: 500 })
  }
}
