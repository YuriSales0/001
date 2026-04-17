import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * GET /api/crew-score — Crew sees own score + recent history
 */
export async function GET() {
  const guard = await requireRole(['ADMIN', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const targetId = me.role === 'CREW' ? me.id : undefined

  const score = await prisma.crewScore.findUnique({
    where: { userId: targetId ?? me.id },
    include: {
      history: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!score) {
    return NextResponse.json({
      currentScore: 100,
      level: 'BASIC',
      totalTasks: 0,
      totalApproved: 0,
      totalRejected: 0,
      history: [],
    })
  }

  return NextResponse.json(score)
}
