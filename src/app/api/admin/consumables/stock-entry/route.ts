import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function POST(req: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  try {
    const { categoryId, quantity, purchasePrice, batchNumber, expenseId } = await req.json()

    if (!categoryId || !quantity || purchasePrice == null) {
      return NextResponse.json(
        { error: 'categoryId, quantity, and purchasePrice are required' },
        { status: 400 },
      )
    }

    const qty = parseInt(quantity)
    if (isNaN(qty) || qty < 1) {
      return NextResponse.json({ error: 'quantity must be a positive integer' }, { status: 400 })
    }

    const price = parseFloat(purchasePrice)
    if (isNaN(price) || price < 0) {
      return NextResponse.json({ error: 'purchasePrice must be a non-negative number' }, { status: 400 })
    }

    // Verify category exists
    const category = await prisma.consumableCategory.findUnique({
      where: { id: categoryId },
    })
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Create N ConsumableItem records with PURCHASE_ENTRY movements
    const createdItems: string[] = []

    for (let i = 0; i < qty; i++) {
      const item = await prisma.consumableItem.create({
        data: {
          categoryId,
          batchNumber: batchNumber || null,
          status: 'AVAILABLE',
          purchasePrice: price,
          purchaseDate: new Date(),
        },
      })

      await prisma.consumableMovement.create({
        data: {
          itemId: item.id,
          movementType: 'PURCHASE_ENTRY',
          toLocation: 'STORAGE',
          quantity: 1,
          notes: expenseId ? `From expense ${expenseId}` : 'Manual stock entry',
        },
      })

      createdItems.push(item.id)
    }

    // Update StockLevel
    await prisma.stockLevel.upsert({
      where: { categoryId },
      update: {
        available: { increment: qty },
        totalItems: { increment: qty },
      },
      create: {
        categoryId,
        available: qty,
        totalItems: qty,
        deployed: 0,
        inLaundry: 0,
        inTransit: 0,
        quarantine: 0,
        retired: 0,
      },
    })

    return NextResponse.json({
      ok: true,
      itemsCreated: qty,
      itemIds: createdItems,
    })
  } catch (e) {
    console.error('Error creating stock entry:', e)
    return NextResponse.json({ error: 'Failed to create stock entry' }, { status: 500 })
  }
}
