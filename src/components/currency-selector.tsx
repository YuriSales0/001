'use client'

import { useCurrency, Currency, CURRENCY_SYMBOLS } from '@/contexts/currency-context'

const CURRENCIES: Currency[] = ['EUR', 'USD', 'GBP', 'BRL']

export function CurrencySelector({ className = '' }: { className?: string }) {
  const { currency, setCurrency } = useCurrency()

  return (
    <select
      value={currency}
      onChange={e => setCurrency(e.target.value as Currency)}
      className={`rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-hm-gold ${className}`}
      aria-label="Select currency"
    >
      {CURRENCIES.map(c => (
        <option key={c} value={c}>
          {CURRENCY_SYMBOLS[c]} {c}
        </option>
      ))}
    </select>
  )
}
