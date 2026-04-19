import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { findBestCrew } from '@/lib/crew-assignment'

/**
 * POST /api/tasks/[id]/assign — auto-assign best Crew to a task
 * Admin or system trigger. Uses the smart assignment algorithm.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const task = await prisma.task.findUnique({
    where: { id: params.id },
    select: { id: true, propertyId: true, status: true, assigneeId: true },
  })
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  if (task.assigneeId) {
    return NextResponse.json({ error: 'Task already assigned', assigneeId: task.assigneeId }, { status: 409 })
  }

  const candidate = await findBestCrew(task.propertyId)
  if (!candidate) {
    return NextResponse.json({ error: 'No available Crew — Captain must assign manually' }, { status: 404 })
  }

  const updated = await prisma.task.update({
    where: { id: params.id },
    data: {
      assigneeId: candidate.userId,
      status: 'NOTIFIED',
      notifiedAt: new Date(),
    },
    include: {
      assignee: { select: { id: true, name: true, email: true } },
      property: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json({
    task: updated,
    candidate: {
      userId: candidate.userId,
      name: candidate.name,
      globalScore: candidate.globalScore,
      propertyTrust: candidate.propertyTrust,
      ownerApproved: candidate.ownerApproved,
      captainEndorsed: candidate.captainEndorsed,
    },
  })
}
