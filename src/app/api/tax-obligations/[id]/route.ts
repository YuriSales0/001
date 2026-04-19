import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/** PATCH — update obligation (ADMIN/MANAGER only) */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const body = await req.json()
  const { status, periodLabel, dueDate, completedAt, documentUrl, notes } = body

  // Verify access
  const existing = await prisma.taxObligation.findUnique({
    where: { id: params.id },
    include: { user: { select: { managerId: true } } },
  })
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 })

  if (guard.user!.role === 'MANAGER' && existing.user.managerId !== guard.user!.id) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = { handledBy: guard.user!.id }
  if (status !== undefined) data.status = status
  if (periodLabel !== undefined) data.periodLabel = periodLabel
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null
  if (completedAt !== undefined) data.completedAt = completedAt ? new Date(completedAt) : null
  if (documentUrl !== undefined) data.documentUrl = documentUrl
  if (notes !== undefined) data.notes = notes

  // Auto-set completedAt when status becomes COMPLETED
  if (status === 'COMPLETED' && !existing.completedAt && completedAt === undefined) {
    data.completedAt = new Date()
  }

  const updated = await prisma.taxObligation.update({
    where: { id: params.id },
    data,
  })

  return NextResponse.json(updated)
}

/** DELETE — remove obligation (ADMIN only) */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  await prisma.taxObligation.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
