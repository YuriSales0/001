import { describe, it, expect } from 'vitest'
import { calculateNpsCategory, dimensionAverages } from '@/lib/vagf/analyzer'

describe('VAGF analyzer helpers', () => {
  describe('calculateNpsCategory', () => {
    it('classifies 9-10 as PROMOTER', () => {
      expect(calculateNpsCategory(9)).toBe('PROMOTER')
      expect(calculateNpsCategory(10)).toBe('PROMOTER')
    })

    it('classifies 7-8 as PASSIVE', () => {
      expect(calculateNpsCategory(7)).toBe('PASSIVE')
      expect(calculateNpsCategory(8)).toBe('PASSIVE')
    })

    it('classifies 0-6 as DETRACTOR', () => {
      expect(calculateNpsCategory(0)).toBe('DETRACTOR')
      expect(calculateNpsCategory(6)).toBe('DETRACTOR')
    })

    it('returns null for null/undefined', () => {
      expect(calculateNpsCategory(null)).toBeNull()
      expect(calculateNpsCategory(undefined as unknown as number | null)).toBeNull()
    })
  })

  describe('dimensionAverages', () => {
    it('averages per dimension, ignoring nulls', () => {
      const result = dimensionAverages({
        scorePropertyStructure: 9,
        scorePropertyAmenities: 7,
        scoreLocation: 10,
        scoreValueForMoney: 8,
        scorePropertyState: 8,
        scoreCleanliness: 9,
        scoreCrewPresentation: null,
        scoreCommunication: 8,
        scoreCheckInExperience: 9,
        scoreCheckOutExperience: 9,
        scorePlatformOverall: 9,
      })
      expect(result.property).toBe(8.5)       // (9+7+10+8)/4
      expect(result.crew).toBe(8.5)           // (8+9)/2 — presentation null
      expect(result.platform).toBe(8.8)       // (8+9+9+9)/4
    })

    it('returns null for a dimension with no values', () => {
      const result = dimensionAverages({})
      expect(result.property).toBeNull()
      expect(result.crew).toBeNull()
      expect(result.platform).toBeNull()
    })

    it('handles single-value dimension', () => {
      const result = dimensionAverages({ scoreCleanliness: 7 })
      expect(result.crew).toBe(7)
    })
  })
})
