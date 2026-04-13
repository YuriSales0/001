"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  type Locale,
  type Messages,
  getLocale as readCookieLocale,
  setLocale as writeCookieLocale,
  loadMessages,
  t as tRaw,
} from '@/i18n'

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
  messages: Messages
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  const [messages, setMessages] = useState<Messages>({})

  // Load messages whenever locale changes
  useEffect(() => {
    loadMessages(locale).then(setMessages)
  }, [locale])

  // On mount: read cookie, then override with session language if authenticated
  useEffect(() => {
    const cookieLocale = readCookieLocale()
    setLocaleState(cookieLocale)

    fetch('/api/auth/session')
      .then(res => res.json())
      .then(session => {
        const lang = session?.user?.language as Locale | undefined
        if (lang && ['en', 'pt', 'es', 'de', 'nl', 'fr', 'sv'].includes(lang)) {
          setLocaleState(lang)
          writeCookieLocale(lang)
        }
      })
      .catch(() => {
        // Not authenticated or fetch failed — keep cookie locale
      })
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    writeCookieLocale(newLocale)

    // Persist to user profile if authenticated
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(session => {
        if (session?.user) {
          fetch('/api/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ language: newLocale }),
          }).catch(() => {
            // Silently fail — cookie is already set
          })
        }
      })
      .catch(() => {
        // Not authenticated — cookie-only
      })
  }, [])

  const t = useCallback(
    (key: string) => tRaw(messages, key),
    [messages],
  )

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, messages }}>
      {children}
    </LocaleContext.Provider>
  )
}

/** Hook to consume the locale context */
export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error('useLocale must be used within a LocaleProvider')
  }
  return { locale: ctx.locale, setLocale: ctx.setLocale, t: ctx.t }
}
