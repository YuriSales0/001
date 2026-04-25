import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { buildAudienceWhere } from '@/lib/broadcast-audience'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/broadcasts/audience-count
 * Returns the number of recipients matching the given audience filter.
 */
export async function POST(req: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const { audienceType, audienceValue } = await req.json().catch(() => ({}))

  const where = buildAudienceWhere(audienceType, audienceValue)
  if (!where) return NextResponse.json({ error: 'Invalid audience' }, { status: 400 })

  const count = await prisma.user.count({ where })
  return NextResponse.json({ count })
}
