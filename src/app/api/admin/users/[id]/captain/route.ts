import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * PATCH /api/admin/users/[id]/captain — toggle isCaptain flag
 * Body: { isCaptain: boolean }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: { id: true, role: true, name: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.role !== 'CREW') {
    return NextResponse.json({ error: 'Only CREW members can be named Captain' }, { status: 400 })
  }

  const body = await req.json()
  const isCaptain = body.isCaptain === true

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: { isCaptain },
    select: { id: true, name: true, isCaptain: true },
  })

  return NextResponse.json(updated)
}
