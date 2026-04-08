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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lead = await (prisma.lead as any).findUnique({
    where: { id: params.id },
    select: { id: true, assignedManagerId: true },
  }) as { id: string; assignedManagerId: string | null } | null
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })

  // MANAGER can only update leads assigned to them
  if (me.role === 'MANAGER' && lead.assignedManagerId !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const {
    status, notes, followUpDate, assignedManagerId,
    budget, propertyType, name, email, phone, source, message,
  } = body

  // Only ADMIN can reassign managers
  const managerUpdate = me.role === 'ADMIN' && assignedManagerId !== undefined
    ? { assignedManagerId: assignedManagerId || null }
    : {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updated = await (prisma.lead as any).update({
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
