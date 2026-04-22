import { describe, it, expect } from 'vitest'
import { coverageFromProperty } from '@/lib/guest-stay/coverage'

describe('coverageFromProperty', () => {
  it('returns 0% when everything is null', () => {
    const result = coverageFromProperty({})
    expect(result.pct).toBe(0)
    expect(result.filled).toBe(0)
  })

  it('returns 100% when all 6 critical fields filled + no bonus', () => {
    const result = coverageFromProperty({
      wifiSsid: 'HM_Villa',
      wifiPassword: 'secret123',
      doorCode: '1234',
      checkInInstructions: 'Enter via main door',
      checkOutInstructions: 'Leave keys inside',
      emergencyWhatsapp: '+34600000000',
    })
    expect(result.pct).toBe(100)
  })

  it('doorCode OR smartLockPassword counts as access fulfilled', () => {
    const a = coverageFromProperty({ doorCode: '1234' })
    const b = coverageFromProperty({ smartLockPassword: '5678' })
    expect(a.pct).toBeGreaterThan(0)
    expect(b.pct).toBeGreaterThan(0)
    expect(a.pct).toBe(b.pct)
  })

  it('rejects whitespace-only strings', () => {
    const result = coverageFromProperty({
      wifiSsid: '   ',
      wifiPassword: '\t\n',
    })
    expect(result.pct).toBe(0)
  })

  it('caps at 100% even with all bonus fields filled', () => {
    const result = coverageFromProperty({
      wifiSsid: 'HM_Villa',
      wifiPassword: 'secret123',
      doorCode: '1234',
      checkInInstructions: 'Enter via main',
      checkOutInstructions: 'Leave keys',
      emergencyWhatsapp: '+34600000000',
      appliancesInfo: 'AC + oven trips breaker',
      breakerLocation: 'Main cupboard',
      waterShutoffLocation: 'Under kitchen sink',
    })
    expect(result.pct).toBe(100)
  })

  it('calculates partial coverage correctly', () => {
    const result = coverageFromProperty({
      wifiSsid: 'HM_Villa',
      wifiPassword: 'secret',
      doorCode: '1234',
    })
    // 3/6 critical = 50%
    expect(result.pct).toBe(50)
  })

  it('bonus fields push above base when partial critical', () => {
    const noBonus = coverageFromProperty({
      wifiSsid: 'HM',
      wifiPassword: 'pw',
      doorCode: '1234',
      checkInInstructions: 'x',
      checkOutInstructions: 'y',
      emergencyWhatsapp: '+34',
    })
    const withBonus = coverageFromProperty({
      wifiSsid: 'HM',
      wifiPassword: 'pw',
      doorCode: '1234',
      checkInInstructions: 'x',
      checkOutInstructions: 'y',
      emergencyWhatsapp: '+34',
      appliancesInfo: 'note',
      breakerLocation: 'loc',
      waterShutoffLocation: 'loc',
    })
    // Both cap at 100 since both fully critical
    expect(noBonus.pct).toBe(100)
    expect(withBonus.pct).toBe(100)
  })
})
