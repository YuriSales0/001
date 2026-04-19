export type Locale = 'en' | 'pt' | 'es' | 'de' | 'nl' | 'fr' | 'sv' | 'da'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Messages = Record<string, any>

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'pt', label: 'Português',  flag: '🇵🇹' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
  { code: 'nl', label: 'Nederlands', flag: '🇳🇱' },
  { code: 'fr', label: 'Français',   flag: '🇫🇷' },
  { code: 'sv', label: 'Svenska',    flag: '🇸🇪' },
  { code: 'da', label: 'Dansk',      flag: '🇩🇰' },
]

const COOKIE_NAME = 'hm_locale'
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 1 year in seconds

/** Read locale from cookie, fall back to 'en' */
export function getLocale(): Locale {
  if (typeof document === 'undefined') return 'en'
  const match = document.cookie
    .split('; ')
    .find(row => row.startsWith(`${COOKIE_NAME}=`))
  const value = match?.split('=')[1]
  if (value && isLocale(value)) return value
  return 'en'
}

/** Set locale cookie with 1-year expiry */
export function setLocale(locale: Locale): void {
  if (typeof document === 'undefined') return
  document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`
}

/** Dynamically import messages for a given locale */
export async function loadMessages(locale: Locale): Promise<Messages> {
  try {
    const mod = await import(`@/messages/${locale}.json`)
    return mod.default ?? mod
  } catch {
    // Fallback to English if locale file is missing
    const mod = await import('@/messages/en.json')
    return mod.default ?? mod
  }
}

/** Dot-notation accessor: t(messages, 'common.dashboard') => 'Dashboard' */
export function t(
  messages: Messages,
  key: string,
): string {
  const parts = key.split('.')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = messages
  for (const part of parts) {
    if (current === null || current === undefined) return key
    current = current[part]
  }
  if (current === null || current === undefined) return key
  if (typeof current === 'string') return current
  if (typeof current === 'number' || typeof current === 'boolean') return String(current)
  return key
}

/** Synchronously load messages for server components (uses require) */
export function loadMessagesSync(locale: Locale): Messages {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require(`@/messages/${locale}.json`)
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@/messages/en.json')
  }
}

function isLocale(value: string): value is Locale {
  return ['en', 'pt', 'es', 'de', 'nl', 'fr', 'sv', 'da'].includes(value)
}

const INTL_LOCALE: Record<Locale, string> = {
  en: 'en-GB', pt: 'pt-PT', es: 'es-ES', de: 'de-DE',
  nl: 'nl-NL', fr: 'fr-FR', sv: 'sv-SE', da: 'da-DK',
}

export function intlLocale(locale: Locale): string {
  return INTL_LOCALE[locale] ?? 'en-GB'
}
