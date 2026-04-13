"use client"

import { useState } from "react"
import { useLocale } from "@/i18n/provider"
import { TourOverlay, type TourStep } from "./tour-overlay"
import {
  Sparkles, Home, TrendingUp, CalendarDays, Wrench,
  MessageCircle, Star, FileText, Shield, User,
  ArrowRight, CheckCircle2,
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
  // 10. Profile setup form
  { key: "profile", type: "form", render: undefined }, // render set below
  // 11. Done
  { key: "done", type: "fullscreen", icon: CheckCircle2 },
]

type ClientTourProps = {
  onComplete: () => void
}

export function ClientTour({ onComplete }: ClientTourProps) {
  const { t } = useLocale()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [language, setLanguage] = useState("en")
  const [saving, setSaving] = useState(false)

  const saveProfile = async (onNext: () => void) => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "profile", data: { name, phone, language } }),
      })
    } catch {}
    setSaving(false)
    onNext()
  }

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

  // Inject the profile form render
  const steps: TourStep[] = CLIENT_STEPS.map(step => {
    if (step.key === "profile") {
      return {
        ...step,
        render: ({ onNext }: { onNext: () => void }) => (
          <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: "#111827" }}>
            <div className="p-8 sm:p-10">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
                   style={{ background: "rgba(201,168,76,0.15)" }}>
                <User className="h-7 w-7" style={{ color: "#C9A84C" }} />
              </div>
              <h2 className="text-2xl font-bold text-white text-center mb-2">
                {t("tour.CLIENT.steps.profile.title")}
              </h2>
              <p className="text-gray-400 text-center text-sm mb-8">
                {t("tour.CLIENT.steps.profile.desc")}
              </p>

              <div className="space-y-4 max-w-sm mx-auto">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                    {t("tour.CLIENT.steps.profile.nameLabel")}
                  </label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full rounded-lg border px-4 py-3 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#C9A84C] transition-colors"
                    placeholder={t("tour.CLIENT.steps.profile.namePlaceholder")}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                    {t("tour.CLIENT.steps.profile.phoneLabel")}
                  </label>
                  <input
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full rounded-lg border px-4 py-3 text-sm bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-[#C9A84C] transition-colors"
                    placeholder="+34 600 000 000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                    {t("tour.CLIENT.steps.profile.langLabel")}
                  </label>
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    className="w-full rounded-lg border px-4 py-3 text-sm bg-white/5 border-white/10 text-white focus:outline-none focus:border-[#C9A84C] transition-colors"
                  >
                    <option value="en" className="bg-gray-900">English</option>
                    <option value="pt" className="bg-gray-900">Portugues</option>
                    <option value="es" className="bg-gray-900">Espanol</option>
                    <option value="de" className="bg-gray-900">Deutsch</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center px-8 py-5" style={{ background: "#0d1420" }}>
              <button
                onClick={() => saveProfile(onNext)}
                disabled={saving || !name.trim()}
                className="flex items-center gap-2 rounded-lg px-8 py-3 text-sm font-semibold transition-all hover:scale-[1.02] disabled:opacity-50"
                style={{ background: "#C9A84C", color: "#111827" }}
              >
                {saving ? t("tour.saving") : t("tour.next")}
                {!saving && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ),
      }
    }
    return step
  })

  return (
    <TourOverlay
      steps={steps}
      role="CLIENT"
      onComplete={handleComplete}
    />
  )
}
