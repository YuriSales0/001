import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      typescript: true,
    })
  }
  return _stripe
}

export const PLANS = {
  BASIC: {
    name: 'Basic',
    price: 89,
    priceId: process.env.STRIPE_BASIC_PRICE_ID || 'price_basic',
    features: [
      'Property dashboard',
      'Monthly reports',
      'Email notifications',
      'Calendar view',
    ],
  },
  PREMIUM: {
    name: 'Premium',
    price: 149,
    priceId: process.env.STRIPE_PREMIUM_PRICE_ID || 'price_premium',
    features: [
      'Everything in Basic',
      'Priority support',
      'Advanced analytics',
      'Multi-language support',
      'Custom branding',
    ],
  },
} as const
