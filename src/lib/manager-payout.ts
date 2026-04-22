import { prisma } from './prisma'
import {
  DEFAULT_MANAGER_SUBSCRIPTION_SHARE,
  DEFAULT_MANAGER_COMMISSION_SHARE,
  managerPortfolioBonus,
  MANAGER_ACQUISITION_BONUS,
} from './finance'

export interface PayoutBreakdown {
  clients: Array<{
    clientId: string
    clientName: string | null
    plan: string | null
    subscriptionPaid: number
    rentalGross: number
    subscriptionEarning: number
    rentalEarning: number
  }>
  portfolioTier: { minProps: number; amount: number } | null
  activeBasicPlusProps: number
  acquisitionBonuses: Array<{
    clientId: string
    clientName: string | null
    plan: string
    amount: number
    activatedAt: string
  }>
  rates: {
    subscriptionShare: number
    commissionShare: number
  }
}

export interface PayoutCalculation {
  managerId: string
  periodYear: number
  periodMonth: number
  subscriptionEarnings: number
  rentalEarnings: number
  portfolioBonus: number
  acquisitionBonus: number
  finalAmount: number
  clientCount: number
  activePropertyCount: number
  breakdown: PayoutBreakdown
}

function monthRange(year: number, month: number): { start: Date; end: Date } {
  // month is 1..12 — JS Date uses 0..11
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
  return { start, end }
}

/** Day 10 of the month AFTER the payout period. */
export function payByDate(year: number, month: number): Date {
  const target = month === 12
    ? new Date(Date.UTC(year + 1, 0, 10, 12, 0, 0, 0))
    : new Date(Date.UTC(year, month, 10, 12, 0, 0, 0))
  return target
}

/**
 * Calculate a manager's payout for a given month.
 * Only counts revenue that was ACTUALLY collected (Invoice.paidAt set) and
 * reservations that were NOT cancelled.
 */
