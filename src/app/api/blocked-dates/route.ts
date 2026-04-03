import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    const where: Record<string, string> = {}
    if (propertyId) where.propertyId = propertyId

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
  try {
    const body = await request.json()
    const { propertyId, startDate, endDate, reason } = body

    if (!propertyId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyId, startDate, endDate' },
        { status: 400 }
      )
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
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
    }

    await prisma.blockedDate.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting blocked date:', error)
    return NextResponse.json({ error: 'Failed to delete blocked date' }, { status: 500 })
  }
}
