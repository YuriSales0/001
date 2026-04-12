export type Locale = 'en' | 'pt' | 'es' | 'de'

export const LOCALES: { code: Locale; label: string; flag: string }[] = [
  { code: 'en', label: 'English',    flag: '🇬🇧' },
  { code: 'pt', label: 'Português',  flag: '🇵🇹' },
  { code: 'es', label: 'Español',    flag: '🇪🇸' },
  { code: 'de', label: 'Deutsch',    flag: '🇩🇪' },
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
export async function loadMessages(locale: Locale): Promise<Record<string, Record<string, string>>> {
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
  messages: Record<string, Record<string, string>>,
  key: string,
): string {
  const parts = key.split('.')
  if (parts.length !== 2) return key

  const [namespace, field] = parts
  return messages?.[namespace]?.[field] ?? key
}

function isLocale(value: string): value is Locale {
  return ['en', 'pt', 'es', 'de'].includes(value)
}
