import { NextRequest, NextResponse } from 'next/server'
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
        _count: {
          select: {
            items: true,
            propertySetups: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(categories)
  } catch (e) {
    console.error('Error fetching consumable categories:', e)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  try {
    const { name, type, unit, standardLifecycle, imageUrl } = await req.json()

    if (!name || !type) {
      return NextResponse.json({ error: 'name and type are required' }, { status: 400 })
    }

    const validTypes = ['LAUNDERABLE', 'DISPOSABLE', 'DURABLE', 'WELCOME_KIT']
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: 'Invalid consumable type' }, { status: 400 })
    }

    const category = await prisma.consumableCategory.create({
      data: {
        name,
        type,
        unit: unit || 'unit',
        standardLifecycle: standardLifecycle ? parseInt(standardLifecycle) : null,
        imageUrl: imageUrl || null,
      },
    })

    // Create initial StockLevel record
    await prisma.stockLevel.create({
      data: {
        categoryId: category.id,
        totalItems: 0,
        available: 0,
        deployed: 0,
        inLaundry: 0,
        inTransit: 0,
        quarantine: 0,
        retired: 0,
        minimumLevel: 0,
        criticalLevel: 0,
      },
    })

    return NextResponse.json({ ok: true, id: category.id })
  } catch (e) {
    console.error('Error creating consumable category:', e)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}
