import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { sendEmail, taskCompletedEmail } from '@/lib/email'
import { crewScoreEngine } from '@/lib/crew-score'
import { updateCrewPropertyRelationship } from '@/lib/crew-property'
import { notify } from '@/lib/notifications'

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING:        ['NOTIFIED', 'IN_PROGRESS', 'COMPLETED'],
  NOTIFIED:       ['CONFIRMED', 'REDISTRIBUTED'],
  CONFIRMED:      ['IN_PROGRESS'],
  IN_PROGRESS:    ['SUBMITTED'],
  SUBMITTED:      ['APPROVED', 'REJECTED'],
  APPROVED:       [],
  REJECTED:       ['REDISTRIBUTED', 'IN_PROGRESS'],
  REDISTRIBUTED:  ['NOTIFIED', 'PENDING'],
  COMPLETED:      [],
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN', 'CREW', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  const isCaptainOrAdmin = me.role === 'ADMIN' || me.isSuperUser || me.isCaptain
  try {
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

    // Scoping
    if (me.role === 'CREW' && existing.assigneeId !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (me.role === 'MANAGER' && existing.property.owner.managerId !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const data: Record<string, unknown> = {}
    const now = new Date()

    // ── Basic field updates ──
    if (body.title) data.title = body.title
    if (body.description !== undefined) data.description = body.description
    if (body.notes !== undefined) data.notes = body.notes
    if (body.checklist !== undefined) data.checklist = body.checklist
    if (body.dueDate) data.dueDate = new Date(body.dueDate)
    if (body.type && (me.role === 'ADMIN' || me.role === 'MANAGER')) data.type = body.type
    if (body.assigneeId !== undefined && me.role === 'ADMIN') data.assigneeId = body.assigneeId || null
    if (body.amount !== undefined && me.role === 'ADMIN') data.amount = Number(body.amount)

    // ── Status transitions with lifecycle timestamps ──
    let newStatus: string | null = null

    if (body.status) {
      const valid = VALID_TRANSITIONS[existing.status] ?? []
      if (!valid.includes(body.status) && me.role !== 'ADMIN') {
        return NextResponse.json(
          { error: `Cannot transition from ${existing.status} to ${body.status}` },
          { status: 400 },
        )
      }
      newStatus = body.status
      data.status = newStatus

      switch (newStatus) {
        case 'NOTIFIED':
          data.notifiedAt = now
          break
        case 'CONFIRMED':
          if (me.role !== 'CREW') return NextResponse.json({ error: 'Only Crew can confirm' }, { status: 403 })
          data.confirmedAt = now
          // Notify owner that crew accepted the task
          if (existing.property.owner.id) {
            notify({
              userId: existing.property.owner.id,
              type: 'TASK_CONFIRMED',
              title: `Crew confirmed: ${existing.title}`,
              body: `${me.name ?? 'Crew member'} accepted the task at ${existing.property.name}`,
              link: '/client/care',
            }).catch(() => {})
          }
          break
        case 'IN_PROGRESS': {
          const code = Math.random().toString().slice(2, 8)
          data.smartLockCode = code
          data.smartLockExpiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000)
          break
        }
        case 'SUBMITTED': {
          if (me.role !== 'CREW') return NextResponse.json({ error: 'Only Crew can submit' }, { status: 403 })
          // Photos mandatory for CHECK_OUT and CLEANING
          if (['CHECK_OUT', 'CLEANING'].includes(existing.type) && (existing.photos?.length ?? 0) < 2) {
            return NextResponse.json({ error: 'Minimum 2 photos required before submitting' }, { status: 400 })
          }
          data.submittedAt = now
          // Auto-set amount from crew rate if not already set
          if (!existing.amount && existing.assigneeId) {
            const crew = await prisma.user.findUnique({
              where: { id: existing.assigneeId },
              select: { crewTaskRate: true },
            })
            if (crew?.crewTaskRate) data.amount = crew.crewTaskRate
          }
          break
        }
        case 'APPROVED':
          if (!isCaptainOrAdmin) {
            return NextResponse.json({ error: 'Only Captain/Admin can approve' }, { status: 403 })
          }
          if (me.id === existing.assigneeId) {
            return NextResponse.json({ error: 'Cannot approve your own task' }, { status: 403 })
          }
          data.approvedAt = now
          data.captainId = me.id
          break
        case 'REJECTED':
          if (!isCaptainOrAdmin) {
            return NextResponse.json({ error: 'Only Captain/Admin can reject' }, { status: 403 })
          }
          if (me.id === existing.assigneeId) {
            return NextResponse.json({ error: 'Cannot reject your own task' }, { status: 403 })
          }
          data.rejectedAt = now
          data.captainId = me.id
          break
        case 'REDISTRIBUTED':
          data.assigneeId = null
          data.notifiedAt = null
          data.confirmedAt = null
          data.submittedAt = null
          break
      }
    }

    // ── Checkout report (legacy Crew submit — also sets SUBMITTED) ──
    let isCheckoutSubmit = false
    let reportPayload: { condition: string; issues: string; damages: string; notes: string } | null = null
    if (body.checkoutCondition !== undefined) {
      reportPayload = {
        condition: String(body.checkoutCondition),
        issues: body.checkoutIssues ?? '',
        damages: body.checkoutDamages ?? '',
        notes: body.checkoutNotes ?? '',
      }
      data.notes = JSON.stringify({
        ...reportPayload,
        submittedAt: now.toISOString(),
        submittedBy: me.id,
      })
      data.status = 'SUBMITTED'
      data.submittedAt = now
      newStatus = 'SUBMITTED'
      isCheckoutSubmit = true
    }

    // ── Persist ──
    const task = await prisma.task.update({
      where: { id: params.id },
      data,
      include: {
        property: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    })

    // ── Post-transition side effects + in-app notifications ──

    // NOTIFIED → tell the Crew they have a new task
    if (newStatus === 'NOTIFIED' && task.assignee) {
      notify({
        userId: task.assignee.id,
        type: 'TASK_ASSIGNED',
        title: `New task: ${task.title}`,
        body: `${task.property.name} — confirm within 30 min`,
        link: '/crew',
      }).catch(() => {})
    }

    // SUBMITTED → tell Captain/Admin there's work to review
    if (newStatus === 'SUBMITTED') {
      const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { id: true } })
      for (const a of admins) {
        notify({
          userId: a.id,
          type: 'TASK_SUBMITTED',
          title: `Task submitted for review`,
          body: `${task.title} at ${task.property.name}`,
          link: '/maintenance',
        }).catch(() => {})
      }
    }

    // APPROVED → score + relationship + notify owner + notify crew
    if (newStatus === 'APPROVED' && existing.assigneeId) {
      crewScoreEngine.applyDelta(existing.assigneeId, 'TASK_ON_TIME', params.id).catch(console.error)
      crewScoreEngine.applyDelta(existing.assigneeId, 'VALIDATED_NO_REPAIR', params.id).catch(console.error)
      updateCrewPropertyRelationship(existing.assigneeId, existing.propertyId, existing.type, true).catch(console.error)

      // Notify crew member
      notify({
        userId: existing.assigneeId,
        type: 'TASK_APPROVED',
        title: 'Task approved ✅',
        body: `${existing.title} at ${existing.property.name} — score +25`,
        link: '/crew',
      }).catch(() => {})

      // Notify owner
      notify({
        userId: existing.property.owner.id,
        type: 'VISIT_COMPLETED',
        title: `Visit completed at ${existing.property.name}`,
        body: existing.title,
        link: '/client/dashboard',
      }).catch(() => {})

      if (existing.property.owner.email) {
        sendEmail({
          to: existing.property.owner.email,
          subject: `Visit completed at ${existing.property.name}`,
          html: taskCompletedEmail({
            propertyName: existing.property.name,
            taskTitle: existing.title,
            taskType: existing.type,
            condition: reportPayload?.condition,
            issues: reportPayload?.issues,
            notes: reportPayload?.notes,
          }),
        }).catch(err => console.error('Task completion email failed:', err))
      }
    }

    // REJECTED → score penalty + relationship + notify crew
    if (newStatus === 'REJECTED' && existing.assigneeId) {
      crewScoreEngine.applyDelta(existing.assigneeId, 'COMPLAINT', params.id).catch(console.error)
      updateCrewPropertyRelationship(existing.assigneeId, existing.propertyId, existing.type, false).catch(console.error)
      notify({
        userId: existing.assigneeId,
        type: 'TASK_REJECTED',
        title: 'Task rejected ❌',
        body: `${existing.title} at ${existing.property.name} — review captain feedback`,
        link: '/crew',
      }).catch(() => {})
    }

    // REDISTRIBUTED → penalty + notify previous crew
    if (newStatus === 'REDISTRIBUTED' && existing.assigneeId) {
      const wasConfirmed = existing.status === 'CONFIRMED' || existing.status === 'IN_PROGRESS'
      const reason = wasConfirmed ? 'ACCEPTED_NOT_DONE' : 'NOT_ACCEPTED'
      crewScoreEngine.applyDelta(existing.assigneeId, reason, params.id).catch(console.error)
      notify({
        userId: existing.assigneeId,
        type: 'TASK_REDISTRIBUTED',
        title: 'Task reassigned',
        body: `${existing.title} was redistributed — score impact: ${crewScoreEngine.SCORE_TABLE[reason]}`,
        link: '/crew',
      }).catch(() => {})
    }

    // Legacy: auto-activate/complete reservations on COMPLETED status
    const becameCompleted = (newStatus === 'COMPLETED' || newStatus === 'APPROVED') && existing.status !== 'COMPLETED'

    if (becameCompleted && existing.type === 'CHECK_IN') {
      const taskDate = existing.dueDate
      const dayBefore = new Date(taskDate); dayBefore.setDate(dayBefore.getDate() - 1)
      const dayAfter = new Date(taskDate); dayAfter.setDate(dayAfter.getDate() + 1)
      const matchingRes = await prisma.reservation.findFirst({
        where: { propertyId: existing.propertyId, status: 'UPCOMING', checkIn: { gte: dayBefore, lte: dayAfter } },
        orderBy: { checkIn: 'asc' },
      })
      if (matchingRes) {
        await prisma.reservation.update({ where: { id: matchingRes.id }, data: { status: 'ACTIVE' } })
      }
    }

    if (becameCompleted && (existing.type === 'CHECK_OUT' || (isCheckoutSubmit && existing.type === 'CLEANING'))) {
      const taskDate = existing.dueDate
      const dayBefore = new Date(taskDate); dayBefore.setDate(dayBefore.getDate() - 1)
      const dayAfter = new Date(taskDate); dayAfter.setDate(dayAfter.getDate() + 1)
      const matchingRes = await prisma.reservation.findFirst({
        where: { propertyId: existing.propertyId, status: 'ACTIVE', checkOut: { gte: dayBefore, lte: dayAfter } },
        orderBy: { checkOut: 'asc' },
      })
      if (matchingRes) {
        await prisma.reservation.update({ where: { id: matchingRes.id }, data: { status: 'COMPLETED' } })
      }
    }

    // Notify Manager to review the stay when CHECK_OUT task is approved/completed
    if (becameCompleted && (existing.type === 'CHECK_OUT' || existing.type === 'CLEANING')) {
      const managerId = existing.property.owner.managerId
      if (managerId) {
        notify({
          userId: managerId,
          type: 'GENERAL',
          title: `Guest checkout — review the stay`,
          body: `${existing.property.name} — please submit a stay review for the recent guest`,
          link: '/manager/reviews',
        }).catch(() => {})
      }
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
