"use client"

import { useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Building2, ArrowRight, MailCheck } from "lucide-react"
import { useLocale } from "@/i18n/provider"

export default function LoginPage() {
  const { t } = useLocale()
  const params = useSearchParams()
  const justVerified = params.get("verified") === "1"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showResend, setShowResend] = useState(false)
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setShowResend(false)
    setResendState("idle")

    try {
      const csrfRes = await fetch("/api/auth/csrf", { credentials: "include" })
      const { csrfToken } = await csrfRes.json()

      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        credentials: "include",
        redirect: "manual",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ csrfToken, email, password, json: "true" }),
      })

      if (res.type === "opaqueredirect" || res.ok) {
        await new Promise(r => setTimeout(r, 100))
        const sessionRes = await fetch("/api/auth/session", { credentials: "include" })
        const session = await sessionRes.json()
        if (session?.user) {
          window.location.href = "/me"
          return
        }
      }

      setError(t("auth.invalidCredentials"))
      // Offer resend option in case the issue is unverified email
      setShowResend(true)
    } catch {
      setError(t("common.error"))
    } finally {
      setLoading(false)
    }
  }

  const resendVerification = async () => {
    if (!email) return
    setResendState("sending")
    await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {})
    setResendState("sent")
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#111827" }}>
      <div className="absolute inset-0 opacity-30"
           style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(201,168,76,0.12) 0%, transparent 70%)" }} />

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: "#C9A84C" }}>
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">
              Host<span style={{ color: "#C9A84C" }}>Masters</span>
            </span>
          </Link>
        </div>

        {/* Card */}
        <div className="rounded-2xl overflow-hidden shadow-2xl" style={{ background: "#1a2332", border: "1px solid rgba(201,168,76,0.15)" }}>
          <div className="p-8">
            <h1 className="text-2xl font-bold text-white text-center mb-1">{t("auth.welcomeBack")}</h1>
            <p className="text-sm text-gray-400 text-center mb-8">{t("auth.loginSubtitle")}</p>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  {t("auth.email")}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3 text-sm transition-colors focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
                  placeholder="email@example.com"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  {t("auth.password")}
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3 text-sm transition-colors focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
                  placeholder="••••••••"
                />
              </div>

              {justVerified && !error && (
                <p className="text-sm text-green-400 text-center rounded-lg px-3 py-2 flex items-center justify-center gap-1.5" style={{ background: "rgba(34,197,94,0.1)" }}>
                  <MailCheck className="h-4 w-4" />
                  Email confirmed — sign in to continue.
                </p>
              )}

              {error && (
                <div className="space-y-2">
                  <p className="text-sm text-red-400 text-center rounded-lg px-3 py-2" style={{ background: "rgba(220,38,38,0.1)" }}>
                    {error}
                  </p>
                  {showResend && email && (
                    resendState === "sent" ? (
                      <p className="text-xs text-green-400 text-center">
                        If that email has a pending confirmation, we just sent a new link. Check your inbox.
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={resendVerification}
                        disabled={resendState === "sending"}
                        className="w-full text-xs text-[#C9A84C] hover:underline disabled:opacity-50"
                      >
                        {resendState === "sending" ? "Sending…" : "Didn't receive a confirmation email? Resend"}
                      </button>
                    )
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 rounded-lg py-3.5 text-sm font-semibold transition-all hover:scale-[1.01] disabled:opacity-50"
                style={{ background: "#C9A84C", color: "#111827" }}
              >
                {loading ? t("auth.signingIn") : t("auth.signIn")}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>
          </div>

          <div className="border-t px-8 py-4 text-center" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <p className="text-sm text-gray-500">
              {t("auth.noAccount")}{" "}
              <Link href="/register" className="font-semibold transition-colors" style={{ color: "#C9A84C" }}>
                {t("auth.signUp")}
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
