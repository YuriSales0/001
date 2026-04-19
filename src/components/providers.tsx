"use client"

import { CurrencyProvider } from '@/contexts/currency-context'
import { LocaleProvider } from '@/i18n/provider'
import { ToastContainer } from '@/components/hm/toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LocaleProvider>
      <CurrencyProvider>
        {children}
        <ToastContainer />
      </CurrencyProvider>
    </LocaleProvider>
  )
}
