import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { notify } from '@/lib/notifications'
import { transferToConnectedAccount } from '@/lib/stripe-connect'

/**
 * PATCH /api/crew-payouts/[id] — Admin marks a CrewPayout as PAID (or FAILED)
 * Body:
 *   { status: 'PAID', skipStripe?: boolean, stripeTransferId?: string }
 *   { status: 'FAILED', failedReason?: string }
 *
 * When status=PAID and skipStripe is not true, attempts a Stripe Connect
 * transfer first. Only marks PAID if the transfer succeeds (or if admin
 * provides an explicit stripeTransferId, e.g. paid outside Stripe).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const payout = await prisma.crewPayout.findUnique({ where: { id: params.id } })
  if (!payout) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { status, stripeTransferId: manualTransferId, failedReason, skipStripe } = body as {
    status?: string
    stripeTransferId?: string
    failedReason?: string
    skipStripe?: boolean
  }

  if (status !== 'PAID' && status !== 'FAILED') {
    return NextResponse.json({ error: 'status must be PAID or FAILED' }, { status: 400 })
  }

  if (payout.status === 'PAID') {
    return NextResponse.json({ error: 'Payout already paid' }, { status: 409 })
  }

  let stripeTransferId = manualTransferId

  if (status === 'PAID' && !skipStripe && !stripeTransferId) {
    try {
      const transfer = await transferToConnectedAccount({
        userId: payout.crewId,
        amountEur: Number(payout.finalAmount),
        description: `Crew weekly payout — week of ${payout.weekStart.toISOString().slice(0, 10)}`,
        metadata: { crewPayoutId: payout.id },
      })
      if (transfer) {
        stripeTransferId = transfer.transferId
      } else {
        return NextResponse.json(
          { error: 'Crew Connect account not ready. Pass skipStripe:true to pay manually outside Stripe.', canOverride: true },
          { status: 502 },
        )
      }
    } catch (err) {
      console.error('[Crew Payout] Stripe transfer failed:', err)
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Stripe transfer failed', canOverride: true },
        { status: 502 },
      )
    }
  }

  const updated = await prisma.crewPayout.update({
    where: { id: params.id },
    data: {
      status,
      paidAt: status === 'PAID' ? new Date() : undefined,
      stripeTransferId: stripeTransferId ?? undefined,
      failedReason: status === 'FAILED' ? (failedReason ?? 'Unknown') : undefined,
    },
  })

  if (status === 'PAID') {
    notify({
      userId: payout.crewId,
      type: 'CREW_PAYOUT_PAID',
      title: `Payout received: €${updated.finalAmount.toFixed(0)}`,
      body: `${updated.taskCount} task(s) — week of ${updated.weekStart.toISOString().slice(0, 10)}`,
      link: '/crew/earnings',
    }).catch(() => {})
  }

  return NextResponse.json(updated)
}
