import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { crewScoreEngine } from '@/lib/crew-score'

/**
 * POST /api/cron/crew-payout — Weekly Crew payout reconciliation
 *
 * Runs every Wednesday 09:00 UTC (called by Vercel Cron or manual trigger).
 *
 * 1. Find all APPROVED tasks from the previous week (Mon-Sun)
 * 2. Group by assignee
 * 3. Calculate payout per crew (base amount + level bonus)
 * 4. Create CrewPayout records
 * 5. Link tasks to payout
 *
 * Stripe Connect execution + Resend statement are separate steps
 * (triggered after manual review or via a follow-up cron).
 */
export async function POST() {
  const authHeader =
    process.env.CRON_SECRET
      ? undefined // Vercel Cron handles auth via headers
      : undefined

  // Calculate previous week window (Mon 00:00 → Sun 23:59)
  const now = new Date()
  const dayOfWeek = now.getUTCDay() // 0=Sun, 1=Mon, ..., 3=Wed
  const daysToLastMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1 + 7
  const weekStart = new Date(now)
  weekStart.setUTCDate(now.getUTCDate() - daysToLastMonday)
  weekStart.setUTCHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6)
  weekEnd.setUTCHours(23, 59, 59, 999)

  // Find all approved tasks in the window that aren't already in a payout
  const tasks = await prisma.task.findMany({
    where: {
      status: 'APPROVED',
      approvedAt: { gte: weekStart, lte: weekEnd },
      crewPayoutId: null,
      assigneeId: { not: null },
      amount: { not: null },
    },
    include: {
      assignee: {
        select: { id: true, name: true, crewScore: { select: { level: true } } },
      },
    },
  })

  // Group by crew member
  const byCrewId: Record<string, typeof tasks> = {}
  for (const task of tasks) {
    if (!task.assigneeId) continue
    if (!byCrewId[task.assigneeId]) byCrewId[task.assigneeId] = []
    byCrewId[task.assigneeId].push(task)
  }

  const payouts: { crewId: string; crewName: string; taskCount: number; total: number; bonus: number; final: number }[] = []

  for (const [crewId, crewTasks] of Object.entries(byCrewId)) {
    const totalAmount = crewTasks.reduce((sum, t) => sum + (t.amount ?? 0), 0)
    const level = crewTasks[0]?.assignee?.crewScore?.level ?? 'BASIC'
    const bonusRate = crewScoreEngine.bonusRate(level)
    const bonusAmount = Math.round(totalAmount * bonusRate * 100) / 100
    const finalAmount = Math.round((totalAmount + bonusAmount) * 100) / 100

    // Atomic check-and-create to prevent duplicate payouts from concurrent runs
    try {
      const payout = await prisma.$transaction(async (tx) => {
        const existing = await tx.crewPayout.findUnique({
          where: { crewId_weekStart: { crewId, weekStart } },
        })
        if (existing) return null

        const created = await tx.crewPayout.create({
          data: {
            crewId,
            weekStart,
            weekEnd,
            taskCount: crewTasks.length,
            totalAmount,
            bonusAmount,
            finalAmount,
            status: 'PENDING',
          },
        })

        await tx.task.updateMany({
          where: { id: { in: crewTasks.map(t => t.id) } },
          data: { crewPayoutId: created.id },
        })

        return created
      })

      if (!payout) continue
    } catch (err) {
      console.error(`[CrewPayout] Failed for crew ${crewId}:`, err)
      continue
    }

    payouts.push({
      crewId,
      crewName: crewTasks[0]?.assignee?.name ?? crewId,
      taskCount: crewTasks.length,
      total: totalAmount,
      bonus: bonusAmount,
      final: finalAmount,
    })
  }

  return NextResponse.json({
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    tasksProcessed: tasks.length,
    payoutsCreated: payouts.length,
    payouts,
  })
}
