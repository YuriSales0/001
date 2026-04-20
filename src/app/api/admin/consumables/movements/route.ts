import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const guard = await requireRole(['ADMIN', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  // CREW must be Captain to access movements
  if (guard.user!.role === 'CREW' && !guard.user!.isCaptain) {
    return NextResponse.json({ error: 'Only Crew Captains can access movements' }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const movementType = searchParams.get('movementType')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: Record<string, unknown> = {}
    if (movementType) where.movementType = movementType
    if (dateFrom || dateTo) {
      where.executedAt = {}
      if (dateFrom) (where.executedAt as Record<string, unknown>).gte = new Date(dateFrom)
      if (dateTo) (where.executedAt as Record<string, unknown>).lte = new Date(dateTo)
    }

    const movements = await prisma.consumableMovement.findMany({
      where,
      include: {
        item: {
          include: {
            category: { select: { id: true, name: true, type: true } },
          },
        },
        property: { select: { id: true, name: true } },
      },
      orderBy: { executedAt: 'desc' },
      take: 100,
    })

    return NextResponse.json(movements)
  } catch (e) {
    console.error('Error fetching movements:', e)
    return NextResponse.json({ error: 'Failed to fetch movements' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireRole(['ADMIN', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  // CREW must be Captain to record movements
  if (guard.user!.role === 'CREW' && !guard.user!.isCaptain) {
    return NextResponse.json({ error: 'Only Crew Captains can record movements' }, { status: 403 })
  }

  try {
    const { itemId, categoryId, quantity, movementType, propertyId, crewMemberId, notes } = await req.json()

    if (!movementType) {
      return NextResponse.json({ error: 'movementType is required' }, { status: 400 })
    }

    const validMovements = [
      'CHECKOUT_FROM_STORAGE', 'CHECKIN_TO_PROPERTY', 'PICKUP_FROM_PROPERTY',
      'SEND_TO_LAUNDRY', 'RETURN_FROM_LAUNDRY', 'RETURN_TO_STORAGE',
      'RETIRED', 'QUARANTINED', 'PURCHASE_ENTRY',
    ]
    if (!validMovements.includes(movementType)) {
      return NextResponse.json({ error: 'Invalid movement type' }, { status: 400 })
    }

    // For single-item movements (LAUNDERABLE tracking)
    if (itemId) {
      const item = await prisma.consumableItem.findUnique({
        where: { id: itemId },
        include: { category: true },
      })
      if (!item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 })
      }

      const statusUpdate = getStatusForMovement(movementType)
      const stockDelta = getStockDelta(movementType)

      // Update item status
      await prisma.consumableItem.update({
        where: { id: itemId },
        data: {
          status: statusUpdate,
          currentPropertyId: propertyId || null,
          ...(movementType === 'RETURN_FROM_LAUNDRY' ? { washCount: { increment: 1 } } : {}),
          ...(movementType === 'RETIRED' ? { retiredAt: new Date(), retireReason: notes || 'Retired' } : {}),
        },
      })

      // Create movement record
      await prisma.consumableMovement.create({
        data: {
          itemId,
          movementType,
          propertyId: propertyId || null,
          crewMemberId: crewMemberId || null,
          quantity: 1,
          notes: notes || null,
        },
      })

      // Update stock level
      if (stockDelta) {
        await prisma.stockLevel.update({
          where: { categoryId: item.categoryId },
          data: stockDelta,
        })
      }

      return NextResponse.json({ ok: true, itemId })
    }

    // For bulk movements by category (DISPOSABLE)
    if (categoryId && quantity) {
      const qty = parseInt(quantity)
      if (isNaN(qty) || qty < 1) {
        return NextResponse.json({ error: 'quantity must be a positive integer' }, { status: 400 })
      }

      // Find available items in the category
      const items = await prisma.consumableItem.findMany({
        where: { categoryId, status: 'AVAILABLE' },
        take: qty,
        orderBy: { createdAt: 'asc' },
      })

      if (items.length < qty) {
        return NextResponse.json(
          { error: `Only ${items.length} items available, requested ${qty}` },
          { status: 400 },
        )
      }

      const statusUpdate = getStatusForMovement(movementType)
      const itemIds = items.map(i => i.id)

      // Update all items
      await prisma.consumableItem.updateMany({
        where: { id: { in: itemIds } },
        data: {
          status: statusUpdate,
          currentPropertyId: propertyId || null,
        },
      })

      // Create movement records
      for (const item of items) {
        await prisma.consumableMovement.create({
          data: {
            itemId: item.id,
            movementType,
            propertyId: propertyId || null,
            crewMemberId: crewMemberId || null,
            quantity: 1,
            notes: notes || null,
          },
        })
      }

      // Update stock level
      const stockDelta = getStockDeltaBulk(movementType, qty)
      if (stockDelta) {
        await prisma.stockLevel.update({
          where: { categoryId },
          data: stockDelta,
        })
      }

      return NextResponse.json({ ok: true, itemsProcessed: qty })
    }

    return NextResponse.json(
      { error: 'Either itemId or categoryId+quantity is required' },
      { status: 400 },
    )
  } catch (e) {
    console.error('Error recording movement:', e)
    return NextResponse.json({ error: 'Failed to record movement' }, { status: 500 })
  }
}

type ItemStatusType = 'AVAILABLE' | 'DEPLOYED' | 'IN_TRANSIT' | 'WASHING' | 'QUARANTINE' | 'RETIRED'

function getStatusForMovement(movementType: string): ItemStatusType {
  switch (movementType) {
    case 'CHECKOUT_FROM_STORAGE': return 'IN_TRANSIT'
    case 'CHECKIN_TO_PROPERTY': return 'DEPLOYED'
    case 'PICKUP_FROM_PROPERTY': return 'IN_TRANSIT'
    case 'SEND_TO_LAUNDRY': return 'WASHING'
    case 'RETURN_FROM_LAUNDRY': return 'AVAILABLE'
    case 'RETURN_TO_STORAGE': return 'AVAILABLE'
    case 'RETIRED': return 'RETIRED'
    case 'QUARANTINED': return 'QUARANTINE'
    default: return 'AVAILABLE'
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getStockDelta(movementType: string): Record<string, any> | null {
  switch (movementType) {
    case 'CHECKOUT_FROM_STORAGE':
      return { available: { decrement: 1 }, inTransit: { increment: 1 } }
    case 'CHECKIN_TO_PROPERTY':
      return { inTransit: { decrement: 1 }, deployed: { increment: 1 } }
    case 'PICKUP_FROM_PROPERTY':
      return { deployed: { decrement: 1 }, inTransit: { increment: 1 } }
    case 'SEND_TO_LAUNDRY':
      return { inTransit: { decrement: 1 }, inLaundry: { increment: 1 } }
    case 'RETURN_FROM_LAUNDRY':
      return { inLaundry: { decrement: 1 }, available: { increment: 1 } }
    case 'RETURN_TO_STORAGE':
      return { inTransit: { decrement: 1 }, available: { increment: 1 } }
    case 'RETIRED':
      return { available: { decrement: 1 }, retired: { increment: 1 } }
    case 'QUARANTINED':
      return { available: { decrement: 1 }, quarantine: { increment: 1 } }
    default:
      return null
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getStockDeltaBulk(movementType: string, qty: number): Record<string, any> | null {
  switch (movementType) {
    case 'CHECKOUT_FROM_STORAGE':
      return { available: { decrement: qty }, deployed: { increment: qty } }
    case 'RETURN_TO_STORAGE':
      return { deployed: { decrement: qty }, available: { increment: qty } }
    case 'RETIRED':
      return { available: { decrement: qty }, retired: { increment: qty } }
    default:
      return null
  }
}
