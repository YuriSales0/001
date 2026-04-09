import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await requireRole(['CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const stats = await prisma.pricingDataPoint.groupBy({
    by: ['monthOfYear'],
    where: { property: { ownerId: me.id } },
    _avg: { priceCharged: true },
    _count: true,
    orderBy: { monthOfYear: 'asc' },
  })

  return NextResponse.json(stats)
}
