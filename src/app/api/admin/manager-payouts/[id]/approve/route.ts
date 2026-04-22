import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * POST /api/admin/manager-payouts/[id]/approve
 * Approves a PENDING manager payout. Does NOT pay.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const payout = await prisma.managerPayout.findUnique({
    where: { id: params.id },
    select: { id: true, status: true },
  })
  if (!payout) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (payout.status !== 'PENDING') {
    return NextResponse.json({ error: `Cannot approve payout in status ${payout.status}` }, { status: 400 })
  }

  const updated = await prisma.managerPayout.update({
    where: { id: params.id },
    data: { status: 'APPROVED' },
  })

  return NextResponse.json(updated)
}
