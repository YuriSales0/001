import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

// Simple HTML strip for user-supplied text (no free-form HTML)
function stripTags(s: string | null | undefined): string | null {
  if (!s) return null
  const trimmed = s.replace(/<[^>]*>/g, '').trim()
  return trimmed || null
}

/**
 * POST /api/recruit — public endpoint for Manager/Crew application
 * No auth required (visitor fills form on landing).
 * Rate-limited implicitly by API route + input validation.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      role?: string
      name?: string
      email?: string
      phone?: string
      zone?: string
      languages?: string[]
      experience?: string
      skills?: string[]
      availability?: string
      message?: string
      source?: string
      locale?: string
    }

    // Basic validation
    if (!body.role || !['MANAGER', 'CREW'].includes(body.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    const name = stripTags(body.name)
    const email = body.email?.toLowerCase().trim()
    if (!name || name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: 'Name required (2-100 chars)' }, { status: 400 })
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
    }

    // Optional fields with size limits
    const phone = stripTags(body.phone)?.slice(0, 30) ?? null
    const zone = stripTags(body.zone)?.slice(0, 50) ?? null
    const experience = stripTags(body.experience)?.slice(0, 2000) ?? null
    const availability = stripTags(body.availability)?.slice(0, 50) ?? null
    const message = stripTags(body.message)?.slice(0, 2000) ?? null

    // Whitelist arrays
    const ALLOWED_LANGS = ['en', 'pt', 'es', 'de', 'nl', 'fr', 'sv', 'da', 'no']
    const ALLOWED_SKILLS = ['CLEANING', 'MAINTENANCE', 'CHECK_IN', 'CHECK_OUT', 'INSPECTION', 'HANDYMAN', 'LAUNDRY', 'GARDENING']
    const languages = Array.isArray(body.languages)
      ? body.languages.filter(l => ALLOWED_LANGS.includes(l)).slice(0, 9)
      : []
    const skills = Array.isArray(body.skills)
      ? body.skills.filter(s => ALLOWED_SKILLS.includes(s)).slice(0, 8)
      : []

    const app = await prisma.recruitApplication.create({
      data: {
        role: body.role as 'MANAGER' | 'CREW',
        name,
        email,
        phone,
        zone,
        languages,
        experience,
        skills,
        availability,
        message,
        source: stripTags(body.source)?.slice(0, 100) ?? 'landing',
        locale: stripTags(body.locale)?.slice(0, 10) ?? null,
      },
    })

    return NextResponse.json({ ok: true, id: app.id })
  } catch (e) {
    console.error('recruit POST error', e)
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 })
  }
}

/**
 * GET /api/recruit — ADMIN only, list applications with filters
 */
export async function GET(req: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const url = new URL(req.url)
  const role = url.searchParams.get('role')
  const status = url.searchParams.get('status')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {}
  if (role && ['MANAGER', 'CREW'].includes(role)) where.role = role
  if (status && ['NEW', 'CONTACTED', 'INTERVIEWING', 'ACCEPTED', 'REJECTED'].includes(status)) where.status = status

  const apps = await prisma.recruitApplication.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 500,
  })

  return NextResponse.json(apps)
}
