import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

const APP_URL = process.env.NEXTAUTH_URL || 'https://hostmasters.es'

/**
 * POST /api/stripe/portal
 *
 * Creates a Stripe Customer Portal session for the authenticated client.
 * Client can: change plan, update payment method, cancel subscription,
 * view billing history.
 */
export async function POST(_request: NextRequest) {
  const guard = await requireRole(['CLIENT', 'ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { stripeCustomerId: true },
  })

  if (!user?.stripeCustomerId) {
    return NextResponse.json(
      { error: 'No Stripe customer found. Subscribe to a plan first.' },
      { status: 400 },
    )
  }

  try {
    const session = await getStripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${APP_URL}/client/plan`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating portal session:', error)
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
}
