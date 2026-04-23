import { getStripe } from './stripe'
import { prisma } from './prisma'

/**
 * Transfer funds to a connected Stripe account (Crew or Manager).
 * Returns the Stripe Transfer object or null if the account isn't ready.
 */
export async function transferToConnectedAccount(opts: {
  userId: string
  amountEur: number
  description: string
  metadata?: Record<string, string>
}): Promise<{ transferId: string; status: string } | null> {
  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: { stripeConnectId: true, name: true, email: true },
  })

  if (!user?.stripeConnectId) {
    console.warn(`[Stripe Connect] No Connect account for user ${opts.userId}`)
    return null
  }

  // Verify account is ready to receive transfers
  const account = await getStripe().accounts.retrieve(user.stripeConnectId)
  if (!account.charges_enabled || !account.payouts_enabled) {
    console.warn(`[Stripe Connect] Account ${user.stripeConnectId} not ready (charges: ${account.charges_enabled}, payouts: ${account.payouts_enabled})`)
    return null
  }

  const amountCents = Math.round(opts.amountEur * 100)
  if (amountCents <= 0) return null

  const idempotencyKey = `transfer_${opts.userId}_${opts.description?.replace(/\s/g, '_') ?? 'payout'}_${amountCents}`
  const transfer = await getStripe().transfers.create({
    amount: amountCents,
    currency: 'eur',
    destination: user.stripeConnectId,
    description: opts.description,
    metadata: {
      userId: opts.userId,
      userName: user.name || user.email,
      ...opts.metadata,
    },
  }, { idempotencyKey })

  return { transferId: transfer.id, status: transfer.reversed ? 'reversed' : 'created' }
}

/**
 * Check if a user's Stripe Connect account is fully onboarded and ready.
 */
export async function isConnectReady(userId: string): Promise<{
  ready: boolean
  hasAccount: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  requirementsDue: string[]
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeConnectId: true },
  })

  if (!user?.stripeConnectId) {
    return { ready: false, hasAccount: false, chargesEnabled: false, payoutsEnabled: false, requirementsDue: [] }
  }

  const account = await getStripe().accounts.retrieve(user.stripeConnectId)

  return {
    ready: !!account.charges_enabled && !!account.payouts_enabled,
    hasAccount: true,
    chargesEnabled: !!account.charges_enabled,
    payoutsEnabled: !!account.payouts_enabled,
    requirementsDue: account.requirements?.currently_due ?? [],
  }
}
