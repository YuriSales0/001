import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function GET() {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const [totalPoints, byMonth, byPlatform, byDayOfWeek] = await Promise.all([
    prisma.pricingDataPoint.count(),
    prisma.pricingDataPoint.groupBy({
      by: ['monthOfYear'],
      _avg: { priceCharged: true },
      _count: true,
      orderBy: { monthOfYear: 'asc' },
    }),
    prisma.pricingDataPoint.groupBy({
      by: ['platform'],
      _avg: { priceCharged: true },
      _count: true,
    }),
    prisma.pricingDataPoint.groupBy({
      by: ['dayOfWeek'],
      _avg: { priceCharged: true },
      _count: true,
      orderBy: { dayOfWeek: 'asc' },
    }),
  ])

  return NextResponse.json({ totalPoints, byMonth, byPlatform, byDayOfWeek })
}
