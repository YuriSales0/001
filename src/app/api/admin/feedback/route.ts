import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * GET /api/admin/feedback — list guest feedback with filters
 * Query: ?status=&dimension=property|crew|platform&escalation=true&limit=
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const escalation = searchParams.get('escalation')
  const limit = Math.min(Number(searchParams.get('limit') ?? 100), 500)

  const where: Record<string, unknown> = {}
  if (status) where.callStatus = status
  if (escalation === 'true') where.escalationTriggered = true

  // Manager sees only feedback for their assigned clients
  if (me.role === 'MANAGER') {
    where.client = { managerId: me.id }
  }

  const feedback = await prisma.guestFeedback.findMany({
    where,
    include: {
      property: { select: { id: true, name: true, city: true } },
      client: { select: { id: true, name: true, email: true } },
      crewMember: { select: { id: true, name: true, email: true } },
      reservation: { select: { guestName: true, checkIn: true, checkOut: true, platform: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return NextResponse.json(feedback)
}
