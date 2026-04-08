'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'

export type Currency = 'EUR' | 'USD' | 'GBP' | 'BRL'

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  BRL: 'R$',
}

export const CURRENCY_LOCALES: Record<Currency, string> = {
  EUR: 'pt-PT',
  USD: 'en-US',
  GBP: 'en-GB',
  BRL: 'pt-BR',
}

type Rates = Record<Currency, number>

type CurrencyContextValue = {
  currency: Currency
  setCurrency: (c: Currency) => void
  rates: Rates
  convert: (amountEUR: number) => number
  fmt: (amountEUR: number) => string
}

const DEFAULT_RATES: Rates = { EUR: 1, USD: 1.08, GBP: 0.86, BRL: 5.40 }

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: 'EUR',
  setCurrency: () => {},
  rates: DEFAULT_RATES,
  convert: n => n,
  fmt: n => `€${n.toFixed(2)}`,
})

const LS_KEY = 'hm_currency'

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('EUR')
  const [rates, setRates] = useState<Rates>(DEFAULT_RATES)

  // Restore from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY) as Currency | null
    if (saved && ['EUR', 'USD', 'GBP', 'BRL'].includes(saved)) {
      setCurrencyState(saved)
    }
  }, [])

  // Fetch rates once on mount
  useEffect(() => {
    fetch('/api/currency')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setRates(data as Rates) })
      .catch(() => {})
  }, [])

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c)
    localStorage.setItem(LS_KEY, c)
  }, [])

  const convert = useCallback((amountEUR: number) => {
    return amountEUR * (rates[currency] ?? 1)
  }, [rates, currency])

  const fmt = useCallback((amountEUR: number) => {
    const converted = amountEUR * (rates[currency] ?? 1)
    return new Intl.NumberFormat(CURRENCY_LOCALES[currency], {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(converted)
  }, [rates, currency])

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, rates, convert, fmt }}>
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  return useContext(CurrencyContext)
}
