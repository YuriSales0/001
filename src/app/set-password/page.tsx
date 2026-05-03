"use client"

import { useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { PasswordInput } from "@/components/ui/password-input"

function SetPasswordForm() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get("token") || ""
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  if (!token) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold mb-2" style={{ color: "#0B1E3A" }}>Invalid link</h1>
        <p className="text-sm text-gray-500">The password setup link is missing or malformed.</p>
        <Link href="/login" className="inline-block mt-4 text-sm font-semibold" style={{ color: "#B08A3E" }}>
          Go to login
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords do not match.")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to set password.")
        return
      }
      setSuccess(true)
      setTimeout(() => router.push("/login"), 1500)
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="text-center">
        <h1 className="text-xl font-bold mb-2" style={{ color: "#0B1E3A" }}>Password set</h1>
        <p className="text-sm text-gray-500">Redirecting to login…</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: "#0B1E3A" }}>Set your password</h1>
        <p className="text-sm text-gray-500">Choose a password to access your account.</p>
      </div>
      <div>
        <label htmlFor="pw" className="block text-sm font-semibold mb-1.5" style={{ color: "#0B1E3A" }}>
          Password
        </label>
        <PasswordInput
          id="pw"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2"
          style={{ borderColor: "#E8E3D8", background: "#FAFAF8" }}
        />
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-semibold mb-1.5" style={{ color: "#0B1E3A" }}>
          Confirm password
        </label>
        <PasswordInput
          id="confirm"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:ring-2"
          style={{ borderColor: "#E8E3D8", background: "#FAFAF8" }}
        />
      </div>
      {error && <p className="text-sm font-medium" style={{ color: "#A32D2D" }}>{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-lg text-sm font-bold transition-all hover:brightness-110 disabled:opacity-60"
        style={{ background: "#B08A3E", color: "#0B1E3A" }}
      >
        {submitting ? "Setting password…" : "Set password"}
      </button>
    </form>
  )
}

export default function SetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "#FAFAF8" }}>
      <div className="w-full max-w-md bg-white rounded-2xl border p-8 shadow-sm" style={{ borderColor: "#E8E3D8" }}>
        <Suspense fallback={<p className="text-sm text-gray-500">Loading…</p>}>
          <SetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
