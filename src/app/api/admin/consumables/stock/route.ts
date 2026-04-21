import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  try {
    const categories = await prisma.consumableCategory.findMany({
      where: { active: true },
      include: {
        stockLevel: true,
      },
      orderBy: { name: 'asc' },
    })

    // Get item counts by status per category
    const itemsByStatus = await prisma.consumableItem.groupBy({
      by: ['categoryId', 'status'],
      _count: true,
    })

    const statusMap: Record<string, Record<string, number>> = {}
    for (const row of itemsByStatus) {
      if (!statusMap[row.categoryId]) statusMap[row.categoryId] = {}
      statusMap[row.categoryId][row.status] = row._count
    }

    const result = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      unit: cat.unit,
      standardLifecycle: cat.standardLifecycle,
      imageUrl: cat.imageUrl,
      stockLevel: cat.stockLevel,
      itemsByStatus: statusMap[cat.id] || {},
    }))

    return NextResponse.json(result)
  } catch (e) {
    console.error('Error fetching stock overview:', e)
    return NextResponse.json({ error: 'Failed to fetch stock overview' }, { status: 500 })
  }
}
