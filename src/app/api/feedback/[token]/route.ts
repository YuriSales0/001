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

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)
  const str = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : null)
  const bool = (v: unknown): boolean => v === true

  const scoreNps = num(body.scoreNps)
  await prisma.guestFeedback.update({
    where: { id: feedback.id },
    data: {
      callStatus: 'FALLBACK_WEB_COMPLETED',
      callEndedAt: new Date(),
      scorePropertyState: num(body.scorePropertyState),
      scoreCleanliness: num(body.scoreCleanliness),
      scoreCommunication: num(body.scoreCommunication),
      scorePlatformOverall: num(body.scorePlatformOverall),
      scoreNps: scoreNps,
      npsCategory: calculateNpsCategory(scoreNps),
      sentimentOverall: deriveSentiment(body),
      feedbackFirstImpression: str(body.firstImpression),
      feedbackPositive: str(body.positive),
      feedbackImprovement: str(body.improvement),
      feedbackNegative: str(body.negative),
      feedbackRecommendation: str(body.recommendation),
      contactedDuringStay: bool(body.contactedDuringStay),
      contactResponseScore: num(body.contactResponseScore),
      reviewPromptSent: bool(body.wantsToReview),
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
