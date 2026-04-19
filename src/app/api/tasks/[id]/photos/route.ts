import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

const MAX_PHOTO_SIZE = 600_000 // ~600KB per photo as base64 string (client should compress)
const MAX_PHOTOS_PER_TASK = 12

/**
 * POST /api/tasks/[id]/photos
 * Body: { photo: "data:image/jpeg;base64,..." }
 * Appends the photo to Task.photos (scoped to CREW assignee, or ADMIN/MANAGER oversight).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: {
      property: { include: { owner: { select: { managerId: true } } } },
    },
  })
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  if (me.role === 'CREW' && task.assigneeId !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (me.role === 'MANAGER' && task.property.owner.managerId !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const photo = body?.photo
  if (typeof photo !== 'string' || !photo.startsWith('data:image/')) {
    return NextResponse.json({ error: 'photo must be a data URL (image/jpeg, image/png, image/webp)' }, { status: 400 })
  }
  if (photo.length > MAX_PHOTO_SIZE) {
    return NextResponse.json({ error: 'Photo too large — compress to under 500KB' }, { status: 413 })
  }
  if (task.photos.length >= MAX_PHOTOS_PER_TASK) {
    return NextResponse.json({ error: `Maximum ${MAX_PHOTOS_PER_TASK} photos per task` }, { status: 400 })
  }

  const updated = await prisma.task.update({
    where: { id: params.id },
    data: { photos: { push: photo } },
    select: { id: true, photos: true },
  })

  return NextResponse.json(updated, { status: 201 })
}

/**
 * DELETE /api/tasks/[id]/photos?index=N — remove a photo by index
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const idx = Number(new URL(req.url).searchParams.get('index'))
  if (!Number.isInteger(idx) || idx < 0) {
    return NextResponse.json({ error: 'index required' }, { status: 400 })
  }

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: { property: { include: { owner: { select: { managerId: true } } } } },
  })
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  if (me.role === 'CREW' && task.assigneeId !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (me.role === 'MANAGER' && task.property.owner.managerId !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Crew cannot remove photos after the task is completed (audit trail)
  if (me.role === 'CREW' && task.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Cannot edit photos after completion' }, { status: 403 })
  }

  const next = task.photos.filter((_, i) => i !== idx)
  const updated = await prisma.task.update({
    where: { id: params.id },
    data: { photos: next },
    select: { id: true, photos: true },
  })
  return NextResponse.json(updated)
}
