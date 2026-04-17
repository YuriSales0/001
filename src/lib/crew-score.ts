import { prisma } from '@/lib/prisma'
import type { CrewScoreLevel } from '@prisma/client'

const SCORE_TABLE: Record<string, number> = {
  TASK_ON_TIME:        +10,
  VALIDATED_NO_REPAIR: +15,
  OWNER_POSITIVE:      +20,
  PEAK_AVAILABILITY:   +5,
  NOT_ACCEPTED:        -20,
  ACCEPTED_NOT_DONE:   -30,
  COMPLAINT:           -40,
  UNREPORTED_DAMAGE:   -50,
}

function levelForScore(score: number): CrewScoreLevel {
  if (score >= 500) return 'ELITE'
  if (score >= 300) return 'EXPERT'
  if (score >= 150) return 'VERIFIED'
  if (score >= 50)  return 'BASIC'
  return 'SUSPENDED'
}

function bonusRate(level: CrewScoreLevel): number {
  switch (level) {
    case 'ELITE':    return 0.15
    case 'EXPERT':   return 0.10
    case 'VERIFIED': return 0.05
    default:         return 0
  }
}

async function getOrCreateScore(userId: string) {
  let score = await prisma.crewScore.findUnique({ where: { userId } })
  if (!score) {
    score = await prisma.crewScore.create({
      data: { userId, currentScore: 100, level: 'BASIC' },
    })
  }
  return score
}

async function applyDelta(userId: string, reason: string, taskId?: string) {
  const delta = SCORE_TABLE[reason]
  if (delta === undefined) throw new Error(`Unknown score reason: ${reason}`)

  const score = await getOrCreateScore(userId)
  const newScore = Math.max(0, score.currentScore + delta)
  const newLevel = levelForScore(newScore)

  const isApproval = delta > 0 && ['TASK_ON_TIME', 'VALIDATED_NO_REPAIR', 'OWNER_POSITIVE'].includes(reason)
  const isRejection = delta < 0

  const [updated] = await prisma.$transaction([
    prisma.crewScore.update({
      where: { id: score.id },
      data: {
        currentScore: newScore,
        level: newLevel,
        totalTasks: isApproval || isRejection ? { increment: 1 } : undefined,
        totalApproved: isApproval ? { increment: 1 } : undefined,
        totalRejected: isRejection ? { increment: 1 } : undefined,
      },
    }),
    prisma.crewScoreEvent.create({
      data: {
        crewScoreId: score.id,
        taskId: taskId ?? null,
        delta,
        reason,
        scoreBefore: score.currentScore,
        scoreAfter: newScore,
      },
    }),
  ])

  return updated
}

export const crewScoreEngine = {
  SCORE_TABLE,
  levelForScore,
  bonusRate,
  getOrCreateScore,
  applyDelta,
}
