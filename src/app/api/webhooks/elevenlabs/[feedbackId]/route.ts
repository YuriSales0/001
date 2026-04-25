import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { analyzeTranscription, calculateNpsCategory } from '@/lib/vagf/analyzer'
import { runPostFeedbackWorkflows } from '@/lib/vagf/workflows'

/**
 * Verify ElevenLabs webhook signature (HMAC-SHA256 over raw body).
 * Header: x-elevenlabs-signature: t=<timestamp>,v0=<hmac>
 */
function verifyElevenLabsSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.ELEVENLABS_WEBHOOK_SECRET
  // Dev mode: if no secret configured, allow (but log a warning)
  if (!secret) {
    console.warn('[VAGF] ELEVENLABS_WEBHOOK_SECRET not set — accepting webhook without verification')
    return true
  }
  if (!signatureHeader) return false

  // Parse header: "t=123456,v0=abcdef..."
  const parts = signatureHeader.split(',').reduce<Record<string, string>>((acc, kv) => {
    const [k, v] = kv.split('=')
    if (k && v) acc[k.trim()] = v.trim()
    return acc
  }, {})
  const timestamp = parts.t
  const providedSig = parts.v0
  if (!timestamp || !providedSig) return false

  // Reject replays older than 5 minutes
  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (age > 300) return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  // Constant-time comparison
  const a = Buffer.from(providedSig, 'hex')
  const b = Buffer.from(expected, 'hex')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

/**
 * POST /api/webhooks/elevenlabs/[feedbackId]
 *
 * ElevenLabs Conversational AI sends webhook events here after a call
 * completes, fails, or goes unanswered. Signature verified with HMAC.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { feedbackId: string } },
) {
  // Read raw body for signature verification
  const rawBody = await req.text()
  if (!verifyElevenLabsSignature(rawBody, req.headers.get('x-elevenlabs-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

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

        let analysis
        try {
          analysis = await analyzeTranscription(transcript)
        } catch (err) {
          console.error(`[VAGF] Analysis failed for ${feedbackId}:`, err)
          // Persist transcript but mark partial — admin can retry analysis manually
          await prisma.guestFeedback.update({
            where: { id: feedbackId },
            data: {
              callStatus: 'COMPLETED_PARTIAL',
              callEndedAt: new Date(),
              callDurationSeconds: duration,
              recordingUrl,
              transcriptionFull: transcript,
            },
          })
          return NextResponse.json({
            received: true,
            warning: 'Analysis failed — stored transcript only',
          })
        }

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
            // Confidence data for score guard
            analysisConfidence: analysis.confidence?.overall ?? null,
            analysisCrossValidated: analysis.crossValidated ?? false,
            analysisReviewRequired: analysis.reviewRequired ?? false,
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
