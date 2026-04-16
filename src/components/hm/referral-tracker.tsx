"use client"

import { useEffect } from "react"

/**
 * Persists ?ref=<code> from the URL into a cookie so the register page
 * can attribute the new user to the referring Manager.
 *
 * Mount on the landing page (or globally). The cookie lives for 30 days.
 */
export function ReferralTracker() {
  useEffect(() => {
    if (typeof window === "undefined") return
    const url = new URL(window.location.href)
    const ref = url.searchParams.get("ref")
    if (!ref) return

    const clean = ref.trim().toLowerCase().slice(0, 60)
    if (!clean) return

    // 30-day cookie
    document.cookie = `hm_ref=${encodeURIComponent(clean)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
  }, [])

  return null
}
