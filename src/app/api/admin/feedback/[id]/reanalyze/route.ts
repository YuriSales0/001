import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { analyzeTranscription, calculateNpsCategory } from '@/lib/vagf/analyzer'
import { runPostFeedbackWorkflows } from '@/lib/vagf/workflows'

/**
 * POST /api/admin/feedback/[id]/reanalyze
 *
 * Re-run Claude transcript analysis on a feedback record that got
 * stuck in COMPLETED_PARTIAL (e.g., Claude returned malformed JSON
 * during the original webhook). Populates scores + qualitative fields.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const feedback = await prisma.guestFeedback.findUnique({
    where: { id: params.id },
    select: {
      id: true, transcriptionFull: true, callStatus: true,
      client: { select: { managerId: true } },
    },
  })
  if (!feedback) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Manager can only re-analyze feedback for their own clients
  if (guard.user!.role === 'MANAGER' && feedback.client.managerId !== guard.user!.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!feedback.transcriptionFull) {
    return NextResponse.json({ error: 'No transcript to analyze' }, { status: 400 })
  }

  let analysis
  try {
    analysis = await analyzeTranscription(feedback.transcriptionFull)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Analysis failed' },
      { status: 502 },
    )
  }

  await prisma.guestFeedback.update({
    where: { id: feedback.id },
    data: {
      callStatus: analysis.complete ? 'COMPLETED_SUCCESS' : 'COMPLETED_PARTIAL',
      scorePropertyStructure: analysis.scores.propertyStructure,
      scorePropertyAmenities: analysis.scores.propertyAmenities,
      scoreLocation: analysis.scores.location,
      scoreValueForMoney: analysis.scores.valueForMoney,
      scorePropertyState: analysis.scores.propertyState,
      scoreCleanliness: analysis.scores.cleanliness,
      scoreCrewPresentation: analysis.scores.crewPresentation,
      scoreCommunication: analysis.scores.communication,
      scoreCheckInExperience: analysis.scores.checkInExperience,
      scoreCheckOutExperience: analysis.scores.checkOutExperience,
      scorePlatformOverall: analysis.scores.platformOverall,
      scoreNps: analysis.scores.nps,
      npsCategory: calculateNpsCategory(analysis.scores.nps),
      sentimentOverall: analysis.sentiment,
      feedbackFirstImpression: analysis.qualitative.firstImpression,
      feedbackProperty: analysis.qualitative.property,
      feedbackPropertyPositive: analysis.qualitative.propertyPositive,
      feedbackPropertyImprovement: analysis.qualitative.propertyImprovement,
      feedbackCrew: analysis.qualitative.crew,
      feedbackCrewPositive: analysis.qualitative.crewPositive,
      feedbackCrewImprovement: analysis.qualitative.crewImprovement,
      feedbackPlatform: analysis.qualitative.platform,
      feedbackPlatformPositive: analysis.qualitative.platformPositive,
      feedbackPlatformImprovement: analysis.qualitative.platformImprovement,
      feedbackRecommendation: analysis.qualitative.recommendation,
      categoryTags: analysis.tags,
      contactedDuringStay: analysis.contactedDuringStay,
      contactResponseScore: analysis.contactResponseScore,
    },
  })

  await runPostFeedbackWorkflows(feedback.id)

  return NextResponse.json({ ok: true, sentiment: analysis.sentiment, complete: analysis.complete })
}
