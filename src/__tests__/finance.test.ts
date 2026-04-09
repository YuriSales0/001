import { describe, it, expect } from 'vitest'
import {
  PLAN_COMMISSION,
  DEFAULT_COMMISSION_RATE,
  commissionRateForPlan,
  calcCommission,
  payoutDateFrom,
  CLEANING_FEE_STANDARD,
  CLEANING_INCLUDED_MIN_NIGHTS,
} from '@/lib/finance'

// ---------------------------------------------------------------------------
// commissionRateForPlan
// ---------------------------------------------------------------------------
describe('commissionRateForPlan', () => {
  it('returns correct rate for each plan', () => {
    expect(commissionRateForPlan('STARTER')).toBe(0.22)
    expect(commissionRateForPlan('BASIC')).toBe(0.20)
    expect(commissionRateForPlan('MID')).toBe(0.17)
    expect(commissionRateForPlan('PREMIUM')).toBe(0.13)
  })

  it('returns DEFAULT_COMMISSION_RATE for unknown plan', () => {
    expect(commissionRateForPlan('UNKNOWN')).toBe(DEFAULT_COMMISSION_RATE)
    expect(commissionRateForPlan(null)).toBe(DEFAULT_COMMISSION_RATE)
    expect(commissionRateForPlan(undefined)).toBe(DEFAULT_COMMISSION_RATE)
    expect(commissionRateForPlan('')).toBe(DEFAULT_COMMISSION_RATE)
  })

  it('DEFAULT_COMMISSION_RATE equals MID rate', () => {
    expect(DEFAULT_COMMISSION_RATE).toBe(PLAN_COMMISSION['MID'])
  })
})

// ---------------------------------------------------------------------------
// calcCommission
// ---------------------------------------------------------------------------
describe('calcCommission', () => {
  it('calculates correctly for PREMIUM (13%)', () => {
    const result = calcCommission(1000, 'PREMIUM')
    expect(result.gross).toBe(1000)
    expect(result.commission).toBe(130)
    expect(result.net).toBe(870)
    expect(result.commissionRate).toBe(13)
  })

  it('calculates correctly for MID (17%)', () => {
    const result = calcCommission(1000, 'MID')
    expect(result.commission).toBe(170)
    expect(result.net).toBe(830)
    expect(result.commissionRate).toBe(17)
  })

  it('calculates correctly for BASIC (20%)', () => {
    const result = calcCommission(1000, 'BASIC')
    expect(result.commission).toBe(200)
    expect(result.net).toBe(800)
    expect(result.commissionRate).toBe(20)
  })

  it('calculates correctly for STARTER (22%)', () => {
    const result = calcCommission(1000, 'STARTER')
    expect(result.commission).toBe(220)
    expect(result.net).toBe(780)
    expect(result.commissionRate).toBe(22)
  })

  it('rounds to 2 decimal places', () => {
    const result = calcCommission(333.33, 'MID') // 333.33 * 0.17 = 56.6661
    expect(result.commission).toBe(56.67)
    expect(result.net).toBe(276.66)
  })

  it('gross + commission == net is always exact', () => {
    for (const plan of ['STARTER', 'BASIC', 'MID', 'PREMIUM']) {
      const gross = 1234.56
      const { commission, net } = calcCommission(gross, plan)
      // Allow 1-cent rounding tolerance due to floating point
      expect(Math.abs(net + commission - gross)).toBeLessThanOrEqual(0.01)
    }
  })

  it('defaults to MID rate when plan is null', () => {
    const withNull = calcCommission(1000, null)
    const withMid  = calcCommission(1000, 'MID')
    expect(withNull).toEqual(withMid)
  })
})

