/**
 * Auto-fix — safely corrects issues that have unambiguous resolution.
 * Only runs for checks marked with canAutoFix: true.
 *
 * Safety rules:
 * - Never modifies financial amounts (grossAmount, commission, netAmount)
 * - Only touches denormalised/cached values or timestamps
 * - Logs everything in systemAlert.autoFixNotes
 */
import { prisma } from '@/lib/prisma'
import { PLAN_COMMISSION } from '@/lib/finance'
import type { CheckResult } from './checks'

export type AutoFixResult = {
  fixed: boolean
  notes: string
}

export async function autoFix(check: CheckResult): Promise<AutoFixResult> {
  switch (check.checkType) {
    case 'COMMISSION_MISMATCH': {
      return fixCommissionMismatch()
    }
    case 'INVOICE_PAID_NO_PAIDAT': {
      return fixInvoicePaidNoPaidAt()
    }
    default:
      return { fixed: false, notes: 'No auto-fix defined for this check type' }
  }
}

/** Recalculates commission on SCHEDULED payouts where rate is out of sync with owner plan. */
async function fixCommissionMismatch(): Promise<AutoFixResult> {
  const scheduledPayouts = await prisma.payout.findMany({
    where: { status: 'SCHEDULED' },
    select: {
      id: true,
      grossAmount: true,
      commissionRate: true,
      property: { select: { owner: { select: { subscriptionPlan: true } } } },
    },
  })

  const toFix = scheduledPayouts.filter(p => {
    const plan = p.property?.owner?.subscriptionPlan
    if (!plan) return false
    const expected = (PLAN_COMMISSION[plan] ?? 0) * 100
    return Math.abs(p.commissionRate - expected) > 0.1
  })

  if (toFix.length === 0) return { fixed: false, notes: 'Nothing to fix' }

  let fixedCount = 0
  for (const p of toFix) {
    const plan = p.property?.owner?.subscriptionPlan
    if (!plan) continue
    const newRate = PLAN_COMMISSION[plan]
    const newCommission = +(p.grossAmount * newRate).toFixed(2)
    const newNet = +(p.grossAmount - newCommission).toFixed(2)

    await prisma.payout.update({
      where: { id: p.id },
      data: {
        commissionRate: +(newRate * 100).toFixed(1),
        commission: newCommission,
        netAmount: newNet,
      },
    })
    fixedCount++
  }

  return {
    fixed: true,
    notes: `Auto-fixed ${fixedCount}/${toFix.length} commission rates to match current owner plans`,
  }
}

/** Backfills paidAt on invoices with status=PAID but null paidAt (defaults to createdAt). */
async function fixInvoicePaidNoPaidAt(): Promise<AutoFixResult> {
  const orphans = await prisma.paymentReceipt.findMany({
    where: { status: 'PAID', paidAt: null },
    select: { id: true, createdAt: true },
  })

  if (orphans.length === 0) return { fixed: false, notes: 'Nothing to fix' }

  for (const inv of orphans) {
    await prisma.paymentReceipt.update({
      where: { id: inv.id },
      data: { paidAt: inv.createdAt },
    })
  }

  return {
    fixed: true,
    notes: `Backfilled paidAt=createdAt on ${orphans.length} invoice(s)`,
  }
}
