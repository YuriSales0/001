import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireRole } from '@/lib/session'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/ai/scraper-setup
 *
 * Creates the Managed Agent + Environment for market scraping.
 * IDs are saved automatically in the database (AppSetting table).
 * No manual env var copying needed.
 *
 * GET /api/ai/scraper-setup
 * Returns current setup status.
 */
export async function GET() {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const agentId = await prisma.appSetting.findUnique({ where: { key: 'SCRAPER_AGENT_ID' } })
  const envId = await prisma.appSetting.findUnique({ where: { key: 'SCRAPER_ENV_ID' } })
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY

  return NextResponse.json({
    configured: !!(agentId && envId && hasApiKey),
    hasApiKey,
    agentId: agentId?.value ?? null,
    environmentId: envId?.value ?? null,
    nextStep: !hasApiKey
      ? 'Adiciona ANTHROPIC_API_KEY nas variáveis de ambiente do Vercel'
      : !(agentId && envId)
      ? 'Clica "Activar Scraper" para criar o agente'
      : 'Tudo configurado — o scraper corre automaticamente ao domingo',
  })
}

export async function POST() {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      error: 'ANTHROPIC_API_KEY não configurada',
      hint: 'Vai a Vercel → Settings → Environment Variables e adiciona a key da Anthropic (console.anthropic.com)',
    }, { status: 503 })
  }

  // Check if already configured
  const existingAgent = await prisma.appSetting.findUnique({ where: { key: 'SCRAPER_AGENT_ID' } })
  if (existingAgent) {
    return NextResponse.json({
      message: 'Scraper já está configurado.',
      agentId: existingAgent.value,
    })
  }

  const client = new Anthropic()

  // 1. Create environment
  const environment = await client.beta.environments.create({
    name: `hostmasters-scraper-${Date.now()}`,
    config: {
      type: 'cloud',
      networking: { type: 'unrestricted' },
    },
  })

  // 2. Create agent
  const agent = await client.beta.agents.create({
    name: 'HostMasters Market Scraper',
    model: 'claude-haiku-4-5',
    description: 'Weekly market scraper for Costa Tropical vacation rentals',
    system: `You are a market research agent for HostMasters, a property management company in Costa Tropical, Spain.

Your job is to scrape vacation rental listings from Airbnb and Booking.com for the Almuñécar area and extract structured data.

RULES:
- Focus on ENTIRE HOMES/APARTMENTS (not hotel rooms)
- Extract prices in EUR
- Target 20-50 listings per run
- Use web_search to find pages, then web_fetch to get details
- Store listings via store_listings tool (batches of up to 10)
- After storing, analyse the market and call store_report
- 5-minute timeout — be efficient
- If blocked, try alternative queries

ZONES: San Cristóbal, Centro, Velilla, La Herradura, Marina del Este, Taramay, Interior, Salobreña`,
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
        description: 'Store extracted listings in the database. Max 10 per call.',
        input_schema: {
          type: 'object',
          properties: {
            listings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  pricePerNight: { type: 'number', description: 'EUR' },
                  bedrooms: { type: 'integer' },
                  bathrooms: { type: 'integer' },
                  maxGuests: { type: 'integer' },
                  rating: { type: 'number', description: '0-5' },
                  reviewCount: { type: 'integer' },
                  isSuperhost: { type: 'boolean' },
                  propertyType: { type: 'string' },
                  platform: { type: 'string', enum: ['AIRBNB', 'BOOKING'] },
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
                  amenities: { type: 'array', items: { type: 'string' } },
                },
                required: ['title', 'pricePerNight', 'platform'],
              },
            },
          },
          required: ['listings'],
        },
      },
      {
        type: 'custom',
        name: 'store_report',
        description: 'Store weekly market analysis.',
        input_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string', description: 'Analysis in Portuguese' },
            avgPrice: { type: 'number' },
            topInsight: { type: 'string' },
            data: { type: 'object' },
          },
          required: ['summary', 'topInsight'],
        },
      },
    ],
  })

  // 3. Save IDs in database (no manual env var copying!)
  await prisma.appSetting.upsert({
    where: { key: 'SCRAPER_AGENT_ID' },
    create: { key: 'SCRAPER_AGENT_ID', value: agent.id },
    update: { value: agent.id },
  })
  await prisma.appSetting.upsert({
    where: { key: 'SCRAPER_ENV_ID' },
    create: { key: 'SCRAPER_ENV_ID', value: environment.id },
    update: { value: environment.id },
  })

  return NextResponse.json({
    message: 'Scraper configurado com sucesso! O cron semanal vai correr automaticamente.',
    agentId: agent.id,
    environmentId: environment.id,
  })
}
