"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useLocale } from "@/i18n/provider"
import {
  Sparkles, Home, TrendingUp, CalendarDays, Wrench,
  MessageCircle, Star, FileText, Shield, CheckCircle2,
  ArrowRight, ArrowLeft, X,
} from "lucide-react"

type TourStepDef = {
  key: string
  icon: React.ElementType
  /** Page to navigate to before showing this step */
  page: string
  /** CSS selector to spotlight (null = fullscreen intro) */
  target: string | null
  /** Tooltip position */
  position: "top" | "bottom" | "left" | "right" | "center"
}

const STEPS: TourStepDef[] = [
  // Welcome — fullscreen on dashboard
  { key: "welcome", icon: Sparkles, page: "/client/dashboard", target: null, position: "center" },
  // Sidebar nav
  { key: "sidebar", icon: Home, page: "/client/dashboard", target: "[data-tour='sidebar-nav']", position: "right" },
  // Dashboard earnings
  { key: "dashboard", icon: TrendingUp, page: "/client/dashboard", target: "[data-tour='earnings-hero']", position: "bottom" },
  // Next guest
  { key: "guest", icon: CalendarDays, page: "/client/dashboard", target: "[data-tour='next-guest']", position: "bottom" },
  // Property condition
  { key: "condition", icon: Shield, page: "/client/dashboard", target: "[data-tour='property-condition']", position: "bottom" },
  // Care section
  { key: "care", icon: Wrench, page: "/client/dashboard", target: "[data-tour='care-section']", position: "top" },
  // Quick actions
  { key: "actions", icon: Star, page: "/client/dashboard", target: "[data-tour='quick-actions']", position: "top" },
  // Earnings page
  { key: "earnings", icon: TrendingUp, page: "/client/financials", target: null, position: "center" },
  // Bookings page
  { key: "bookings", icon: CalendarDays, page: "/client/bookings", target: null, position: "center" },
  // AI tools
  { key: "ai", icon: Star, page: "/client/dashboard", target: null, position: "center" },
  // Communication
  { key: "communication", icon: MessageCircle, page: "/client/messages", target: null, position: "center" },
  // Plan
  { key: "plan", icon: Shield, page: "/client/plan", target: null, position: "center" },
  // Done
  { key: "done", icon: CheckCircle2, page: "/client/dashboard", target: null, position: "center" },
]

type ClientTourProps = {
  onComplete: () => void
}

