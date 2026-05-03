"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowRight, Mail, ArrowLeft } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email.trim()) {
      setError("Please enter your email.")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Something went wrong. Try again.")
        return
      }
      setSubmitted(true)
    } catch {
      setError("Network error. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#0B1E3A" }}>
      <div className="w-full max-w-md rounded-2xl p-8 sm:p-10" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
        {submitted ? (
          <div className="text-center">
            <div className="h-14 w-14 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: "rgba(176,138,62,0.15)" }}>
              <Mail className="h-7 w-7" style={{ color: "#B08A3E" }} />
            </div>
            <h1 className="text-2xl font-bold mb-3 text-white">Check your email</h1>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              If an account exists for <strong>{email}</strong>, you&apos;ll receive a link to reset your password within a few minutes. The link expires in 1 hour.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-80"
              style={{ color: "#B08A3E" }}
            >
              <ArrowLeft className="h-4 w-4" /> Back to login
            </Link>
          </div>
        ) : (
          <>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-medium mb-6 transition-colors hover:opacity-80"
              style={{ color: "#B08A3E" }}
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to login
            </Link>
            <h1 className="text-2xl font-bold mb-2 text-white">Forgot your password?</h1>
            <p className="text-sm text-gray-400 mb-8">
              Enter your email and we&apos;ll send you a link to reset it.
            </p>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-lg border px-4 py-3 text-sm transition-colors focus:outline-none"
                  style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "#fff" }}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-sm font-medium" style={{ color: "#ef4444" }}>{error}</p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: "#B08A3E", color: "#0B1E3A" }}
              >
                {submitting ? "Sending…" : (
                  <>
                    Send reset link <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
