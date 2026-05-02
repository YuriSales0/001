import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateManagerPayout, payByDate } from '@/lib/manager-payout'
import { notify, tForUser } from '@/lib/notifications'

/**
 * POST /api/cron/manager-payout
 *
 * Monthly cron that computes commission payouts for all active Managers.
 * Scheduled to run between the 1st and 10th of each month (triggered by
 * AI Monitor umbrella). Calculates for the PREVIOUS month and creates
 * ManagerPayout records with status=PENDING — admins approve/pay manually.
 *
 * Idempotent: if a payout already exists for (manager, year, month) it's
 * skipped. Safe to re-run.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Determine target period: PREVIOUS month (in UTC)
  const now = new Date()
  const targetMonthDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth() - 1,
    1,
  ))
  const periodYear = targetMonthDate.getUTCFullYear()
  const periodMonth = targetMonthDate.getUTCMonth() + 1 // 1..12

  const managers = await prisma.user.findMany({
    where: { role: 'MANAGER' },
    select: { id: true, name: true, email: true },
  })

  const created: Array<{ managerId: string; amount: number }> = []
  const skipped: Array<{ managerId: string; reason: string }> = []
  const errors: Array<{ managerId: string; error: string }> = []

  for (const mgr of managers) {
    try {
      // Skip if payout already exists
      const existing = await prisma.managerPayout.findUnique({
        where: {
          managerId_periodYear_periodMonth: {
            managerId: mgr.id,
            periodYear,
            periodMonth,
          },
        },
        select: { id: true },
      })
      if (existing) {
        skipped.push({ managerId: mgr.id, reason: 'already exists' })
        continue
      }

      const calc = await calculateManagerPayout(mgr.id, periodYear, periodMonth)

      // Skip if manager has no clients — nothing to calculate
      if (calc.clientCount === 0) {
        skipped.push({ managerId: mgr.id, reason: 'no clients' })
        continue
      }

      // Skip if zero amount — manager earned nothing this period
      if (calc.finalAmount <= 0) {
        skipped.push({ managerId: mgr.id, reason: 'zero amount' })
        continue
      }

      await prisma.managerPayout.create({
        data: {
          managerId: mgr.id,
          periodYear,
          periodMonth,
          subscriptionEarnings: calc.subscriptionEarnings,
          rentalEarnings: calc.rentalEarnings,
          portfolioBonus: calc.portfolioBonus,
          acquisitionBonus: calc.acquisitionBonus,
          finalAmount: calc.finalAmount,
          breakdown: calc.breakdown as unknown as object,
          clientCount: calc.clientCount,
          activePropertyCount: calc.activePropertyCount,
          payBy: payByDate(periodYear, periodMonth),
          status: 'PENDING',
        },
      })

      // Notify manager that their statement is ready
      Promise.all([
        tForUser(mgr.id, 'notifications.commissionStatementTitle'),
        tForUser(mgr.id, 'notifications.commissionStatementBody'),
      ]).then(([title, body]) =>
        notify({
          userId: mgr.id,
          type: 'COMMISSION_STATEMENT',
          title: title || `Commission statement — ${periodMonth}/${periodYear}`,
          body: body || `Your payout of €${calc.finalAmount.toFixed(2)} is pending admin approval.`,
          link: '/manager/payouts',
        }),
      ).catch(() => {})

      created.push({ managerId: mgr.id, amount: calc.finalAmount })
    } catch (err) {
      errors.push({
        managerId: mgr.id,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      console.error(`[manager-payout] Failed for ${mgr.email}:`, err)
    }
  }

  return NextResponse.json({
    period: `${periodYear}-${String(periodMonth).padStart(2, '0')}`,
    managersProcessed: managers.length,
    created: created.length,
    createdDetail: created,
    skipped: skipped.length,
    skippedDetail: skipped,
    errors: errors.length,
    errorsDetail: errors,
  })
}
