import { describe, it, expect } from 'vitest'
import { vatFromTotal, vatOnNet, IVA_RATE } from '@/lib/receipts'

describe('VAT helpers', () => {
  it('IVA_RATE is 21 (Spain standard for services)', () => {
    expect(IVA_RATE).toBe(21)
  })

  describe('vatFromTotal (VAT-inclusive gross)', () => {
    it('splits €121 into €100 net + €21 VAT', () => {
      const r = vatFromTotal(121)
      expect(r.net).toBe(100)
      expect(r.vat).toBe(21)
      expect(r.total).toBe(121)
      expect(r.rate).toBe(21)
    })

    it('handles rounding correctly', () => {
      const r = vatFromTotal(107.69)
      expect(r.net).toBe(89)
      expect(r.vat).toBe(18.69)
    })

    it('respects custom rate', () => {
      const r = vatFromTotal(110, 10)
      expect(r.net).toBe(100)
      expect(r.vat).toBe(10)
    })
  })

  describe('vatOnNet (VAT-exclusive net)', () => {
    it('adds 21% to €100 → €121', () => {
      const r = vatOnNet(100)
      expect(r.net).toBe(100)
      expect(r.vat).toBe(21)
      expect(r.total).toBe(121)
    })

    it('handles small values with rounding', () => {
      const r = vatOnNet(89)
      expect(r.net).toBe(89)
      expect(r.vat).toBe(18.69)
      expect(r.total).toBe(107.69)
    })

    it('zero is handled gracefully', () => {
      const r = vatOnNet(0)
      expect(r.net).toBe(0)
      expect(r.vat).toBe(0)
      expect(r.total).toBe(0)
    })
  })

  it('roundtrip: vatOnNet → vatFromTotal is consistent', () => {
    const net = 159
    const a = vatOnNet(net)
    const b = vatFromTotal(a.total)
    expect(b.net).toBe(a.net)
    expect(b.vat).toBe(a.vat)
  })
})
