import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const block = await prisma.blockedDate.findUnique({
    where: { id: params.id },
    select: { property: { select: { ownerId: true, owner: { select: { managerId: true } } } } },
  })
  if (!block) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (me.role === 'CLIENT' && block.property.ownerId !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (me.role === 'MANAGER' && block.property.owner.managerId !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.blockedDate.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
