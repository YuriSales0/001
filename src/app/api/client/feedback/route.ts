import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * GET /api/client/feedback
 *
 * Returns guest feedback for properties owned by the authenticated CLIENT,
 * plus aggregated scores per dimension + benchmarks.
 */
export async function GET(_request: NextRequest) {
  const guard = await requireRole(['CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const items = await prisma.guestFeedback.findMany({
    where: {
      clientId: me.id,
      callStatus: { in: ['COMPLETED_SUCCESS', 'COMPLETED_PARTIAL', 'FALLBACK_WEB_COMPLETED'] },
    },
    select: {
      id: true,
      createdAt: true,
      language: true,
      scorePropertyStructure: true,
      scorePropertyAmenities: true,
      scoreLocation: true,
      scoreValueForMoney: true,
      scorePropertyState: true,
      scoreCleanliness: true,
      scoreCrewPresentation: true,
      scoreCommunication: true,
      scoreCheckInExperience: true,
      scoreCheckOutExperience: true,
      scorePlatformOverall: true,
      scoreNps: true,
      npsCategory: true,
      sentimentOverall: true,
      feedbackProperty: true,
      feedbackPropertyPositive: true,
      feedbackPropertyImprovement: true,
      feedbackCrew: true,
      feedbackPlatform: true,
      feedbackRecommendation: true,
      categoryTags: true,
      property: { select: { id: true, name: true, city: true } },
      reservation: { select: { guestName: true, checkIn: true, checkOut: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })

  // Platform-wide benchmark for the same window (anonymous, aggregate only)
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
  const benchmarkData = await prisma.guestFeedback.findMany({
    where: {
      callStatus: { in: ['COMPLETED_SUCCESS', 'COMPLETED_PARTIAL', 'FALLBACK_WEB_COMPLETED'] },
      createdAt: { gte: since },
    },
    select: {
      scorePropertyStructure: true,
      scorePropertyAmenities: true,
      scoreLocation: true,
      scoreValueForMoney: true,
      scoreNps: true,
    },
  })

  const avg = (arr: (number | null)[]) => {
    const nums = arr.filter((v): v is number => v !== null)
    return nums.length ? +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : null
  }

  const benchmark = {
    propertyStructure: avg(benchmarkData.map(f => f.scorePropertyStructure)),
    propertyAmenities: avg(benchmarkData.map(f => f.scorePropertyAmenities)),
    location: avg(benchmarkData.map(f => f.scoreLocation)),
    valueForMoney: avg(benchmarkData.map(f => f.scoreValueForMoney)),
    nps: avg(benchmarkData.map(f => f.scoreNps)),
    sampleSize: benchmarkData.length,
  }

  return NextResponse.json({ items, benchmark })
}
