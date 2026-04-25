import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { notify } from '@/lib/notifications'
import { crewScoreEngine } from '@/lib/crew-score'

export const dynamic = 'force-dynamic'

/**
 * POST /api/crew-score/dispute — Crew member disputes a score from VAGF feedback.
 * Body: { feedbackId, reason }
 *
 * This flags the feedback for Captain/Admin review. The original score
 * delta is NOT reversed until review is completed.
 */
export async function POST(req: NextRequest) {
  const guard = await requireRole(['CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  let body: { feedbackId?: string; reason?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { feedbackId, reason } = body
  if (!feedbackId || !reason || reason.trim().length < 10) {
    return NextResponse.json({ error: 'feedbackId and reason (min 10 chars) required' }, { status: 400 })
  }

  const feedback = await prisma.guestFeedback.findUnique({
    where: { id: feedbackId },
    select: { id: true, crewMemberId: true, scoreDisputed: true, propertyId: true },
  })
  if (!feedback) return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
  if (feedback.crewMemberId !== me.id) {
    return NextResponse.json({ error: 'You can only dispute your own scores' }, { status: 403 })
  }
  if (feedback.scoreDisputed) {
    return NextResponse.json({ error: 'Already disputed' }, { status: 409 })
  }

  await prisma.guestFeedback.update({
    where: { id: feedbackId },
    data: {
      scoreDisputed: true,
      scoreDisputeReason: reason.trim(),
      scoreDisputedAt: new Date(),
      analysisReviewRequired: true,
    },
  })

  // Notify Captain + Admin
  const captains = await prisma.user.findMany({
    where: { role: 'CREW', isCaptain: true },
    select: { id: true },
  })
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  })
  const notifyIds = [...captains.map(c => c.id), ...admins.map(a => a.id)]

  for (const userId of notifyIds) {
    notify({
      userId,
      type: 'GENERAL',
      title: `Score dispute from ${me.name ?? me.email}`,
      body: `"${reason.slice(0, 100)}" — review call logs and analysis`,
      link: '/crew/approvals',
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true, disputed: true })
}

/**
 * PATCH /api/crew-score/dispute — Captain/Admin resolves a dispute.
 * Body: { feedbackId, outcome: 'UPHELD' | 'OVERRIDDEN' | 'ADJUSTED', adjustedDelta?: number }
 *
 * UPHELD: original score stands, dispute rejected.
 * OVERRIDDEN: reverse the original score delta entirely.
 * ADJUSTED: apply a custom delta correction.
 */
export async function PATCH(req: NextRequest) {
  const guard = await requireRole(['ADMIN', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  if (me.role === 'CREW' && !me.isCaptain) {
    return NextResponse.json({ error: 'Only Captains can resolve disputes' }, { status: 403 })
  }

  let body: { feedbackId?: string; outcome?: string; adjustedDelta?: number }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { feedbackId, outcome, adjustedDelta } = body
  if (!feedbackId || !outcome) {
    return NextResponse.json({ error: 'feedbackId and outcome required' }, { status: 400 })
  }
  if (!['UPHELD', 'OVERRIDDEN', 'ADJUSTED'].includes(outcome)) {
    return NextResponse.json({ error: 'outcome must be UPHELD, OVERRIDDEN, or ADJUSTED' }, { status: 400 })
  }

  const feedback = await prisma.guestFeedback.findUnique({
    where: { id: feedbackId },
    select: {
      id: true, crewMemberId: true, scoreDisputed: true,
      scoreCleanliness: true, scorePropertyState: true, scoreCrewPresentation: true,
    },
  })
  if (!feedback) return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })

  // Apply correction based on outcome
  if (feedback.crewMemberId && outcome === 'OVERRIDDEN') {
    // Reverse the original score impact — apply opposite delta
    const scores = [
      { val: feedback.scoreCleanliness, weight: 0.5 },
      { val: feedback.scorePropertyState, weight: 0.3 },
      { val: feedback.scoreCrewPresentation, weight: 0.2 },
    ].filter(s => s.val !== null) as { val: number; weight: number }[]

    if (scores.length > 0) {
      const totalWeight = scores.reduce((s, x) => s + x.weight, 0)
      const weighted = scores.reduce((s, x) => s + x.val * (x.weight / totalWeight), 0)

      let reverseReason: string | null = null
      if (weighted >= 9) reverseReason = 'GUEST_EXCELLENT'
      else if (weighted >= 7) reverseReason = 'GUEST_GOOD'
      else if (weighted >= 3) reverseReason = 'GUEST_POOR'
      else reverseReason = 'GUEST_COMPLAINT'

      if (reverseReason) {
        const originalDelta = crewScoreEngine.SCORE_TABLE[reverseReason] ?? 0
        if (originalDelta !== 0) {
          // Apply reverse manually (we don't have an applyRawDelta, so use upsert-style)
          const score = await prisma.crewScore.findUnique({ where: { userId: feedback.crewMemberId } })
          if (score) {
            const corrected = Math.max(0, score.currentScore - originalDelta)
            await prisma.crewScore.update({
              where: { id: score.id },
              data: { currentScore: corrected, level: crewScoreEngine.levelForScore(corrected) },
            })
            await prisma.crewScoreEvent.create({
              data: {
                crewScoreId: score.id,
                delta: -originalDelta,
                reason: `DISPUTE_OVERRIDDEN (original: ${reverseReason})`,
                scoreBefore: score.currentScore,
                scoreAfter: corrected,
              },
            })
          }
        }
      }
    }
  }

  if (feedback.crewMemberId && outcome === 'ADJUSTED' && adjustedDelta) {
    const score = await prisma.crewScore.findUnique({ where: { userId: feedback.crewMemberId } })
    if (score) {
      const corrected = Math.max(0, score.currentScore + adjustedDelta)
      await prisma.crewScore.update({
        where: { id: score.id },
        data: { currentScore: corrected, level: crewScoreEngine.levelForScore(corrected) },
      })
      await prisma.crewScoreEvent.create({
        data: {
          crewScoreId: score.id,
          delta: adjustedDelta,
          reason: `DISPUTE_ADJUSTED (by ${me.name ?? me.email})`,
          scoreBefore: score.currentScore,
          scoreAfter: corrected,
        },
      })
    }
  }

  await prisma.guestFeedback.update({
    where: { id: feedbackId },
    data: {
      scoreDisputeResolvedAt: new Date(),
      scoreDisputeResolvedBy: me.id,
      scoreDisputeOutcome: outcome,
      analysisReviewRequired: false,
      analysisReviewedAt: new Date(),
      analysisReviewedBy: me.id,
    },
  })

  // Notify crew member of resolution
  if (feedback.crewMemberId) {
    notify({
      userId: feedback.crewMemberId,
      type: 'CREW_SCORE_CHANGE',
      title: `Score dispute ${outcome.toLowerCase()}`,
      body: outcome === 'UPHELD'
        ? 'Your dispute was reviewed and the original score stands.'
        : outcome === 'OVERRIDDEN'
        ? 'Your dispute was accepted — score has been reversed.'
        : `Your dispute was reviewed — score adjusted by ${adjustedDelta ?? 0} points.`,
      link: '/crew/profile',
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true, outcome })
}
