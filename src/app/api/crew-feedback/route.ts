import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/crew-feedback — Crew sees all VAGF feedback that affected their score.
 * Returns scores + dispute status + transcript excerpt so the crew can
 * review what was said and dispute if unfair.
 */
export async function GET() {
  const guard = await requireRole(['CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const feedbacks = await prisma.guestFeedback.findMany({
    where: {
      crewMemberId: me.id,
      callStatus: { in: ['COMPLETED_SUCCESS', 'COMPLETED_PARTIAL', 'FALLBACK_WEB_COMPLETED'] },
    },
    take: 50,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      scoreCleanliness: true,
      scorePropertyState: true,
      scoreCrewPresentation: true,
      sentimentOverall: true,
      analysisConfidence: true,
      analysisCrossValidated: true,
      analysisReviewRequired: true,
      scoreDisputed: true,
      scoreDisputeReason: true,
      scoreDisputeResolvedAt: true,
      scoreDisputeOutcome: true,
      transcriptionFull: true,
      feedbackCrewPositive: true,
      feedbackCrewImprovement: true,
      createdAt: true,
      property: { select: { id: true, name: true } },
      reservation: { select: { guestName: true, checkOut: true } },
    },
  })

  // Return a truncated transcript for UI preview (first 500 chars)
  const result = feedbacks.map(f => ({
    ...f,
    transcriptExcerpt: f.transcriptionFull ? f.transcriptionFull.slice(0, 500) : null,
    transcriptionFull: undefined, // hide full in list view
  }))

  return NextResponse.json(result)
}
