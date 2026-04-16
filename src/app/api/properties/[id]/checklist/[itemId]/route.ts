import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  // MANAGER can only update checklist items for properties belonging to their clients
  if (me.role === 'MANAGER') {
    const prop = await prisma.property.findUnique({
      where: { id: params.id },
      select: { owner: { select: { managerId: true } } },
    })
    if (!prop || prop.owner?.managerId !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const body = await request.json()
  const data: Record<string, unknown> = {}
  if (body.label    !== undefined) data.label     = body.label.trim()
  if (body.category !== undefined) data.category  = body.category
  if (body.isActive !== undefined) data.isActive  = body.isActive
  if (body.sortOrder!== undefined) data.sortOrder = body.sortOrder

  const item = await prisma.propertyChecklistItem.update({
    where: { id: params.itemId },
    data,
  })
  return NextResponse.json(item)
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  // MANAGER can only delete checklist items for properties belonging to their clients
  if (me.role === 'MANAGER') {
    const prop = await prisma.property.findUnique({
      where: { id: params.id },
      select: { owner: { select: { managerId: true } } },
    })
    if (!prop || prop.owner?.managerId !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  await prisma.propertyChecklistItem.delete({ where: { id: params.itemId } })
  return new NextResponse(null, { status: 204 })
}
