import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      typescript: true,
    })
  }
  return _stripe
}

export const STRIPE_PLANS = {
  STARTER: {
    name: 'Starter',
    price: 0,
    priceId: null,
    commission: 22,
  },
  BASIC: {
    name: 'Basic',
    price: 89,
    priceId: process.env.STRIPE_BASIC_PRICE_ID || null,
    commission: 20,
  },
  MID: {
    name: 'Mid',
    price: 159,
    priceId: process.env.STRIPE_MID_PRICE_ID || null,
    commission: 17,
  },
  PREMIUM: {
    name: 'Premium',
    price: 269,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID || null,
    commission: 13,
  },
} as const

export type StripePlanId = keyof typeof STRIPE_PLANS
