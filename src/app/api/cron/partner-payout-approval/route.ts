import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/cron/partner-payout-approval
 * Auto-approves partner payouts past their 30-day hold period.
 * Triggered daily by AI Monitor.
 */
export const maxDuration = 30
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  const approved = await prisma.partnerPayout.updateMany({
    where: {
      status: 'PENDING',
      holdUntil: { lte: now },
    },
    data: { status: 'APPROVED' },
  })

  return NextResponse.json({ approved: approved.count })
}
