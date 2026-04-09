import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const in7 = new Date(now)
  in7.setDate(in7.getDate() + 7)

  const [
    propertiesCount,
    clientsCount,
    activeRes,
    monthRevenueAgg,
    openPayoutsAgg,
    paidPayoutsAgg,
    overdueTasks,
    upcomingCheckIns,
    upcomingCheckOuts,
    leadsOpen,
    pendingInvoicesAgg,
  ] = await Promise.all([
    prisma.property.count(),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.reservation.count({ where: { status: { in: ['UPCOMING', 'ACTIVE'] } } }),
    // Gross from payouts paid this month (same source as commission — consistent)
    prisma.payout.aggregate({
      _sum: { grossAmount: true },
      where: { status: 'PAID', paidAt: { gte: monthStart, lt: monthEnd } },
    }),
    prisma.payout.aggregate({
      _sum: { netAmount: true, commission: true },
      _count: true,
      where: { status: 'SCHEDULED' },
    }),
    // Commission from payouts actually paid this month (accurate, plan-aware)
    prisma.payout.aggregate({
      _sum: { grossAmount: true, commission: true },
      where: { status: 'PAID', paidAt: { gte: monthStart, lt: monthEnd } },
    }),
    prisma.task.count({
      where: { status: { not: 'COMPLETED' }, dueDate: { lt: now } },
    }),
    prisma.reservation.findMany({
      where: { checkIn: { gte: now, lt: in7 } },
      include: { property: { select: { name: true, city: true } } },
      orderBy: { checkIn: 'asc' },
      take: 10,
    }),
    prisma.reservation.findMany({
      where: { checkOut: { gte: now, lt: in7 } },
      include: { property: { select: { name: true, city: true } } },
      orderBy: { checkOut: 'asc' },
      take: 10,
    }),
    prisma.lead.count({ where: { status: { in: ['NEW', 'CONTACTED', 'QUALIFIED'] } } }),
    prisma.invoice.aggregate({
      _sum: { amount: true },
      _count: true,
      where: { status: 'SENT' },
    }),
  ])

  // Both gross and commission come from PAID payouts this month — consistent source
  const monthRevenue = monthRevenueAgg._sum.grossAmount ?? 0
  const monthCommission = paidPayoutsAgg._sum.commission ?? 0

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
