import { NextResponse } from 'next/server'
import { requireRole } from '@/lib/session'
import { generateBriefing, type ManagerBriefing } from '@/lib/manager-copilot'

export const dynamic = 'force-dynamic'

// Simple in-memory cache (1 hour TTL) — keeps Haiku spend low when the
// manager refreshes the dashboard repeatedly. Cache scoped per manager.
type CacheEntry = { briefing: ManagerBriefing; expiresAt: number }
const cache = new Map<string, CacheEntry>()
const TTL_MS = 60 * 60 * 1000 // 1h

/**
 * GET /api/manager/ai-briefing
 *   Returns the manager's AI-generated action list.
 *   Cached for 1h per manager.
 *
 * GET /api/manager/ai-briefing?refresh=1
 *   Forces a fresh generation (bypasses cache).
 */
export async function GET(req: Request) {
  const guard = await requireRole(['MANAGER', 'ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const url = new URL(req.url)
  const refresh = url.searchParams.get('refresh') === '1'

  const cached = cache.get(me.id)
  if (!refresh && cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ ...cached.briefing, cached: true })
  }

  try {
    const briefing = await generateBriefing(me.id)
    cache.set(me.id, { briefing, expiresAt: Date.now() + TTL_MS })
    return NextResponse.json({ ...briefing, cached: false })
  } catch (e) {
    console.error('AI briefing failed:', e)
    return NextResponse.json({ error: 'Failed to generate briefing' }, { status: 500 })
  }
}
