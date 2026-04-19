import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

/** GET /api/conversations
 *  CLIENT  → returns their single conversation (creates if missing)
 *  MANAGER → returns only their own client conversations (scoped by managerId)
 *  ADMIN   → returns all conversations (read-only)
 */
export async function GET(_req: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  if (me.role === 'CLIENT') {
    // Fetch managerId from DB (not in session type)
    const dbUser = await prisma.user.findUnique({
      where: { id: me.id },
      select: { managerId: true },
    })
    if (!dbUser?.managerId) {
      return NextResponse.json({ error: 'No manager assigned' }, { status: 400 })
    }
    const managerId = dbUser.managerId
    // Upsert conversation
    const conv = await prisma.conversation.upsert({
      where: { clientId_managerId: { clientId: me.id, managerId } },
      create: { clientId: me.id, managerId },
      update: {},
      include: {
        manager: { select: { id: true, name: true, email: true, image: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { sender: { select: { id: true, name: true, role: true, image: true } } },
        },
      },
    })
    return NextResponse.json([conv])
  }

  if (me.role === 'MANAGER') {
    const convs = await prisma.conversation.findMany({
      where: { managerId: me.id },
      include: {
        client:  { select: { id: true, name: true, email: true, image: true } },
        manager: { select: { id: true, name: true, email: true, image: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { sender: { select: { id: true, name: true, role: true, image: true } } },
        },
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    // Annotate with unread count for this manager
    const withMeta = await Promise.all(convs.map(async c => {
      const unread = await prisma.message.count({
        where: {
          conversationId: c.id,
          senderId: { not: me.id },
          readAt: null,
        },
      })
      return {
        ...c,
        unreadCount: unread,
        readonly: false,
      }
    }))

    return NextResponse.json(withMeta)
  }

  // ADMIN — all conversations, all read-only
  const convs = await prisma.conversation.findMany({
    include: {
      client:  { select: { id: true, name: true, email: true, image: true } },
      manager: { select: { id: true, name: true, email: true, image: true } },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })
  return NextResponse.json(convs.map(c => ({ ...c, readonly: true, unreadCount: 0 })))
}
