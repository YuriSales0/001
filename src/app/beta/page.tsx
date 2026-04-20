"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  CheckCircle2,
  ArrowRight,
  Shield,
  Brain,
  BarChart3,
  Users,
  Lock,
  MessageCircle,
  Award,
  Calendar,
} from "lucide-react"
import { useLocale } from "@/i18n/provider"
import { HmLogo } from "@/components/hm/hm-logo"
import { LanguageSelector } from "@/components/hm/language-selector"

const TOTAL_SPOTS = 10

const LOCATIONS = [
  "locationAlmunecar",
  "locationHerradura",
  "locationSalobrena",
  "locationMotril",
  "locationOther",
] as const

export default function BetaPage() {
  const { t } = useLocale()
  const [spotsTaken, setSpotsTaken] = useState(0)
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
    properties: "",
    partnerCode: "",
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")

  /* Fetch taken spots count */
  useEffect(() => {
    fetch("/api/leads/public?source=BETA")
      .then((r) => {
        if (r.ok) return r.json()
        return null
      })
      .then((data) => {
        if (data && typeof data.count === "number") {
          setSpotsTaken(Math.min(data.count, TOTAL_SPOTS))
        }
      })
      .catch(() => {
        // Silent — default to 0
      })
  }, [])

  const spotsRemaining = TOTAL_SPOTS - spotsTaken

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      setError(t("landing.beta.required"))
      return
    }

    setSubmitting(true)
    try {
      const notes = [
        form.location ? `Location: ${form.location}` : "",
        form.properties ? `Properties: ${form.properties}` : "",
        form.partnerCode ? `Partner code: ${form.partnerCode}` : "",
      ]
        .filter(Boolean)
        .join(" | ")

      const res = await fetch("/api/leads/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          source: "BETA",
          notes: notes || null,
          partnerCode: form.partnerCode?.trim() || undefined,
        }),
      })

      if (!res.ok) throw new Error("Failed")
      setSubmitted(true)
    } catch {
      setError(t("common.error"))
    } finally {
      setSubmitting(false)
    }
  }

  const benefitIcons = [Calendar, Lock, MessageCircle, Award]

  return (
    <div className="min-h-screen font-sans" style={{ background: "#071328" }}>
      {/* ───────── Header ───────── */}
      <header
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{
          background: "rgba(7,19,40,0.92)",
          borderColor: "rgba(176,138,62,0.15)",
        }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <HmLogo size={36} onDark />
            <span
              className="text-lg font-semibold tracking-tight"
              style={{ color: "#F6F2EA" }}
            >
              Host<span style={{ color: "#B08A3E" }}>Masters</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Link
              href="/"
              className="text-sm transition-colors hidden sm:block"
              style={{ color: "rgba(246,242,234,0.6)" }}
            >
              {t("landing.nav.enter")}
            </Link>
          </div>
        </div>
      </header>

      {/* ───────── Hero Section ───────── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, #071328 0%, #0B1E3A 50%, #071328 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(176,138,62,0.12) 0%, transparent 70%)",
          }}
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full px-5 py-2 mb-8"
                 style={{
                   background: "rgba(176,138,62,0.1)",
                   border: "1px solid rgba(176,138,62,0.25)",
                 }}>
              <span
                className="inline-block h-2 w-2 rounded-full animate-pulse"
                style={{ background: "#B08A3E" }}
              />
              <span
                className="text-xs sm:text-sm font-semibold uppercase tracking-widest"
                style={{ color: "#B08A3E" }}
              >
                {t("landing.beta.badge")}
              </span>
            </div>

            {/* Headline */}
            <h1
              className="text-3xl sm:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-[-0.025em]"
              style={{ color: "#F6F2EA" }}
            >
              {t("landing.beta.heroTitle1")}{" "}
              <span style={{ color: "#B08A3E" }}>
                {t("landing.beta.heroTitleGold")}
              </span>
            </h1>

            {/* Subtitle */}
            <p
              className="mt-6 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
              style={{ color: "rgba(246,242,234,0.6)" }}
            >
              {t("landing.beta.heroSubtitle")}
            </p>

            {/* Benefits */}
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {[1, 2, 3, 4].map((i) => {
                const Icon = benefitIcons[i - 1]
                return (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl px-5 py-4 text-left"
                    style={{
                      background: "rgba(176,138,62,0.06)",
                      border: "1px solid rgba(176,138,62,0.12)",
                    }}
                  >
                    <Icon
                      className="h-5 w-5 shrink-0"
                      style={{ color: "#B08A3E" }}
                    />
                    <span
                      className="text-sm font-medium"
                      style={{ color: "#F6F2EA" }}
                    >
                      {t(`landing.beta.benefit${i}`)}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Arrow to form */}
            <div className="mt-12">
              <a
                href="#beta-form"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-lg text-base font-bold transition-all hover:brightness-110"
                style={{ background: "#B08A3E", color: "#071328" }}
              >
                {t("landing.beta.submitBtn")}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Spots Remaining ───────── */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2
            className="text-2xl sm:text-3xl font-semibold mb-3"
            style={{ color: "#F6F2EA" }}
          >
            {spotsRemaining} {t("landing.beta.spotsOf")}
          </h2>

          {/* Spot circles */}
          <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
            {Array.from({ length: TOTAL_SPOTS }, (_, i) => {
              const taken = i < spotsTaken
              return (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div
                    className="h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-all"
                    style={{
                      background: taken
                        ? "rgba(176,138,62,0.2)"
                        : "rgba(176,138,62,0.06)",
                      border: taken
                        ? "2px solid #B08A3E"
                        : "2px solid rgba(176,138,62,0.2)",
                    }}
                  >
                    {taken ? (
                      <CheckCircle2
                        className="h-5 w-5"
                        style={{ color: "#B08A3E" }}
                      />
                    ) : (
                      <span
                        className="text-xs font-bold"
                        style={{ color: "rgba(176,138,62,0.4)" }}
                      >
                        {i + 1}
                      </span>
                    )}
                  </div>
                  <span
                    className="text-[10px] font-medium hidden sm:block"
                    style={{
                      color: taken
                        ? "#B08A3E"
                        : "rgba(246,242,234,0.3)",
                    }}
                  >
                    {taken
                      ? t("landing.beta.spotTaken")
                      : t("landing.beta.spotAvailable")}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ───────── Beta Signup Form ───────── */}
      <section id="beta-form" className="py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(11,30,58,0.8)",
              border: "1px solid rgba(176,138,62,0.2)",
            }}
          >
            {/* Form header */}
            <div
              className="px-6 sm:px-10 py-6 border-b"
              style={{ borderColor: "rgba(176,138,62,0.15)" }}
            >
              <h3
                className="text-xl sm:text-2xl font-bold"
                style={{ color: "#F6F2EA" }}
              >
                {t("landing.beta.formTitle")}
              </h3>
            </div>

            {/* Form body */}
            <div className="px-6 sm:px-10 py-8">
              {submitted ? (
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <div
                    className="h-16 w-16 rounded-full flex items-center justify-center mb-6"
                    style={{ background: "rgba(42,122,79,0.15)" }}
                  >
                    <CheckCircle2
                      className="h-8 w-8"
                      style={{ color: "#2A7A4F" }}
                    />
                  </div>
                  <h3
                    className="text-2xl font-bold mb-3"
                    style={{ color: "#F6F2EA" }}
                  >
                    {t("landing.beta.thankYouTitle")}
                  </h3>
                  <p style={{ color: "rgba(246,242,234,0.6)" }}>
                    {t("landing.beta.thankYouDesc")}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name & Email */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="beta-name"
                        className="block text-sm font-semibold mb-1.5"
                        style={{ color: "#F6F2EA" }}
                      >
                        {t("landing.beta.nameLabel")} *
                      </label>
                      <input
                        id="beta-name"
                        name="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder={t("landing.beta.namePlaceholder")}
                        className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2"
                        style={{
                          borderColor: "rgba(176,138,62,0.25)",
                          background: "rgba(7,19,40,0.6)",
                          color: "#F6F2EA",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="beta-email"
                        className="block text-sm font-semibold mb-1.5"
                        style={{ color: "#F6F2EA" }}
                      >
                        {t("landing.beta.emailLabel")} *
                      </label>
                      <input
                        id="beta-email"
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder={t("landing.beta.emailPlaceholder")}
                        className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2"
                        style={{
                          borderColor: "rgba(176,138,62,0.25)",
                          background: "rgba(7,19,40,0.6)",
                          color: "#F6F2EA",
                        }}
                      />
                    </div>
                  </div>

                  {/* Phone & Location */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="beta-phone"
                        className="block text-sm font-semibold mb-1.5"
                        style={{ color: "#F6F2EA" }}
                      >
                        {t("landing.beta.phoneLabel")} *
                      </label>
                      <input
                        id="beta-phone"
                        name="phone"
                        type="tel"
                        required
                        value={form.phone}
                        onChange={handleChange}
                        placeholder={t("landing.beta.phonePlaceholder")}
                        className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2"
                        style={{
                          borderColor: "rgba(176,138,62,0.25)",
                          background: "rgba(7,19,40,0.6)",
                          color: "#F6F2EA",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="beta-location"
                        className="block text-sm font-semibold mb-1.5"
                        style={{ color: "#F6F2EA" }}
                      >
                        {t("landing.beta.locationLabel")}
                      </label>
                      <select
                        id="beta-location"
                        name="location"
                        value={form.location}
                        onChange={handleChange}
                        className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2"
                        style={{
                          borderColor: "rgba(176,138,62,0.25)",
                          background: "rgba(7,19,40,0.6)",
                          color: form.location
                            ? "#F6F2EA"
                            : "rgba(246,242,234,0.4)",
                        }}
                      >
                        <option value="">
                          {t("landing.beta.locationPlaceholder")}
                        </option>
                        {LOCATIONS.map((loc) => (
                          <option key={loc} value={t(`landing.beta.${loc}`)}>
                            {t(`landing.beta.${loc}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Properties & Partner code */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="beta-properties"
                        className="block text-sm font-semibold mb-1.5"
                        style={{ color: "#F6F2EA" }}
                      >
                        {t("landing.beta.propertiesLabel")}
                      </label>
                      <input
                        id="beta-properties"
                        name="properties"
                        type="text"
                        value={form.properties}
                        onChange={handleChange}
                        placeholder={t("landing.beta.propertiesPlaceholder")}
                        className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2"
                        style={{
                          borderColor: "rgba(176,138,62,0.25)",
                          background: "rgba(7,19,40,0.6)",
                          color: "#F6F2EA",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="beta-partnerCode"
                        className="block text-sm font-semibold mb-1.5"
                        style={{ color: "#F6F2EA" }}
                      >
                        {t("landing.beta.partnerCodeLabel")}
                      </label>
                      <input
                        id="beta-partnerCode"
                        name="partnerCode"
                        type="text"
                        value={form.partnerCode}
                        onChange={handleChange}
                        placeholder={t(
                          "landing.beta.partnerCodePlaceholder",
                        )}
                        className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2"
                        style={{
                          borderColor: "rgba(176,138,62,0.25)",
                          background: "rgba(7,19,40,0.6)",
                          color: "#F6F2EA",
                        }}
                      />
                    </div>
                  </div>

                  {/* Error */}
                  {error && (
                    <p
                      className="text-sm font-medium"
                      style={{ color: "#E5544B" }}
                    >
                      {error}
                    </p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 px-7 py-4 rounded-lg text-base font-bold transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: "#B08A3E", color: "#071328" }}
                  >
                    {submitting
                      ? t("landing.beta.submitting")
                      : t("landing.beta.submitBtn")}
                    {!submitting && <ArrowRight className="h-4 w-4" />}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── What You Get ───────── */}
      <section className="py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2
              className="text-2xl sm:text-3xl font-semibold tracking-tight"
              style={{ color: "#F6F2EA" }}
            >
              {t("landing.beta.whatYouGetTitle")}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: BarChart3, num: 1 },
              { icon: Brain, num: 2 },
              { icon: Users, num: 3 },
            ].map(({ icon: Icon, num }) => (
              <div
                key={num}
                className="rounded-2xl p-8 transition-all hover:scale-[1.02]"
                style={{
                  background: "rgba(11,30,58,0.6)",
                  border: "1px solid rgba(176,138,62,0.15)",
                }}
              >
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: "rgba(176,138,62,0.12)" }}
                >
                  <Icon className="h-6 w-6" style={{ color: "#B08A3E" }} />
                </div>
                <h3
                  className="text-xl font-bold mb-3"
                  style={{ color: "#F6F2EA" }}
                >
                  {t(`landing.beta.card${num}Title`)}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: "rgba(246,242,234,0.6)" }}
                >
                  {t(`landing.beta.card${num}Desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer
        className="border-t py-10"
        style={{ borderColor: "rgba(176,138,62,0.1)" }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <HmLogo size={24} onDark />
            <span
              className="text-sm font-semibold tracking-tight"
              style={{ color: "#F6F2EA" }}
            >
              Host<span style={{ color: "#B08A3E" }}>Masters</span>
            </span>
            <span
              className="text-xs ml-1"
              style={{ color: "rgba(246,242,234,0.4)" }}
            >
              Costa Tropical
            </span>
          </div>
          <p
            className="text-xs text-center sm:text-right"
            style={{ color: "rgba(246,242,234,0.4)" }}
          >
            {t("landing.beta.footerContact")}
          </p>
        </div>
      </footer>
    </div>
  )
}
