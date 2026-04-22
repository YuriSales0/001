import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { HOUSE_RULES } from '@/lib/house-rules'

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CLIENT', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  try {
    const { id } = params

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            managerId: true,
          },
        },
        reservations: {
          orderBy: { checkIn: 'desc' },
        },
        expenses: {
          orderBy: { expenseDate: 'desc' },
        },
        tasks: {
          orderBy: { dueDate: 'asc' },
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Scope checks
    if (me.role === 'CLIENT' && property.ownerId !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (me.role === 'MANAGER' && property.owner.managerId !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (me.role === 'CREW') {
      const hasTask = await prisma.task.findFirst({
        where: { propertyId: id, assigneeId: me.id },
        select: { id: true },
      })
      if (!hasTask) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      // Return limited data for CREW — no financial data, no reservations, no expenses
      return NextResponse.json({
        id: property.id,
        name: property.name,
        address: property.address,
        city: property.city,
        postalCode: property.postalCode,
        description: property.description,
        photos: property.photos,
        tasks: property.tasks.filter(t => t.assigneeId === me.id),
      })
    }

    return NextResponse.json(property)
  } catch (error) {
    console.error('Error fetching property:', error)
    return NextResponse.json(
      { error: 'Failed to fetch property' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  try {
    const { id } = params

    if (me.role === 'MANAGER') {
      const owned = await prisma.property.findUnique({
        where: { id },
        select: { owner: { select: { managerId: true } } },
      })
      if (owned?.owner.managerId !== me.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const body = await request.json()

    // Validate houseRules if provided
    if (body.houseRules !== undefined) {
      if (!Array.isArray(body.houseRules)) {
        return NextResponse.json({ error: 'houseRules must be an array' }, { status: 400 })
      }
      const validKeys = new Set(HOUSE_RULES.map(r => r.key))
      const invalid = body.houseRules.filter((k: string) => !validKeys.has(k))
      if (invalid.length > 0) {
        return NextResponse.json({ error: `Invalid house rule keys: ${invalid.join(', ')}` }, { status: 400 })
      }
    }

    const allowedFields = ['name', 'address', 'city', 'postalCode', 'description',
                            'photos', 'commissionRate', 'airbnbIcalUrl', 'bookingIcalUrl',
                            'smartLockId', 'bedrooms', 'bathrooms', 'latitude', 'longitude',
                            'houseRules',
                            // AI Assistant context fields
                            'wifiSsid', 'wifiPassword', 'doorCode', 'smartLockPassword',
                            'emergencyWhatsapp', 'parkingInstructions',
                            'checkInInstructions', 'checkOutInstructions',
                            'appliancesInfo', 'breakerLocation', 'waterShutoffLocation',
                            'propertyQuirks', 'guestGuideUrl']
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) data[field] = body[field]
    }
    // status transitions should go through dedicated endpoints, not PUT
    const property = await prisma.property.update({
      where: { id },
      data,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(property)
  } catch (error) {
    console.error('Error updating property:', error)
    return NextResponse.json(
      { error: 'Failed to update property' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  try {
    const { id } = params

    await prisma.property.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Property deleted successfully' })
  } catch (error) {
    console.error('Error deleting property:', error)
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    )
  }
}
