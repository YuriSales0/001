import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { calculateSuggestedPrice } from '@/lib/pricing-engine'
import type { PricingSuggestion } from '@/lib/pricing-engine'

export type PropertyPricingSuggestion = {
  propertyId: string
  propertyName: string
  zoneId: string | null
  bedrooms: number
  suggestion: PricingSuggestion
}

/**
 * GET /api/ai/pricing-engine
 *
 * Gera sugestões de preço para todas as propriedades activas
 * combinando dados próprios + dados de competitors.
 *
 * Query params:
 *   ?month=7&dayOfWeek=5  — target date (default: amanhã)
 *   ?propertyId=xxx       — só uma propriedade
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const params = request.nextUrl.searchParams
  const propertyId = params.get('propertyId')

  // Target date context
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const targetMonth = parseInt(params.get('month') ?? '') || (tomorrow.getMonth() + 1)
  const targetDayOfWeek = parseInt(params.get('dayOfWeek') ?? '') || ((tomorrow.getDay() + 6) % 7) // convert JS Sun=0 to Mon=0
  const leadTimeDays = parseInt(params.get('leadTime') ?? '') || 14

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  // Get active properties
  const where = propertyId
    ? { id: propertyId, status: 'ACTIVE' as const }
    : { status: 'ACTIVE' as const }

  const properties = await prisma.property.findMany({
    where,
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      bedrooms: true,
      reservations: {
        where: { checkIn: { gte: ninetyDaysAgo }, status: { not: 'CANCELLED' } },
        select: { amount: true, checkIn: true, checkOut: true },
      },
    },
  })

  // Get all competitor listings with recent prices
  const competitors = await prisma.competitorListing.findMany({
    where: { isActive: true },
    select: {
      id: true,
      zoneId: true,
      bedrooms: true,
      pricePerNight: true,
      priceWeekend: true,
      rating: true,
      isSuperhost: true,
    },
  })

  // Auto-detect zone for each property
  function detectZone(lat: number | null, lng: number | null): string | null {
    if (!lat || !lng) return null
    const ZONES = [
      { id: 'zone-san-cristobal',   minLat: 36.7250, maxLat: 36.7360, minLng: -3.7080, maxLng: -3.6940 },
      { id: 'zone-centro',          minLat: 36.7305, maxLat: 36.7410, minLng: -3.6940, maxLng: -3.6820 },
      { id: 'zone-velilla',         minLat: 36.7290, maxLat: 36.7385, minLng: -3.6820, maxLng: -3.6660 },
      { id: 'zone-herradura',       minLat: 36.7320, maxLat: 36.7470, minLng: -3.7450, maxLng: -3.7230 },
      { id: 'zone-marina-este',     minLat: 36.7240, maxLat: 36.7320, minLng: -3.7320, maxLng: -3.7220 },
      { id: 'zone-taramay-cotobro', minLat: 36.7200, maxLat: 36.7290, minLng: -3.6850, maxLng: -3.6540 },
      { id: 'zone-interior',        minLat: 36.7420, maxLat: 36.7600, minLng: -3.7050, maxLng: -3.6600 },
      { id: 'zone-salobrena',       minLat: 36.7400, maxLat: 36.7580, minLng: -3.6000, maxLng: -3.5700 },
    ]
    for (const z of ZONES) {
      if (lat >= z.minLat && lat <= z.maxLat && lng >= z.minLng && lng <= z.maxLng) return z.id
    }
    return null
  }

  const results: PropertyPricingSuggestion[] = []

  for (const prop of properties) {
    const zoneId = detectZone(prop.latitude, prop.longitude)

    // Own historical prices (per night, from reservations)
    const ownPrices: number[] = []
    let totalNights = 0
    for (const r of prop.reservations) {
      const nights = Math.max(1, Math.ceil((r.checkOut.getTime() - r.checkIn.getTime()) / (1000 * 60 * 60 * 24)))
      const perNight = r.amount / nights
      ownPrices.push(+perNight.toFixed(0))
      totalNights += nights
    }

    const ownOccupancy = Math.min(100, (totalNights / 90) * 100)

    // Competitor prices in same zone (or nearby bedrooms if no zone)
    const isWeekend = targetDayOfWeek >= 4 // Fri-Sun
    const competitorPrices = competitors
      .filter(c => {
        if (zoneId && c.zoneId === zoneId) return true
        // Fallback: same bedroom count
        if (!zoneId && c.bedrooms === (prop.bedrooms ?? 2)) return true
        return false
      })
      .map(c => isWeekend && c.priceWeekend ? c.priceWeekend : c.pricePerNight)

    const suggestion = calculateSuggestedPrice({
      ownHistoricalPrices: ownPrices,
      ownOccupancy: +ownOccupancy.toFixed(0),
      competitorPrices,
      targetMonth,
      targetDayOfWeek,
      leadTimeDays,
      rating: null,
      isSuperhost: false,
    })

    results.push({
      propertyId: prop.id,
      propertyName: prop.name,
      zoneId,
      bedrooms: prop.bedrooms ?? 0,
      suggestion,
    })
  }

  // Sort by suggested price desc
  results.sort((a, b) => b.suggestion.suggestedPrice - a.suggestion.suggestedPrice)

  return NextResponse.json({
    targetMonth,
    targetDayOfWeek,
    leadTimeDays,
    propertyCount: results.length,
    competitorCount: competitors.length,
    suggestions: results,
  })
}
