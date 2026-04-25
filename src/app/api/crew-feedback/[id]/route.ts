import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/crew-feedback/[id] — Crew sees full transcript + scores for their feedback.
 * Used when preparing a dispute (Crew needs to re-read what was said).
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireRole(['ADMIN', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const feedback = await prisma.guestFeedback.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      crewMemberId: true,
      scoreCleanliness: true,
      scorePropertyState: true,
      scoreCrewPresentation: true,
      scorePropertyStructure: true,
      scorePropertyAmenities: true,
      scoreCommunication: true,
      scoreCheckInExperience: true,
      scoreCheckOutExperience: true,
      scorePlatformOverall: true,
      scoreNps: true,
      sentimentOverall: true,
      analysisConfidence: true,
      analysisCrossValidated: true,
      analysisReviewRequired: true,
      scoreDisputed: true,
      scoreDisputeReason: true,
      scoreDisputeResolvedAt: true,
      scoreDisputeOutcome: true,
      scoreDisputeResolvedBy: true,
      transcriptionFull: true,
      recordingUrl: true,
      callDurationSeconds: true,
      feedbackCrewPositive: true,
      feedbackCrewImprovement: true,
      feedbackRecommendation: true,
      createdAt: true,
      property: { select: { id: true, name: true } },
      reservation: { select: { guestName: true, checkOut: true } },
    },
  })

  if (!feedback) return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })

  // Crew can only see their own feedback; Admin can see all
  if (me.role === 'CREW' && feedback.crewMemberId !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(feedback)
}
