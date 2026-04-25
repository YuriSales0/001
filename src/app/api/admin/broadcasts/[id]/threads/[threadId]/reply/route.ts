import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { notify } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/broadcasts/[id]/threads/[threadId]/reply
 * Admin replies in the thread of a specific subscriber. Notifies the subscriber.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; threadId: string } },
) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const { bodyText } = await req.json().catch(() => ({}))
  if (typeof bodyText !== 'string' || bodyText.trim().length < 1) {
    return NextResponse.json({ error: 'Reply body is required' }, { status: 400 })
  }

  // Verify the thread owner is a real recipient of this broadcast
  const recipient = await prisma.broadcastRecipient.findUnique({
    where: { broadcastId_userId: { broadcastId: params.id, userId: params.threadId } },
    include: { broadcast: { select: { status: true } } },
  })
  if (!recipient) return NextResponse.json({ error: 'Thread not found' }, { status: 404 })

  // M5: only allow replies on broadcasts that have completed sending
  if (recipient.broadcast.status !== 'SENT') {
    return NextResponse.json({ error: 'Broadcast is not yet sent' }, { status: 409 })
  }

  const reply = await prisma.broadcastReply.create({
    data: {
      broadcastId: params.id,
      threadOwnerId: params.threadId,
      authorId: me.id,
      bodyText: bodyText.trim().slice(0, 5000),
    },
  })

  await notify({
    userId: params.threadId,
    type: 'BROADCAST_REPLY',
    title: `${me.name ?? 'Founder'} responded`,
    body: bodyText.trim().slice(0, 140),
    link: `/client/broadcasts/${params.id}`,
  }).catch(() => {})

  return NextResponse.json(reply)
}
