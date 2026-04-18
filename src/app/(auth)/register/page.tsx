"use client"
import { HmLogo } from "@/components/hm/hm-logo"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowRight, Globe } from "lucide-react"
import { useLocale } from "@/i18n/provider"
import { LOCALES, type Locale } from "@/i18n"

export default function RegisterPage() {
  const router = useRouter()
  const { t, locale, setLocale } = useLocale()
  const [form, setForm] = useState({ name: "", email: "", password: "", language: locale })
  const [ref, setRef] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Capture ?ref= from URL or cookie set by landing page
  useEffect(() => {
    if (typeof window === "undefined") return
    const urlRef = new URLSearchParams(window.location.search).get("ref")
    if (urlRef) {
      setRef(urlRef)
      // Persist so it survives locale toggles
      document.cookie = `hm_ref=${encodeURIComponent(urlRef)}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
      return
    }
    // Fallback: read from cookie
    const match = document.cookie.split("; ").find(r => r.startsWith("hm_ref="))
    if (match) setRef(decodeURIComponent(match.split("=")[1] ?? ""))
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) { setError(t("auth.nameRequired")); return }
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, ref }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || t("common.error"))
        return
      }
      // Set locale to selected language — cookie persists through redirect
      setLocale(form.language as Locale)
      router.push(`/login?registered=1&lang=${form.language}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0B1E3A" }}>
      {/* Background glow */}
      <div className="absolute inset-0 opacity-30"
           style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(201,168,76,0.12) 0%, transparent 70%)" }} />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/"><HmLogo size={40} variant="compact" onDark /></Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: "#142B4D", border: "1px solid rgba(201,168,76,0.15)" }}>
          <div className="p-8">
            <h1 className="text-2xl font-bold text-white text-center mb-1">{t("auth.createAccount")}</h1>
            <p className="text-sm text-gray-400 text-center mb-8">{t("auth.registerSubtitle")}</p>

            <form onSubmit={submit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  {t("common.name")} *
                </label>
                <input
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full rounded-lg border px-4 py-3 text-sm transition-colors focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
                  placeholder={t("auth.namePlaceholder")}
                  autoFocus
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  {t("auth.email")} *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border px-4 py-3 text-sm transition-colors focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
                  placeholder="email@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  {t("auth.password")} *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full rounded-lg border px-4 py-3 text-sm transition-colors focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
                  placeholder={t("auth.passwordPlaceholder")}
                />
              </div>

              {/* Language */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  <Globe className="h-3 w-3 inline mr-1" />
                  {t("common.language")}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {LOCALES.map(lang => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => { setForm({ ...form, language: lang.code }); setLocale(lang.code) }}
                      className="rounded-lg border px-3 py-2.5 text-center text-sm transition-all"
                      style={{
                        background: form.language === lang.code ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.03)",
                        borderColor: form.language === lang.code ? "#B08A3E" : "rgba(255,255,255,0.08)",
                        color: form.language === lang.code ? "#B08A3E" : "rgba(255,255,255,0.5)",
                      }}
                    >
                      <span className="text-lg block mb-0.5">{lang.flag}</span>
                      <span className="text-[10px] font-medium">{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-sm text-red-400 text-center rounded-lg px-3 py-2" style={{ background: "rgba(220,38,38,0.1)" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-50"
                style={{ background: "#B08A3E", color: "#0B1E3A" }}
              >
                {loading ? t("auth.creating") : t("auth.createAccount")}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </div>

          <div className="border-t px-8 py-4 text-center" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <p className="text-sm text-gray-500">
              {t("auth.hasAccount")}{" "}
              <Link href="/login" className="font-semibold transition-colors" style={{ color: "#B08A3E" }}>
                {t("auth.signIn")}
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          Costa Tropical · España
        </p>
      </div>
    </div>
  )
}
