"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Mail, UserPlus, Loader2, CheckCircle2 } from "lucide-react"
import { showToast } from "@/components/hm/toast"

type Plan = "STARTER" | "BASIC" | "MID" | "PREMIUM"

const PLAN_OPTIONS: { value: Plan; label: string; fee: string; commission: string }[] = [
  { value: "STARTER", label: "Starter", fee: "€0/mo", commission: "22%" },
  { value: "BASIC", label: "Basic", fee: "€89/mo", commission: "20%" },
  { value: "MID", label: "Mid", fee: "€159/mo", commission: "17%" },
  { value: "PREMIUM", label: "Premium", fee: "€269/mo", commission: "13%" },
]

export default function ManagerInviteClientPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: "", name: "", plan: "" as Plan | "" })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<{ email: string; signupUrl: string } | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.email.trim()) return
    setSending(true)
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          name: form.name.trim() || null,
          role: "CLIENT",
          subscriptionPlan: form.plan || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error ?? "Failed to send invite", "error")
        return
      }
      setSent({ email: form.email, signupUrl: data.signupUrl })
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="p-6 max-w-xl mx-auto" style={{ fontFamily: "system-ui, sans-serif" }}>
        <div className="rounded-2xl border bg-white p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-navy-900 mb-1">Invitation sent</h1>
          <p className="text-sm text-gray-500 mb-6">
            We emailed <strong>{sent.email}</strong> with a signup link. The client will be assigned to you automatically.
          </p>
          <div className="rounded-lg bg-gray-50 border p-3 mb-6">
            <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">Signup link (for your reference)</p>
            <code className="text-xs break-all text-gray-700">{sent.signupUrl}</code>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => { setSent(null); setForm({ email: "", name: "", plan: "" }) }}
              className="rounded-lg bg-navy-900 text-white px-4 py-2 text-sm font-semibold hover:bg-navy-800"
            >
              Invite another client
            </button>
            <Link
              href="/manager/clients"
              className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              Back to my clients
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-xl mx-auto" style={{ fontFamily: "system-ui, sans-serif" }}>
      <Link href="/manager/clients" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy-900 mb-4">
        <ArrowLeft className="h-4 w-4" /> Back to my clients
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-900 flex items-center gap-2">
          <UserPlus className="h-6 w-6" /> Invite a client
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Send a signup link. The new owner will be added to your portfolio automatically.
        </p>
      </div>

      <form onSubmit={submit} className="rounded-2xl border bg-white p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
            Email *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
              placeholder="owner@example.com"
              autoFocus
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
            Name
          </label>
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
            placeholder="Full name (optional)"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            Suggested plan <span className="text-gray-400 font-normal normal-case">(optional, they can change later)</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PLAN_OPTIONS.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => setForm({ ...form, plan: form.plan === p.value ? "" : p.value })}
                className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  form.plan === p.value
                    ? "border-navy-900 bg-navy-50 ring-1 ring-navy-900"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <p className="text-sm font-semibold text-navy-900">{p.label}</p>
                <p className="text-[11px] text-gray-500">{p.fee} · commission {p.commission}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          <p className="font-semibold mb-0.5">Before you invite</p>
          <p>Make sure you&rsquo;ve talked to the owner and they expect this email. Cold invites have poor conversion.</p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={sending || !form.email.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-navy-900 text-white px-5 py-2.5 text-sm font-semibold hover:bg-navy-800 disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {sending ? "Sending…" : "Send invite"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/manager/clients")}
            disabled={sending}
            className="rounded-lg border bg-white px-5 py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
