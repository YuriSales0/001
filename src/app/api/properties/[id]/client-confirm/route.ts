import { NextRequest, NextResponse } from 'next/server'
import { PropertyStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

// CLIENT confirms a property submitted by a manager.
// Transitions: PENDING_CLIENT → PENDING_APPROVAL (admin then sets up OTA and activates).
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole(['CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: { ownerId: true, status: true },
  })
  if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (property.ownerId !== me.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if ((property.status as string) !== 'PENDING_CLIENT') {
    return NextResponse.json({ error: 'Property is not awaiting client confirmation' }, { status: 400 })
  }

  const updated = await prisma.property.update({
    where: { id: params.id },
    data: { status: PropertyStatus.PENDING_APPROVAL },
    select: { id: true, status: true },
  })

  return NextResponse.json(updated)
}
