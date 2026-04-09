import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CLIENT', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  try {
    const { id } = params

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
        expenses: {
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(reservation)
  } catch (error) {
    console.error('Error fetching reservation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
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
  try {
    const { id } = params
    const body = await request.json()

    const data: Record<string, unknown> = { ...body }
    if (body.checkIn) data.checkIn = new Date(body.checkIn)
    if (body.checkOut) data.checkOut = new Date(body.checkOut)

    const reservation = await prisma.reservation.update({
      where: { id },
      data,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(reservation)
  } catch (error) {
    console.error('Error updating reservation:', error)
    return NextResponse.json(
      { error: 'Failed to update reservation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  try {
    const { id } = params

    await prisma.reservation.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Reservation deleted successfully' })
  } catch (error) {
    console.error('Error deleting reservation:', error)
    return NextResponse.json(
      { error: 'Failed to delete reservation' },
      { status: 500 }
    )
  }
}
