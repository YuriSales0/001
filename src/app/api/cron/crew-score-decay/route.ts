import { NextRequest, NextResponse } from 'next/server'
import { crewScoreEngine } from '@/lib/crew-score'

/**
 * POST /api/cron/crew-score-decay
 * Quarterly crew score decay — resets scores to level minimum + 20% of excess.
 * Prevents high-scoring crew from coasting with a large buffer.
 *
 * Should run on Jan 1, Apr 1, Jul 1, Oct 1 — triggered by AI Monitor
 * on the 1st day of those months.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const result = await crewScoreEngine.quarterlyDecay()
  return NextResponse.json(result)
}
