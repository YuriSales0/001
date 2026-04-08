import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole(['CLIENT', 'ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: { ownerId: true, owner: { select: { managerId: true } } },
  })
  if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // CLIENT can only update their own property; MANAGER must be assigned to the owner
  if (me.role === 'CLIENT' && property.ownerId !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (me.role === 'MANAGER' && property.owner.managerId !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { airbnbIcalUrl, airbnbListingId, bookingIcalUrl, bookingPropertyId } = body

  const updated = await prisma.property.update({
    where: { id: params.id },
    data: {
      ...(airbnbIcalUrl !== undefined && {
        airbnbIcalUrl: airbnbIcalUrl || null,
        airbnbConnected: Boolean(airbnbIcalUrl),
      }),
      ...(airbnbListingId !== undefined && { airbnbListingId: airbnbListingId || null }),
      ...(bookingIcalUrl !== undefined && {
        bookingIcalUrl: bookingIcalUrl || null,
        bookingConnected: Boolean(bookingIcalUrl),
      }),
      ...(bookingPropertyId !== undefined && { bookingPropertyId: bookingPropertyId || null }),
    },
    select: {
      id: true,
      airbnbConnected: true,
      bookingConnected: true,
      airbnbIcalUrl: true,
      bookingIcalUrl: true,
      status: true,
    },
  })

  return NextResponse.json(updated)
}
