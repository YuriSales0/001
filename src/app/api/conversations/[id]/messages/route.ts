import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

/** GET /api/conversations/[id]/messages — fetch messages and mark unread as read */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const conv = await prisma.conversation.findUnique({ where: { id: params.id } })
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // CLIENT can only see their own conversation
  if (me.role === 'CLIENT' && conv.clientId !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // MANAGER: own conversations are writable, others are read-only (both allowed for GET)

  const messages = await prisma.message.findMany({
    where: { conversationId: params.id },
    orderBy: { createdAt: 'asc' },
    include: { sender: { select: { id: true, name: true, role: true } } },
  })

  // Mark unread messages as read (only messages NOT from me)
  if (me.role !== 'ADMIN') {
    await prisma.message.updateMany({
      where: {
        conversationId: params.id,
        senderId: { not: me.id },
        readAt: null,
      },
      data: { readAt: new Date() },
    })
  }

  return NextResponse.json(messages)
}

/** POST /api/conversations/[id]/messages — send a message */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['MANAGER', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const conv = await prisma.conversation.findUnique({ where: { id: params.id } })
  if (!conv) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Only participants can write
  if (conv.clientId !== me.id && conv.managerId !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { body } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Empty message' }, { status: 400 })

  const message = await prisma.message.create({
    data: {
      conversationId: params.id,
      senderId: me.id,
      body: body.trim(),
    },
    include: { sender: { select: { id: true, name: true, role: true } } },
  })

  // Bump conversation updatedAt
  await prisma.conversation.update({
    where: { id: params.id },
    data: { updatedAt: new Date() },
  })

  return NextResponse.json(message, { status: 201 })
}
