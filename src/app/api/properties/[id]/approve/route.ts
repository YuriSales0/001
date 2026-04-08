import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Only the Admin (Owner) can approve properties
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: { status: true },
  })
  if (!property) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if ((property.status as string) !== 'PENDING_APPROVAL') {
    return NextResponse.json({ error: 'Property is not pending approval' }, { status: 400 })
  }

  const updated = await prisma.property.update({
    where: { id: params.id },
    data: { status: 'ACTIVE' },
    select: { id: true, status: true },
  })

  return NextResponse.json(updated)
}
