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
// Pre-load English synchronously to avoid flash of raw translation keys
import enMessages from '@/messages/en.json'

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
  messages: Messages
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en')
  // Initialize with English messages so first render has translations,
  // not raw keys. Other locales load async on cookie/session detection.
  const [messages, setMessages] = useState<Messages>(enMessages as Messages)

  // Load messages whenever locale changes (skip if already English — already loaded)
  useEffect(() => {
    if (locale === 'en') {
      setMessages(enMessages as Messages)
      return
    }
    loadMessages(locale).then(setMessages)
  }, [locale])

  // On mount: session language is the source of truth.
  // Cookie is only a cache for unauthenticated pages.
  useEffect(() => {
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(session => {
        const lang = session?.user?.language as Locale | undefined
        if (lang && ['en', 'pt', 'es', 'de', 'nl', 'fr', 'sv', 'da'].includes(lang)) {
          setLocaleState(lang)
          writeCookieLocale(lang)
          return
        }
        // Not authenticated — fall back to cookie
        const cookieLocale = readCookieLocale()
        if (cookieLocale !== 'en') setLocaleState(cookieLocale)
      })
      .catch(() => {
        // Offline or not authenticated — use cookie
        const cookieLocale = readCookieLocale()
        if (cookieLocale !== 'en') setLocaleState(cookieLocale)
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
  // `messages` is exposed for cases where t() (string-only) isn't enough —
  // e.g. reading nested arrays for plan perks. Prefer t() for normal lookups.
  return { locale: ctx.locale, setLocale: ctx.setLocale, t: ctx.t, messages: ctx.messages }
}
