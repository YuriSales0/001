"use client"

import { useState, useEffect, useCallback, type ReactNode } from "react"
import { ArrowRight, ArrowLeft, X, CheckCircle2 } from "lucide-react"
import { useLocale } from "@/i18n/provider"

export type TourStep = {
  /** Unique key for i18n: tour.{role}.steps.{key} */
  key: string
  /** 'spotlight' highlights a real element, 'fullscreen' shows a full card, 'form' shows custom content */
  type: "spotlight" | "fullscreen" | "form"
  /** CSS selector to highlight (only for spotlight type) */
  target?: string
  /** Tooltip position relative to target */
  position?: "top" | "bottom" | "left" | "right"
  /** Icon component */
  icon?: React.ElementType
  /** Custom render for form steps */
  render?: (props: { onNext: () => void }) => ReactNode
}

type TourOverlayProps = {
  steps: TourStep[]
  role: string
  onComplete: () => void
  /** Called on each step advance with step index */
  onStep?: (index: number) => void
}

export function TourOverlay({ steps, role, onComplete, onStep }: TourOverlayProps) {
  const { t } = useLocale()
  const [current, setCurrent] = useState(0)
  const [visible, setVisible] = useState(true)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [animating, setAnimating] = useState(true)

  const step = steps[current]
  const isLast = current === steps.length - 1
  const progress = ((current + 1) / steps.length) * 100

  // Find target element for spotlight steps
  useEffect(() => {
    if (step?.type === "spotlight" && step.target) {
      const el = document.querySelector(step.target)
      if (el) {
        const rect = el.getBoundingClientRect()
        setTargetRect(rect)
        // Scroll into view if needed
        el.scrollIntoView({ behavior: "smooth", block: "center" })
      } else {
        setTargetRect(null)
      }
    } else {
      setTargetRect(null)
    }
  }, [step])

  // Entrance animation
  useEffect(() => {
    setAnimating(true)
    const timer = setTimeout(() => setAnimating(false), 300)
    return () => clearTimeout(timer)
  }, [current])

  const goNext = useCallback(() => {
    if (isLast) {
      setVisible(false)
      setTimeout(onComplete, 300)
      return
    }
    setCurrent(c => c + 1)
    onStep?.(current + 1)
  }, [isLast, current, onComplete, onStep])

  const goBack = useCallback(() => {
    if (current > 0) setCurrent(c => c - 1)
  }, [current])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") goNext()
      if (e.key === "ArrowLeft") goBack()
      if (e.key === "Escape") {
        setVisible(false)
        setTimeout(onComplete, 300)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [goNext, goBack, onComplete])

  if (!visible || !step) return null

  const title = t(`tour.${role}.steps.${step.key}.title`)
  const desc = t(`tour.${role}.steps.${step.key}.desc`)

  // Form step — render custom content
  if (step.type === "form" && step.render) {
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center transition-opacity duration-300"
        style={{ opacity: animating ? 0 : 1, background: "rgba(17,24,39,0.92)" }}
      >
        <div className="w-full max-w-lg mx-4">
          {/* Progress */}
          <div className="mb-4 flex items-center gap-3">
            <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "#B08A3E" }} />
            </div>
            <span className="text-xs text-white/40">{current + 1}/{steps.length}</span>
          </div>
          {step.render({ onNext: goNext })}
        </div>
      </div>
    )
  }

  // Fullscreen card step
  if (step.type === "fullscreen") {
    const Icon = step.icon
    return (
      <div
        className="fixed inset-0 z-[60] flex items-center justify-center transition-opacity duration-300"
        style={{ opacity: animating ? 0 : 1, background: "rgba(17,24,39,0.92)" }}
      >
        <div className="w-full max-w-xl mx-4">
          {/* Progress */}
          <div className="mb-6 flex items-center gap-3">
            <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "#B08A3E" }} />
            </div>
            <span className="text-xs text-white/40">{current + 1}/{steps.length}</span>
          </div>

          {/* Card */}
          <div
            className="rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300"
            style={{ transform: animating ? "translateY(20px)" : "translateY(0)" }}
          >
            <div className="p-8 sm:p-10 text-center" style={{ background: "#0B1E3A" }}>
              {Icon && (
                <div className="h-16 w-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
                     style={{ background: "rgba(176,138,62,0.15)" }}>
                  <Icon className="h-8 w-8" style={{ color: "#B08A3E" }} />
                </div>
              )}
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{title}</h2>
              <p className="text-gray-400 leading-relaxed max-w-md mx-auto">{desc}</p>

              {/* Feature list if available */}
              {[0, 1, 2, 3, 4].map(i => {
                const feat = t(`tour.${role}.steps.${step.key}.features.${i}`)
                if (feat === `tour.${role}.steps.${step.key}.features.${i}`) return null
                return (
                  <div key={i} className="flex items-center gap-2 text-sm text-gray-300 mt-3 justify-center">
                    <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#B08A3E" }} />
                    {feat}
                  </div>
                )
              })}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between px-8 py-5" style={{ background: "#071328" }}>
              {current > 0 ? (
                <button onClick={goBack} className="flex items-center gap-1.5 text-sm text-white/50 hover:text-white transition-colors">
                  <ArrowLeft className="h-4 w-4" /> {t('tour.back')}
                </button>
              ) : (
                <button onClick={() => { setVisible(false); setTimeout(onComplete, 300) }}
                  className="flex items-center gap-1 text-sm text-white/30 hover:text-white/50 transition-colors">
                  <X className="h-3.5 w-3.5" /> {t('tour.skip')}
                </button>
              )}
              <button
                onClick={goNext}
                className="flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02]"
                style={{ background: "#B08A3E", color: "#0B1E3A" }}
              >
                {isLast ? t('tour.finish') : t('tour.next')}
                {!isLast && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Spotlight step (highlight real element)
  const padding = 8
  const spotStyle = targetRect ? {
    top: targetRect.top - padding + window.scrollY,
    left: targetRect.left - padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
  } : null

  return (
    <div className="fixed inset-0 z-[60] transition-opacity duration-300" style={{ opacity: animating ? 0 : 1 }}>
      {/* Dark overlay with hole */}
      <svg className="absolute inset-0 w-full h-full" style={{ pointerEvents: "none" }}>
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {spotStyle && (
              <rect
                x={spotStyle.left} y={spotStyle.top}
                width={spotStyle.width} height={spotStyle.height}
                rx="12" fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(17,24,39,0.85)" mask="url(#tour-mask)" />
      </svg>

      {/* Spotlight border */}
      {spotStyle && (
        <div
          className="absolute rounded-xl border-2 pointer-events-none transition-all duration-500"
          style={{ ...spotStyle, borderColor: "#B08A3E", boxShadow: "0 0 0 4px rgba(176,138,62,0.15)" }}
        />
      )}

      {/* Tooltip */}
      <div
        className="absolute z-10 w-80 transition-all duration-300"
        style={{
          top: spotStyle ? spotStyle.top + spotStyle.height + 16 : "50%",
          left: spotStyle ? Math.min(spotStyle.left, window.innerWidth - 340) : "50%",
          transform: !spotStyle ? "translate(-50%, -50%)" : animating ? "translateY(10px)" : "translateY(0)",
        }}
      >
        <div className="rounded-xl shadow-2xl overflow-hidden" style={{ background: "#0B1E3A", border: "1px solid rgba(176,138,62,0.2)" }}>
          {/* Progress */}
          <div className="px-5 pt-4 flex items-center gap-3">
            <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: "#B08A3E" }} />
            </div>
            <span className="text-[10px] text-white/40">{current + 1}/{steps.length}</span>
          </div>

          <div className="p-5">
            <h3 className="text-base font-bold text-white mb-1.5">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
          </div>

          <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {current > 0 ? (
              <button onClick={goBack} className="text-xs text-white/40 hover:text-white transition-colors">
                <ArrowLeft className="h-3.5 w-3.5 inline mr-1" />{t('tour.back')}
              </button>
            ) : (
              <button onClick={() => { setVisible(false); setTimeout(onComplete, 300) }}
                className="text-xs text-white/30 hover:text-white/50 transition-colors">
                {t('tour.skip')}
              </button>
            )}
            <button
              onClick={goNext}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all hover:scale-[1.02]"
              style={{ background: "#B08A3E", color: "#0B1E3A" }}
            >
              {isLast ? t('tour.finish') : t('tour.next')}
              {!isLast && <ArrowRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
