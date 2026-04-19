import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function GET() {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const reports = await prisma.marketReport.findMany({
    where: { type: 'WEEKLY_SCRAPE' },
    orderBy: { weekOf: 'desc' },
    take: 4,
    select: {
      weekOf: true,
      avgPrice: true,
      avgOccupancy: true,
      listingsScraped: true,
      topInsight: true,
    },
  })

  return NextResponse.json(reports)
}
