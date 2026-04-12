import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireRole } from '@/lib/session'

/**
 * POST /api/ai/scraper-setup
 *
 * Creates the Managed Agent + Environment for market scraping.
 * Run ONCE, then save the returned IDs as env vars:
 *   SCRAPER_AGENT_ID=agent_xxx
 *   SCRAPER_ENV_ID=env_xxx
 *
 * The agent uses:
 * - web_search + web_fetch (built-in, server-side) for browsing
 * - store_listings (custom tool) → callback to our /api/competitors
 * - store_report (custom tool) → callback to our MarketReport
 */
export async function POST() {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 503 })
  }

  const client = new Anthropic()

  // 1. Create environment (unrestricted networking for web access)
  const environment = await client.beta.environments.create({
    name: `hostmasters-scraper-${Date.now()}`,
    config: {
      type: 'cloud',
      networking: { type: 'unrestricted' },
    },
  })

  // 2. Create agent with web tools + custom storage tools
  const agent = await client.beta.agents.create({
    name: 'HostMasters Market Scraper',
    model: 'claude-haiku-4-5',
    description: 'Weekly market scraper for Costa Tropical vacation rentals',
    system: `You are a market research agent for HostMasters, a property management company in Costa Tropical, Spain.

Your job is to scrape vacation rental listings from Airbnb and Booking.com for the Almuñécar area and extract structured data.

IMPORTANT RULES:
- Focus on ENTIRE HOMES/APARTMENTS (not hotel rooms or shared spaces)
- Extract prices in EUR
- Get as many listings as possible (target 20-50 per run)
- Use web_search first to find listing pages, then web_fetch to get details
- Store listings using the store_listings tool (batch into groups of up to 10)
- After all listings are stored, provide a market analysis using store_report
- Be thorough but efficient — this runs on a weekly cron with a 5-minute timeout
- If a page blocks you, try alternative search queries or URLs
- Extract latitude/longitude from the listing URL or page data when possible

ZONES OF INTEREST:
- Playa San Cristóbal (beachfront west)
- Puerta del Mar / Centro (city center)
- Playa Velilla (east beach)
- La Herradura (western cove, premium)
- Marina del Este (luxury marina)
- Taramay / Cotobro (eastern coves)
- Interior / Cumbres (inland)
- Salobreña (neighboring town)`,
    tools: [
      {
        type: 'agent_toolset_20260401',
        default_config: { enabled: false },
        configs: [
          { name: 'web_search', enabled: true },
          { name: 'web_fetch', enabled: true },
          { name: 'bash', enabled: true },
        ],
      },
      {
        type: 'custom',
        name: 'store_listings',
        description: 'Store extracted vacation rental listings in the HostMasters database. Send up to 10 listings per call.',
        input_schema: {
          type: 'object',
          properties: {
            listings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string', description: 'Listing title' },
                  pricePerNight: { type: 'number', description: 'Price per night in EUR' },
                  bedrooms: { type: 'integer', description: 'Number of bedrooms' },
                  bathrooms: { type: 'integer', description: 'Number of bathrooms' },
                  maxGuests: { type: 'integer', description: 'Maximum guests' },
                  rating: { type: 'number', description: 'Rating 0-5 scale (null if unknown)' },
                  reviewCount: { type: 'integer', description: 'Number of reviews' },
                  isSuperhost: { type: 'boolean', description: 'Is the host a Superhost' },
                  propertyType: { type: 'string', description: 'apartment, villa, house, studio, room' },
                  platform: { type: 'string', enum: ['AIRBNB', 'BOOKING'], description: 'Source platform' },
                  latitude: { type: 'number', description: 'Latitude (null if unknown)' },
                  longitude: { type: 'number', description: 'Longitude (null if unknown)' },
                  amenities: { type: 'array', items: { type: 'string' }, description: 'List of amenities' },
                },
                required: ['title', 'pricePerNight', 'platform'],
              },
              description: 'Array of listings to store (max 10 per call)',
            },
          },
          required: ['listings'],
        },
      },
      {
        type: 'custom',
        name: 'store_report',
        description: 'Store the weekly market analysis report in the HostMasters database.',
        input_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string', description: 'Market analysis summary in Portuguese (2-3 paragraphs)' },
            avgPrice: { type: 'number', description: 'Average price per night in EUR' },
            avgOccupancy: { type: 'number', description: 'Estimated average occupancy percentage (0-100)' },
            topInsight: { type: 'string', description: 'Single most important market insight' },
            data: {
              type: 'object',
              description: 'Structured market data (price ranges, property type breakdown, etc.)',
            },
          },
          required: ['summary', 'topInsight'],
        },
      },
    ],
  })

  return NextResponse.json({
    message: 'Scraper agent created successfully. Save these IDs as environment variables in Vercel.',
    agentId: agent.id,
    agentVersion: agent.version,
    environmentId: environment.id,
    envVars: {
      SCRAPER_AGENT_ID: agent.id,
      SCRAPER_ENV_ID: environment.id,
    },
  })
}
