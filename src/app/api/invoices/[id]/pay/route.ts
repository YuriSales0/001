import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole(['CLIENT', 'ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const invoice = await prisma.invoice.findUnique({
    where: { id: params.id },
    include: { client: { select: { id: true, name: true, email: true, stripeCustomerId: true } } },
  })
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (me.role === 'CLIENT' && invoice.clientId !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if ((invoice.status as string) === 'PAID') {
    return NextResponse.json({ error: 'Already paid' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // If no Stripe key configured, return demo mode
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({
      demo: true,
      url: `${appUrl}/client/payouts?payment=success&invoiceId=${invoice.id}`,
    })
  }

  try {
    const { getStripe } = await import('@/lib/stripe')
    const stripe = getStripe()

    let customerId = invoice.client.stripeCustomerId
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: invoice.client.email,
        name: invoice.client.name || undefined,
        metadata: { userId: invoice.clientId },
      })
      customerId = customer.id
      await prisma.user.update({
        where: { id: invoice.clientId },
        data: { stripeCustomerId: customerId },
      })
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            unit_amount: Math.round(invoice.amount * 100),
            product_data: {
              name: invoice.description,
              metadata: { invoiceId: invoice.id },
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/client/payouts?payment=success&invoiceId=${invoice.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/client/payouts?payment=cancelled`,
      metadata: { invoiceId: invoice.id },
    })

    // Store session ID
    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { stripeSessionId: session.id } as never,
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error('Stripe checkout error:', e)
    return NextResponse.json({ error: 'Payment setup failed' }, { status: 500 })
  }
}
