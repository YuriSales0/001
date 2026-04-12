import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { sendEmail, taskCompletedEmail } from '@/lib/email'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN', 'CREW', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  try {
    // Scope: CREW can only modify their own tasks; MANAGER only tasks for their owners
    const existing = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        property: {
          include: {
            owner: { select: { id: true, name: true, email: true, managerId: true } },
          },
        },
      },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (me.role === 'CREW' && existing.assigneeId !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (me.role === 'MANAGER' && existing.property.owner.managerId !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const data: Record<string, unknown> = {}
    if (body.status) data.status = body.status
    if (body.assigneeId !== undefined && me.role === 'ADMIN') data.assigneeId = body.assigneeId || null
    if (body.title) data.title = body.title
    if (body.description !== undefined) data.description = body.description
    if (body.notes !== undefined) data.notes = body.notes
    if (body.checklist !== undefined) data.checklist = body.checklist
    if (body.dueDate) data.dueDate = new Date(body.dueDate)
    if (body.type && (me.role === 'ADMIN' || me.role === 'MANAGER')) data.type = body.type

    let isCheckoutSubmit = false
    let reportPayload: { condition: string; issues: string; damages: string; notes: string } | null = null
    if (body.checkoutCondition !== undefined) {
      reportPayload = {
        condition: String(body.checkoutCondition),
        issues: body.checkoutIssues ?? '',
        damages: body.checkoutDamages ?? '',
        notes: body.checkoutNotes ?? '',
      }
      const report = JSON.stringify({
        ...reportPayload,
        submittedAt: new Date().toISOString(),
        submittedBy: me.id,
      })
      data.notes = report
      data.status = 'COMPLETED'
      isCheckoutSubmit = true
    }

    const task = await prisma.task.update({
      where: { id: params.id },
      data,
      include: {
        property: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    })

    // Auto-activate reservation when CHECK_IN task is completed
    const becameCompleted =
      (data.status === 'COMPLETED' || isCheckoutSubmit) && existing.status !== 'COMPLETED'

    if (becameCompleted && existing.type === 'CHECK_IN') {
      // Find UPCOMING reservation for this property around the task due date
      const taskDate = existing.dueDate
      const dayBefore = new Date(taskDate)
      dayBefore.setDate(dayBefore.getDate() - 1)
      const dayAfter = new Date(taskDate)
      dayAfter.setDate(dayAfter.getDate() + 1)

      await prisma.reservation.updateMany({
        where: {
          propertyId: existing.propertyId,
          status: 'UPCOMING',
          checkIn: { gte: dayBefore, lte: dayAfter },
        },
        data: { status: 'ACTIVE' },
      })
    }

    // Auto-complete reservation when CHECK_OUT task is completed
    if (becameCompleted && (existing.type === 'CHECK_OUT' || (isCheckoutSubmit && existing.type === 'CLEANING'))) {
      const taskDate = existing.dueDate
      const dayBefore = new Date(taskDate)
      dayBefore.setDate(dayBefore.getDate() - 1)
      const dayAfter = new Date(taskDate)
      dayAfter.setDate(dayAfter.getDate() + 1)

      await prisma.reservation.updateMany({
        where: {
          propertyId: existing.propertyId,
          status: 'ACTIVE',
          checkOut: { gte: dayBefore, lte: dayAfter },
        },
        data: { status: 'COMPLETED' },
      })
    }

    // Notify the owner when a task is completed (best-effort, never block the response).
    if (becameCompleted && existing.property.owner.email) {
      const ownerEmail = existing.property.owner.email
      sendEmail({
        to: ownerEmail,
        subject: `Visit completed at ${existing.property.name}`,
        html: taskCompletedEmail({
          propertyName: existing.property.name,
          taskTitle: existing.title,
          taskType: existing.type,
          condition: reportPayload?.condition,
          issues: reportPayload?.issues,
          notes: reportPayload?.notes,
        }),
      }).catch(err => console.error('Failed to send task completion email:', err))
    }

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
