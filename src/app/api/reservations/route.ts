import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (propertyId) where.propertyId = propertyId
    if (status) where.status = status

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
      },
      orderBy: { checkIn: 'desc' },
    })

    return NextResponse.json(reservations)
  } catch (error) {
    console.error('Error fetching reservations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { propertyId, guestName, guestEmail, guestPhone, checkIn, checkOut, amount, platform } = body

    if (!propertyId || !guestName || !checkIn || !checkOut || amount == null) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyId, guestName, checkIn, checkOut, amount' },
        { status: 400 }
      )
    }

    const reservation = await prisma.reservation.create({
      data: {
        propertyId,
        guestName,
        guestEmail,
        guestPhone,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        amount,
        platform,
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

    return NextResponse.json(reservation, { status: 201 })
  } catch (error) {
    console.error('Error creating reservation:', error)
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    )
  }
}
