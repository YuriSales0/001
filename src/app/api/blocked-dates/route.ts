import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function GET(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    const where: Record<string, unknown> = {}
    if (propertyId) where.propertyId = propertyId
    if (me.role === 'CLIENT') where.property = { ownerId: me.id }
    else if (me.role === 'MANAGER') where.property = { owner: { managerId: me.id } }

    const blockedDates = await prisma.blockedDate.findMany({
      where,
      include: { property: { select: { name: true } } },
      orderBy: { startDate: 'asc' },
    })

    return NextResponse.json(blockedDates)
  } catch (error) {
    console.error('Error fetching blocked dates:', error)
    return NextResponse.json({ error: 'Failed to fetch blocked dates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
    let { propertyId } = body
    const { startDate, endDate, reason } = body

    // CLIENT may omit propertyId — auto-pick their property if they have only one
    if (me.role === 'CLIENT' && !propertyId) {
      const props = await prisma.property.findMany({ where: { ownerId: me.id }, select: { id: true } })
      if (props.length === 1) propertyId = props[0].id
    }

    if (!propertyId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyId, startDate, endDate' },
        { status: 400 }
      )
    }

    // Verify ownership
    const prop = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true, owner: { select: { managerId: true } } },
    })
    if (!prop) return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    if (me.role === 'CLIENT' && prop.ownerId !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (me.role === 'MANAGER' && prop.owner.managerId !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check for overlapping reservations
    const overlapping = await prisma.reservation.findFirst({
      where: {
        propertyId,
        status: { not: 'CANCELLED' },
        OR: [
          { checkIn: { lte: new Date(endDate) }, checkOut: { gte: new Date(startDate) } },
        ],
      },
    })

    if (overlapping) {
      return NextResponse.json(
        { error: 'Cannot block dates that overlap with existing reservations' },
        { status: 409 }
      )
    }

    const blockedDate = await prisma.blockedDate.create({
      data: {
        propertyId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
      },
    })

    return NextResponse.json(blockedDate, { status: 201 })
  } catch (error) {
    console.error('Error creating blocked date:', error)
    return NextResponse.json({ error: 'Failed to create blocked date' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    }

    // Scope check
    const block = await prisma.blockedDate.findUnique({
      where: { id },
      select: { property: { select: { ownerId: true, owner: { select: { managerId: true } } } } },
    })
    if (!block) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (me.role === 'CLIENT' && block.property.ownerId !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (me.role === 'MANAGER' && block.property.owner.managerId !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.blockedDate.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting blocked date:', error)
    return NextResponse.json({ error: 'Failed to delete blocked date' }, { status: 500 })
  }
}
