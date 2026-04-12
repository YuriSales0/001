import { describe, it, expect } from 'vitest'
import { calculateSuggestedPrice } from '@/lib/pricing-engine'
import type { PricingInput } from '@/lib/pricing-engine'

const BASE_INPUT: PricingInput = {
  ownHistoricalPrices: [150, 160, 140, 155, 145, 150, 160, 150],
  ownOccupancy: 75,
  competitorPrices: [130, 140, 150, 160, 170, 145, 155],
  targetMonth: 4, // April
  targetDayOfWeek: 5, // Saturday
  leadTimeDays: 14,
  rating: 4.6,
  isSuperhost: false,
}

describe('calculateSuggestedPrice', () => {
  it('returns all required fields', () => {
    const result = calculateSuggestedPrice(BASE_INPUT)
    expect(result.basePrice).toBeGreaterThan(0)
    expect(result.suggestedPrice).toBeGreaterThan(0)
    expect(['LOW', 'MEDIUM', 'HIGH']).toContain(result.confidence)
    expect(result.factors.length).toBeGreaterThanOrEqual(4)
    expect(result.competitorMedian).not.toBeNull()
    expect(result.percentile).not.toBeNull()
  })

  it('base price is median of own historical prices', () => {
    const result = calculateSuggestedPrice(BASE_INPUT)
    // sorted: [140, 145, 150, 150, 150, 155, 160, 160] → median at index 4 = 150
    expect(result.basePrice).toBe(150)
  })

  it('Saturday has weekend premium', () => {
    const sat = calculateSuggestedPrice({ ...BASE_INPUT, targetDayOfWeek: 5 })
    const tue = calculateSuggestedPrice({ ...BASE_INPUT, targetDayOfWeek: 1 })
    expect(sat.suggestedPrice).toBeGreaterThan(tue.suggestedPrice)
  })

  it('August (peak) is more expensive than January (low)', () => {
    const aug = calculateSuggestedPrice({ ...BASE_INPUT, targetMonth: 8 })
    const jan = calculateSuggestedPrice({ ...BASE_INPUT, targetMonth: 1 })
    expect(aug.suggestedPrice).toBeGreaterThan(jan.suggestedPrice)
  })

  it('high occupancy increases price', () => {
    const high = calculateSuggestedPrice({ ...BASE_INPUT, ownOccupancy: 90 })
    const low = calculateSuggestedPrice({ ...BASE_INPUT, ownOccupancy: 40 })
    expect(high.suggestedPrice).toBeGreaterThan(low.suggestedPrice)
  })

  it('last-minute booking gets discount', () => {
    const lastMin = calculateSuggestedPrice({ ...BASE_INPUT, leadTimeDays: 1 })
    const normal = calculateSuggestedPrice({ ...BASE_INPUT, leadTimeDays: 14 })
    expect(lastMin.suggestedPrice).toBeLessThan(normal.suggestedPrice)
  })

  it('advance booking gets premium', () => {
    const advance = calculateSuggestedPrice({ ...BASE_INPUT, leadTimeDays: 60 })
    const normal = calculateSuggestedPrice({ ...BASE_INPUT, leadTimeDays: 14 })
    expect(advance.suggestedPrice).toBeGreaterThan(normal.suggestedPrice)
  })

  it('superhost gets premium', () => {
    const sh = calculateSuggestedPrice({ ...BASE_INPUT, isSuperhost: true })
    const noSh = calculateSuggestedPrice({ ...BASE_INPUT, isSuperhost: false })
    expect(sh.suggestedPrice).toBeGreaterThan(noSh.suggestedPrice)
  })

  it('high rating gets premium', () => {
    const good = calculateSuggestedPrice({ ...BASE_INPUT, rating: 4.9 })
    const poor = calculateSuggestedPrice({ ...BASE_INPUT, rating: 3.8 })
    expect(good.suggestedPrice).toBeGreaterThan(poor.suggestedPrice)
  })

  it('falls back to competitor median when no own data', () => {
    const result = calculateSuggestedPrice({
      ...BASE_INPUT,
      ownHistoricalPrices: [],
    })
    // Should use competitor median as base
    expect(result.basePrice).toBeGreaterThan(0)
    expect(result.dataPoints).toBe(0)
  })

  it('confidence is LOW with minimal data', () => {
    const result = calculateSuggestedPrice({
      ...BASE_INPUT,
      ownHistoricalPrices: [150],
      competitorPrices: [140],
    })
    expect(result.confidence).toBe('LOW')
  })

  it('confidence is MEDIUM with moderate data', () => {
    const result = calculateSuggestedPrice({
      ...BASE_INPUT,
      ownHistoricalPrices: [150, 160, 140, 155, 145],
      competitorPrices: [130, 140, 150, 160, 170],
    })
    expect(result.confidence).toBe('MEDIUM')
  })

  it('confidence is HIGH with abundant data', () => {
    const prices = Array.from({ length: 25 }, (_, i) => 130 + i * 2)
    const comps = Array.from({ length: 15 }, (_, i) => 120 + i * 3)
    const result = calculateSuggestedPrice({
      ...BASE_INPUT,
      ownHistoricalPrices: prices,
      competitorPrices: comps,
    })
    expect(result.confidence).toBe('HIGH')
  })

  it('calculates percentile correctly', () => {
    const result = calculateSuggestedPrice({
      ...BASE_INPUT,
      ownHistoricalPrices: [200, 200, 200, 200, 200], // base = 200
      competitorPrices: [100, 120, 140, 160, 180, 190, 210, 220, 240],
    })
    // 200 is above 100,120,140,160,180,190 (6 out of 9) → ~67th percentile
    expect(result.percentile).toBeGreaterThanOrEqual(60)
    expect(result.percentile).toBeLessThanOrEqual(80)
  })

  it('suggested price is never zero', () => {
    const result = calculateSuggestedPrice({
      ownHistoricalPrices: [],
      ownOccupancy: 0,
      competitorPrices: [],
      targetMonth: 1,
      targetDayOfWeek: 0,
      leadTimeDays: null,
      rating: null,
      isSuperhost: false,
    })
    expect(result.suggestedPrice).toBeGreaterThan(0)
  })
})
