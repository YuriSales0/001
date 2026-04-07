import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN', 'CREW', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  try {
    const body = await req.json()
    const data: Record<string, unknown> = {}
    if (body.status) data.status = body.status
    if (body.assigneeId !== undefined && me.role === 'ADMIN') data.assigneeId = body.assigneeId || null
    if (body.title) data.title = body.title
    if (body.description !== undefined) data.description = body.description
    if (body.notes !== undefined) data.notes = body.notes
    if (body.checklist !== undefined) data.checklist = body.checklist
    if (body.dueDate) data.dueDate = new Date(body.dueDate)
    if (body.type) data.type = body.type

    const task = await prisma.task.update({
      where: { id: params.id },
      data,
      include: {
        property: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    })
    return NextResponse.json(task)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, ctx: { params: { id: string } }) {
  return PATCH(req, ctx)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  try {
    await prisma.task.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 })
  }
}
