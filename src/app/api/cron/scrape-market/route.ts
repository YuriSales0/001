import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 min timeout for scraping + analysis

/**
 * Cron: Market Scraping Agent
 * Scheduled: weekly (Sunday 06:00 UTC) — vercel.json
 *
 * Uses Claude with tool_use to:
 * 1. Fetch Airbnb/Booking search pages for Costa Tropical
 * 2. Extract listing data in structured format
 * 3. Analyse market trends
 * 4. Store results in CompetitorListing + MarketReport
 *
 * Cost estimate: ~€2-5/run with Haiku (parsing) + Sonnet (analysis)
 */
export async function GET(request: NextRequest) {
  // Auth: Vercel Cron or manual trigger with secret
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      error: 'ANTHROPIC_API_KEY not configured',
      hint: 'Add ANTHROPIC_API_KEY to Vercel environment variables',
    }, { status: 503 })
  }

  const client = new Anthropic()
  const region = 'Almuñécar, Costa Tropical, Spain'
  const now = new Date()

  // ── Step 1: Fetch search pages ──
  const searchUrls = [
    `https://www.airbnb.com/s/Almu%C3%B1%C3%A9car--Spain/homes?adults=2&checkin=&checkout=&tab_id=home_tab&refinement_paths%5B%5D=%2Fhomes`,
    `https://www.booking.com/searchresults.html?ss=Almu%C3%B1%C3%A9car&ssne=Almu%C3%B1%C3%A9car&dest_type=city&nflt=ht_id%3D220`,
  ]

  const fetchedPages: { url: string; html: string; status: number }[] = []

  for (const url of searchUrls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
          'Accept': 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(15000),
      })
      const html = await res.text()
      fetchedPages.push({ url, html: html.slice(0, 50000), status: res.status }) // limit to 50KB per page
    } catch (err) {
      console.error(`[Scrape] Failed to fetch ${url}:`, err)
      fetchedPages.push({ url, html: '', status: 0 })
    }
  }

  const successfulPages = fetchedPages.filter(p => p.status === 200 && p.html.length > 1000)

  if (successfulPages.length === 0) {
    // No pages fetched — store report noting the failure and exit
    await prisma.marketReport.upsert({
      where: {
        weekOf_region_type: {
          weekOf: getMonday(now),
          region: 'costa-tropical',
          type: 'WEEKLY_SCRAPE',
        },
      },
      create: {
        weekOf: getMonday(now),
        region: 'costa-tropical',
        type: 'WEEKLY_SCRAPE',
        summary: 'Scraping failed — no pages fetched successfully. Platforms may be blocking automated requests.',
        data: { fetchAttempts: fetchedPages.length, errors: fetchedPages.map(p => ({ url: p.url, status: p.status })) },
        listingsScraped: 0,
        topInsight: 'Scrape failed — retry next week or add manual data via /api/competitors',
      },
      update: {
        summary: 'Scraping failed — no pages fetched successfully.',
        data: { fetchAttempts: fetchedPages.length, errors: fetchedPages.map(p => ({ url: p.url, status: p.status })) },
      },
    })
    return NextResponse.json({ status: 'failed', reason: 'no pages fetched' })
  }

  // ── Step 2: Claude extracts listings from HTML ──
  type ExtractedListing = {
    title: string
    pricePerNight: number
    bedrooms: number
    bathrooms: number
    maxGuests: number
    rating: number | null
    reviewCount: number
    isSuperhost: boolean
    instantBook: boolean
    latitude: number | null
    longitude: number | null
    amenities: string[]
    propertyType: string
    platform: string
  }

  let extractedListings: ExtractedListing[] = []

  for (const page of successfulPages) {
    const platform = page.url.includes('airbnb') ? 'AIRBNB' : 'BOOKING'

    try {
      const extraction = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: `You are a data extraction agent. Extract vacation rental listing data from HTML.
Return ONLY a JSON array of listings. Each listing should have:
- title: string
- pricePerNight: number (in EUR, estimate if shown in other currency)
- bedrooms: number (default 1)
- bathrooms: number (default 1)
- maxGuests: number (default 4)
- rating: number | null (0-5 scale)
- reviewCount: number (default 0)
- isSuperhost: boolean
- instantBook: boolean
- latitude: number | null
- longitude: number | null
- amenities: string[] (pool, wifi, AC, parking, etc.)
- propertyType: string (apartment, villa, house, studio, room)

If data is not visible, use sensible defaults. Extract as many listings as you can find.
If the HTML is blocked/empty/CAPTCHA, return an empty array [].
Return ONLY valid JSON, no markdown, no explanation.`,
        messages: [{
          role: 'user',
          content: `Extract listing data from this ${platform} search page HTML:\n\n${page.html}`,
        }],
      })

      const text = extraction.content[0].type === 'text' ? extraction.content[0].text : '[]'
      const cleaned = text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim()
      const parsed = JSON.parse(cleaned) as ExtractedListing[]
      extractedListings.push(
        ...parsed.map(l => ({ ...l, platform }))
      )
    } catch (err) {
      console.error(`[Scrape] Claude extraction failed for ${platform}:`, err)
    }
  }

  // ── Step 3: Store extracted listings ──
  let stored = 0
  let errors = 0

  for (const listing of extractedListings) {
    try {
      const zoneId = listing.latitude && listing.longitude
        ? detectZone(listing.latitude, listing.longitude)
        : null

      await prisma.competitorListing.upsert({
        where: {
          externalId_platform: {
            externalId: `scraped_${listing.title.toLowerCase().replace(/\s+/g, '_').slice(0, 50)}`,
            platform: listing.platform as 'AIRBNB' | 'BOOKING',
          },
        },
        create: {
          externalId: `scraped_${listing.title.toLowerCase().replace(/\s+/g, '_').slice(0, 50)}`,
          platform: listing.platform as 'AIRBNB' | 'BOOKING',
          title: listing.title,
          latitude: listing.latitude ?? 36.7340, // default Almuñécar center
          longitude: listing.longitude ?? -3.6899,
          zoneId,
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          maxGuests: listing.maxGuests,
          pricePerNight: listing.pricePerNight,
          rating: listing.rating,
          reviewCount: listing.reviewCount,
          isSuperhost: listing.isSuperhost,
          instantBook: listing.instantBook,
          amenities: listing.amenities ? JSON.stringify(listing.amenities) : null,
          lastScrapedAt: now,
        },
        update: {
          pricePerNight: listing.pricePerNight,
          rating: listing.rating,
          reviewCount: listing.reviewCount,
          lastScrapedAt: now,
          isActive: true,
        },
      })
      stored++
    } catch {
      errors++
    }
  }

  // ── Step 4: Claude analyses the market ──
  let analysis = ''
  let topInsight = ''

  if (extractedListings.length >= 3) {
    try {
      const avgPrice = extractedListings.reduce((s, l) => s + l.pricePerNight, 0) / extractedListings.length
      const priceRange = {
        min: Math.min(...extractedListings.map(l => l.pricePerNight)),
        max: Math.max(...extractedListings.map(l => l.pricePerNight)),
      }
      const avgRating = extractedListings.filter(l => l.rating).reduce((s, l) => s + (l.rating ?? 0), 0) /
        Math.max(1, extractedListings.filter(l => l.rating).length)
      const superhostPct = (extractedListings.filter(l => l.isSuperhost).length / extractedListings.length) * 100
      const types = extractedListings.reduce((acc, l) => {
        acc[l.propertyType] = (acc[l.propertyType] ?? 0) + 1
        return acc
      }, {} as Record<string, number>)

      const dataForAnalysis = {
        region,
        date: now.toISOString().split('T')[0],
        listingsCount: extractedListings.length,
        avgPrice: +avgPrice.toFixed(0),
        priceRange,
        avgRating: +avgRating.toFixed(1),
        superhostPct: +superhostPct.toFixed(0),
        propertyTypes: types,
        avgBedrooms: +(extractedListings.reduce((s, l) => s + l.bedrooms, 0) / extractedListings.length).toFixed(1),
      }

      const analysisResponse = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: `You are a market analyst for short-term rentals in Costa Tropical, Spain.
Analyse the scraped market data and provide:
1. A 2-3 paragraph market summary in Portuguese (Portugal)
2. Key trends and anomalies
3. One actionable insight for property managers
4. Comparison with typical Costa Tropical seasonal patterns

Be concise, data-driven, and actionable. This feeds a dashboard for property managers.`,
        messages: [{
          role: 'user',
          content: `Analyse this week's market data for ${region}:\n\n${JSON.stringify(dataForAnalysis, null, 2)}`,
        }],
      })

      analysis = analysisResponse.content[0].type === 'text' ? analysisResponse.content[0].text : ''
      // Extract first sentence as top insight
      topInsight = analysis.split('.')[0] + '.'
    } catch (err) {
      console.error('[Scrape] Analysis failed:', err)
      analysis = 'Análise não disponível esta semana.'
    }
  }

  // ── Step 5: Store market report ──
  const avgPrice = extractedListings.length > 0
    ? extractedListings.reduce((s, l) => s + l.pricePerNight, 0) / extractedListings.length
    : null

  await prisma.marketReport.upsert({
    where: {
      weekOf_region_type: {
        weekOf: getMonday(now),
        region: 'costa-tropical',
        type: 'WEEKLY_SCRAPE',
      },
    },
    create: {
      weekOf: getMonday(now),
      region: 'costa-tropical',
      type: 'WEEKLY_SCRAPE',
      summary: analysis || `Scraped ${stored} listings from ${successfulPages.length} source(s).`,
      data: {
        extractedCount: extractedListings.length,
        storedCount: stored,
        errorCount: errors,
        sources: successfulPages.map(p => p.url),
      },
      listingsScraped: stored,
      avgPrice: avgPrice ? +avgPrice.toFixed(0) : null,
      topInsight: topInsight || null,
    },
    update: {
      summary: analysis || `Scraped ${stored} listings.`,
      data: {
        extractedCount: extractedListings.length,
        storedCount: stored,
        errorCount: errors,
        sources: successfulPages.map(p => p.url),
      },
      listingsScraped: stored,
      avgPrice: avgPrice ? +avgPrice.toFixed(0) : null,
      topInsight: topInsight || null,
    },
  })

  const result = {
    status: 'completed',
    region,
    date: now.toISOString(),
    fetched: successfulPages.length,
    extracted: extractedListings.length,
    stored,
    errors,
    topInsight,
  }

  console.log('[Scrape Market]', JSON.stringify(result))
  return NextResponse.json(result)
}

// ── Helpers ──

function getMonday(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  d.setHours(0, 0, 0, 0)
  return d
}

function detectZone(lat: number, lng: number): string | null {
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
