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
  // M13: defensive — requireRole with isSuperUser short-circuits for ADMINs.
  // Block CLIENT routes if the caller isn't actually a CLIENT (no impersonation set).
  if (me.role !== 'CLIENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { bodyText } = await req.json().catch(() => ({}))
  if (typeof bodyText !== 'string' || bodyText.trim().length < 1) {
    return NextResponse.json({ error: 'Reply body is required' }, { status: 400 })
  }

  // Verify recipient exists (client must have received this broadcast)
  const recipient = await prisma.broadcastRecipient.findUnique({
    where: { broadcastId_userId: { broadcastId: params.id, userId: me.id } },
    include: { broadcast: { select: { senderId: true, subject: true, status: true } } },
  })
  if (!recipient) return NextResponse.json({ error: 'Broadcast not found' }, { status: 404 })

  // M5: only allow replies on broadcasts that have completed sending
  if (recipient.broadcast.status !== 'SENT') {
    return NextResponse.json({ error: 'Broadcast is not yet sent' }, { status: 409 })
  }

  const reply = await prisma.broadcastReply.create({
    data: {
      broadcastId: params.id,
      threadOwnerId: me.id,
      authorId: me.id,
      bodyText: bodyText.trim().slice(0, 5000),
    },
  })

  // Notify the founder/admin who sent the broadcast (senderId may be null
  // if the original admin user was deleted — broadcast survives, notification
  // simply skipped).
  if (recipient.broadcast.senderId) {
    await notify({
      userId: recipient.broadcast.senderId,
      type: 'BROADCAST_REPLY',
      title: `New reply: ${me.name ?? me.email}`,
      body: bodyText.trim().slice(0, 140),
      link: `/messages?broadcast=${params.id}&thread=${me.id}`,
    }).catch(() => {})
  }

  return NextResponse.json(reply)
}
