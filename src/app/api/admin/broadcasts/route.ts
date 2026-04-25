import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET  /api/admin/broadcasts        — list history (most recent first)
 * POST /api/admin/broadcasts        — create draft
 */
export async function GET() {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const broadcasts = await prisma.broadcast.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { sender: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json(broadcasts)
}

export async function POST(req: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const body = await req.json().catch(() => ({}))
  const { subject, bodyMarkdown, ctaText, ctaUrl, audienceType, audienceValue } = body as {
    subject?: string
    bodyMarkdown?: string
    ctaText?: string | null
    ctaUrl?: string | null
    audienceType?: 'ALL_PAID' | 'ALL_CLIENTS' | 'BY_PLAN' | 'BY_LANGUAGE'
    audienceValue?: string | null
  }

  if (!subject || subject.trim().length < 3) {
    return NextResponse.json({ error: 'Subject is required (min 3 chars)' }, { status: 400 })
  }
  if (!bodyMarkdown || bodyMarkdown.trim().length < 10) {
    return NextResponse.json({ error: 'Body is required (min 10 chars)' }, { status: 400 })
  }
  const validAudience = ['ALL_PAID', 'ALL_CLIENTS', 'BY_PLAN', 'BY_LANGUAGE']
  const audType = audienceType && validAudience.includes(audienceType) ? audienceType : 'ALL_PAID'

  const draft = await prisma.broadcast.create({
    data: {
      senderId: guard.user!.id,
      subject: subject.trim().slice(0, 200),
      bodyMarkdown: bodyMarkdown.trim().slice(0, 20_000),
      ctaText: ctaText?.trim().slice(0, 60) || null,
      ctaUrl: ctaUrl?.trim().slice(0, 500) || null,
      audienceType: audType,
      audienceValue: audienceValue?.trim().slice(0, 60) || null,
      status: 'DRAFT',
    },
  })

  return NextResponse.json(draft)
}
