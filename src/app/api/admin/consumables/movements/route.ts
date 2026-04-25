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

    // Validate movementType against the enum to surface 400 instead of a
    // generic 500 from Prisma when an invalid string slips through.
    const VALID_MOVEMENT_TYPES = [
      'CHECKOUT_FROM_STORAGE', 'CHECKIN_TO_PROPERTY', 'PICKUP_FROM_PROPERTY',
      'SEND_TO_LAUNDRY', 'RETURN_FROM_LAUNDRY', 'RETURN_TO_STORAGE',
      'RETIRED', 'QUARANTINED', 'PURCHASE_ENTRY',
    ]
    if (movementType && !VALID_MOVEMENT_TYPES.includes(movementType)) {
      return NextResponse.json({ error: `Invalid movementType: ${movementType}` }, { status: 400 })
    }

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
      // M2: read item AND validate stock inside the transaction so two
      // concurrent movements can't both pass the negative-stock check
      // before either commits. Outer findUnique was a TOCTOU window.
      try {
        const result = await prisma.$transaction(async (tx) => {
          const item = await tx.consumableItem.findUnique({
            where: { id: itemId },
            include: { category: true },
          })
          if (!item) throw new Error('NOT_FOUND')

          const statusUpdate = getStatusForMovement(movementType)
          const stockDelta = getStockDelta(movementType, item.status)

          if (stockDelta) {
            const currentStock = await tx.stockLevel.findUnique({
              where: { categoryId: item.categoryId },
            })
            if (currentStock) {
              const validationError = validateStockDelta(currentStock, stockDelta)
              if (validationError) throw new Error(`STOCK:${validationError}`)
            }
          }

          // Update item status
          await tx.consumableItem.update({
            where: { id: itemId },
            data: {
              status: statusUpdate,
              currentPropertyId: propertyId || null,
              ...(movementType === 'RETURN_FROM_LAUNDRY' ? { washCount: { increment: 1 } } : {}),
              ...(movementType === 'RETIRED' ? { retiredAt: new Date(), retireReason: notes || 'Retired' } : {}),
            },
          })

          // Create movement record
          await tx.consumableMovement.create({
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
            await tx.stockLevel.update({
              where: { categoryId: item.categoryId },
              data: stockDelta,
            })
            // Recalculate totalItems as sum of all counters (Issue 6.1)
            await recalcTotalItems(tx, item.categoryId)
          }

          return { itemId }
        })
        return NextResponse.json({ ok: true, ...result })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'UNKNOWN'
        if (msg === 'NOT_FOUND') return NextResponse.json({ error: 'Item not found' }, { status: 404 })
        if (msg.startsWith('STOCK:')) return NextResponse.json({ error: msg.slice(6) }, { status: 400 })
        throw e
      }
    }

    // For bulk movements by category (DISPOSABLE)
    if (categoryId && quantity) {
      const qty = parseInt(quantity)
      if (isNaN(qty) || qty < 1) {
        return NextResponse.json({ error: 'quantity must be a positive integer' }, { status: 400 })
      }

      // Issue 3.5: Reject unsupported bulk movement types
      const supportedBulkTypes = ['CHECKOUT_FROM_STORAGE', 'RETURN_TO_STORAGE', 'RETIRED']
      if (!supportedBulkTypes.includes(movementType)) {
        return NextResponse.json(
          { error: `Bulk movement type '${movementType}' is not supported. Supported: ${supportedBulkTypes.join(', ')}` },
          { status: 400 },
        )
      }

      // M2: read items + stock inside the transaction to close the TOCTOU
      // window for concurrent bulk movements on the same category.
      try {
        await prisma.$transaction(async (tx) => {
          const items = await tx.consumableItem.findMany({
            where: { categoryId, status: 'AVAILABLE' },
            take: qty,
            orderBy: { createdAt: 'asc' },
          })
          if (items.length < qty) {
            throw new Error(`STOCK:Only ${items.length} items available, requested ${qty}`)
          }

          const stockDelta = getStockDeltaBulk(movementType, qty)

          if (stockDelta) {
            const currentStock = await tx.stockLevel.findUnique({ where: { categoryId } })
            if (currentStock) {
              const validationError = validateStockDelta(currentStock, stockDelta)
              if (validationError) throw new Error(`STOCK:${validationError}`)
            }
          }

          const statusUpdate = getStatusForMovement(movementType)
          const itemIds = items.map(i => i.id)

          // Update all items
          await tx.consumableItem.updateMany({
            where: { id: { in: itemIds } },
            data: {
              status: statusUpdate,
              currentPropertyId: propertyId || null,
            },
          })

          // Create movement records (createMany — single roundtrip vs N inserts)
          await tx.consumableMovement.createMany({
            data: items.map(item => ({
              itemId: item.id,
              movementType,
              propertyId: propertyId || null,
              crewMemberId: crewMemberId || null,
              quantity: 1,
              notes: notes || null,
            })),
          })

          // Update stock level
          if (stockDelta) {
            await tx.stockLevel.update({
              where: { categoryId },
              data: stockDelta,
            })
            // Recalculate totalItems as sum of all counters (Issue 6.1)
            await recalcTotalItems(tx, categoryId)
          }
        })
        return NextResponse.json({ ok: true, itemsProcessed: qty })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'UNKNOWN'
        if (msg.startsWith('STOCK:')) return NextResponse.json({ error: msg.slice(6) }, { status: 400 })
        throw e
      }
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

// Maps item status to the StockLevel counter field name
function statusToCounter(status: string): string {
  switch (status) {
    case 'AVAILABLE': return 'available'
    case 'DEPLOYED': return 'deployed'
    case 'IN_TRANSIT': return 'inTransit'
    case 'WASHING': return 'inLaundry'
    case 'QUARANTINE': return 'quarantine'
    case 'RETIRED': return 'retired'
    default: return 'available'
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getStockDelta(movementType: string, currentItemStatus?: string): Record<string, any> | null {
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
    case 'RETIRED': {
      // Decrement whatever counter the item is currently in
      const counter = statusToCounter(currentItemStatus || 'AVAILABLE')
      return { [counter]: { decrement: 1 }, retired: { increment: 1 } }
    }
    case 'QUARANTINED': {
      const counter = statusToCounter(currentItemStatus || 'AVAILABLE')
      return { [counter]: { decrement: 1 }, quarantine: { increment: 1 } }
    }
    default:
      return null
  }
}

/** Validate that applying a stock delta won't make any counter go below 0 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateStockDelta(currentStock: Record<string, any>, delta: Record<string, any>): string | null {
  const counterFields = ['available', 'deployed', 'inTransit', 'inLaundry', 'quarantine', 'retired']
  for (const field of counterFields) {
    if (delta[field]?.decrement) {
      const current = Number(currentStock[field] ?? 0)
      const dec = Number(delta[field].decrement)
      if (current - dec < 0) {
        return `Insufficient stock: ${field} has ${current} items but tried to decrement by ${dec}`
      }
    }
  }
  return null
}

/** Recalculate totalItems as sum of all counter fields */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function recalcTotalItems(tx: any, categoryId: string) {
  const stock = await tx.stockLevel.findUnique({ where: { categoryId } })
  if (!stock) return
  const total = stock.available + stock.deployed + stock.inTransit + stock.inLaundry + stock.quarantine + stock.retired
  await tx.stockLevel.update({
    where: { categoryId },
    data: { totalItems: total },
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getStockDeltaBulk(movementType: string, qty: number): Record<string, any> | null {
  switch (movementType) {
    case 'CHECKOUT_FROM_STORAGE':
      return { available: { decrement: qty }, inTransit: { increment: qty } }
    case 'RETURN_TO_STORAGE':
      return { inTransit: { decrement: qty }, available: { increment: qty } }
    case 'RETIRED':
      return { available: { decrement: qty }, retired: { increment: qty } }
    default:
      return null
  }
}
