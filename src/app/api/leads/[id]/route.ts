import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

const LEAD_INCLUDE = {
  owner: { select: { id: true, name: true, email: true } },
  assignedManager: { select: { id: true, name: true, email: true } },
} as const

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const lead = await prisma.lead.findUnique({
    where: { id: params.id },
    select: { id: true, assignedManagerId: true },
  })
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  // MANAGER can only update leads assigned to them
  if (me.role === 'MANAGER' && lead.assignedManagerId !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const {
    status, notes, followUpDate, assignedManagerId,
    budget, propertyType, name, email, phone, source, message,
    score, bantData,
  } = body

  // Only ADMIN can reassign managers
  const managerUpdate = me.role === 'ADMIN' && assignedManagerId !== undefined
    ? { assignedManagerId: assignedManagerId || null }
    : {}

  const updated = await prisma.lead.update({
    where: { id: params.id },
    data: {
      ...(status !== undefined && { status }),
      ...(notes !== undefined && { notes }),
      ...(followUpDate !== undefined && { followUpDate: followUpDate ? new Date(followUpDate) : null }),
      ...(budget !== undefined && { budget: budget ? Number(budget) : null }),
      ...(propertyType !== undefined && { propertyType: propertyType || null }),
      ...(name !== undefined && { name }),
      ...(email !== undefined && { email: email || null }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(source !== undefined && { source }),
      ...(message !== undefined && { message: message || null }),
      ...(score !== undefined && { score: Number(score) }),
      ...(bantData !== undefined && { bantData }),
      ...managerUpdate,
    },
    include: LEAD_INCLUDE,
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  await prisma.lead.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
