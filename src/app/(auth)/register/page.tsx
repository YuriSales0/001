"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Building2 } from "lucide-react"

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Failed to register")
        return
      }
      router.push("/login?registered=1")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-50 to-blue-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="flex items-center gap-2 mb-6">
          <Building2 className="h-8 w-8 text-navy-900" />
          <span className="text-2xl font-bold text-navy-900">Hostmaster</span>
        </div>
        <h1 className="text-2xl font-bold text-navy-900 mb-1">Create your account</h1>
        <p className="text-sm text-gray-600 mb-6">Property owners — list your home on Costa Tropical.</p>

        <form onSubmit={submit} className="space-y-3">
          <input
            placeholder="Full name"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <input
            type="email"
            required
            placeholder="Email"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Password (min 6 chars)"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          <input
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            className="w-full rounded-md border px-3 py-2 text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-navy-900 text-white py-2 text-sm font-semibold hover:bg-navy-800 disabled:opacity-50"
          >
            {loading ? "Creating…" : "Create account"}
          </button>
        </form>

        <p className="text-sm text-gray-600 mt-4 text-center">
          Already have an account? <Link href="/login" className="text-navy-900 font-semibold">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