export function ClientTour({ onComplete }: ClientTourProps) {
  const { t } = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(true)
  const [animating, setAnimating] = useState(true)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  const step = STEPS[current]
  const isLast = current === STEPS.length - 1
  const progress = ((current + 1) / STEPS.length) * 100

  // Navigate to step's page if needed
  useEffect(() => {
    if (step && pathname !== step.page) {
      router.push(step.page)
    }
  }, [step, pathname, router])

  // Find and highlight target element
  useEffect(() => {
    if (!step?.target) {
      setTargetRect(null)
      return
    }

    const findTarget = () => {
      const el = document.querySelector(step.target!)
      if (el) {
        const rect = el.getBoundingClientRect()
        setTargetRect(rect)
        el.scrollIntoView({ behavior: "smooth", block: "center" })
        return true
      }
      return false
    }

    // Try immediately, then retry (elements may not be rendered yet)
    if (!findTarget()) {
      const interval = setInterval(() => {
        if (findTarget()) clearInterval(interval)
      }, 200)
      const timeout = setTimeout(() => clearInterval(interval), 3000)
      return () => { clearInterval(interval); clearTimeout(timeout) }
    }
  }, [step, pathname])

  // Animate on step change
  useEffect(() => {
    setAnimating(true)
    const timer = setTimeout(() => setAnimating(false), 350)
    return () => clearTimeout(timer)
  }, [current])

  const goNext = useCallback(() => {
    if (isLast) {
      setVisible(false)
      fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "complete", data: {}, complete: true }),
      }).catch(() => {})
      setTimeout(onComplete, 300)
      return
    }
    setTargetRect(null)
    setCurrent(c => c + 1)
  }, [isLast, onComplete])

  const goBack = useCallback(() => {
    if (current > 0) {
      setTargetRect(null)
      setCurrent(c => c - 1)
    }
  }, [current])

  // Keyboard nav
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") goNext()
      if (e.key === "ArrowLeft") goBack()
      if (e.key === "Escape") {
        setVisible(false)
        fetch("/api/onboarding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ step: "complete", data: {}, complete: true }),
        }).catch(() => {})
        setTimeout(onComplete, 300)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [goNext, goBack, onComplete])

  if (!visible || !step) return null

  const title = t(`tour.CLIENT.steps.${step.key}.title`)
  const desc = t(`tour.CLIENT.steps.${step.key}.desc`)
  const Icon = step.icon
  const hasTarget = step.target && targetRect

  // ─── Spotlight mode (real element highlighted) ───
  if (hasTarget) {
    const pad = 10
    const spot = {
      top: targetRect!.top - pad + window.scrollY,
      left: targetRect!.left - pad,
      width: targetRect!.width + pad * 2,
      height: targetRect!.height + pad * 2,
    }

    // Tooltip positioning
    let tooltipStyle: React.CSSProperties = {}
    if (step.position === "bottom") {
      tooltipStyle = { top: spot.top + spot.height + 16, left: Math.max(16, Math.min(spot.left, window.innerWidth - 380)) }
    } else if (step.position === "top") {
      tooltipStyle = { top: spot.top - 16, left: Math.max(16, Math.min(spot.left, window.innerWidth - 380)), transform: "translateY(-100%)" }
    } else if (step.position === "right") {
      tooltipStyle = { top: spot.top, left: spot.left + spot.width + 16 }
    } else {
      tooltipStyle = { top: spot.top, left: spot.left - 380 }
    }

    return (
      <div className="fixed inset-0 z-[60] transition-opacity duration-300" style={{ opacity: animating ? 0 : 1 }}>
        {/* Overlay with cutout */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ position: "fixed" }}>
          <defs>
            <mask id="tour-spotlight">
              <rect width="100%" height="100%" fill="white" />
              <rect x={spot.left} y={spot.top - window.scrollY} width={spot.width} height={spot.height} rx="12" fill="black" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(17,24,39,0.75)" mask="url(#tour-spotlight)" />
        </svg>

        {/* Glow border around target */}
        <div
          className="fixed rounded-xl border-2 pointer-events-none transition-all duration-500"
          style={{
            top: spot.top - window.scrollY,
            left: spot.left,
            width: spot.width,
            height: spot.height,
            borderColor: "#C9A84C",
            boxShadow: "0 0 0 4px rgba(201,168,76,0.2), 0 0 24px rgba(201,168,76,0.15)",
          }}
        />

        {/* Tooltip */}
        <div className="absolute z-10 w-[360px]" style={tooltipStyle}>
          <div
            className="rounded-xl shadow-2xl overflow-hidden transition-transform duration-300"
            style={{
              background: "#111827",
              border: "1px solid rgba(201,168,76,0.25)",
              transform: animating ? "translateY(8px)" : "translateY(0)",
            }}
          >
            {/* Progress bar */}
            <div className="px-4 pt-3 flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "#C9A84C" }} />
              </div>
              <span className="text-[10px] text-white/40 shrink-0">{current + 1}/{STEPS.length}</span>
            </div>

            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,168,76,0.15)" }}>
                  <Icon className="h-3.5 w-3.5" style={{ color: "#C9A84C" }} />
                </div>
                <h3 className="text-sm font-bold text-white">{title}</h3>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{desc}</p>
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              {current > 0 ? (
                <button onClick={goBack} className="text-xs text-white/40 hover:text-white transition-colors">
                  <ArrowLeft className="h-3 w-3 inline mr-1" />{t("tour.back")}
                </button>
              ) : (
                <button
                  onClick={() => { setVisible(false); fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step: "complete", data: {}, complete: true }) }).catch(() => {}); setTimeout(onComplete, 300) }}
                  className="text-xs text-white/20 hover:text-white/40 transition-colors"
                ><X className="h-3 w-3 inline mr-0.5" />{t("tour.skip")}</button>
              )}
              <button
                onClick={goNext}
                className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all hover:scale-[1.02]"
                style={{ background: "#C9A84C", color: "#111827" }}
              >
                {isLast ? t("tour.finish") : t("tour.next")}
                {!isLast && <ArrowRight className="h-3 w-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Fullscreen mode (page intro or no target found) ───
  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center transition-opacity duration-300"
      style={{ opacity: animating ? 0 : 1, background: "rgba(17,24,39,0.88)" }}
    >
      <div className="w-full max-w-lg mx-4">
        {/* Progress */}
        <div className="mb-5 flex items-center gap-3">
          <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "#C9A84C" }} />
          </div>
          <span className="text-xs text-white/40">{current + 1}/{STEPS.length}</span>
        </div>

        <div
          className="rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300"
          style={{ transform: animating ? "translateY(16px)" : "translateY(0)" }}
        >
          <div className="p-8 sm:p-10 text-center" style={{ background: "#111827" }}>
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                 style={{ background: "rgba(201,168,76,0.15)" }}>
              <Icon className="h-8 w-8" style={{ color: "#C9A84C" }} />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{title}</h2>
            <p className="text-gray-400 leading-relaxed max-w-md mx-auto">{desc}</p>

            {/* Feature list */}
            {[0, 1, 2, 3, 4].map(i => {
              const feat = t(`tour.CLIENT.steps.${step.key}.features.${i}`)
              if (feat === `tour.CLIENT.steps.${step.key}.features.${i}`) return null
              return (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-300 mt-3 justify-center">
                  <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#C9A84C" }} />
                  {feat}
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between px-8 py-5" style={{ background: "#0d1420" }}>
            {current > 0 ? (
              <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors">
                <ArrowLeft className="h-4 w-4" /> {t("tour.back")}
              </button>
            ) : (
              <button
                onClick={() => { setVisible(false); fetch("/api/onboarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ step: "complete", data: {}, complete: true }) }).catch(() => {}); setTimeout(onComplete, 300) }}
                className="flex items-center gap-1 text-sm text-white/30 hover:text-white/50 transition-colors"
              ><X className="h-3.5 w-3.5" /> {t("tour.skip")}</button>
            )}
            <button
              onClick={goNext}
              className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02]"
              style={{ background: "#C9A84C", color: "#111827" }}
            >
              {isLast ? t("tour.finish") : t("tour.next")}
              {!isLast && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
