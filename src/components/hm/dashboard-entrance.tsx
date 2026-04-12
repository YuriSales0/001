"use client"

import { useEffect, useState, useRef } from "react"

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Bom dia"
  if (h < 18) return "Boa tarde"
  return "Boa noite"
}

function formatToday(): string {
  return new Date().toLocaleDateString("pt-PT", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

/** Typewriter greeting: "Bom dia, [nome]" */
function TypewriterGreeting({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const fullText = `${getGreeting()}, ${name}`
  const [displayed, setDisplayed] = useState("")
  const idx = useRef(0)

  useEffect(() => {
    idx.current = 0
    setDisplayed("")

    const timer = setInterval(() => {
      idx.current++
      setDisplayed(fullText.slice(0, idx.current))
      if (idx.current >= fullText.length) clearInterval(timer)
    }, 38)

    return () => clearInterval(timer)
  }, [fullText])

  return (
    <h1 className={className}>
      {displayed}
      <span className="animate-pulse text-hm-gold">|</span>
    </h1>
  )
}

/**
 * Fetches the current user's first name from the NextAuth session endpoint.
 */
function useFirstName(): string | null {
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const full: string | undefined = data?.user?.name
        if (full) setName(full.split(" ")[0])
      })
      .catch(() => {})
  }, [])

  return name
}

/**
 * Dashboard entrance header — typewriter greeting + date.
 * Drop this at the top of any portal dashboard.
 */
export function DashboardGreeting({
  headingClass = "text-2xl font-bold text-navy-900",
  dateClass = "text-sm text-gray-500 mt-0.5",
  fallback = "there",
}: {
  headingClass?: string
  dateClass?: string
  fallback?: string
}) {
  const firstName = useFirstName()

  return (
    <div className="hm-animate-in hm-stagger-1">
      <TypewriterGreeting
        name={firstName ?? fallback}
        className={headingClass}
      />
      <p className={dateClass}>{formatToday()}</p>
    </div>
  )
}
