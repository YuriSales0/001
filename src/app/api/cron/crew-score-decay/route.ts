import { NextRequest, NextResponse } from 'next/server'
import { crewScoreEngine } from '@/lib/crew-score'

/**
 * POST /api/cron/crew-score-decay
 * Monthly crew score decay — resets scores to level minimum + 30% of excess.
 * Runs on the 1st of every month via AI Monitor.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const result = await crewScoreEngine.scoreDecay()
  return NextResponse.json(result)
}
