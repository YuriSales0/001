import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * GET /api/admin/stay-chats
 * List stay chats (Admin sees all, Manager sees only their clients').
 * Query: ?escalated=true to filter for active escalations.
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const { searchParams } = new URL(request.url)
  const escalated = searchParams.get('escalated')

  const where: Record<string, unknown> = {}
  if (escalated === 'true') {
    where.escalationStatus = { in: ['PENDING_MANAGER', 'PENDING_ADMIN'] }
  }
  if (me.role === 'MANAGER') {
    where.client = { managerId: me.id }
  }

  const chats = await prisma.guestStayChat.findMany({
    where,
    include: {
      property: { select: { id: true, name: true, city: true } },
      reservation: { select: { guestName: true, checkIn: true, checkOut: true } },
      _count: { select: { messages: true } },
    },
    orderBy: [{ escalationStatus: 'desc' }, { lastMessageAt: 'desc' }],
    take: 100,
  })

  return NextResponse.json(chats)
}
