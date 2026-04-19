import { NextRequest, NextResponse } from 'next/server'
import { getStripe, STRIPE_PLANS, type StripePlanId } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

const APP_URL = process.env.NEXTAUTH_URL || 'https://hostmasters.es'

export async function POST(request: NextRequest) {
  const guard = await requireRole(['CLIENT', 'ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  try {
    const body = await request.json()
    const { planId, priceId: rawPriceId, userId } = body as {
      planId?: string
      priceId?: string
      userId?: string
    }

    const targetUserId = userId ?? me.id

    if (me.role === 'CLIENT' && me.id !== targetUserId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Resolve priceId from planId if provided
    let resolvedPriceId = rawPriceId
    if (!resolvedPriceId && planId) {
      const plan = STRIPE_PLANS[planId.toUpperCase() as StripePlanId]
      if (!plan) {
        return NextResponse.json({ error: `Unknown plan: ${planId}` }, { status: 400 })
      }
      if (plan.price === 0) {
        return NextResponse.json({ error: 'Starter plan is free — no checkout needed' }, { status: 400 })
      }
      if (!plan.priceId) {
        return NextResponse.json(
          { error: `Stripe price not configured for ${plan.name}. Set STRIPE_${planId.toUpperCase()}_PRICE_ID env var.` },
          { status: 503 },
        )
      }
      resolvedPriceId = plan.priceId
    }

    if (!resolvedPriceId) {
      return NextResponse.json({ error: 'priceId or planId required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: targetUserId } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let customerId = user.stripeCustomerId
    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.id },
      })
      customerId = customer.id
      await prisma.user.update({
        where: { id: targetUserId },
        data: { stripeCustomerId: customerId },
      })
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: resolvedPriceId, quantity: 1 }],
      success_url: `${APP_URL}/client/plan?upgraded=1`,
      cancel_url: `${APP_URL}/client/plan`,
      metadata: { userId: targetUserId, planId: planId ?? '' },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
