import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateNpsCategory } from '@/lib/vagf/analyzer'
import { runPostFeedbackWorkflows } from '@/lib/vagf/workflows'

/**
 * GET /api/feedback/[token] — load feedback form data
 * POST /api/feedback/[token] — submit web-based feedback (SMS fallback)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { token: string } },
) {
  const feedback = await prisma.guestFeedback.findUnique({
    where: { webToken: params.token },
    select: {
      id: true,
      callStatus: true,
      language: true,
      property: { select: { name: true, city: true } },
      reservation: { select: { guestName: true, checkOut: true } },
    },
  })

  if (!feedback) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (feedback.callStatus === 'FALLBACK_WEB_COMPLETED') {
    return NextResponse.json({ error: 'Already completed', completed: true }, { status: 410 })
  }

  return NextResponse.json({
    propertyName: feedback.property.name,
    propertyCity: feedback.property.city,
    guestName: feedback.reservation.guestName,
    checkOutDate: feedback.reservation.checkOut,
    language: feedback.language,
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  const feedback = await prisma.guestFeedback.findUnique({
    where: { webToken: params.token },
    select: { id: true, callStatus: true },
  })

  if (!feedback) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (feedback.callStatus === 'FALLBACK_WEB_COMPLETED') {
    return NextResponse.json({ error: 'Already completed' }, { status: 410 })
  }

  const body = await request.json()

  await prisma.guestFeedback.update({
    where: { id: feedback.id },
    data: {
      callStatus: 'FALLBACK_WEB_COMPLETED',
      callEndedAt: new Date(),
      scorePropertyState: body.scorePropertyState ?? null,
      scoreCleanliness: body.scoreCleanliness ?? null,
      scoreCommunication: body.scoreCommunication ?? null,
      scorePlatformOverall: body.scorePlatformOverall ?? null,
      scoreNps: body.scoreNps ?? null,
      npsCategory: calculateNpsCategory(body.scoreNps ?? null),
      sentimentOverall: deriveSentiment(body),
      feedbackFirstImpression: body.firstImpression ?? null,
      feedbackPositive: body.positive ?? null,
      feedbackImprovement: body.improvement ?? null,
      feedbackNegative: body.negative ?? null,
      feedbackRecommendation: body.recommendation ?? null,
      contactedDuringStay: body.contactedDuringStay ?? false,
      contactResponseScore: body.contactResponseScore ?? null,
      reviewPromptSent: body.wantsToReview ?? false,
    },
  })

  await runPostFeedbackWorkflows(feedback.id)

  return NextResponse.json({ ok: true })
}

function deriveSentiment(body: Record<string, unknown>): 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'SEVERE_NEGATIVE' {
  const overall = body.scorePlatformOverall as number | null
  const cleanliness = body.scoreCleanliness as number | null
  const avg = [overall, cleanliness].filter((v): v is number => v !== null)
  if (avg.length === 0) return 'NEUTRAL'
  const mean = avg.reduce((a, b) => a + b, 0) / avg.length
  if (mean >= 8) return 'POSITIVE'
  if (mean >= 5) return 'NEUTRAL'
  if (mean >= 3) return 'NEGATIVE'
  return 'SEVERE_NEGATIVE'
}
