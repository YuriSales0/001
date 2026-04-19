import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

const VALID_STATUSES = ['NEW', 'CONTACTED', 'INTERVIEWING', 'ACCEPTED', 'REJECTED'] as const

/**
 * PATCH /api/recruit/[id] — ADMIN only, update status and/or adminNotes
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const body = await req.json() as { status?: string; adminNotes?: string }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = {}

  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status as typeof VALID_STATUSES[number])) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    data.status = body.status
    data.reviewedAt = new Date()
    data.reviewedById = guard.user!.id
  }

  if (body.adminNotes !== undefined) {
    const trimmed = String(body.adminNotes).slice(0, 2000)
    data.adminNotes = trimmed || null
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const updated = await prisma.recruitApplication.update({
    where: { id: params.id },
    data,
  })

  return NextResponse.json(updated)
}

/**
 * DELETE /api/recruit/[id] — ADMIN only
 */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  await prisma.recruitApplication.delete({ where: { id: params.id } })
  return NextResponse.json({ ok: true })
}
