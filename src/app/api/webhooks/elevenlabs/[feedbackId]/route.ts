import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { analyzeTranscription, calculateNpsCategory } from '@/lib/vagf/analyzer'
import { runPostFeedbackWorkflows } from '@/lib/vagf/workflows'

/**
 * POST /api/webhooks/elevenlabs/[feedbackId]
 *
 * ElevenLabs Conversational AI sends webhook events here after a call
 * completes, fails, or goes unanswered.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { feedbackId: string } },
) {
  const payload = await req.json()
  const feedbackId = params.feedbackId

  const feedback = await prisma.guestFeedback.findUnique({
    where: { id: feedbackId },
    select: { id: true, callAttempts: true, callStatus: true },
  })
  if (!feedback) {
    return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
  }

  const event = payload.event ?? payload.type ?? 'unknown'

  try {
    switch (event) {
      case 'call.completed':
      case 'conversation.completed': {
        const transcript = payload.transcript ?? payload.transcription ?? ''
        const duration = payload.duration_seconds ?? payload.duration ?? 0
        const recordingUrl = payload.recording_url ?? null

        if (!transcript) {
          await prisma.guestFeedback.update({
            where: { id: feedbackId },
            data: {
              callStatus: 'COMPLETED_PARTIAL',
              callEndedAt: new Date(),
              callDurationSeconds: duration,
              recordingUrl,
            },
          })
          break
        }

        const analysis = await analyzeTranscription(transcript)

        await prisma.guestFeedback.update({
          where: { id: feedbackId },
          data: {
            callStatus: analysis.complete ? 'COMPLETED_SUCCESS' : 'COMPLETED_PARTIAL',
            callEndedAt: new Date(),
            callDurationSeconds: duration,
            recordingUrl,
            transcriptionFull: transcript,
            // PROPERTY scores
            scorePropertyStructure: analysis.scores.propertyStructure,
            scorePropertyAmenities: analysis.scores.propertyAmenities,
            scoreLocation: analysis.scores.location,
            scoreValueForMoney: analysis.scores.valueForMoney,
            // CREW scores
            scorePropertyState: analysis.scores.propertyState,
            scoreCleanliness: analysis.scores.cleanliness,
            scoreCrewPresentation: analysis.scores.crewPresentation,
            // PLATFORM scores
            scoreCommunication: analysis.scores.communication,
            scoreCheckInExperience: analysis.scores.checkInExperience,
            scoreCheckOutExperience: analysis.scores.checkOutExperience,
            scorePlatformOverall: analysis.scores.platformOverall,
            scoreNps: analysis.scores.nps,
            npsCategory: calculateNpsCategory(analysis.scores.nps),
            sentimentOverall: analysis.sentiment,
            // Qualitative — 3 dimensions
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
            reviewPromptSent: analysis.reviewSmsRequested,
          },
        })

        await runPostFeedbackWorkflows(feedbackId)
        break
      }

      case 'call.failed':
      case 'call.error': {
        if (feedback.callAttempts < 2) {
          // Reschedule 4 hours later
          await prisma.guestFeedback.update({
            where: { id: feedbackId },
            data: {
              callStatus: 'SCHEDULED',
              callScheduledAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
            },
          })
        } else {
          await prisma.guestFeedback.update({
            where: { id: feedbackId },
            data: { callStatus: 'UNREACHABLE' },
          })
        }
        break
      }

      case 'call.no_answer':
      case 'call.busy': {
        if (feedback.callAttempts < 2) {
          await prisma.guestFeedback.update({
            where: { id: feedbackId },
            data: {
              callStatus: 'SCHEDULED',
              callScheduledAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
            },
          })
        } else {
          // Fallback to SMS with web form link
          await prisma.guestFeedback.update({
            where: { id: feedbackId },
            data: { callStatus: 'NOT_ANSWERED' },
          })
        }
        break
      }

      case 'call.declined': {
        await prisma.guestFeedback.update({
          where: { id: feedbackId },
          data: { callStatus: 'DECLINED' },
        })
        break
      }

      default:
        console.log(`[VAGF] Unhandled ElevenLabs event: ${event}`)
    }
  } catch (err) {
    console.error(`[VAGF] Webhook error for ${feedbackId}:`, err)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
