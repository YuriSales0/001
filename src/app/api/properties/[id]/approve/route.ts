import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole(['CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: { ownerId: true, status: true, airbnbConnected: true, bookingConnected: true },
  })
  if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (property.ownerId !== me.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if ((property.status as string) !== 'PENDING_APPROVAL') {
    return NextResponse.json({ error: 'Property is not pending approval' }, { status: 400 })
  }
  if (!property.airbnbConnected && !property.bookingConnected) {
    return NextResponse.json(
      { error: 'At least one OTA platform must be connected before approving' },
      { status: 422 }
    )
  }

  const updated = await prisma.property.update({
    where: { id: params.id },
    data: { status: 'ACTIVE' },
    select: { id: true, status: true },
  })

  return NextResponse.json(updated)
}
