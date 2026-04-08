import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const { searchParams } = new URL(req.url)
  const clientId = searchParams.get('clientId') || undefined

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const in7 = new Date(now)
  in7.setDate(in7.getDate() + 7)

  // Scope queries by client if requested
  const propOwnerWhere = clientId ? { ownerId: clientId } : {}
  const propRelWhere = clientId ? { property: { ownerId: clientId } } : {}

  const [
    propertiesCount,
    clientsCount,
    activeRes,
    monthRevenueAgg,
    openPayoutsAgg,
    overdueTasks,
    upcomingCheckIns,
    upcomingCheckOuts,
    leadsOpen,
    pendingInvoicesAgg,
  ] = await Promise.all([
    prisma.property.count({ where: propOwnerWhere }),
    clientId
      ? Promise.resolve(1)
      : prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.reservation.count({
      where: { status: { in: ['UPCOMING', 'ACTIVE'] }, ...propRelWhere },
    }),
    prisma.reservation.aggregate({
      _sum: { amount: true },
      where: { checkIn: { gte: monthStart, lt: monthEnd }, ...propRelWhere },
    }),
    prisma.payout.aggregate({
      _sum: { netAmount: true, commission: true },
      _count: true,
      where: { status: 'SCHEDULED', ...propRelWhere },
    }),
    prisma.task.count({
      where: {
        status: { not: 'COMPLETED' },
        dueDate: { lt: now },
        ...(clientId ? { property: { ownerId: clientId } } : {}),
      },
    }),
    prisma.reservation.findMany({
      where: { checkIn: { gte: now, lt: in7 }, ...propRelWhere },
      include: { property: { select: { name: true, city: true } } },
      orderBy: { checkIn: 'asc' },
      take: 10,
    }),
    prisma.reservation.findMany({
      where: { checkOut: { gte: now, lt: in7 }, ...propRelWhere },
      include: { property: { select: { name: true, city: true } } },
      orderBy: { checkOut: 'asc' },
      take: 10,
    }),
    clientId
      ? Promise.resolve(0)
      : prisma.lead.count({ where: { status: { in: ['NEW', 'CONTACTED', 'QUALIFIED'] } } }),
    prisma.invoice.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { status: 'SENT', ...(clientId ? { clientId } : {}) },
    }),
  ])

  const monthRevenue = monthRevenueAgg._sum.amount ?? 0
  const monthCommission = +(monthRevenue * 0.18).toFixed(2)

  return NextResponse.json({
    propertiesCount,
    clientsCount,
    activeReservations: activeRes,
    monthRevenue,
    monthCommission,
    openPayouts: {
      count: openPayoutsAgg._count,
      net: openPayoutsAgg._sum.netAmount ?? 0,
      commission: openPayoutsAgg._sum.commission ?? 0,
    },
    overdueTasks,
    upcomingCheckIns,
    upcomingCheckOuts,
    leadsOpen,
    pendingInvoices: {
      count: pendingInvoicesAgg._count,
      total: pendingInvoicesAgg._sum.amount ?? 0,
    },
  })
}
