"use client"

import { CurrencyProvider } from '@/contexts/currency-context'

export function Providers({ children }: { children: React.ReactNode }) {
  return <CurrencyProvider>{children}</CurrencyProvider>
}
