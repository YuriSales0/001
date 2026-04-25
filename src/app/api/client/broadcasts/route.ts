import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/client/broadcasts
 * Returns all broadcasts received by the current client, in their language.
 */
export async function GET() {
  const guard = await requireRole(['CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const recipients = await prisma.broadcastRecipient.findMany({
    where: { userId: me.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      broadcast: {
        select: {
          id: true,
          subject: true,
          bodyMarkdown: true,
          ctaText: true,
          ctaUrl: true,
          translations: true,
          sender: { select: { id: true, name: true, email: true } },
          sentAt: true,
        },
      },
    },
  })

  // Pick translation for each
  const items = recipients.map(r => {
    const translations = (r.broadcast.translations as Record<string, { subject: string; bodyMarkdown: string; ctaText: string | null }> | null) ?? {}
    const localized = translations[r.language] ?? null
    return {
      id: r.broadcast.id,
      subject: localized?.subject ?? r.broadcast.subject,
      bodyPreview: (localized?.bodyMarkdown ?? r.broadcast.bodyMarkdown).slice(0, 200),
      sender: r.broadcast.sender,
      sentAt: r.broadcast.sentAt,
      readAt: r.readAt,
    }
  })

  const unreadCount = items.filter(i => !i.readAt).length

  return NextResponse.json({ items, unreadCount })
}
