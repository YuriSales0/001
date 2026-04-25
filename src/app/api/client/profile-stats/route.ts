import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/client/profile-stats
 * Returns dashboard-style stats for the client's member page.
 */
export async function GET() {
  const guard = await requireRole(['CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const [propertyCount, paidPayouts, broadcastsReceived, recentBroadcasts] = await Promise.all([
    prisma.property.count({ where: { ownerId: me.id } }),
    prisma.payout.aggregate({
      where: {
        property: { ownerId: me.id },
        status: 'PAID',
      },
      _sum: { netAmount: true },
    }),
    prisma.broadcastRecipient.count({ where: { userId: me.id } }),
    prisma.broadcastRecipient.findMany({
      where: { userId: me.id },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        broadcast: {
          select: { id: true, subject: true, sentAt: true, translations: true, sender: { select: { name: true } } },
        },
      },
    }),
  ])

  const recent = recentBroadcasts.map(r => {
    const translations = (r.broadcast.translations as Record<string, { subject: string }> | null) ?? {}
    return {
      id: r.broadcast.id,
      subject: translations[r.language]?.subject ?? r.broadcast.subject,
      sentAt: r.broadcast.sentAt,
      sender: r.broadcast.sender?.name ?? 'HostMasters',
      readAt: r.readAt,
    }
  })

  // Profile completion: name, phone, image (3 fields)
  const fullUser = await prisma.user.findUnique({
    where: { id: me.id },
    select: { name: true, phone: true, image: true },
  })
  const filled = [fullUser?.name, fullUser?.phone, fullUser?.image].filter(Boolean).length
  const profileCompletion = Math.round((filled / 3) * 100)

  return NextResponse.json({
    propertyCount,
    totalPayouts: Number(paidPayouts._sum.netAmount ?? 0),
    broadcastsReceived,
    recentBroadcasts: recent,
    profileCompletion,
  })
}
