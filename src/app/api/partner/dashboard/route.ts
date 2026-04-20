import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getPartnerFromCookie } from '@/lib/partner-auth'

export async function GET() {
  const partner = await getPartnerFromCookie()
  if (!partner) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get lead stats
    const leads = await prisma.lead.findMany({
      where: { partnerId: partner.id } as Record<string, unknown>,
      select: { id: true, status: true },
    })

    const totalReferrals = leads.length
    const conversions = leads.filter((l: { status: string }) => l.status === 'CONVERTED').length

    // Get payouts
    const payouts = await prisma.partnerPayout.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        clientName: true,
        amount: true,
        status: true,
        holdUntil: true,
        paidAt: true,
        reversedAt: true,
      },
    })

    const pendingPayouts = payouts
      .filter((p: { status: string }) => p.status === 'PENDING' || p.status === 'APPROVED')
      .reduce((sum: number, p: { amount: { toString: () => string } }) => sum + parseFloat(p.amount.toString()), 0)

    const totalEarned = payouts
      .filter((p: { status: string }) => p.status === 'PAID')
      .reduce((sum: number, p: { amount: { toString: () => string } }) => sum + parseFloat(p.amount.toString()), 0)

    return NextResponse.json({
      partner: {
        name: partner.name,
        tier: partner.tier,
        referralCode: partner.referralCode,
      },
      stats: {
        totalReferrals,
        conversions,
        pendingPayouts: pendingPayouts.toFixed(2),
        totalEarned: totalEarned.toFixed(2),
      },
      payouts: payouts.map((p: { id: string; clientName: string | null; amount: { toString: () => string }; status: string; holdUntil: Date; paidAt: Date | null; reversedAt: Date | null }) => ({
        id: p.id,
        clientName: p.clientName,
        amount: parseFloat(p.amount.toString()).toFixed(2),
        status: p.status,
        holdUntil: p.holdUntil,
        paidAt: p.paidAt,
        reversedAt: p.reversedAt,
      })),
    })
  } catch (error) {
    console.error('[Partner Dashboard] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
