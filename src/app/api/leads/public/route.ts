// Public (no-auth) endpoint for receiving leads from marketing integrations
// Used by: embeddable form, Meta Lead Ads webhook, Zapier, Make, etc.
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple HMAC-style token validation: INTEGRATION_SECRET env var (optional)
function isValidToken(req: NextRequest): boolean {
  const secret = process.env.INTEGRATION_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') return false // fail-secure in prod
    return true // allow in dev
  }
  const token = req.headers.get('x-integration-token') ?? req.nextUrl.searchParams.get('token')
  return token === secret
}

export async function POST(request: NextRequest) {
  if (!isValidToken(request)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, email, phone, source, notes, ref } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    if (name.trim().length > 200) {
      return NextResponse.json({ error: 'name too long' }, { status: 400 })
    }

    // Validate email format if provided
    const trimmedEmail = typeof email === 'string' ? email.trim() : ''
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return NextResponse.json({ error: 'invalid email format' }, { status: 400 })
    }

    // Sanitize text fields — strip HTML tags to prevent stored XSS
    const stripTags = (s: string) => s.replace(/<[^>]*>/g, '')

    // Resolve campaign from tracking code (QR code ref)
    let campaignId: string | null = null
    if (ref && typeof ref === 'string') {
      const campaign = await prisma.campaign.findUnique({
        where: { trackingCode: ref.toUpperCase() },
        select: { id: true },
      })
      campaignId = campaign?.id ?? null
    }

    const lead = await prisma.lead.create({
      data: {
        name: stripTags(name.trim()).slice(0, 200),
        email: trimmedEmail || null,
        phone: typeof phone === 'string' ? stripTags(phone.trim()).slice(0, 50) : null,
        source: campaignId ? 'PRINT' : (source ?? 'WEBSITE'),
        notes: typeof notes === 'string' ? stripTags(notes.trim()).slice(0, 1000) : null,
        status: 'NEW',
      },
      select: { id: true, name: true, email: true, createdAt: true },
    })

    // Attribute lead to campaign
    if (campaignId) {
      await prisma.leadAttribution.create({
        data: { leadId: lead.id, campaignId },
      }).catch(() => {}) // ignore duplicate if somehow already exists
    }

    return NextResponse.json({ ok: true, lead }, { status: 201 })
  } catch (error) {
    console.error('Public lead intake error:', error)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}

// GET: health check for webhook verification (Meta requires GET on webhook URL)
export async function GET(request: NextRequest) {
  const challenge = request.nextUrl.searchParams.get('hub.challenge')
  const verify_token = request.nextUrl.searchParams.get('hub.verify_token')
  const secret = process.env.INTEGRATION_SECRET ?? 'hostmasters'

  if (verify_token === secret && challenge) {
    return new Response(challenge, { status: 200 })
  }
  return NextResponse.json({ ok: true, service: 'HostMasters Lead Intake' })
}
