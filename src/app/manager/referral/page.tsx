"use client"

import { useEffect, useState } from "react"
import { Copy, CheckCircle2, Link2, Users, TrendingUp, Pencil, Loader2, Share2 } from "lucide-react"
import { showToast } from "@/components/hm/toast"
import { useLocale } from "@/i18n/provider"

type ReferralData = {
  referralCode: string
  referralUrl: string
  managerZone: string | null
  stats: { leadCount: number; clientCount: number }
}

export default function ManagerReferralPage() {
  const { t } = useLocale()
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [editing, setEditing] = useState(false)
  const [codeInput, setCodeInput] = useState("")
  const [zoneInput, setZoneInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/manager/referral")
      if (!res.ok) throw new Error()
      const d = await res.json()
      setData(d)
      setCodeInput(d.referralCode)
      setZoneInput(d.managerZone ?? "")
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const copy = async () => {
    if (!data) return
    await navigator.clipboard.writeText(data.referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const save = async () => {
    setSaving(true)
    const res = await fetch("/api/manager/referral", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralCode: codeInput, managerZone: zoneInput || null }),
    })
    const result = await res.json().catch(() => ({}))
    setSaving(false)
    if (res.ok) {
      showToast(t('manager.referralPage.linkUpdated'), "success")
      setEditing(false)
      load()
    } else {
      showToast(result.error ?? t('manager.referralPage.linkUpdateFailed'), "error")
    }
  }

  const share = async () => {
    if (!data) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: "HostMasters — Property Management Costa Tropical",
          text: "Professional short-term rental management. Check the platform:",
          url: data.referralUrl,
        })
      } catch { /* user cancelled */ }
    } else {
      copy()
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-10 rounded bg-gray-100 w-64" />
        <div className="h-32 rounded-xl bg-gray-100" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-xl bg-gray-100" />
          <div className="h-24 rounded-xl bg-gray-100" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <p className="text-sm text-red-500 text-center p-4 rounded-lg bg-red-50">
          {t('manager.referralPage.loadFailed')} <button onClick={load} className="underline">{t('manager.referralPage.tryAgain')}</button>
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">{t('manager.referralPage.title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {t('manager.referralPage.subtitle')}
        </p>
      </div>

      {/* Main referral card */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #0B1E3A 0%, #1F3A66 100%)" }}>
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(176,138,62,0.2) 0%, transparent 70%)" }} />
        <div className="relative p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium mb-4" style={{ background: "rgba(176,138,62,0.15)", color: "#B08A3E", border: "1px solid rgba(176,138,62,0.25)" }}>
            <Link2 className="h-3.5 w-3.5" />
            {t('manager.referralPage.personalLink')}
          </div>

          {!editing ? (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <code className="text-lg sm:text-xl font-mono text-white break-all">{data.referralUrl}</code>
              </div>
              {data.managerZone && (
                <p className="text-xs text-gray-400 mb-4">{t('manager.referralPage.territoryPrefix')} {data.managerZone}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={copy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#B08A3E] text-[#0B1E3A] px-4 py-2 text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  {copied ? <><CheckCircle2 className="h-4 w-4" /> {t('manager.referralPage.copied')}</> : <><Copy className="h-4 w-4" /> {t('manager.referralPage.copyLink')}</>}
                </button>
                <button
                  onClick={share}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 text-white px-4 py-2 text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  <Share2 className="h-4 w-4" /> {t('manager.referralPage.share')}
                </button>
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 text-white px-4 py-2 text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  <Pencil className="h-4 w-4" /> {t('manager.referralPage.customize')}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('manager.referralPage.codeLabel')}</label>
                <input
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value)}
                  placeholder="your-name"
                  className="w-full rounded-lg px-3 py-2 text-sm font-mono"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
                />
                <p className="text-[10px] text-gray-400 mt-1">{t('manager.referralPage.codeHint')}</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('manager.referralPage.territoryLabel')}</label>
                <input
                  value={zoneInput}
                  onChange={e => setZoneInput(e.target.value)}
                  placeholder={t('manager.referralPage.territoryPlaceholder')}
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={save}
                  disabled={saving || !codeInput.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#B08A3E] text-[#0B1E3A] px-4 py-2 text-sm font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('manager.referralPage.saving')}</> : t('manager.referralPage.save')}
                </button>
                <button
                  onClick={() => { setEditing(false); setCodeInput(data.referralCode); setZoneInput(data.managerZone ?? "") }}
                  disabled={saving}
                  className="rounded-lg border border-white/20 bg-white/5 text-white px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
                >
                  {t('manager.referralPage.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Users}
          label={t('manager.referralPage.statsClients')}
          value={data.stats.clientCount}
          hint={t('manager.referralPage.statsClientsHint')}
          color="#B08A3E"
        />
        <StatCard
          icon={TrendingUp}
          label={t('manager.referralPage.statsLeads')}
          value={data.stats.leadCount}
          hint={t('manager.referralPage.statsLeadsHint')}
          color="#2A7A4F"
        />
      </div>

      {/* How it works */}
      <div className="rounded-xl border bg-white p-6">
        <h3 className="font-semibold text-navy-900 mb-3">{t('manager.referralPage.howTitle')}</h3>
        <ol className="space-y-3 text-sm">
          <Step n={1}>
            {t('manager.referralPage.howStep1')}
          </Step>
          <Step n={2}>
            {t('manager.referralPage.howStep2Before')} <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{data.referralUrl}</code>{t('manager.referralPage.howStep2After')}
          </Step>
          <Step n={3}>
            {t('manager.referralPage.howStep3')}
          </Step>
          <Step n={4}>
            {t('manager.referralPage.howStep4')}
          </Step>
        </ol>
      </div>

      {/* Pre-written message */}
      <div className="rounded-xl border bg-gray-50 p-6">
        <h3 className="font-semibold text-navy-900 mb-3">{t('manager.referralPage.pitchTitle')}</h3>
        <p className="text-xs text-gray-500 mb-2">{t('manager.referralPage.pitchIntro')}</p>
        <div className="rounded-lg bg-white border p-4 text-sm text-gray-700 whitespace-pre-wrap mb-3">
          {t('manager.referralPage.pitchBody').replace('{url}', data.referralUrl)}
        </div>
        <button
          onClick={() => {
            const pitch = t('manager.referralPage.pitchBody').replace('{url}', data.referralUrl)
            navigator.clipboard.writeText(pitch)
            showToast(t('manager.referralPage.pitchCopied'), "success")
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          <Copy className="h-4 w-4" /> {t('manager.referralPage.pitchCopy')}
        </button>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, hint, color }: {
  icon: React.ElementType
  label: string
  value: number
  hint: string
  color: string
}) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: color + "20" }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">{label}</p>
      </div>
      <p className="text-3xl font-bold text-navy-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{hint}</p>
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 h-6 w-6 rounded-full bg-navy-900 text-white flex items-center justify-center text-xs font-bold">
        {n}
      </span>
      <span className="text-gray-700 pt-0.5">{children}</span>
    </li>
  )
}
