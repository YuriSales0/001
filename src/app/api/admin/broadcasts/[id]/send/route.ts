import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { sendEmail } from '@/lib/email'
import { notifyMany } from '@/lib/notifications'
import { broadcastEmailHtml, translateBroadcast, isSupportedLocale, type Locale } from '@/lib/broadcast'
import { buildAudienceWhere } from '../../audience-count/route'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/broadcasts/[id]/send
 *
 * Body: { sourceLocale: 'pt' | 'en' | ... } — language the admin composed in.
 *
 * Pipeline:
 * 1. Resolve recipients from audience filter
 * 2. Group by language; for each unique target language, translate via Claude (cached)
 * 3. Send branded email per recipient in their language
 * 4. Update broadcast status, recipientCount, failedCount, translations cache
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const broadcast = await prisma.broadcast.findUnique({ where: { id: params.id } })
  if (!broadcast) return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 })
  if (broadcast.status === 'SENT' || broadcast.status === 'SENDING') {
    return NextResponse.json({ error: `Already ${broadcast.status}` }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const sourceLocaleRaw = typeof body.sourceLocale === 'string' ? body.sourceLocale : 'pt'
  const sourceLocale: Locale = isSupportedLocale(sourceLocaleRaw) ? sourceLocaleRaw : 'pt'

  // 1. Resolve recipients
  const where = buildAudienceWhere(broadcast.audienceType, broadcast.audienceValue)
  if (!where) return NextResponse.json({ error: 'Invalid audience' }, { status: 400 })

  const recipients = await prisma.user.findMany({
    where,
    select: { id: true, email: true, name: true, language: true },
  })
  if (recipients.length === 0) {
    return NextResponse.json({ error: 'No recipients match this audience' }, { status: 400 })
  }

  // Mark as sending
  await prisma.broadcast.update({
    where: { id: params.id },
    data: { status: 'SENDING' },
  })

  // 2. Build translation cache for unique languages
  const langs = new Set<Locale>()
  for (const r of recipients) {
    const l = isSupportedLocale(r.language) ? r.language : 'en'
    langs.add(l)
  }

  const cachedTranslations = (broadcast.translations as Record<string, { subject: string; bodyMarkdown: string; ctaText: string | null }> | null) ?? {}
  const translations: Record<string, { subject: string; bodyMarkdown: string; ctaText: string | null }> = { ...cachedTranslations }

  for (const lang of Array.from(langs)) {
    if (translations[lang]) continue
    try {
      translations[lang] = await translateBroadcast(
        {
          subject: broadcast.subject,
          bodyMarkdown: broadcast.bodyMarkdown,
          ctaText: broadcast.ctaText,
        },
        lang,
        sourceLocale,
      )
    } catch (e) {
      console.error(`Translation to ${lang} failed:`, e)
      // Fallback: use source content
      translations[lang] = {
        subject: broadcast.subject,
        bodyMarkdown: broadcast.bodyMarkdown,
        ctaText: broadcast.ctaText,
      }
    }
  }

  // 3. Build platform link for the broadcast (used as default CTA when admin didn't set one)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') ?? ''
  const platformUrl = baseUrl ? `${baseUrl}/client/broadcasts/${broadcast.id}` : null
  const effectiveCtaUrl = broadcast.ctaUrl || platformUrl

  // 4. Send emails + create BroadcastRecipient rows
  const senderName = guard.user!.name ?? 'Yuri Sales'
  let sent = 0
  let failed = 0
  const deliveredUserIds: string[] = []

  for (const r of recipients) {
    const lang: Locale = isSupportedLocale(r.language) ? r.language : 'en'
    const t = translations[lang]
    // If admin didn't set their own CTA, default to "Reply on the portal"
    const ctaText = t.ctaText || (lang === 'pt' ? 'Responder no portal'
      : lang === 'es' ? 'Responder en el portal'
      : lang === 'de' ? 'Im Portal antworten'
      : lang === 'nl' ? 'Reageer in het portaal'
      : lang === 'fr' ? 'Répondre sur le portail'
      : lang === 'sv' ? 'Svara i portalen'
      : lang === 'da' ? 'Svar i portalen'
      : 'Reply on the portal')
    const html = broadcastEmailHtml({
      recipientName: r.name ?? 'Owner',
      subject: t.subject,
      bodyMarkdown: t.bodyMarkdown,
      ctaText,
      ctaUrl: effectiveCtaUrl,
      senderName,
    })
    try {
      await sendEmail({ to: r.email, subject: t.subject, html })
      sent++
      deliveredUserIds.push(r.id)

      // Persist recipient record (idempotent via unique constraint)
      await prisma.broadcastRecipient.upsert({
        where: { broadcastId_userId: { broadcastId: broadcast.id, userId: r.id } },
        create: {
          broadcastId: broadcast.id,
          userId: r.id,
          language: lang,
          delivered: true,
        },
        update: { delivered: true, language: lang },
      }).catch(() => { /* ignore — recipient row is best-effort */ })
    } catch (e) {
      console.error(`Failed to send broadcast to ${r.email}:`, e)
      failed++
    }
  }

  // 5. Notifications inside the platform (one per delivered recipient)
  if (deliveredUserIds.length > 0) {
    const titleByLang: Record<string, string> = {
      pt: 'Mensagem do founder',
      en: 'Message from the founder',
      es: 'Mensaje del fundador',
      de: 'Nachricht vom Gründer',
      nl: 'Bericht van de oprichter',
      fr: 'Message du fondateur',
      sv: 'Meddelande från grundaren',
      da: 'Besked fra grundlæggeren',
    }
    // Issue one notification per language to keep titles localized
    const byLang = new Map<string, string[]>()
    for (const r of recipients) {
      if (!deliveredUserIds.includes(r.id)) continue
      const l = isSupportedLocale(r.language) ? r.language : 'en'
      if (!byLang.has(l)) byLang.set(l, [])
      byLang.get(l)!.push(r.id)
    }
    for (const [lang, ids] of Array.from(byLang.entries())) {
      const title = titleByLang[lang] ?? titleByLang.en
      const subjectInLang = translations[lang as Locale]?.subject ?? broadcast.subject
      await notifyMany(ids, {
        type: 'BROADCAST_RECEIVED',
        title,
        body: subjectInLang.slice(0, 140),
        link: `/client/broadcasts/${broadcast.id}`,
      }).catch(() => {})
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
}
