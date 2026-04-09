import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const { searchParams } = new URL(request.url)
  const propertyId = searchParams.get('propertyId')
  const month = parseInt(searchParams.get('month') ?? '', 10)
  const year  = parseInt(searchParams.get('year')  ?? '', 10)

  if (!propertyId || !month || !year) {
    return NextResponse.json({ error: 'propertyId, month and year are required' }, { status: 400 })
  }

  const monthStart = new Date(year, month - 1, 1)
  const monthEnd   = new Date(year, month, 1)

  const [property, reservations, expenses] = await Promise.all([
    prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        name: true,
        city: true,
        commissionRate: true,
        owner: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.reservation.findMany({
      where: {
        propertyId,
        checkIn: { gte: monthStart, lt: monthEnd },
        status: { not: 'CANCELLED' },
      },
      orderBy: { checkIn: 'asc' },
    }),
    prisma.expense.findMany({
      where: {
        propertyId,
        date: { gte: monthStart, lt: monthEnd },
      },
      orderBy: { date: 'asc' },
    }),
  ])

  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 })
  }

  const grossRevenue  = reservations.reduce((s, r) => s + r.amount, 0)
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const commissionRate = property.commissionRate
  const commission    = +(grossRevenue * commissionRate / 100).toFixed(2)
  const ownerPayout   = +(grossRevenue - totalExpenses - commission).toFixed(2)

  return NextResponse.json({
    property,
    reservations,
    expenses,
    grossRevenue,
    totalExpenses,
    commissionRate,
    commission,
    ownerPayout,
  })
}
