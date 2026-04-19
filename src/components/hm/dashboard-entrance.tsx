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
  headingClass = "text-2xl sm:text-3xl font-bold text-navy-900",
  dateClass = "text-sm text-gray-500 mt-1",
}: {
  nameOverride?: string
  headingClass?: string
  dateClass?: string
}) {
  const { locale } = useLocale()
  const [name, setName] = useState(nameOverride ?? "")

  useEffect(() => {
    if (nameOverride) return
    fetch("/api/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const n = data?.name?.split(" ")[0]
        if (n) setName(n)
      })
      .catch(() => {})
  }, [nameOverride])

  if (!name) return null

  return (
    <div>
      <h1 className={headingClass}>
        <TypewriterGreeting name={name} locale={locale} />
      </h1>
      <p className={dateClass}>{formatToday(locale)}</p>
    </div>
  )
}
