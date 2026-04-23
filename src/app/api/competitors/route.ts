import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * GET  /api/competitors — lista todos os competitors activos
 * POST /api/competitors — criar ou bulk import
 *
 * Bulk import aceita array: { listings: [...] }
 * Single aceita objecto: { title, platform, latitude, ... }
 */

export async function GET(request: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const zoneId = request.nextUrl.searchParams.get('zone')
  const platform = request.nextUrl.searchParams.get('platform')

  const where: Record<string, unknown> = { isActive: true }
  if (zoneId) where.zoneId = zoneId
  if (platform) where.platform = platform

  const listings = await prisma.competitorListing.findMany({
    where,
    orderBy: { pricePerNight: 'desc' },
    include: {
      prices: {
        orderBy: { date: 'desc' },
        take: 30, // últimos 30 dias
      },
    },
  })

  return NextResponse.json({
    count: listings.length,
    listings,
  })
}

// Zone detection (same logic as market/geo)
function detectZone(lat: number, lng: number): string | null {
  const ZONES: { id: string; minLat: number; maxLat: number; minLng: number; maxLng: number }[] = [
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

export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Bulk import
  if (body.listings && Array.isArray(body.listings)) {
    const results: { id: string; title: string; status: 'created' | 'updated' | 'error'; error?: string }[] = []

    for (const item of body.listings) {
      try {
        const zoneId = detectZone(item.latitude, item.longitude)
        const data = {
          externalId: item.externalId ?? null,
          platform: item.platform ?? 'AIRBNB',
          title: item.title,
          latitude: item.latitude,
          longitude: item.longitude,
          zoneId,
          bedrooms: item.bedrooms ?? 1,
          bathrooms: item.bathrooms ?? 1,
          maxGuests: item.maxGuests ?? 4,
          pricePerNight: item.pricePerNight,
          priceWeekend: item.priceWeekend ?? null,
          rating: item.rating ?? null,
          reviewCount: item.reviewCount ?? 0,
          isSuperhost: item.isSuperhost ?? false,
          instantBook: item.instantBook ?? false,
          minNights: item.minNights ?? 1,
          amenities: item.amenities ? JSON.stringify(item.amenities) : null,
          imageUrl: item.imageUrl ?? null,
          listingUrl: item.listingUrl ?? null,
          lastScrapedAt: new Date(),
        }

        // Upsert by externalId+platform if externalId provided
        if (item.externalId && item.platform) {
          await prisma.competitorListing.upsert({
            where: { externalId_platform: { externalId: item.externalId, platform: item.platform } },
            create: data,
            update: { ...data, updatedAt: new Date() },
          })
          results.push({ id: item.externalId, title: item.title, status: 'updated' })
        } else {
          const created = await prisma.competitorListing.create({ data })
          results.push({ id: created.id, title: item.title, status: 'created' })
        }
      } catch (err) {
        results.push({ id: item.externalId ?? '?', title: item.title ?? '?', status: 'error', error: String(err) })
      }
    }

    return NextResponse.json({
      imported: results.filter(r => r.status !== 'error').length,
      errors: results.filter(r => r.status === 'error').length,
      results,
    })
  }

  // Single create
  if (!body.title || !body.latitude || !body.longitude || !body.pricePerNight) {
    return NextResponse.json({ error: 'title, latitude, longitude, pricePerNight required' }, { status: 400 })
  }

  const zoneId = detectZone(body.latitude, body.longitude)
  const listing = await prisma.competitorListing.create({
    data: {
      externalId: body.externalId ?? null,
      platform: body.platform ?? 'AIRBNB',
      title: body.title,
      latitude: body.latitude,
      longitude: body.longitude,
      zoneId,
      bedrooms: body.bedrooms ?? 1,
      bathrooms: body.bathrooms ?? 1,
      maxGuests: body.maxGuests ?? 4,
      pricePerNight: body.pricePerNight,
      priceWeekend: body.priceWeekend ?? null,
      rating: body.rating ?? null,
      reviewCount: body.reviewCount ?? 0,
      isSuperhost: body.isSuperhost ?? false,
      instantBook: body.instantBook ?? false,
      minNights: body.minNights ?? 1,
      amenities: body.amenities ? JSON.stringify(body.amenities) : null,
      imageUrl: body.imageUrl ?? null,
      listingUrl: body.listingUrl ?? null,
      lastScrapedAt: new Date(),
    },
  })

  return NextResponse.json(listing, { status: 201 })
}
