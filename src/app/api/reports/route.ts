import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function GET(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const where: Record<string, unknown> = {}
    if (propertyId) where.propertyId = propertyId
    if (month) where.month = parseInt(month, 10)
    if (year) where.year = parseInt(year, 10)

    const reports = await prisma.monthlyReport.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            city: true,
            ownerId: true,
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    })

    return NextResponse.json(reports)
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  try {
    const body = await request.json()
    const { propertyId, month, year } = body

    if (!propertyId || !month || !year) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyId, month, year' },
        { status: 400 }
      )
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    const startDate = new Date(year, month - 1, 1)
    const endDate = new Date(year, month, 0, 23, 59, 59, 999)

    const reservations = await prisma.reservation.findMany({
      where: {
        propertyId,
        checkIn: { gte: startDate },
        checkOut: { lte: endDate },
        status: { not: 'CANCELLED' },
      },
    })

    const grossRevenue = reservations.reduce(
      (sum, reservation) => sum + reservation.amount,
      0
    )

    const expenses = await prisma.expense.findMany({
      where: {
        propertyId,
        date: { gte: startDate, lte: endDate },
      },
    })

    const totalExpenses = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    )

    const commission = grossRevenue * (property.commissionRate / 100)
    const ownerPayout = grossRevenue - totalExpenses - commission

    const report = await prisma.monthlyReport.upsert({
      where: {
        propertyId_month_year: {
          propertyId,
          month,
          year,
        },
      },
      update: {
        grossRevenue,
        totalExpenses,
        commission,
        ownerPayout,
      },
      create: {
        propertyId,
        month,
        year,
        grossRevenue,
        totalExpenses,
        commission,
        ownerPayout,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            city: true,
            commissionRate: true,
          },
        },
      },
    })

    return NextResponse.json(report, { status: 201 })
  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}
