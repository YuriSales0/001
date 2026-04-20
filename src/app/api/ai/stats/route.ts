import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function GET() {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  // Exclude data points from cancelled reservations
  const activeFilter = {
    OR: [
      { reservationId: null },
      { reservation: { status: { not: 'CANCELLED' as const } } },
    ],
  }

  const [totalPoints, byMonth, byPlatform, byDayOfWeek] = await Promise.all([
    prisma.pricingDataPoint.count({ where: activeFilter }),
    prisma.pricingDataPoint.groupBy({
      by: ['monthOfYear'],
      where: activeFilter,
      _avg: { priceCharged: true },
      _count: true,
      orderBy: { monthOfYear: 'asc' },
    }),
    prisma.pricingDataPoint.groupBy({
      by: ['platform'],
      where: activeFilter,
      _avg: { priceCharged: true },
      _count: true,
    }),
    prisma.pricingDataPoint.groupBy({
      by: ['dayOfWeek'],
      where: activeFilter,
      _avg: { priceCharged: true },
      _count: true,
      orderBy: { dayOfWeek: 'asc' },
    }),
  ])

  return NextResponse.json({ totalPoints, byMonth, byPlatform, byDayOfWeek })
}
