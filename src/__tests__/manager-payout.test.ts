import { describe, it, expect } from 'vitest'
import {
  DEFAULT_MANAGER_SUBSCRIPTION_SHARE,
  DEFAULT_MANAGER_COMMISSION_SHARE,
  MANAGER_PORTFOLIO_BONUS,
  MANAGER_ACQUISITION_BONUS,
  managerPortfolioBonus,
  calcManagerEarnings,
} from '@/lib/finance'
import { payByDate } from '@/lib/manager-payout'

describe('Manager compensation constants', () => {
  it('default rates match CLAUDE.md (15% sub + 3% rental)', () => {
    expect(DEFAULT_MANAGER_SUBSCRIPTION_SHARE).toBe(0.15)
    expect(DEFAULT_MANAGER_COMMISSION_SHARE).toBe(0.03)
  })

  it('portfolio bonus tiers are 10/20/30 with €150/€400/€750', () => {
    const map = Object.fromEntries(MANAGER_PORTFOLIO_BONUS.map(t => [t.minProps, t.amount]))
    expect(map[10]).toBe(150)
    expect(map[20]).toBe(400)
    expect(map[30]).toBe(750)
  })

  it('acquisition bonus: €50/€100/€150 Basic/Mid/Premium, €0 Starter', () => {
    expect(MANAGER_ACQUISITION_BONUS.STARTER).toBe(0)
    expect(MANAGER_ACQUISITION_BONUS.BASIC).toBe(50)
    expect(MANAGER_ACQUISITION_BONUS.MID).toBe(100)
    expect(MANAGER_ACQUISITION_BONUS.PREMIUM).toBe(150)
  })
})

describe('managerPortfolioBonus', () => {
  it('returns 0 below 10 props', () => {
    expect(managerPortfolioBonus(0)).toBe(0)
    expect(managerPortfolioBonus(9)).toBe(0)
  })

  it('returns 150 at 10-19 props', () => {
    expect(managerPortfolioBonus(10)).toBe(150)
    expect(managerPortfolioBonus(19)).toBe(150)
  })

  it('returns 400 at 20-29 props', () => {
    expect(managerPortfolioBonus(20)).toBe(400)
    expect(managerPortfolioBonus(29)).toBe(400)
  })

  it('returns 750 at 30+ props', () => {
    expect(managerPortfolioBonus(30)).toBe(750)
    expect(managerPortfolioBonus(100)).toBe(750)
  })
})

describe('calcManagerEarnings', () => {
  it('uses default rates when not overridden', () => {
    const result = calcManagerEarnings({ grossRevenue: 10000, subscriptionFees: 1000 })
    expect(result.fromSubscriptions).toBe(150)  // 1000 * 0.15
    expect(result.fromCommissions).toBe(300)    // 10000 * 0.03
    expect(result.total).toBe(450)
  })

  it('respects per-manager rate overrides', () => {
    const result = calcManagerEarnings({
      grossRevenue: 10000,
      subscriptionFees: 1000,
      subscriptionShare: 0.20,
      commissionShare: 0.05,
    })
    expect(result.fromSubscriptions).toBe(200)
    expect(result.fromCommissions).toBe(500)
    expect(result.total).toBe(700)
  })

  it('handles zero revenue', () => {
    const result = calcManagerEarnings({ grossRevenue: 0, subscriptionFees: 0 })
    expect(result.total).toBe(0)
  })
})

describe('payByDate', () => {
  it('returns day 10 of the following month', () => {
    const d = payByDate(2026, 4)  // April → pay by May 10
    expect(d.getUTCFullYear()).toBe(2026)
    expect(d.getUTCMonth()).toBe(4)  // May (0-indexed)
    expect(d.getUTCDate()).toBe(10)
  })

  it('handles December → January of next year', () => {
    const d = payByDate(2026, 12)
    expect(d.getUTCFullYear()).toBe(2027)
    expect(d.getUTCMonth()).toBe(0)  // January
    expect(d.getUTCDate()).toBe(10)
  })
})
