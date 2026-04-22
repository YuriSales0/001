import { describe, it, expect } from 'vitest'
import { regionalContextBlock, COSTA_TROPICAL_ZONES } from '@/lib/guest-stay/regional-context'

describe('regionalContextBlock', () => {
  it('includes all 5 Costa Tropical zones', () => {
    const block = regionalContextBlock('Almuñécar')
    expect(block).toContain('ALMUÑÉCAR')
    expect(block).toContain('LA HERRADURA')
    expect(block).toContain('SALOBREÑA')
    expect(block).toContain('MOTRIL')
    expect(block).toContain('NERJA')
  })

  it('marks the primary zone with "(the property is here)"', () => {
    const block = regionalContextBlock('Almuñécar')
    expect(block).toContain('(the property is here)')
  })

  it('includes EU emergency numbers', () => {
    const block = regionalContextBlock('Nerja')
    expect(block).toContain('112')
    expect(block).toContain('091')
    expect(block).toContain('112')
  })

  it('handles null/undefined city without crashing', () => {
    expect(() => regionalContextBlock(null)).not.toThrow()
    expect(() => regionalContextBlock(undefined)).not.toThrow()
    expect(() => regionalContextBlock('')).not.toThrow()
  })

  it('handles city with special characters', () => {
    const block = regionalContextBlock('La Herradura')
    expect(block).toContain('(the property is here)')
  })

  it('handles case-insensitive matching', () => {
    const upper = regionalContextBlock('NERJA')
    const lower = regionalContextBlock('nerja')
    const mixed = regionalContextBlock('Nerja')
    expect(upper).toContain('(the property is here)')
    expect(lower).toContain('(the property is here)')
    expect(mixed).toContain('(the property is here)')
  })
})

describe('COSTA_TROPICAL_ZONES', () => {
  it('has exactly 5 zones', () => {
    expect(COSTA_TROPICAL_ZONES).toHaveLength(5)
  })

  it('each zone has required fields', () => {
    for (const zone of COSTA_TROPICAL_ZONES) {
      expect(zone.code).toBeDefined()
      expect(zone.name).toBeDefined()
      expect(zone.description).toBeDefined()
      expect(zone.markets.length).toBeGreaterThan(0)
      expect(zone.mustSeeTours.length).toBeGreaterThan(0)
      expect(zone.trails.length).toBeGreaterThan(0)
      expect(zone.beaches.length).toBeGreaterThan(0)
      expect(zone.restaurants.length).toBeGreaterThan(0)
      expect(zone.services.length).toBeGreaterThan(0)
    }
  })
})
