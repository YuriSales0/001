/**
 * Hostmaster financial rules.
 *
 * Commission per subscription plan:
 *   STARTER  → 20%
 *   BASIC    → 20%
 *   MID      → 18%  (most popular)
 *   PREMIUM  → 15%
 *
 * Payout scheduling:
 *   Airbnb  → checkOut + 1 day + 2 business days
 *   Booking → last day of checkOut month
 *   Others  → checkOut + 7 days
 */

export const PLAN_COMMISSION: Record<string, number> = {
  STARTER: 0.20,
  BASIC:   0.20,
  MID:     0.18,
  PREMIUM: 0.15,
}

/** Default when plan is unknown */
export const DEFAULT_COMMISSION_RATE = 0.18

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
