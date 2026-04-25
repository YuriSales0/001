import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

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

export function buildAudienceWhere(
  audienceType: string | undefined,
  audienceValue: string | null | undefined,
): Record<string, unknown> | null {
  const base: Record<string, unknown> = { role: 'CLIENT' }

  switch (audienceType) {
    case 'ALL_PAID':
      // Anyone with a paid plan (BASIC, MID, PREMIUM)
      return { ...base, subscriptionPlan: { in: ['BASIC', 'MID', 'PREMIUM'] } }
    case 'ALL_CLIENTS':
      return base
    case 'BY_PLAN':
      if (!audienceValue || !['STARTER', 'BASIC', 'MID', 'PREMIUM'].includes(audienceValue)) return null
      return { ...base, subscriptionPlan: audienceValue }
    case 'BY_LANGUAGE':
      if (!audienceValue) return null
      return { ...base, language: audienceValue, subscriptionPlan: { in: ['BASIC', 'MID', 'PREMIUM'] } }
    default:
      return null
  }
}
