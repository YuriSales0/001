import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function POST(request: NextRequest) {
  const guard = await requireRole(['CLIENT', 'ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  try {
    const body = await request.json()
    const { priceId, userId } = body

    if (!priceId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: priceId, userId' },
        { status: 400 }
      )
    }

    // CLIENT can only create checkout for themselves
    if (me.role === 'CLIENT' && me.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
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
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      })
    }

    const session = await getStripe().checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: { userId },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
