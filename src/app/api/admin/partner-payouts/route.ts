import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function GET() {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  try {
    const payouts = await prisma.partnerPayout.findMany({
      include: {
        partner: { select: { id: true, name: true, tier: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })

    const result = payouts.map((p: {
      id: string
      partnerId: string
      partner: { id: string; name: string; tier: string }
      clientName: string | null
      amount: { toString: () => string }
      status: string
      holdUntil: Date
      paidAt: Date | null
      reversedAt: Date | null
      createdAt: Date
    }) => ({
      id: p.id,
      partnerId: p.partnerId,
      partnerName: p.partner.name,
      clientName: p.clientName,
      amount: parseFloat(p.amount.toString()).toFixed(2),
      status: p.status,
      holdUntil: p.holdUntil,
      paidAt: p.paidAt,
      reversedAt: p.reversedAt,
      createdAt: p.createdAt,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('[Admin Partner Payouts] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
