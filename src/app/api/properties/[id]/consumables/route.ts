import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  try {
    const setups = await prisma.propertyConsumableSetup.findMany({
      where: { propertyId: params.id, active: true },
      include: {
        category: {
          select: { id: true, name: true, type: true, unit: true },
        },
      },
      orderBy: { category: { name: 'asc' } },
    })

    return NextResponse.json(setups)
  } catch (e) {
    console.error('Error fetching property consumable setup:', e)
    return NextResponse.json({ error: 'Failed to fetch setup' }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  try {
    const { categoryId, quantityPerStay, notes } = await req.json()

    if (!categoryId || quantityPerStay == null) {
      return NextResponse.json(
        { error: 'categoryId and quantityPerStay are required' },
        { status: 400 },
      )
    }

    const qty = parseInt(quantityPerStay)
    if (isNaN(qty) || qty <= 0) {
      return NextResponse.json({ error: 'quantityPerStay must be a positive integer (> 0)' }, { status: 400 })
    }

    // Verify category exists
    const category = await prisma.consumableCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    })
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Verify property exists
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      select: { id: true },
    })
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Upsert the setup
    const setup = await prisma.propertyConsumableSetup.upsert({
      where: {
        propertyId_categoryId: {
          propertyId: params.id,
          categoryId,
        },
      },
      update: {
        quantityPerStay: qty,
        notes: notes || null,
        active: qty > 0,
      },
      create: {
        propertyId: params.id,
        categoryId,
        quantityPerStay: qty,
        notes: notes || null,
        active: qty > 0,
      },
    })

    return NextResponse.json({ ok: true, id: setup.id })
  } catch (e) {
    console.error('Error saving property consumable setup:', e)
    return NextResponse.json({ error: 'Failed to save setup' }, { status: 500 })
  }
}
