import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * POST /api/stripe/connect/dashboard
 *
 * Creates a login link to the Stripe Express Dashboard for the
 * connected account. Crew/Managers use this to view their payouts,
 * tax forms, and bank details.
 */
export async function POST(_request: NextRequest) {
  const guard = await requireRole(['CREW', 'MANAGER', 'ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: { stripeConnectId: true },
  })

  if (!user?.stripeConnectId) {
    return NextResponse.json(
      { error: 'Stripe Connect account not set up. Complete onboarding first.' },
      { status: 400 },
    )
  }

  try {
    const loginLink = await getStripe().accounts.createLoginLink(user.stripeConnectId)
    return NextResponse.json({ url: loginLink.url })
  } catch (error) {
    console.error('Stripe dashboard link error:', error)
    return NextResponse.json({ error: 'Failed to create dashboard link' }, { status: 500 })
  }
}
