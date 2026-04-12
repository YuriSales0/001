import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * Cron: Market Scraping via Managed Agent
 * Schedule: weekly (Sunday 06:00 UTC) — vercel.json
 *
 * Uses Anthropic Managed Agents with web_search + web_fetch to:
 * 1. Search Airbnb/Booking for Almuñécar listings
 * 2. Extract structured listing data
 * 3. Call custom tool `store_listings` → upserts CompetitorListing
 * 4. Analyse market and call `store_report` → creates MarketReport
 *
 * Setup: SCRAPER_AGENT_ID + SCRAPER_ENV_ID must be set in env.
 * Run /api/ai/scraper-setup first to create them.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
  }

  // Read agent/env IDs from database (saved by /api/ai/scraper-setup)
  const [agentSetting, envSetting] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: 'SCRAPER_AGENT_ID' } }),
    prisma.appSetting.findUnique({ where: { key: 'SCRAPER_ENV_ID' } }),
  ])
  const agentId = agentSetting?.value
  const envId = envSetting?.value

  if (!agentId || !envId) {
    return NextResponse.json({
      error: 'Scraper não configurado. Activa-o primeiro em AI Pricing → Settings.',
    }, { status: 503 })
  }

  const client = new Anthropic()
  const now = new Date()

  // ── Create session ──
  const session = await client.beta.sessions.create({
    agent: agentId,
    environment_id: envId,
    title: `Market scrape — ${now.toISOString().split('T')[0]}`,
  })

  // ── Send scraping instructions ──
  const stream = await client.beta.sessions.events.stream(session.id)

  await client.beta.sessions.events.send(session.id, {
    events: [{
      type: 'user.message',
      content: [{
        type: 'text',
        text: `Scrape the short-term rental market for Almuñécar, Costa Tropical, Spain.

INSTRUCTIONS:
1. Use web_search to find vacation rental listings in Almuñécar on Airbnb and Booking.com
2. Use web_fetch on the search result URLs to get listing details
3. Extract as many listings as possible (target: 20-50) with these fields:
   - title, pricePerNight (EUR), bedrooms, bathrooms, maxGuests
   - rating (0-5), reviewCount, isSuperhost, propertyType
   - latitude/longitude if available, amenities list
   - platform (AIRBNB or BOOKING)
4. Call the store_listings tool with the extracted data (batch into groups of 10)
5. After storing, analyse the market:
   - Average price per night by property type
   - Price range (min/max)
   - % superhosts
   - Most common amenities
   - Market trends or notable patterns
6. Call store_report with your analysis

Today's date: ${now.toISOString().split('T')[0]}
Region: Almuñécar, Granada, Spain (Costa Tropical)
Focus: vacation rentals (entire homes/apartments, not hotel rooms)`,
      }],
    }],
  })

  // ── Stream events, handle custom tool calls ──
  let stored = 0
  let reportStored = false
  const errors: string[] = []

  for await (const event of stream) {
    // Handle custom tool calls
    if (event.type === 'agent.custom_tool_use') {
      const evt = event as unknown as { tool_name?: string; name?: string; input?: unknown }
      const toolName = evt.tool_name ?? evt.name ?? ''
      const toolInput = evt.input

      if (toolName === 'store_listings') {
        try {
          const listings = (toolInput as { listings: Array<Record<string, unknown>> }).listings ?? []
          for (const item of listings) {
            const zoneId = item.latitude && item.longitude
              ? detectZone(item.latitude as number, item.longitude as number)
              : null

            await prisma.competitorListing.upsert({
              where: {
                externalId_platform: {
                  externalId: `scraped_${(item.title as string ?? '').toLowerCase().replace(/\s+/g, '_').slice(0, 50)}`,
                  platform: (item.platform as string ?? 'AIRBNB') as 'AIRBNB' | 'BOOKING',
                },
              },
              create: {
                externalId: `scraped_${(item.title as string ?? '').toLowerCase().replace(/\s+/g, '_').slice(0, 50)}`,
                platform: (item.platform as string ?? 'AIRBNB') as 'AIRBNB' | 'BOOKING',
                title: (item.title as string) ?? 'Unknown',
                latitude: (item.latitude as number) ?? 36.7340,
                longitude: (item.longitude as number) ?? -3.6899,
                zoneId,
                bedrooms: (item.bedrooms as number) ?? 1,
                bathrooms: (item.bathrooms as number) ?? 1,
                maxGuests: (item.maxGuests as number) ?? 4,
                pricePerNight: (item.pricePerNight as number) ?? 0,
                rating: (item.rating as number) ?? null,
                reviewCount: (item.reviewCount as number) ?? 0,
                isSuperhost: (item.isSuperhost as boolean) ?? false,
                amenities: item.amenities ? JSON.stringify(item.amenities) : null,
                lastScrapedAt: now,
              },
              update: {
                pricePerNight: (item.pricePerNight as number) ?? 0,
                rating: (item.rating as number) ?? null,
                reviewCount: (item.reviewCount as number) ?? 0,
                lastScrapedAt: now,
                isActive: true,
              },
            })
            stored++
          }

          await client.beta.sessions.events.send(session.id, {
            events: [{
              type: 'user.custom_tool_result',
              custom_tool_use_id: event.id,
              content: [{ type: 'text', text: `Stored ${listings.length} listings successfully. Total: ${stored}` }],
            }],
          })
        } catch (err) {
          errors.push(`store_listings: ${err}`)
          await client.beta.sessions.events.send(session.id, {
            events: [{
              type: 'user.custom_tool_result',
              custom_tool_use_id: event.id,
              content: [{ type: 'text', text: `Error storing listings: ${err}` }],
              is_error: true,
            }],
          })
        }
      } else if (toolName === 'store_report') {
        try {
          const input = toolInput as { summary: string; avgPrice?: number; avgOccupancy?: number; topInsight?: string; data?: unknown }
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
              summary: input.summary,
              data: (input.data ?? { storedCount: stored }) as object,
              listingsScraped: stored,
              avgPrice: input.avgPrice ?? null,
              avgOccupancy: input.avgOccupancy ?? null,
              topInsight: input.topInsight ?? null,
            },
            update: {
              summary: input.summary,
              data: (input.data ?? { storedCount: stored }) as object,
              listingsScraped: stored,
              avgPrice: input.avgPrice ?? null,
              topInsight: input.topInsight ?? null,
            },
          })
          reportStored = true

          await client.beta.sessions.events.send(session.id, {
            events: [{
              type: 'user.custom_tool_result',
              custom_tool_use_id: event.id,
              content: [{ type: 'text', text: 'Market report stored successfully.' }],
            }],
          })
        } catch (err) {
          errors.push(`store_report: ${err}`)
          await client.beta.sessions.events.send(session.id, {
            events: [{
              type: 'user.custom_tool_result',
              custom_tool_use_id: event.id,
              content: [{ type: 'text', text: `Error storing report: ${err}` }],
              is_error: true,
            }],
          })
        }
      }
    }

    // Break conditions
    if (event.type === 'session.status_terminated') break
    if (event.type === 'session.status_idle') {
      const stopReason = (event as { stop_reason?: { type: string } }).stop_reason
      if (stopReason?.type !== 'requires_action') break
    }
  }

  // ── Cleanup: archive session ──
  try {
    // Small delay for status sync
    await new Promise(r => setTimeout(r, 500))
    await client.beta.sessions.archive(session.id)
  } catch {
    // Session may already be terminated
  }

  const result = {
    status: 'completed',
    sessionId: session.id,
    date: now.toISOString(),
    listingsStored: stored,
    reportStored,
    errors: errors.length > 0 ? errors : undefined,
  }

  console.log('[Scrape Market] Cron complete:', JSON.stringify(result))
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
