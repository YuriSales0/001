import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * GET /api/group-chats/[id]/messages — list messages (paginated)
 * POST /api/group-chats/[id]/messages — send a message
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  // Verify membership
  const member = await prisma.groupChatMember.findUnique({
    where: { chatId_userId: { chatId: params.id, userId: me.id } },
  })
  if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit')) || 50, 100)

  const messages = await prisma.groupMessage.findMany({
    where: { chatId: params.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      sender: { select: { id: true, name: true, role: true, isCaptain: true } },
    },
  })

  return NextResponse.json(messages.reverse())
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const member = await prisma.groupChatMember.findUnique({
    where: { chatId_userId: { chatId: params.id, userId: me.id } },
  })
  if (!member) return NextResponse.json({ error: 'Not a member' }, { status: 403 })

  const body = await req.json()
  if (!body.body?.trim()) return NextResponse.json({ error: 'body required' }, { status: 400 })

  const [msg] = await prisma.$transaction([
    prisma.groupMessage.create({
      data: {
        chatId: params.id,
        senderId: me.id,
        body: body.body.trim().slice(0, 5000),
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
      },
    }),
    prisma.groupChat.update({
      where: { id: params.id },
      data: { updatedAt: new Date() },
    }),
  ])

  return NextResponse.json(msg, { status: 201 })
}
