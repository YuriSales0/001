import { prisma } from '@/lib/prisma'
import type { CrewScoreLevel } from '@prisma/client'
import { notify, tForUser } from '@/lib/notifications'

const SCORE_TABLE: Record<string, number> = {
  TASK_ON_TIME:        +10,
  VALIDATED_NO_REPAIR: +15,
  OWNER_POSITIVE:      +20,
  PEAK_AVAILABILITY:   +5,
  NOT_ACCEPTED:        -20,
  ACCEPTED_NOT_DONE:   -30,
  COMPLAINT:           -40,
  UNREPORTED_DAMAGE:   -50,
  MONTHLY_DECAY:       0, // calculated dynamically, not a fixed delta
  // VAGF-driven events (from guest voice feedback)
  GUEST_EXCELLENT:     +20, // cleanliness 9-10
  GUEST_GOOD:          +10, // cleanliness 7-8
  GUEST_POOR:          -20, // cleanliness 3-4
  GUEST_COMPLAINT:     -40, // cleanliness 1-2 (also triggers suspension)
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
      data: { userId, currentScore: 50, level: 'BASIC' },
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

  const oldLevel = score.level as CrewScoreLevel
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

  // Gap #5 + #6: Notify crew of score/level changes
  const levelOrder: CrewScoreLevel[] = ['SUSPENDED', 'BASIC', 'VERIFIED', 'EXPERT', 'ELITE']
  const oldIdx = levelOrder.indexOf(oldLevel)
  const newIdx = levelOrder.indexOf(newLevel)

  if (newIdx > oldIdx) {
    // Level UP
    tForUser(userId, 'notifications.crewLevelUpTitle', { level: newLevel })
      .then(title =>
        tForUser(userId, 'notifications.crewLevelUpBody', { score: String(newScore) })
          .then(body => notify({ userId, type: 'CREW_LEVEL_UP', title, body, link: '/crew/score' }))
      )
      .catch(() => {})
  } else if (newIdx < oldIdx) {
    // Level DOWN
    tForUser(userId, 'notifications.crewLevelDownTitle', { level: newLevel })
      .then(title =>
        tForUser(userId, 'notifications.crewLevelDownBody', { score: String(newScore) })
          .then(body => notify({ userId, type: 'CREW_LEVEL_DOWN', title, body, link: '/crew/score' }))
      )
      .catch(() => {})
  } else if (Math.abs(delta) >= 15) {
    // Significant score change without level change
    const sign = delta > 0 ? '+' : ''
    tForUser(userId, 'notifications.crewScoreChangeTitle', { delta: `${sign}${delta}` })
      .then(title =>
        tForUser(userId, 'notifications.crewScoreChangeBody', { score: String(newScore), reason })
          .then(body => notify({ userId, type: 'CREW_SCORE_CHANGE', title, body, link: '/crew/score' }))
      )
      .catch(() => {})
  }

  return updated
}

const LEVEL_MIN: Record<string, number> = {
  ELITE: 500, EXPERT: 300, VERIFIED: 150, BASIC: 50, SUSPENDED: 0,
}

const DECAY_RETAIN_PCT = 0.30

async function scoreDecay() {
  const allScores = await prisma.crewScore.findMany({
    select: { id: true, userId: true, currentScore: true, level: true },
  })

  let decayed = 0
  for (const score of allScores) {
    const min = LEVEL_MIN[score.level] ?? 0
    if (score.currentScore <= min) continue

    const excess = score.currentScore - min
    const newScore = Math.round(min + excess * DECAY_RETAIN_PCT)
    const newLevel = levelForScore(newScore)

    await prisma.$transaction([
      prisma.crewScore.update({
        where: { id: score.id },
        data: { currentScore: newScore, level: newLevel },
      }),
      prisma.crewScoreEvent.create({
        data: {
          crewScoreId: score.id,
          delta: newScore - score.currentScore,
          reason: 'MONTHLY_DECAY',
          scoreBefore: score.currentScore,
          scoreAfter: newScore,
        },
      }),
    ])

    if (newLevel !== score.level) {
      tForUser(score.userId, 'notifications.crewLevelDownTitle', { level: newLevel })
        .then(title =>
          tForUser(score.userId, 'notifications.crewLevelDownBody', { score: String(newScore) })
            .then(body => notify({ userId: score.userId, type: 'CREW_LEVEL_DOWN', title, body, link: '/crew/profile' }))
        )
        .catch(() => {})
    } else {
      tForUser(score.userId, 'notifications.crewScoreChangeTitle', { delta: String(newScore - score.currentScore) })
        .then(title =>
          notify({ userId: score.userId, type: 'CREW_SCORE_CHANGE', title, body: `Quarterly score reset. New score: ${newScore}`, link: '/crew/profile' })
        )
        .catch(() => {})
    }

    decayed++
  }

  return { decayed, total: allScores.length }
}

export const crewScoreEngine = {
  SCORE_TABLE,
  levelForScore,
  bonusRate,
  getOrCreateScore,
  applyDelta,
  scoreDecay,
}
