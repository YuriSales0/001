import { describe, it, expect } from 'vitest'
import {
  PLAN_MONTHLY_FEE,
  PLAN_COMMISSION,
  PLATFORM_LABELS,
  PLATFORM_RULES,
  calcCommission,
  payoutDateFrom,
} from '@/lib/finance'

// ---------------------------------------------------------------------------
// PLAN_MONTHLY_FEE constants
// ---------------------------------------------------------------------------
describe('PLAN_MONTHLY_FEE', () => {
  it('STARTER is free', () => expect(PLAN_MONTHLY_FEE['STARTER']).toBe(0))
  it('BASIC is €89',    () => expect(PLAN_MONTHLY_FEE['BASIC']).toBe(89))
  it('MID is €159',     () => expect(PLAN_MONTHLY_FEE['MID']).toBe(159))
  it('PREMIUM is €269', () => expect(PLAN_MONTHLY_FEE['PREMIUM']).toBe(269))
})

// ---------------------------------------------------------------------------
// PLATFORM_LABELS
// ---------------------------------------------------------------------------
describe('PLATFORM_LABELS', () => {
  it('maps all platforms to display labels', () => {
    expect(PLATFORM_LABELS['AIRBNB']).toBe('Airbnb')
    expect(PLATFORM_LABELS['BOOKING']).toBe('Booking.com')
    expect(PLATFORM_LABELS['DIRECT']).toBe('Directo')
    expect(PLATFORM_LABELS['OTHER']).toBe('Outro')
  })
})

// ---------------------------------------------------------------------------
// PLATFORM_RULES
// ---------------------------------------------------------------------------
describe('PLATFORM_RULES', () => {
  it('describes Airbnb rule', () => {
    expect(PLATFORM_RULES['AIRBNB']).toContain('2 dias úteis')
  })
  it('describes Booking rule', () => {
    expect(PLATFORM_RULES['BOOKING']).toContain('Fim do mês')
  })
  it('describes Direct/Other rule', () => {
    expect(PLATFORM_RULES['DIRECT']).toContain('D+7')
    expect(PLATFORM_RULES['OTHER']).toContain('D+7')
  })
})

// ---------------------------------------------------------------------------
// calcCommission — edge cases
// ---------------------------------------------------------------------------
describe('calcCommission edge cases', () => {
  it('handles zero gross amount', () => {
    const result = calcCommission(0, 'MID')
    expect(result.gross).toBe(0)
    expect(result.commission).toBe(0)
    expect(result.net).toBe(0)
  })

  it('handles very large amounts', () => {
    const result = calcCommission(100000, 'PREMIUM')
    expect(result.commission).toBe(13000)
    expect(result.net).toBe(87000)
  })

  it('handles decimal cents correctly', () => {
    // 99.99 * 0.22 = 21.9978 → rounded to 21.998 → 22.00
    const result = calcCommission(99.99, 'STARTER')
    expect(result.commission).toBe(22)
    expect(result.net).toBe(77.99)
  })

  it('commissionRate is percentage (0-100), not fraction', () => {
    for (const plan of ['STARTER', 'BASIC', 'MID', 'PREMIUM']) {
      const { commissionRate } = calcCommission(100, plan)
      expect(commissionRate).toBeGreaterThan(1) // should be 13-22, not 0.13-0.22
      expect(commissionRate).toBeLessThan(100)
    }
  })
})

// ---------------------------------------------------------------------------
// Commission hierarchy — higher plan = lower commission
// ---------------------------------------------------------------------------
describe('commission hierarchy', () => {
  it('STARTER > BASIC > MID > PREMIUM', () => {
    expect(PLAN_COMMISSION['STARTER']).toBeGreaterThan(PLAN_COMMISSION['BASIC'])
    expect(PLAN_COMMISSION['BASIC']).toBeGreaterThan(PLAN_COMMISSION['MID'])
    expect(PLAN_COMMISSION['MID']).toBeGreaterThan(PLAN_COMMISSION['PREMIUM'])
  })

  it('monthly fee increases with plan tier', () => {
    expect(PLAN_MONTHLY_FEE['STARTER']).toBeLessThan(PLAN_MONTHLY_FEE['BASIC'])
    expect(PLAN_MONTHLY_FEE['BASIC']).toBeLessThan(PLAN_MONTHLY_FEE['MID'])
    expect(PLAN_MONTHLY_FEE['MID']).toBeLessThan(PLAN_MONTHLY_FEE['PREMIUM'])
  })
})

// ---------------------------------------------------------------------------
// payoutDateFrom — additional edge cases
// ---------------------------------------------------------------------------
describe('payoutDateFrom edge cases', () => {
  it('AIRBNB: Saturday checkout handles weekend skip', () => {
    // Sat Apr 11 → +1 = Sun Apr 12 → +2 biz: Mon Apr 13 (+1), Tue Apr 14 (+2)
    const sat = new Date('2026-04-11T12:00:00Z')
    const payout = payoutDateFrom(sat, 'AIRBNB')
    expect(payout.getUTCDate()).toBe(14)
  })

  it('AIRBNB: Sunday checkout', () => {
    // Sun Apr 12 → +1 = Mon Apr 13 → +2 biz: Tue Apr 14 (+1), Wed Apr 15 (+2)
    const sun = new Date('2026-04-12T12:00:00Z')
    const payout = payoutDateFrom(sun, 'AIRBNB')
    expect(payout.getUTCDate()).toBe(15)
  })

  it('BOOKING: December checkout → Dec 31', () => {
    const dec = new Date('2026-12-15T12:00:00Z')
    const payout = payoutDateFrom(dec, 'BOOKING')
    expect(payout.getMonth()).toBe(11) // December
    expect(payout.getDate()).toBe(31)
  })

  it('BOOKING: January checkout → Jan 31', () => {
    const jan = new Date('2026-01-10T12:00:00Z')
    const payout = payoutDateFrom(jan, 'BOOKING')
    expect(payout.getMonth()).toBe(0) // January
    expect(payout.getDate()).toBe(31)
  })

  it('DIRECT: month boundary crossing', () => {
    // Apr 28 + 7 = May 5
    const apr28 = new Date('2026-04-28T12:00:00Z')
    const payout = payoutDateFrom(apr28, 'DIRECT')
    expect(payout.getUTCMonth()).toBe(4) // May
    expect(payout.getUTCDate()).toBe(5)
  })

  it('OTHER platform behaves same as DIRECT', () => {
    const date = new Date('2026-06-15T12:00:00Z')
    const direct = payoutDateFrom(date, 'DIRECT')
    const other = payoutDateFrom(date, 'OTHER')
    expect(direct.getTime()).toBe(other.getTime())
  })
})
