import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * GET /api/admin/manager-payouts
 *
 * List all manager payouts with optional filters.
 * Query params: status, year, month, managerId
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const year = searchParams.get('year')
  const month = searchParams.get('month')
  const managerId = searchParams.get('managerId')

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (year) where.periodYear = Number(year)
  if (month) where.periodMonth = Number(month)
  if (managerId) where.managerId = managerId

  const payouts = await prisma.managerPayout.findMany({
    where,
    include: {
      manager: { select: { id: true, name: true, email: true } },
    },
    orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }, { createdAt: 'desc' }],
    take: 500,
  })

  return NextResponse.json(payouts)
}
