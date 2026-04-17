import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * POST /api/tasks/[id]/intervention — Manager opens an intervention
 * Body: { reason: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    include: { property: { include: { owner: { select: { managerId: true } } } } },
  })
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  if (me.role === 'MANAGER' && task.property.owner.managerId !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  if (!body.reason || typeof body.reason !== 'string') {
    return NextResponse.json({ error: 'reason is required' }, { status: 400 })
  }

  const intervention = await prisma.crewIntervention.create({
    data: {
      taskId: params.id,
      managerId: me.id,
      reason: body.reason.slice(0, 2000),
    },
  })

  return NextResponse.json(intervention, { status: 201 })
}

/**
 * PATCH /api/tasks/[id]/intervention — Captain resolves an intervention
 * Body: { interventionId, resolution, status: 'RESOLVED'|'ESCALATED' }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const body = await req.json()
  const { interventionId, resolution, status } = body as {
    interventionId?: string
    resolution?: string
    status?: string
  }

  if (!interventionId) {
    return NextResponse.json({ error: 'interventionId required' }, { status: 400 })
  }

  const intervention = await prisma.crewIntervention.findUnique({
    where: { id: interventionId },
  })
  if (!intervention || intervention.taskId !== params.id) {
    return NextResponse.json({ error: 'Intervention not found' }, { status: 404 })
  }

  const updated = await prisma.crewIntervention.update({
    where: { id: interventionId },
    data: {
      captainId: me.id,
      resolution: resolution?.slice(0, 2000) ?? null,
      status: status === 'ESCALATED' ? 'ESCALATED' : 'RESOLVED',
      resolvedAt: new Date(),
    },
  })

  return NextResponse.json(updated)
}
