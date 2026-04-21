"use client"

import { useState } from "react"
import { HmLogo } from "@/components/hm/hm-logo"
import { Loader2, Mail, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function PartnerLoginPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!email.trim()) {
      setError("Please enter your email address")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/partner/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Something went wrong")
      }
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <HmLogo size={48} variant="compact" />
          </div>
          <h1 className="text-xl font-serif font-bold text-gray-900">Partner Portal</h1>
          <p className="text-sm text-gray-500 mt-1">Sign in to view your referrals and payouts</p>
        </div>

        {sent ? (
          <div className="bg-white rounded-xl border p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900">Check your email</h2>
            <p className="text-sm text-gray-500 mt-2">
              We sent a login link to <strong>{email}</strong>. Click the link in the email to access your portal.
            </p>
            <button
              onClick={() => { setSent(false); setEmail("") }}
              className="text-sm text-amber-700 hover:text-amber-800 mt-4 underline"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 transition-colors"
              style={{ background: "#B08A3E" }}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Sending...
                </span>
              ) : (
                "Send magic link"
              )}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Not a partner yet?{" "}
              <Link href="/careers" className="text-amber-700 hover:underline">Learn more</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
