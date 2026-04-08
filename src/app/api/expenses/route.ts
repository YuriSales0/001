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
    const reservationId = searchParams.get('reservationId')

    const where: Record<string, unknown> = {}
    if (propertyId) where.propertyId = propertyId
    if (reservationId) where.reservationId = reservationId
    if (me.role === 'CLIENT') where.property = { ownerId: me.id }
    else if (me.role === 'MANAGER') where.property = { owner: { managerId: me.id } }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        reservation: {
          select: {
            id: true,
            guestName: true,
            checkIn: true,
            checkOut: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  try {
    const body = await request.json()
    const { propertyId, reservationId, description, amount, category, date } = body

    if (!propertyId || !description || amount == null || !category || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyId, description, amount, category, date' },
        { status: 400 }
      )
    }

    // MANAGER can only log expenses for properties of their assigned owners
    if (me.role === 'MANAGER') {
      const prop = await prisma.property.findUnique({
        where: { id: propertyId },
        select: { owner: { select: { managerId: true } } },
      })
      if (prop?.owner.managerId !== me.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const expense = await prisma.expense.create({
      data: {
        propertyId,
        reservationId: reservationId || null,
        description,
        amount,
        category,
        date: new Date(date),
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    )
  }
}
