"use client"

import { useLocale } from "@/i18n/provider"
import { TourOverlay, type TourStep } from "./tour-overlay"
import {
  Sparkles, Home, TrendingUp, CalendarDays, Wrench,
  MessageCircle, Star, FileText, Shield,
  CheckCircle2,
} from "lucide-react"

/**
 * Client onboarding tour — full interactive walkthrough of the platform.
 * Uses fullscreen cards for feature explanations + form steps for profile setup.
 */

const CLIENT_STEPS: TourStep[] = [
  // 1. Welcome
  { key: "welcome", type: "fullscreen", icon: Sparkles },
  // 2. Dashboard overview
  { key: "dashboard", type: "fullscreen", icon: Home },
  // 3. Earnings & finance
  { key: "earnings", type: "fullscreen", icon: TrendingUp },
  // 4. Bookings & calendar
  { key: "bookings", type: "fullscreen", icon: CalendarDays },
  // 5. Care & maintenance
  { key: "care", type: "fullscreen", icon: Wrench },
  // 6. Communication
  { key: "communication", type: "fullscreen", icon: MessageCircle },
  // 7. AI tools
  { key: "ai", type: "fullscreen", icon: Star },
  // 8. Reports & documents
  { key: "reports", type: "fullscreen", icon: FileText },
  // 9. Plan & subscription
  { key: "plan", type: "fullscreen", icon: Shield },
  // 10. Done
  { key: "done", type: "fullscreen", icon: CheckCircle2 },
]

type ClientTourProps = {
  onComplete: () => void
}

export function ClientTour({ onComplete }: ClientTourProps) {
  const handleComplete = async () => {
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "complete", data: {}, complete: true }),
      })
    } catch {}
    onComplete()
  }

  return (
    <TourOverlay
      steps={CLIENT_STEPS}
      role="CLIENT"
      onComplete={handleComplete}
    />
  )
}
