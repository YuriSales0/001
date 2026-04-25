import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/consumables/items?categoryId=X
 * Returns individual consumable items for a specific category.
 * Admin + Captain only.
 */
export async function GET(req: NextRequest) {
  const guard = await requireRole(['ADMIN', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  if (guard.user!.role === 'CREW' && !guard.user!.isCaptain) {
    return NextResponse.json({ error: 'Only Crew Captains can view inventory items' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get('categoryId')
  const status = searchParams.get('status')

  const where: Record<string, unknown> = {}
  if (categoryId) where.categoryId = categoryId
  if (status) where.status = status

  const items = await prisma.consumableItem.findMany({
    where,
    take: 500,
    orderBy: { createdAt: 'desc' },
    include: {
      category: { select: { id: true, name: true, type: true, unit: true } },
      currentProperty: { select: { id: true, name: true } },
      movements: {
        orderBy: { executedAt: 'desc' },
        take: 1,
        select: { movementType: true, executedAt: true, notes: true },
      },
    },
  })

  return NextResponse.json(items)
}
