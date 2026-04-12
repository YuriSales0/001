/**
 * Hostmaster financial rules.
 *
 * Commission per subscription plan:
 *   STARTER  → 22%
 *   BASIC    → 20%
 *   MID      → 17%  (most popular)
 *   PREMIUM  → 13%
 *
 * Monthly fees (EUR):
 *   STARTER  →   0  (no monthly fee)
 *   BASIC    →  89
 *   MID      → 159
 *   PREMIUM  → 269
 *
 * Cleaning fee per turnover (EUR):
 *   STARTER  → 70 (always charged)
 *   BASIC    → 60 (always charged)
 *   MID      → 45 if stay < 5 nights, included if stay ≥ 5 nights
 *   PREMIUM  → 35 if stay < 3 nights, included if stay ≥ 3 nights
 *
 * Payout scheduling:
 *   Airbnb  → checkOut + 1 day + 2 business days
 *   Booking → last day of checkOut month
 *   Others  → checkOut + 7 days
 */

export const PLAN_COMMISSION: Record<string, number> = {
  STARTER: 0.22,
  BASIC:   0.20,
  MID:     0.17,
  PREMIUM: 0.13,
}

export const PLAN_MONTHLY_FEE: Record<string, number> = {
  STARTER:   0,
  BASIC:    89,
  MID:     159,
  PREMIUM: 269,
}

/** Standard cleaning fee per turnover (EUR) */
export const CLEANING_FEE_STANDARD: Record<string, number> = {
  STARTER: 70,
  BASIC:   60,
  MID:     45,
  PREMIUM: 35,
}

/**
 * Minimum nights for cleaning to be included in the plan.
 * null = never included (always charged).
 */
export const CLEANING_INCLUDED_MIN_NIGHTS: Record<string, number | null> = {
  STARTER: null,
  BASIC:   null,
  MID:     5,
  PREMIUM: 3,
}

/** Default when plan is unknown */
export const DEFAULT_COMMISSION_RATE = 0.17

export function commissionRateForPlan(plan?: string | null): number {
  return PLAN_COMMISSION[plan ?? ''] ?? DEFAULT_COMMISSION_RATE
}

export function calcCommission(gross: number, plan?: string | null) {
  const rate       = commissionRateForPlan(plan)
  const commission = +(gross * rate).toFixed(2)
  const net        = +(gross - commission).toFixed(2)
  return { gross, commission, commissionRate: +(rate * 100).toFixed(1), net }
}

/** Add N business days (Mon–Fri) to a date */
function addBusinessDays(date: Date, days: number): Date {
  const d = new Date(date)
  let added = 0
  while (added < days) {
    d.setDate(d.getDate() + 1)
    const day = d.getDay()
    if (day !== 0 && day !== 6) added++ // skip Sat/Sun
  }
  return d
}

/** Last day of the month of a given date */
function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0)
}

export type PayoutPlatform = 'AIRBNB' | 'BOOKING' | 'DIRECT' | 'OTHER' | null | undefined

export function payoutDateFrom(checkOut: Date, platform?: PayoutPlatform): Date {
  if (platform === 'AIRBNB') {
    // D+1 then +2 business days
    const next = new Date(checkOut)
    next.setDate(next.getDate() + 1)
    return addBusinessDays(next, 2)
  }
  if (platform === 'BOOKING') {
    return endOfMonth(checkOut)
  }
  // Default: D+7
  const d = new Date(checkOut)
  d.setDate(d.getDate() + 7)
  return d
}

// ── Manager compensation ──────────────────────────────────────────────────
export const DEFAULT_MANAGER_SUBSCRIPTION_SHARE = 0.10 // 10% of client subscription
export const DEFAULT_MANAGER_COMMISSION_SHARE = 0.02   // 2% of gross rental revenue

export function calcManagerEarnings(opts: {
  grossRevenue: number
  subscriptionFees: number
  subscriptionShare?: number | null
  commissionShare?: number | null
}) {
  const subShare = opts.subscriptionShare ?? DEFAULT_MANAGER_SUBSCRIPTION_SHARE
  const comShare = opts.commissionShare ?? DEFAULT_MANAGER_COMMISSION_SHARE
  const fromSubscriptions = +(opts.subscriptionFees * subShare).toFixed(2)
  const fromCommissions = +(opts.grossRevenue * comShare).toFixed(2)
  return {
    fromSubscriptions,
    fromCommissions,
    total: +(fromSubscriptions + fromCommissions).toFixed(2),
    subscriptionShareRate: subShare,
    commissionShareRate: comShare,
  }
}

export const PLATFORM_LABELS: Record<string, string> = {
  AIRBNB:  'Airbnb',
  BOOKING: 'Booking.com',
  DIRECT:  'Directo',
  OTHER:   'Outro',
}

export const PLATFORM_RULES: Record<string, string> = {
  AIRBNB:  'Checkout + 1 dia + 2 dias úteis',
  BOOKING: 'Fim do mês do checkout',
  DIRECT:  'D+7 após checkout',
  OTHER:   'D+7 após checkout',
}
