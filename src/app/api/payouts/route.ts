import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const propertyId = searchParams.get('propertyId')

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (propertyId) where.propertyId = propertyId

    const payouts = await prisma.payout.findMany({
      where,
      include: {
        property: { select: { id: true, name: true, owner: { select: { id: true, name: true, email: true } } } },
        reservation: { select: { id: true, guestName: true, checkIn: true, checkOut: true } },
      },
      orderBy: { scheduledFor: 'asc' },
    })

    return NextResponse.json(payouts)
  } catch (error) {
    console.error('Error fetching payouts:', error)
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
  }
}
