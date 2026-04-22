import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * GET /api/manager/my-payouts
 *
 * Returns the authenticated Manager's own commission payouts.
 */
export async function GET(_request: NextRequest) {
  const guard = await requireRole(['MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const me = guard.user!

  const payouts = await prisma.managerPayout.findMany({
    where: { managerId: me.id },
    orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
    take: 36, // 3 years
  })

  return NextResponse.json(payouts)
}
