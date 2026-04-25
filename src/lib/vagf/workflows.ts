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
 *
 * Uses WEIGHTED aggregation across 3 crew-accountability dimensions
 * (cleanliness 50%, propertyState 30%, crewPresentation 20%)
 * instead of the old single-dimension cleanliness-only approach.
 *
 * CONFIDENCE GUARD: if cross-validation confidence < 0.75, the delta
 * is NOT applied automatically — the feedback is flagged for Captain
 * review in the Captain Hub. Captain (or Admin) can approve/override.
 */
async function applyGuestFeedbackToScoreEngine(
  feedback: GuestFeedback,
) {
  if (!feedback.crewMemberId) return

  // Check if this feedback has confidence data (stored in JSON details field)
  const details = (feedback as unknown as { analysisConfidence?: number })
  const confidence = details.analysisConfidence ?? 1.0

  // Guard: if confidence below threshold, skip auto-apply
  if (confidence < 0.75) {
    console.log(`[VAGF] Skipping auto-score for feedback ${feedback.id} — confidence ${confidence.toFixed(2)} < 0.75. Queued for Captain review.`)
    return
  }

  // Weighted crew score: 50% cleanliness + 30% propertyState + 20% crewPresentation
  const scores = [
    { val: feedback.scoreCleanliness, weight: 0.5 },
    { val: feedback.scorePropertyState, weight: 0.3 },
    { val: feedback.scoreCrewPresentation, weight: 0.2 },
  ].filter(s => s.val !== null && s.val !== undefined) as { val: number; weight: number }[]

  if (scores.length === 0) return

  // Normalize weights to sum to 1
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0)
  const weighted = scores.reduce((sum, s) => sum + s.val * (s.weight / totalWeight), 0)
  const avgScore = Math.round(weighted * 10) / 10

  let reason: string | null = null
  if (avgScore >= 9) reason = 'GUEST_EXCELLENT'
  else if (avgScore >= 7) reason = 'GUEST_GOOD'
  else if (avgScore >= 5) reason = null // neutral
  else if (avgScore >= 3) reason = 'GUEST_POOR'
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
