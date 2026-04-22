import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * GET /api/admin/feedback/summary
 *
 * Aggregated KPIs for the admin feedback dashboard — 3 dimensions:
 *   - Property (owner accountability)
 *   - Crew (delivery accountability)
 *   - Platform (HostMasters accountability)
 *
 * Query params:
 *   ?days=30 → date window (default 90)
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const { searchParams } = new URL(request.url)
  const days = Math.min(Number(searchParams.get('days') ?? 90), 365)
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const baseWhere: Record<string, unknown> = {
    createdAt: { gte: since },
    callStatus: { in: ['COMPLETED_SUCCESS', 'COMPLETED_PARTIAL', 'FALLBACK_WEB_COMPLETED'] },
  }
  if (me.role === 'MANAGER') {
    baseWhere.client = { managerId: me.id }
  }

  // All-call stats (total scheduled vs completed = response rate)
  const [totalScheduled, allFeedback] = await Promise.all([
    prisma.guestFeedback.count({
      where: {
        createdAt: { gte: since },
        ...(me.role === 'MANAGER' ? { client: { managerId: me.id } } : {}),
      },
    }),
    prisma.guestFeedback.findMany({
      where: baseWhere,
      select: {
        // Property
        scorePropertyStructure: true,
        scorePropertyAmenities: true,
        scoreLocation: true,
        scoreValueForMoney: true,
        // Crew
        scorePropertyState: true,
        scoreCleanliness: true,
        scoreCrewPresentation: true,
        // Platform
        scoreCommunication: true,
        scoreCheckInExperience: true,
        scoreCheckOutExperience: true,
        scorePlatformOverall: true,
        scoreNps: true,
        npsCategory: true,
        sentimentOverall: true,
        escalationLevel: true,
        escalationTriggered: true,
        categoryTags: true,
      },
    }),
  ])

  const completed = allFeedback.length
  const responseRate = totalScheduled > 0 ? +(completed / totalScheduled * 100).toFixed(1) : 0

  const avg = (values: (number | null)[]) => {
    const nums = values.filter((v): v is number => v !== null)
    return nums.length ? +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2) : null
  }

  // Dimension averages
  const property = {
    structure:  avg(allFeedback.map(f => f.scorePropertyStructure)),
    amenities:  avg(allFeedback.map(f => f.scorePropertyAmenities)),
    location:   avg(allFeedback.map(f => f.scoreLocation)),
    valueForMoney: avg(allFeedback.map(f => f.scoreValueForMoney)),
    overall:    avg(allFeedback.flatMap(f => [
      f.scorePropertyStructure, f.scorePropertyAmenities,
      f.scoreLocation, f.scoreValueForMoney,
    ])),
  }
  const crew = {
    state:          avg(allFeedback.map(f => f.scorePropertyState)),
    cleanliness:    avg(allFeedback.map(f => f.scoreCleanliness)),
    presentation:   avg(allFeedback.map(f => f.scoreCrewPresentation)),
    overall:        avg(allFeedback.flatMap(f => [
      f.scorePropertyState, f.scoreCleanliness, f.scoreCrewPresentation,
    ])),
  }
  const platform = {
    communication:     avg(allFeedback.map(f => f.scoreCommunication)),
    checkIn:           avg(allFeedback.map(f => f.scoreCheckInExperience)),
    checkOut:          avg(allFeedback.map(f => f.scoreCheckOutExperience)),
    platformOverall:   avg(allFeedback.map(f => f.scorePlatformOverall)),
    overall:           avg(allFeedback.flatMap(f => [
      f.scoreCommunication, f.scoreCheckInExperience,
      f.scoreCheckOutExperience, f.scorePlatformOverall,
    ])),
  }

  // NPS calculation
  const npsValues = allFeedback.map(f => f.scoreNps).filter((v): v is number => v !== null)
  const promoters  = npsValues.filter(v => v >= 9).length
  const passives   = npsValues.filter(v => v >= 7 && v <= 8).length
  const detractors = npsValues.filter(v => v <= 6).length
  const nps = npsValues.length > 0
    ? Math.round((promoters - detractors) / npsValues.length * 100)
    : null

  // Escalations
  const escalations = {
    total: allFeedback.filter(f => f.escalationTriggered).length,
    critical: allFeedback.filter(f => f.escalationLevel === 'CRITICAL').length,
    high:     allFeedback.filter(f => f.escalationLevel === 'HIGH').length,
    medium:   allFeedback.filter(f => f.escalationLevel === 'MEDIUM').length,
    low:      allFeedback.filter(f => f.escalationLevel === 'LOW').length,
  }

  // Sentiment distribution
  const sentiment = {
    positive:       allFeedback.filter(f => f.sentimentOverall === 'POSITIVE').length,
    neutral:        allFeedback.filter(f => f.sentimentOverall === 'NEUTRAL').length,
    negative:       allFeedback.filter(f => f.sentimentOverall === 'NEGATIVE').length,
    severeNegative: allFeedback.filter(f => f.sentimentOverall === 'SEVERE_NEGATIVE').length,
  }

  // Top tags
  const tagCounts: Record<string, number> = {}
  for (const f of allFeedback) {
    for (const tag of f.categoryTags ?? []) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    }
  }
  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }))

  return NextResponse.json({
    windowDays: days,
    totalScheduled,
    completed,
    responseRate,
    nps,
    npsBreakdown: { promoters, passives, detractors, total: npsValues.length },
    dimensions: { property, crew, platform },
    escalations,
    sentiment,
    topTags,
  })
}
