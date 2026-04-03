import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const reservationId = searchParams.get('reservationId')

    const where: Record<string, unknown> = {}
    if (propertyId) where.propertyId = propertyId
    if (reservationId) where.reservationId = reservationId

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
  try {
    const body = await request.json()
    const { propertyId, reservationId, description, amount, category, date } = body

    if (!propertyId || !description || amount == null || !category || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyId, description, amount, category, date' },
        { status: 400 }
      )
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
