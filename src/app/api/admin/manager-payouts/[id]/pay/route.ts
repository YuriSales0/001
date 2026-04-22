import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { notify, tForUser } from '@/lib/notifications'
import { transferToConnectedAccount } from '@/lib/stripe-connect'

/**
 * POST /api/admin/manager-payouts/[id]/pay
 * Marks an APPROVED (or PENDING) manager payout as PAID.
 * Optional body: { stripeTransferId?: string, notes?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const payout = await prisma.managerPayout.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, managerId: true, finalAmount: true, periodYear: true, periodMonth: true },
  })
  if (!payout) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (payout.status === 'PAID') {
    return NextResponse.json({ error: 'Already paid' }, { status: 400 })
  }
  if (payout.status === 'CANCELLED') {
    return NextResponse.json({ error: 'Cannot pay cancelled payout' }, { status: 400 })
  }

  const body = await request.json().catch(() => ({})) as {
    stripeTransferId?: string
    notes?: string
    skipStripe?: boolean
  }

  // Attempt Stripe Connect transfer if not manually overridden
  let stripeTransferId = body.stripeTransferId
  let transferError: string | null = null

  if (!body.skipStripe && !stripeTransferId) {
    try {
      const transfer = await transferToConnectedAccount({
        userId: payout.managerId,
        amountEur: Number(payout.finalAmount),
        description: `Manager commission ${payout.periodMonth}/${payout.periodYear}`,
        metadata: { managerPayoutId: payout.id },
      })
      if (transfer) {
        stripeTransferId = transfer.transferId
      } else {
        transferError = 'Connect account not ready. Pass skipStripe:true to pay manually outside Stripe.'
      }
    } catch (err) {
      transferError = err instanceof Error ? err.message : 'Stripe transfer failed'
      console.error('[Manager Payout] Stripe transfer failed:', err)
    }
  }

  if (transferError && !body.skipStripe) {
    return NextResponse.json({ error: transferError, canOverride: true }, { status: 502 })
  }

  const updated = await prisma.managerPayout.update({
    where: { id: params.id },
    data: {
      status: 'PAID',
      paidAt: new Date(),
      ...(stripeTransferId ? { stripeTransferId } : {}),
      ...(body.notes ? { notes: body.notes } : {}),
    },
  })

  // Notify the manager
  Promise.all([
    tForUser(payout.managerId, 'notifications.commissionPaidTitle'),
    tForUser(payout.managerId, 'notifications.commissionPaidBody'),
  ]).then(([title, body]) =>
    notify({
      userId: payout.managerId,
      type: 'COMMISSION_PAID',
      title: title || `Commission paid: €${Number(payout.finalAmount).toFixed(2)}`,
      body: body || `Your ${payout.periodMonth}/${payout.periodYear} commission has been transferred.`,
      link: '/manager/payouts',
    }),
  ).catch(() => {})

  return NextResponse.json(updated)
}