export async function calculateManagerPayout(
  managerId: string,
  periodYear: number,
  periodMonth: number,
): Promise<PayoutCalculation> {
  const { start, end } = monthRange(periodYear, periodMonth)

  // Load manager with rate overrides
  const manager = await prisma.user.findUnique({
    where: { id: managerId },
    select: {
      id: true,
      managerSubscriptionShare: true,
      managerCommissionShare: true,
    },
  }) as { id: string; managerSubscriptionShare: number | null; managerCommissionShare: number | null } | null

  if (!manager) throw new Error(`Manager ${managerId} not found`)

  const subShare = manager.managerSubscriptionShare ?? DEFAULT_MANAGER_SUBSCRIPTION_SHARE
  const comShare = manager.managerCommissionShare ?? DEFAULT_MANAGER_COMMISSION_SHARE

  // Load all clients assigned to this manager
  const clients = await prisma.user.findMany({
    where: { managerId, role: 'CLIENT' },
    select: {
      id: true,
      name: true,
      email: true,
      subscriptionPlan: true,
      createdAt: true,
      properties: {
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          reservations: {
            where: {
              // Check-out within period (revenue recognised at checkout)
              checkOut: { gte: start, lt: end },
              status: { not: 'CANCELLED' },
            },
            select: { amount: true },
          },
        },
      },
    },
  }) as Array<{
    id: string
    name: string | null
    email: string
    subscriptionPlan: string | null
    createdAt: Date
    properties: Array<{ id: string; reservations: Array<{ amount: number }> }>
  }>

  // Load paid subscription invoices for these clients in this month
  const clientIds = clients.map(c => c.id)
  const subInvoices = clientIds.length === 0 ? [] : await prisma.invoice.findMany({
    where: {
      clientId: { in: clientIds },
      type: 'SUBSCRIPTION',
      status: 'PAID',
      paidAt: { gte: start, lt: end },
    },
    select: { clientId: true, amount: true },
  })

  const paidSubByClient = new Map<string, number>()
  for (const inv of subInvoices) {
    paidSubByClient.set(inv.clientId, (paidSubByClient.get(inv.clientId) ?? 0) + inv.amount)
  }

  // Per-client earnings
  const breakdown: PayoutBreakdown['clients'] = []
  let totalSubscriptionEarnings = 0
  let totalRentalEarnings = 0
  let activeBasicPlusProps = 0

  for (const c of clients) {
    const subscriptionPaid = paidSubByClient.get(c.id) ?? 0
    const rentalGross = c.properties.reduce(
      (sum, p) => sum + p.reservations.reduce((s, r) => s + r.amount, 0),
      0,
    )
    const subscriptionEarning = +(subscriptionPaid * subShare).toFixed(2)
    const rentalEarning = +(rentalGross * comShare).toFixed(2)

    totalSubscriptionEarnings += subscriptionEarning
    totalRentalEarnings += rentalEarning

    // Portfolio bonus counts ACTIVE properties on BASIC+ plans
    if (c.subscriptionPlan && ['BASIC', 'MID', 'PREMIUM'].includes(c.subscriptionPlan)) {
      activeBasicPlusProps += c.properties.length
    }

    breakdown.push({
      clientId: c.id,
      clientName: c.name ?? c.email,
      plan: c.subscriptionPlan,
      subscriptionPaid,
      rentalGross,
      subscriptionEarning,
      rentalEarning,
    })
  }

  // Portfolio bonus
  const portfolioBonusAmount = managerPortfolioBonus(activeBasicPlusProps)
  const portfolioTierEntry = portfolioBonusAmount > 0
    ? { minProps: activeBasicPlusProps >= 30 ? 30 : activeBasicPlusProps >= 20 ? 20 : 10, amount: portfolioBonusAmount }
    : null

  // Acquisition bonus: paid in the 2nd month after client activation
  // (i.e. clients whose subscriptionStatus became active 2 months before period)
  // For simplicity we use User.createdAt as proxy for activation timestamp
  // since there's no dedicated activation field. Refine if one is added later.
  const twoMonthsAgoStart = new Date(Date.UTC(
    periodMonth <= 2 ? periodYear - 1 : periodYear,
    (periodMonth - 3 + 12) % 12,
    1, 0, 0, 0, 0,
  ))
  const twoMonthsAgoEnd = new Date(Date.UTC(
    periodMonth <= 2 ? (periodMonth === 1 ? periodYear - 1 : periodYear) : periodYear,
    (periodMonth - 2 + 12) % 12,
    1, 0, 0, 0, 0,
  ))

  const acquisitionBonuses: PayoutBreakdown['acquisitionBonuses'] = []
  let totalAcquisitionBonus = 0

  for (const c of clients) {
    if (!c.subscriptionPlan) continue
    const amount = MANAGER_ACQUISITION_BONUS[c.subscriptionPlan] ?? 0
    if (amount === 0) continue
    if (c.createdAt >= twoMonthsAgoStart && c.createdAt < twoMonthsAgoEnd) {
      acquisitionBonuses.push({
        clientId: c.id,
        clientName: c.name ?? c.email,
        plan: c.subscriptionPlan,
        amount,
        activatedAt: c.createdAt.toISOString(),
      })
      totalAcquisitionBonus += amount
    }
  }

  const finalAmount = +(
    totalSubscriptionEarnings + totalRentalEarnings + portfolioBonusAmount + totalAcquisitionBonus
  ).toFixed(2)

  const activePropertyCount = clients.reduce((n, c) => n + c.properties.length, 0)

  return {
    managerId,
    periodYear,
    periodMonth,
    subscriptionEarnings: +totalSubscriptionEarnings.toFixed(2),
    rentalEarnings: +totalRentalEarnings.toFixed(2),
    portfolioBonus: portfolioBonusAmount,
    acquisitionBonus: +totalAcquisitionBonus.toFixed(2),
    finalAmount,
    clientCount: clients.length,
    activePropertyCount,
    breakdown: {
      clients: breakdown,
      portfolioTier: portfolioTierEntry,
      activeBasicPlusProps,
      acquisitionBonuses,
      rates: { subscriptionShare: subShare, commissionShare: comShare },
    },
  }
}