// ---------------------------------------------------------------------------
// payoutDateFrom
// ---------------------------------------------------------------------------
describe('payoutDateFrom', () => {
  // Use a fixed Monday 2026-04-06 as checkout base
  const monday = new Date('2026-04-06T12:00:00Z')

  describe('AIRBNB — checkout + 1 day + 2 business days', () => {
    it('Monday checkout → Friday payout (Tue + 2 business = Thu)', () => {
      // Mon Apr 6 → +1 = Tue Apr 7 → +2 biz = Thu Apr 9
      const payout = payoutDateFrom(monday, 'AIRBNB')
      expect(payout.getUTCFullYear()).toBe(2026)
      expect(payout.getUTCMonth()).toBe(3)  // April (0-indexed)
      expect(payout.getUTCDate()).toBe(9)
    })

    it('Thursday checkout skips weekend correctly', () => {
      // Thu Apr 9 → +1 = Fri Apr 10 → +2 biz = Tue Apr 14 (skips Sat+Sun)
      const thu = new Date('2026-04-09T12:00:00Z')
      const payout = payoutDateFrom(thu, 'AIRBNB')
      expect(payout.getUTCDate()).toBe(14)
    })

    it('Friday checkout spans two weekends', () => {
      // Fri Apr 10 → +1 = Sat Apr 11 → +2 biz: Mon Apr 13 (+1), Tue Apr 14 (+2)
      const fri = new Date('2026-04-10T12:00:00Z')
      const payout = payoutDateFrom(fri, 'AIRBNB')
      expect(payout.getUTCDate()).toBe(14)
    })
  })

  describe('BOOKING — end of checkout month', () => {
    it('April checkout → April 30', () => {
      const payout = payoutDateFrom(monday, 'BOOKING')
      expect(payout.getMonth()).toBe(3)  // April
      expect(payout.getDate()).toBe(30)
    })

    it('February checkout → Feb 28 in non-leap year', () => {
      const feb = new Date('2025-02-15T12:00:00Z')
      const payout = payoutDateFrom(feb, 'BOOKING')
      expect(payout.getDate()).toBe(28)
    })

    it('February checkout → Feb 29 in leap year', () => {
      const feb = new Date('2028-02-15T12:00:00Z')
      const payout = payoutDateFrom(feb, 'BOOKING')
      expect(payout.getDate()).toBe(29)
    })
  })

  describe('Default (DIRECT / OTHER / null) — D+7', () => {
    it('adds exactly 7 days for DIRECT', () => {
      const payout = payoutDateFrom(monday, 'DIRECT')
      const expected = new Date(monday)
      expected.setDate(expected.getDate() + 7)
      expect(payout.getTime()).toBe(expected.getTime())
    })

    it('adds exactly 7 days when platform is null', () => {
      const payout = payoutDateFrom(monday, null)
      const expected = new Date(monday)
      expected.setDate(expected.getDate() + 7)
      expect(payout.getTime()).toBe(expected.getTime())
    })

    it('adds exactly 7 days when platform is undefined', () => {
      const payout = payoutDateFrom(monday, undefined)
      const expected = new Date(monday)
      expected.setDate(expected.getDate() + 7)
      expect(payout.getTime()).toBe(expected.getTime())
    })
  })
})

// ---------------------------------------------------------------------------
// Cleaning fee constants
// ---------------------------------------------------------------------------
describe('CLEANING_FEE_STANDARD', () => {
  it('STARTER has €70 cleaning fee', () => expect(CLEANING_FEE_STANDARD['STARTER']).toBe(70))
  it('BASIC has €60 cleaning fee',   () => expect(CLEANING_FEE_STANDARD['BASIC']).toBe(60))
  it('MID has €45 cleaning fee',     () => expect(CLEANING_FEE_STANDARD['MID']).toBe(45))
  it('PREMIUM has €35 cleaning fee', () => expect(CLEANING_FEE_STANDARD['PREMIUM']).toBe(35))
})

describe('CLEANING_INCLUDED_MIN_NIGHTS', () => {
  it('STARTER: never included (null)',  () => expect(CLEANING_INCLUDED_MIN_NIGHTS['STARTER']).toBeNull())
  it('BASIC: never included (null)',    () => expect(CLEANING_INCLUDED_MIN_NIGHTS['BASIC']).toBeNull())
  it('MID: included from 5 nights',    () => expect(CLEANING_INCLUDED_MIN_NIGHTS['MID']).toBe(5))
  it('PREMIUM: included from 3 nights',() => expect(CLEANING_INCLUDED_MIN_NIGHTS['PREMIUM']).toBe(3))
})
