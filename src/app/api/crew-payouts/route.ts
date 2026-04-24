import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/crew-payouts — list payouts (Admin sees all, Crew sees own)
 */
export async function GET(req: NextRequest) {
  const guard = await requireRole(['ADMIN', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (me.role === 'CREW') where.crewId = me.id
  if (status) where.status = status

  const payouts = await prisma.crewPayout.findMany({
    where,
    include: {
      crew: { select: { id: true, name: true, email: true } },
      tasks: {
        select: { id: true, title: true, type: true, amount: true, property: { select: { name: true } } },
      },
    },
    orderBy: { weekStart: 'desc' },
    take: 50,
  })

  return NextResponse.json(payouts)
}
