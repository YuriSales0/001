import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * GET /api/admin/stay-chats/[id] — view chat with full message history
 * POST /api/admin/stay-chats/[id] — human (Manager/Admin) replies
 * PATCH /api/admin/stay-chats/[id] — change escalation status (e.g., RESOLVED)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const chat = await prisma.guestStayChat.findUnique({
    where: { id: params.id },
    include: {
      property: { select: { name: true, city: true } },
      reservation: { select: { guestName: true, guestEmail: true, guestPhone: true, checkIn: true, checkOut: true } },
      client: { select: { id: true, name: true, email: true, managerId: true } },
      messages: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!chat) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (guard.user!.role === 'MANAGER' && chat.client.managerId !== guard.user!.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(chat)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const chat = await prisma.guestStayChat.findUnique({
    where: { id: params.id },
    select: { id: true, clientId: true, client: { select: { managerId: true } } },
  })
  if (!chat) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (me.role === 'MANAGER' && chat.client.managerId !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: { content?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const content = (body.content ?? '').trim().slice(0, 4000)
  if (!content) return NextResponse.json({ error: 'Empty message' }, { status: 400 })

  const msg = await prisma.guestStayMessage.create({
    data: {
      chatId: chat.id,
      author: me.role === 'ADMIN' ? 'ADMIN' : 'MANAGER',
      authorUserId: me.id,
      content,
    },
  })
  await prisma.guestStayChat.update({
    where: { id: chat.id },
    data: { messageCount: { increment: 1 }, lastMessageAt: new Date() },
  })
  return NextResponse.json(msg)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  let body: { action?: 'resolve' | 'escalate-admin' }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (body.action === 'resolve') {
    const updated = await prisma.guestStayChat.update({
      where: { id: params.id },
      data: { escalationStatus: 'RESOLVED', resolvedAt: new Date() },
    })
    return NextResponse.json(updated)
  }
  if (body.action === 'escalate-admin') {
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
    const updated = await prisma.guestStayChat.update({
      where: { id: params.id },
      data: {
        escalationStatus: 'PENDING_ADMIN',
        escalatedAt: new Date(),
        escalatedToUserId: admins[0]?.id ?? null,
      },
    })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
