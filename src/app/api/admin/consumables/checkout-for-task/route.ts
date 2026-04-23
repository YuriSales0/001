import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * POST /api/admin/consumables/checkout-for-task
 * Captain confirms crew picked up consumables for a property task.
 * Auto-withdraws stock based on PropertyConsumableSetup.
 *
 * Body: { taskId: string, propertyId: string }
 *
 * Flow:
 * 1. Read PropertyConsumableSetup for the property
 * 2. For each category with quantityPerStay > 0:
 *    - For DISPOSABLE: bulk decrement stock (items consumed)
 *    - For LAUNDERABLE: find N available items, mark as IN_TRANSIT
 * 3. Create ConsumableMovement records for audit
 * 4. Return summary of what was withdrawn
 */
export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  // Only Captain or Admin can authorize withdrawal
  if (me.role === 'CREW' && !me.isCaptain) {
    return NextResponse.json({ error: 'Only Captain can authorize stock withdrawal' }, { status: 403 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let _body: any
  try { _body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  const { taskId, propertyId } = _body
  if (!propertyId) return NextResponse.json({ error: 'propertyId required' }, { status: 400 })

  // Get property setup
  const setups = await prisma.propertyConsumableSetup.findMany({
    where: { propertyId, active: true },
    include: { category: { select: { id: true, name: true, type: true } } },
  })

  if (setups.length === 0) {
    return NextResponse.json({ error: 'No consumable setup for this property' }, { status: 404 })
  }

  const withdrawn: { category: string; type: string; quantity: number; status: string }[] = []

  await prisma.$transaction(async (tx) => {
    for (const setup of setups) {
      const qty = setup.quantityPerStay
      const cat = setup.category

      if (cat.type === 'DISPOSABLE' || cat.type === 'WELCOME_KIT') {
        // Bulk decrement — items are consumed
        const stockLevel = await tx.stockLevel.findUnique({ where: { categoryId: cat.id } })
        if (!stockLevel || stockLevel.available < qty) {
          withdrawn.push({ category: cat.name, type: cat.type, quantity: qty, status: 'INSUFFICIENT_STOCK' })
          continue
        }

        await tx.stockLevel.update({
          where: { categoryId: cat.id },
          data: {
            available: { decrement: qty },
            deployed: { increment: qty },
            totalItems: stockLevel.available + stockLevel.deployed + stockLevel.inLaundry + stockLevel.inTransit + stockLevel.quarantine + stockLevel.retired,
          },
        })

        // Create a single movement record for the batch
        await tx.consumableMovement.create({
          data: {
            itemId: cat.id, // use category ID for bulk
            movementType: 'CHECKOUT_FROM_STORAGE',
            fromLocation: 'STORAGE',
            toLocation: propertyId,
            propertyId,
            crewMemberId: me.id,
            quantity: qty,
            notes: taskId ? `Task: ${taskId}` : null,
          },
        })

        withdrawn.push({ category: cat.name, type: cat.type, quantity: qty, status: 'OK' })

      } else if (cat.type === 'LAUNDERABLE' || cat.type === 'DURABLE') {
        // Find N available items and mark as IN_TRANSIT
        const items = await tx.consumableItem.findMany({
          where: { categoryId: cat.id, status: 'AVAILABLE' },
          take: qty,
          select: { id: true },
        })

        if (items.length < qty) {
          withdrawn.push({ category: cat.name, type: cat.type, quantity: items.length, status: `PARTIAL (${items.length}/${qty})` })
        }

        for (const item of items) {
          await tx.consumableItem.update({
            where: { id: item.id },
            data: { status: 'IN_TRANSIT', currentPropertyId: propertyId },
          })
          await tx.consumableMovement.create({
            data: {
              itemId: item.id,
              movementType: 'CHECKOUT_FROM_STORAGE',
              fromLocation: 'STORAGE',
              toLocation: propertyId,
              propertyId,
              crewMemberId: me.id,
              quantity: 1,
              notes: taskId ? `Task: ${taskId}` : null,
            },
          })
        }

        // Update stock level
        const actualQty = items.length
        if (actualQty > 0) {
          await tx.stockLevel.update({
            where: { categoryId: cat.id },
            data: {
              available: { decrement: actualQty },
              inTransit: { increment: actualQty },
            },
          })
        }

        if (items.length === qty) {
          withdrawn.push({ category: cat.name, type: cat.type, quantity: qty, status: 'OK' })
        }
      }
    }
  })

  return NextResponse.json({ propertyId, taskId, withdrawn })
}
