import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { crewScoreEngine } from '@/lib/crew-score'
import { notify } from '@/lib/notifications'
import { findBestCrew } from '@/lib/crew-assignment'

/**
 * POST /api/cron/crew-confirmation-timeout
 * Runs every 10 minutes. Redistributes NOTIFIED tasks older than 30 minutes.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000)

  const stale = await prisma.task.findMany({
    where: {
      status: 'NOTIFIED',
      notifiedAt: { lte: thirtyMinAgo },
      assigneeId: { not: null },
    },
    select: { id: true, assigneeId: true, propertyId: true, title: true, notes: true },
  })

  let redistributed = 0

  for (const task of stale) {
    const prevAssignee = task.assigneeId!

    // Track redistribution count to prevent infinite loops
    let redistributionCount = 0
    try {
      const parsed = task.notes ? JSON.parse(task.notes) : {}
      redistributionCount = parsed.redistributionCount ?? 0
    } catch { /* notes not JSON, count stays 0 */ }
    redistributionCount++

    await crewScoreEngine.applyDelta(prevAssignee, 'NOT_ACCEPTED', task.id)

    await notify({
      userId: prevAssignee,
      type: 'TASK_REDISTRIBUTED',
      title: `Task redistributed: ${task.title}`,
      body: 'Not confirmed within 30 minutes. Score impact: -20',
      link: '/crew',
    }).catch(() => {})

    // If redistributed 3+ times, stop trying and set to PENDING
    if (redistributionCount >= 3) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: 'PENDING',
          assigneeId: null,
          notes: JSON.stringify({ redistributionCount }),
        },
      })
      redistributed++
      continue
    }

    const nextCrew = await findBestCrew(task.propertyId)

    if (nextCrew && nextCrew.userId !== prevAssignee) {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: 'NOTIFIED',
          assigneeId: nextCrew.userId,
          notifiedAt: new Date(),
          notes: JSON.stringify({ redistributionCount }),
        },
      })

      await notify({
        userId: nextCrew.userId,
        type: 'TASK_ASSIGNED',
        title: `New task: ${task.title}`,
        body: 'Confirm within 30 minutes',
        link: '/crew',
      }).catch(() => {})
    } else {
      await prisma.task.update({
        where: { id: task.id },
        data: {
          status: 'PENDING',
          assigneeId: null,
          notes: JSON.stringify({ redistributionCount }),
        },
      })
    }

    redistributed++
  }

  return NextResponse.json({ redistributed, checked: stale.length })
}
