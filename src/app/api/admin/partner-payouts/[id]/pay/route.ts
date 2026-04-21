import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  try {
    const payout = await prisma.partnerPayout.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    })

    if (!payout) {
      return NextResponse.json({ error: 'Payout not found' }, { status: 404 })
    }

    if (payout.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Only APPROVED payouts can be marked as paid' },
        { status: 400 }
      )
    }

    const updated = await prisma.partnerPayout.update({
      where: { id: params.id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('[Partner Payout Pay] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
