import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { notify } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

/**
 * POST /api/client/broadcasts/[id]/reply
 * Subscriber posts a reply to the founder. Creates a BroadcastReply
 * row and notifies the broadcast sender (admin).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const { bodyText } = await req.json().catch(() => ({}))
  if (typeof bodyText !== 'string' || bodyText.trim().length < 1) {
    return NextResponse.json({ error: 'Reply body is required' }, { status: 400 })
  }

  // Verify recipient exists (client must have received this broadcast)
  const recipient = await prisma.broadcastRecipient.findUnique({
    where: { broadcastId_userId: { broadcastId: params.id, userId: me.id } },
    include: { broadcast: { select: { senderId: true, subject: true } } },
  })
  if (!recipient) return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 })

  const reply = await prisma.broadcastReply.create({
    data: {
      broadcastId: params.id,
      threadOwnerId: me.id,
      authorId: me.id,
      bodyText: bodyText.trim().slice(0, 5000),
    },
  })

  // Notify the founder/admin who sent the broadcast
  await notify({
    userId: recipient.broadcast.senderId,
    type: 'BROADCAST_REPLY',
    title: `New reply: ${me.name ?? me.email}`,
    body: bodyText.trim().slice(0, 140),
    link: `/messages?broadcast=${params.id}&thread=${me.id}`,
  }).catch(() => {})

  return NextResponse.json(reply)
}
