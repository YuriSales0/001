import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/session'
import { isConnectReady } from '@/lib/stripe-connect'

/**
 * GET /api/stripe/connect/status
 *
 * Returns the Stripe Connect readiness of the authenticated CREW or
 * MANAGER user. Used by the portal UI to prompt onboarding if needed.
 */
export async function GET(_request: NextRequest) {
  const guard = await requireRole(['CREW', 'MANAGER', 'ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const status = await isConnectReady(guard.user!.id)
  return NextResponse.json(status)
}
