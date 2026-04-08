// Public (no-auth) endpoint for receiving leads from marketing integrations
// Used by: embeddable form, Meta Lead Ads webhook, Zapier, Make, etc.
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Simple HMAC-style token validation: INTEGRATION_SECRET env var (optional)
function isValidToken(req: NextRequest): boolean {
  const secret = process.env.INTEGRATION_SECRET
  if (!secret) return true // no secret configured → accept all
  const token = req.headers.get('x-integration-token') ?? req.nextUrl.searchParams.get('token')
  return token === secret
}

export async function POST(request: NextRequest) {
  if (!isValidToken(request)) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, email, phone, source, notes } = body

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const lead = await prisma.lead.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        source: source ?? 'WEBSITE',
        notes: notes?.trim() || null,
        status: 'NEW',
      },
      select: { id: true, name: true, email: true, createdAt: true },
    })

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
