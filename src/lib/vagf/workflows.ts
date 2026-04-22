import { prisma } from '../prisma'
import { notify } from '../notifications'
import { crewScoreEngine } from '../crew-score'
import type { GuestFeedback } from '@prisma/client'

/**
 * Run all post-feedback workflows after a call completes.
 *
 * @param feedbackId
 * @param options.skipScoreEngine — pass true on re-analysis to prevent
 *   double-counting CrewScore deltas that were already applied.
 */
export async function runPostFeedbackWorkflows(
  feedbackId: string,
  options: { skipScoreEngine?: boolean } = {},
) {
  const feedback = await prisma.guestFeedback.findUnique({
    where: { id: feedbackId },
    include: {
      reservation: { select: { guestName: true, guestPhone: true, platform: true } },
      property: { select: { name: true, ownerId: true } },
    },
  })
  if (!feedback) return

  await updateCrewScoreAggregate(feedback.crewMemberId)
  if (!options.skipScoreEngine) {
    await applyGuestFeedbackToScoreEngine(feedback)
  }
  await checkEscalation(feedback)
  await notifyStakeholders(feedback)
}

/**
 * Bridge VAGF → CrewScore points engine.
 * Translates guest cleanliness score (1-10) into CrewScore delta events.
 */
async function applyGuestFeedbackToScoreEngine(
  feedback: GuestFeedback,
) {
  if (!feedback.crewMemberId || feedback.scoreCleanliness == null) return

  const score = feedback.scoreCleanliness
  let reason: string | null = null

  if (score >= 9) reason = 'GUEST_EXCELLENT'
  else if (score >= 7) reason = 'GUEST_GOOD'
  else if (score >= 5) reason = null // neutral, no delta
  else if (score >= 3) reason = 'GUEST_POOR'
  else reason = 'GUEST_COMPLAINT'

  if (!reason) return

  try {
    await crewScoreEngine.applyDelta(feedback.crewMemberId, reason)
  } catch (err) {
    console.error('[VAGF] Failed to apply CrewScore delta:', err)
  }
}

async function updateCrewScoreAggregate(crewMemberId: string | null) {
  if (!crewMemberId) return

  const agg = await prisma.guestFeedback.aggregate({
    where: {
      crewMemberId,
      scoreCleanliness: { not: null },
      callStatus: { in: ['COMPLETED_SUCCESS', 'COMPLETED_PARTIAL', 'FALLBACK_WEB_COMPLETED'] },
    },
    _avg: { scoreCleanliness: true },
    _count: true,
  })

  await prisma.user.update({
    where: { id: crewMemberId },
    data: {
      guestScoreAverage: agg._avg.scoreCleanliness ?? 0,
      guestScoreCount: agg._count,
      lastGuestScoreAt: new Date(),
    },
  })
}

async function checkEscalation(feedback: GuestFeedback & {
  property: { name: string; ownerId: string }
  reservation: { guestName: string }
}) {
  let escalationLevel: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'NONE'
  const notifyUserIds: string[] = []

  // Find relevant stakeholders
  const owner = await prisma.user.findUnique({
    where: { id: feedback.property.ownerId },
    select: { managerId: true },
  })
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  })
  const adminIds = admins.map(a => a.id)

  if (feedback.sentimentOverall === 'SEVERE_NEGATIVE') {
    escalationLevel = 'CRITICAL'
    notifyUserIds.push(...adminIds)
    if (owner?.managerId) notifyUserIds.push(owner.managerId)

    if (feedback.crewMemberId && feedback.scoreCleanliness && feedback.scoreCleanliness <= 2) {
      await prisma.user.update({
        where: { id: feedback.crewMemberId },
        data: {
          suspendedDueToFeedback: true,
          suspendedAt: new Date(),
          suspensionReason: `Severe negative feedback — cleanliness score ${feedback.scoreCleanliness}/10 from ${feedback.reservation.guestName}`,
        },
      })
    }
  } else if (feedback.scoreCleanliness !== null && feedback.scoreCleanliness <= 4) {
    escalationLevel = 'HIGH'
    if (owner?.managerId) notifyUserIds.push(owner.managerId)
    notifyUserIds.push(...adminIds)
  } else if (feedback.scoreCleanliness !== null && feedback.scoreCleanliness <= 6) {
    escalationLevel = 'MEDIUM'
    if (owner?.managerId) notifyUserIds.push(owner.managerId)
  } else if (feedback.sentimentOverall === 'NEGATIVE') {
    escalationLevel = 'LOW'
    if (owner?.managerId) notifyUserIds.push(owner.managerId)
  }

  if (escalationLevel !== 'NONE') {
    await prisma.guestFeedback.update({
      where: { id: feedback.id },
      data: {
        escalationTriggered: true,
        escalationLevel,
        escalationNotifiedTo: notifyUserIds,
      },
    })

    const unique = Array.from(new Set(notifyUserIds))
    for (const userId of unique) {
      notify({
        userId,
        type: 'GENERAL',
        title: `Guest feedback alert — ${feedback.property.name}`,
        body: `${feedback.reservation.guestName}: cleanliness ${feedback.scoreCleanliness ?? '?'}/10, overall ${feedback.scorePlatformOverall ?? '?'}/10. Level: ${escalationLevel}`,
        link: '/feedback',
      }).catch(() => {})
    }
  }
}

async function notifyStakeholders(feedback: GuestFeedback & {
  property: { name: string; ownerId: string }
  reservation: { guestName: string }
}) {
  // Notify property owner
  notify({
    userId: feedback.property.ownerId,
    type: 'GENERAL',
    title: `Guest feedback received — ${feedback.property.name}`,
    body: `${feedback.reservation.guestName} rated your property ${feedback.scorePlatformOverall ?? '?'}/10 overall.`,
    link: '/client/feedback',
  }).catch(() => {})

  // Notify crew member
  if (feedback.crewMemberId && feedback.scoreCleanliness) {
    notify({
      userId: feedback.crewMemberId,
      type: 'CREW_SCORE_CHANGE',
      title: `Guest rated your cleaning: ${feedback.scoreCleanliness}/10`,
      body: feedback.feedbackPositive
        ? `"${feedback.feedbackPositive.slice(0, 100)}"`
        : `Property: ${feedback.property.name}`,
      link: '/crew/score',
    }).catch(() => {})
  }
}
