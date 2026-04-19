"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Mail, UserPlus, Loader2, CheckCircle2 } from "lucide-react"
import { showToast } from "@/components/hm/toast"
import { useLocale } from "@/i18n/provider"

type Plan = "STARTER" | "BASIC" | "MID" | "PREMIUM"

const PLAN_OPTIONS: { value: Plan; label: string; fee: string; commission: string }[] = [
  { value: "STARTER", label: "Starter", fee: "€0/mo", commission: "22%" },
  { value: "BASIC", label: "Basic", fee: "€89/mo", commission: "20%" },
  { value: "MID", label: "Mid", fee: "€159/mo", commission: "17%" },
  { value: "PREMIUM", label: "Premium", fee: "€269/mo", commission: "13%" },
]

export default function ManagerInviteClientPage() {
  const router = useRouter()
  const { t } = useLocale()
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
        showToast(data.error ?? t('manager.inviteClient.sendFailed'), "error")
        return
      }
      setSent({ email: form.email, signupUrl: data.signupUrl })
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="p-6 max-w-xl mx-auto">
        <div className="rounded-2xl border bg-white p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-green-50 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-7 w-7 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-hm-black mb-1">{t('manager.inviteClient.sentTitle')}</h1>
          <p className="text-sm text-gray-500 mb-6">
            {t('manager.inviteClient.sentBodyPrefix')} <strong>{sent.email}</strong> {t('manager.inviteClient.sentBodySuffix')}
          </p>
          <div className="rounded-lg bg-gray-50 border p-3 mb-6">
            <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold mb-1">{t('manager.inviteClient.signupLinkLabel')}</p>
            <code className="text-xs break-all text-gray-700">{sent.signupUrl}</code>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              onClick={() => { setSent(null); setForm({ email: "", name: "", plan: "" }) }}
              className="rounded-lg bg-hm-black text-white px-4 py-2 text-sm font-semibold hover:bg-hm-black/90"
            >
              {t('manager.inviteClient.inviteAnother')}
            </button>
            <Link
              href="/manager/clients"
              className="rounded-lg border bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50"
            >
              {t('manager.inviteClient.back')}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Link href="/manager/clients" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-hm-black mb-4">
        <ArrowLeft className="h-4 w-4" /> {t('manager.inviteClient.back')}
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-hm-black flex items-center gap-2">
          <UserPlus className="h-6 w-6" /> {t('manager.inviteClient.title')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('manager.inviteClient.subtitle')}
        </p>
      </div>

      <form onSubmit={submit} className="rounded-2xl border bg-white p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
            {t('manager.inviteClient.emailLabel')} *
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
              placeholder="owner@example.com"
              autoFocus
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
            {t('manager.inviteClient.nameLabel')}
          </label>
          <input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
            placeholder={t('manager.inviteClient.namePlaceholder')}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
            {t('manager.inviteClient.planLabel')} <span className="text-gray-400 font-normal normal-case">{t('manager.inviteClient.planHint')}</span>
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
                <p className="text-sm font-semibold text-hm-black">{p.label}</p>
                <p className="text-[11px] text-gray-500">{p.fee} · {t('manager.inviteClient.planCommission')} {p.commission}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
          <p className="font-semibold mb-0.5">{t('manager.inviteClient.warningTitle')}</p>
          <p>{t('manager.inviteClient.warningBody')}</p>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={sending || !form.email.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-hm-black text-white px-5 py-2.5 text-sm font-semibold hover:bg-hm-black/90 disabled:opacity-50"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {sending ? t('manager.inviteClient.sending') : t('manager.inviteClient.send')}
          </button>
          <button
            type="button"
            onClick={() => router.push("/manager/clients")}
            disabled={sending}
            className="rounded-lg border bg-white px-5 py-2.5 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50"
          >
            {t('manager.inviteClient.cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
