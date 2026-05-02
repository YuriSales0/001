import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/cron/notification-cleanup — delete read notifications older than 90 days
 * Scheduled: weekly (e.g., Sundays 03:00 UTC)
 */
export const maxDuration = 30
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const deleted = await prisma.notification.deleteMany({
    where: {
      read: true,
      createdAt: { lt: ninetyDaysAgo },
    },
  })

  // Also clean unread notifications older than 180 days (stale)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setDate(sixMonthsAgo.getDate() - 180)

  const staleDeleted = await prisma.notification.deleteMany({
    where: {
      createdAt: { lt: sixMonthsAgo },
    },
  })

  return NextResponse.json({
    deletedRead: deleted.count,
    deletedStale: staleDeleted.count,
    cutoffRead: ninetyDaysAgo.toISOString(),
    cutoffStale: sixMonthsAgo.toISOString(),
  })
}
