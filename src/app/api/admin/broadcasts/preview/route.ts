import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/session'
import { broadcastEmailHtml } from '@/lib/broadcast'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/broadcasts/preview
 * Renders the branded HTML for the given content. Used for live preview in the composer.
 */
export async function POST(req: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const { subject, bodyMarkdown, ctaText, ctaUrl } = await req.json().catch(() => ({}))

  if (typeof subject !== 'string' || typeof bodyMarkdown !== 'string') {
    return NextResponse.json({ error: 'subject and bodyMarkdown required' }, { status: 400 })
  }

  const html = broadcastEmailHtml({
    recipientName: guard.user!.name ?? 'Owner',
    subject,
    bodyMarkdown,
    ctaText: ctaText || null,
    ctaUrl: ctaUrl || null,
    senderName: guard.user!.name ?? 'Yuri Sales',
  })

  return NextResponse.json({ html })
}
