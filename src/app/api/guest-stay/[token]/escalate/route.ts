import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { escalateStayChat } from '@/lib/guest-stay/escalation'

/**
 * POST /api/guest-stay/[token]/escalate
 * Guest manually requests escalation ("Talk to a person").
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { token: string } },
) {
  const chat = await prisma.guestStayChat.findUnique({
    where: { token: params.token },
    select: { id: true, escalationStatus: true },
  })
  if (!chat) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (chat.escalationStatus !== 'NONE') {
    return NextResponse.json({ ok: true, alreadyEscalated: true })
  }

  const result = await escalateStayChat(chat.id, 'Guest requested human', 'MANAGER')
  return NextResponse.json({ ok: true, ...result })
}
