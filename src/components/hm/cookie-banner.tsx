"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

const COOKIE_NAME = "hm_cookie_consent"

export function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = document.cookie.split("; ").find(r => r.startsWith(`${COOKIE_NAME}=`))
    if (!consent) setShow(true)
  }, [])

  const accept = (level: "essential" | "all") => {
    document.cookie = `${COOKIE_NAME}=${level}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`
    setShow(false)

    if (level === "all" && typeof window !== "undefined") {
      // Enable GA if configured
      const gaId = process.env.NEXT_PUBLIC_GA_ID
      if (gaId && typeof (window as any).gtag === "function") {
        (window as any).gtag("consent", "update", {
          analytics_storage: "granted",
        })
      }
    }
  }

  if (!show) return null

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6">
      <div
        className="max-w-2xl mx-auto rounded-2xl border shadow-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        style={{ background: "#0B1E3A", borderColor: "rgba(176,138,62,0.2)" }}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm text-white/90 font-medium mb-1">
            We use cookies to make HostMasters work
          </p>
          <p className="text-xs text-white/60 leading-relaxed">
            Essential cookies keep you logged in and remember your language.
            Analytics cookies (optional) help us improve the platform.{" "}
            <Link href="/privacy" className="underline text-white/70 hover:text-white">
              Privacy Policy
            </Link>
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => accept("essential")}
            className="rounded-lg border border-white/20 px-4 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 transition-colors"
          >
            Essential only
          </button>
          <button
            onClick={() => accept("all")}
            className="rounded-lg px-4 py-2 text-xs font-bold transition-opacity hover:opacity-90"
            style={{ background: "#B08A3E", color: "#0B1E3A" }}
          >
            Accept all
          </button>
        </div>
      </div>
    </div>
  )
}
