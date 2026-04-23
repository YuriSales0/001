"use client"

import { useEffect, useState, useRef } from "react"
import { useLocale } from "@/i18n/provider"

const GREETINGS: Record<string, { morning: string; afternoon: string; evening: string }> = {
  en: { morning: 'Good morning', afternoon: 'Good afternoon', evening: 'Good evening' },
  pt: { morning: 'Bom dia', afternoon: 'Boa tarde', evening: 'Boa noite' },
  es: { morning: 'Buenos días', afternoon: 'Buenas tardes', evening: 'Buenas noches' },
  de: { morning: 'Guten Morgen', afternoon: 'Guten Tag', evening: 'Guten Abend' },
  nl: { morning: 'Goedemorgen', afternoon: 'Goedemiddag', evening: 'Goedenavond' },
  fr: { morning: 'Bonjour', afternoon: 'Bon après-midi', evening: 'Bonsoir' },
  sv: { morning: 'God morgon', afternoon: 'God eftermiddag', evening: 'God kväll' },
  da: { morning: 'Godmorgen', afternoon: 'God eftermiddag', evening: 'Godaften' },
}

// Used when we have no name at all — shown after the greeting ("Bom dia, amigo")
const NAMELESS_FALLBACK: Record<string, string> = {
  en: 'friend', pt: 'amigo', es: 'amigo', de: 'Freund',
  nl: 'vriend', fr: 'ami',   sv: 'vän',   da: 'ven',
}

function getGreeting(locale: string): string {
  const h = new Date().getHours()
  const g = GREETINGS[locale] ?? GREETINGS.en
  if (h < 12) return g.morning
  if (h < 18) return g.afternoon
  return g.evening
}

function formatToday(locale: string): string {
  const localeMap: Record<string, string> = {
    en: 'en-GB', pt: 'pt-PT', es: 'es-ES', de: 'de-DE',
    nl: 'nl-NL', fr: 'fr-FR', sv: 'sv-SE', da: 'da-DK',
  }
  return new Date().toLocaleDateString(localeMap[locale] ?? 'en-GB', {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function TypewriterGreeting({
  name,
  locale,
  className,
}: {
  name: string
  locale: string
  className?: string
}) {
  const fullText = `${getGreeting(locale)}, ${name}`
  const [displayed, setDisplayed] = useState("")
  const idx = useRef(0)

  useEffect(() => {
    idx.current = 0
    setDisplayed("")

    const timer = setInterval(() => {
      idx.current++
      setDisplayed(fullText.slice(0, idx.current))
      if (idx.current >= fullText.length) clearInterval(timer)
    }, 35)

    return () => clearInterval(timer)
  }, [fullText])

  return <span className={className}>{displayed}<span className="animate-pulse">|</span></span>
}

/**
 * Dashboard greeting — uses the user's locale for language.
 *
 * Props:
 *  - nameOverride: force a specific name (otherwise reads from session)
 *  - headingClass / dateClass: optional styling
 */
export function DashboardGreeting({
  nameOverride,
  headingClass = "text-2xl sm:text-3xl font-bold text-hm-black",
  dateClass = "text-sm text-gray-500 mt-1",
}: {
  nameOverride?: string
  headingClass?: string
  dateClass?: string
}) {
  const { locale } = useLocale()
  const [name, setName] = useState(nameOverride ?? "")
  const [loaded, setLoaded] = useState(!!nameOverride)

  useEffect(() => {
    if (nameOverride) return
    fetch("/api/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        // Prefer given name, fall back to full name, then email prefix
        const first = data?.name?.split(" ")[0]
        const fallback = data?.email?.split("@")[0]
        setName(first || fallback || "")
        setLoaded(true)
      })
      .catch(() => setLoaded(true))
  }, [nameOverride])

  // Render skeleton during load; then show with whatever name we have
  // (never return null — greeting must always show)
  if (!loaded) {
    return (
      <div>
        <div className="h-8 w-64 rounded bg-gray-100 animate-pulse" />
        <div className="h-4 w-48 rounded bg-gray-100 animate-pulse mt-2" />
      </div>
    )
  }

  const displayName = name || NAMELESS_FALLBACK[locale] || NAMELESS_FALLBACK.en

  return (
    <div>
      <h1 className={headingClass}>
        <TypewriterGreeting name={displayName} locale={locale} />
      </h1>
      <p className={dateClass}>{formatToday(locale)}</p>
    </div>
  )
}
