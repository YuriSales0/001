import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * PATCH /api/crew-payouts/[id] — Admin marks a CrewPayout as PAID (or FAILED)
 * Body: { status: 'PAID'|'FAILED', stripeTransferId?, failedReason? }
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
  const { status, stripeTransferId, failedReason } = body as {
    status?: string
    stripeTransferId?: string
    failedReason?: string
  }

  if (status !== 'PAID' && status !== 'FAILED') {
    return NextResponse.json({ error: 'status must be PAID or FAILED' }, { status: 400 })
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

  return NextResponse.json(updated)
}
