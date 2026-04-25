import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Admin + Captain can read stock overview
  const guard = await requireRole(['ADMIN', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  if (guard.user!.role === 'CREW' && !guard.user!.isCaptain) {
    return NextResponse.json({ error: 'Only Crew Captains can view stock' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const lowOnly = searchParams.get('lowOnly') === 'true'

  try {
    const categories = await prisma.consumableCategory.findMany({
      where: { active: true },
      include: { stockLevel: true },
      orderBy: { name: 'asc' },
    })

    const itemsByStatus = await prisma.consumableItem.groupBy({
      by: ['categoryId', 'status'],
      _count: true,
    })

    const statusMap: Record<string, Record<string, number>> = {}
    for (const row of itemsByStatus) {
      if (!statusMap[row.categoryId]) statusMap[row.categoryId] = {}
      statusMap[row.categoryId][row.status] = row._count
    }

    const result = categories
      .map(cat => ({
        id: cat.id,
        categoryId: cat.id,
        categoryName: cat.name,
        name: cat.name,
        type: cat.type,
        unit: cat.unit,
        standardLifecycle: cat.standardLifecycle,
        imageUrl: cat.imageUrl,
        stockLevel: cat.stockLevel,
        available: cat.stockLevel?.available ?? 0,
        minimumLevel: cat.stockLevel?.minimumLevel ?? 0,
        itemsByStatus: statusMap[cat.id] || {},
      }))
      .filter(cat => {
        if (!lowOnly) return true
        const min = cat.stockLevel?.minimumLevel ?? 0
        const avail = cat.stockLevel?.available ?? 0
        return min > 0 && avail <= min
      })

    return NextResponse.json(result)
  } catch (e) {
    console.error('Error fetching stock overview:', e)
    return NextResponse.json({ error: 'Failed to fetch stock overview' }, { status: 500 })
  }
}
