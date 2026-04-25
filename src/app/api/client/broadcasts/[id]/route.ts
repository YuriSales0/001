import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/client/broadcasts/[id]
 * Returns the broadcast in the client's language + reply thread.
 * Marks as read on first GET.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const guard = await requireRole(['CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const recipient = await prisma.broadcastRecipient.findUnique({
    where: { broadcastId_userId: { broadcastId: params.id, userId: me.id } },
    include: {
      broadcast: {
        include: { sender: { select: { id: true, name: true, email: true, image: true } } },
      },
    },
  })

  if (!recipient) return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 })

  const translations = (recipient.broadcast.translations as Record<string, { subject: string; bodyMarkdown: string; ctaText: string | null }> | null) ?? {}
  const localized = translations[recipient.language] ?? null

  const replies = await prisma.broadcastReply.findMany({
    where: { broadcastId: params.id, threadOwnerId: me.id },
    orderBy: { createdAt: 'asc' },
    include: { author: { select: { id: true, name: true, email: true, role: true, image: true } } },
  })

  // Mark broadcast as read (first time only)
  if (!recipient.readAt) {
    await prisma.broadcastRecipient.update({
      where: { id: recipient.id },
      data: { readAt: new Date() },
    }).catch(() => {})
  }

  // Mark any unread admin replies as read
  await prisma.broadcastReply.updateMany({
    where: {
      broadcastId: params.id,
      threadOwnerId: me.id,
      authorId: { not: me.id },
      readAt: null,
    },
    data: { readAt: new Date() },
  }).catch(() => {})

  return NextResponse.json({
    id: recipient.broadcast.id,
    subject: localized?.subject ?? recipient.broadcast.subject,
    bodyMarkdown: localized?.bodyMarkdown ?? recipient.broadcast.bodyMarkdown,
    ctaText: localized?.ctaText ?? recipient.broadcast.ctaText,
    ctaUrl: recipient.broadcast.ctaUrl,
    sender: recipient.broadcast.sender,
    sentAt: recipient.broadcast.sentAt,
    language: recipient.language,
    replies,
  })
}
