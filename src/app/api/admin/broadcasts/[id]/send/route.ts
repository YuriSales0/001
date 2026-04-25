import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { sendEmail } from '@/lib/email'
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

  // 3. Send emails
  const senderName = guard.user!.name ?? 'Yuri Sales'
  let sent = 0
  let failed = 0

  for (const r of recipients) {
    const lang: Locale = isSupportedLocale(r.language) ? r.language : 'en'
    const t = translations[lang]
    const html = broadcastEmailHtml({
      recipientName: r.name ?? 'Owner',
      subject: t.subject,
      bodyMarkdown: t.bodyMarkdown,
      ctaText: t.ctaText,
      ctaUrl: broadcast.ctaUrl,
      senderName,
    })
    try {
      await sendEmail({ to: r.email, subject: t.subject, html })
      sent++
    } catch (e) {
      console.error(`Failed to send broadcast to ${r.email}:`, e)
      failed++
    }
  }

  // 4. Persist final state
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
