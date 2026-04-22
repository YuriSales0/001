import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await requireRole(['MANAGER', 'ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const monthEnd   = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  const in7 = new Date(now)
  in7.setDate(in7.getDate() + 7)

  // Scope: clients managed by this manager (ADMIN sees all)
  const clientWhere = me.role === 'ADMIN' ? {} : { managerId: me.id }
  const propWhere   = me.role === 'ADMIN' ? {} : { owner: { managerId: me.id } }

  const [
    propertiesCount,
    clientsCount,
    activeReservations,
    openPayoutsAgg,
    paidPayoutsAgg,
    overdueTasks,
    upcomingCheckIns,
    upcomingCheckOuts,
    pendingInvoicesAgg,
  ] = await Promise.all([
    prisma.property.count({ where: propWhere }),
    prisma.user.count({ where: { role: 'CLIENT', ...clientWhere } }),
    prisma.reservation.count({
      where: { status: { in: ['UPCOMING', 'ACTIVE'] }, property: propWhere },
    }),
    prisma.payout.aggregate({
      _sum: { netAmount: true, commission: true },
      _count: true,
      where: { status: 'SCHEDULED', property: propWhere },
    }),
    prisma.payout.aggregate({
      _sum: { grossAmount: true, commission: true },
      where: { status: 'PAID', paidAt: { gte: monthStart, lt: monthEnd }, property: propWhere },
    }),
    prisma.task.count({
      where: { status: { not: 'COMPLETED' }, dueDate: { lt: now }, property: propWhere },
    }),
    prisma.reservation.findMany({
      where: { checkIn: { gte: now, lt: in7 }, property: propWhere },
      include: { property: { select: { name: true, city: true } } },
      orderBy: { checkIn: 'asc' },
      take: 10,
    }),
    prisma.reservation.findMany({
      where: { checkOut: { gte: now, lt: in7 }, property: propWhere },
      include: { property: { select: { name: true, city: true } } },
      orderBy: { checkOut: 'asc' },
      take: 10,
    }),
    prisma.paymentReceipt.aggregate({
      _sum: { grossAmount: true },
      _count: true,
      where: { status: 'PENDING', client: clientWhere },
    }),
  ])

  return NextResponse.json({
    propertiesCount,
    clientsCount,
    activeReservations,
    rentalVolume:    paidPayoutsAgg._sum.grossAmount ?? 0,
    rentalCommission: paidPayoutsAgg._sum.commission ?? 0,
    openPayouts: {
      count:      openPayoutsAgg._count,
      net:        openPayoutsAgg._sum.netAmount ?? 0,
      commission: openPayoutsAgg._sum.commission ?? 0,
    },
    overdueTasks,
    upcomingCheckIns,
    upcomingCheckOuts,
    pendingInvoices: {
      count: pendingInvoicesAgg._count,
      total: Number(pendingInvoicesAgg._sum?.grossAmount ?? 0),
    },
  })
}
