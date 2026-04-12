"use client"

import { CurrencyProvider } from '@/contexts/currency-context'
import { LocaleProvider } from '@/i18n/provider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <CurrencyProvider>{children}</CurrencyProvider>
    </LocaleProvider>
  )
}
