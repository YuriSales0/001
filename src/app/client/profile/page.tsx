"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  Camera, Save, Lock, FileText, Download, User, Crown,
  Mail, Building2, TrendingUp, Calendar, ChevronRight, ChevronDown, Sparkles,
} from "lucide-react"
import { useLocale } from "@/i18n/provider"
import { showToast } from "@/components/hm/toast"

interface Profile {
  id: string; name: string | null; email: string; phone: string | null
  image: string | null; bio: string | null; subscriptionPlan: string | null
  subscriptionStatus: string | null; role: string; createdAt: string
}

interface Stats {
  propertyCount: number
  totalPayouts: number
  broadcastsReceived: number
  recentBroadcasts: Array<{ id: string; subject: string; sentAt: string | null; sender: string; readAt: string | null }>
  profileCompletion: number
}

const PLAN_TIER_NAMES: Record<string, string> = {
  STARTER: 'Starter',
  BASIC: 'Basic',
  MID: 'Mid',
  PREMIUM: 'Premium',
}

// PREMIUM owners get a slightly different hero gradient — subtle but premium signal.
const HERO_GRADIENT: Record<string, string> = {
  STARTER: 'linear-gradient(135deg, #0B1E3A 0%, #142B4D 100%)',
  BASIC:   'linear-gradient(135deg, #0B1E3A 0%, #142B4D 100%)',
  MID:     'linear-gradient(135deg, #0B1E3A 0%, #1a3358 60%, #142B4D 100%)',
  PREMIUM: 'linear-gradient(135deg, #0B1E3A 0%, #1F2D5F 50%, #2A1F4B 100%)',
}

async function downloadDoc(type: "management" | "rules" | "guide", ownerName: string) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF()
  const W = doc.internal.pageSize.getWidth()
  doc.setFillColor(11, 30, 58)
  doc.rect(0, 0, W, 20, "F")
  doc.setFillColor(176, 138, 62)
  doc.rect(0, 0, W, 2, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(176, 138, 62)
  doc.text("HostMasters", 20, 13)

  const titles = {
    management: "Property Management Agreement",
    rules: "House Rules",
    guide: "Owner Welcome Guide",
  }
  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(180, 180, 180)
  doc.text(titles[type], W - 20, 13, { align: "right" })

  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(11, 30, 58)
  doc.text(type === "guide" ? `Welcome, ${ownerName.split(" ")[0]}` : titles[type], 20, 40)

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(80, 80, 80)
  doc.text(`Owner: ${ownerName}`, 20, 50)
  doc.text(`Date: ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, 20, 56)
  doc.save(`HostMasters_${type}.pdf`)
}

/**
 * Circular SVG progress ring — radius 32, stroke 5. Animates the dasharray
 * via CSS transition. Replaces the bare "%" number for a more premium feel.
 */
function ProgressRing({ pct }: { pct: number }) {
  const radius = 32
  const stroke = 5
  const normalised = radius - stroke / 2
  const circumference = 2 * Math.PI * normalised
  const offset = circumference - (Math.max(0, Math.min(100, pct)) / 100) * circumference
  return (
    <div className="relative h-[80px] w-[80px]">
      <svg width={80} height={80} className="rotate-[-90deg]">
        <circle
          cx={40}
          cy={40}
          r={normalised}
          stroke="rgba(176,138,62,0.15)"
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          cx={40}
          cy={40}
          r={normalised}
          stroke="#B08A3E"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-serif text-xl font-bold" style={{ color: '#B08A3E' }}>
          {pct}%
        </span>
      </div>
    </div>
  )
}

export default function ClientProfilePage() {
  const { t, messages } = useLocale()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ name: "", phone: "", image: "" })
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" })
  const [pwError, setPwError] = useState("")
  const [pwSaved, setPwSaved] = useState(false)
  const [showInfoForm, setShowInfoForm] = useState(false)
  const [showSecurity, setShowSecurity] = useState(false)
  const infoFormRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then(r => r.ok ? r.json() : null),
      fetch("/api/client/profile-stats").then(r => r.ok ? r.json() : null),
    ]).then(([p, s]) => {
      setProfile(p)
      setStats(s)
      if (p) setForm({ name: p.name ?? "", phone: p.phone ?? "", image: p.image ?? "" })
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const openInfoFormAndScroll = () => {
    setShowInfoForm(true)
    setTimeout(() => infoFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      showToast(t('profile.imageTooLarge'), 'error')
      return
    }
    const reader = new FileReader()
    reader.onload = ev => setForm(f => ({ ...f, image: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError(""); setSaved(false)
    const res = await fetch("/api/profile", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    else { const d = await res.json(); setError(d.error ?? t('profile.failedToSave')) }
    setSaving(false)
  }

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(""); setPwSaved(false)
    if (pw.next !== pw.confirm) { setPwError(t('profile.passwordsDoNotMatch')); return }
    if (pw.next.length < 8) { setPwError(t('profile.passwordMinLength')); return }
    const res = await fetch("/api/profile", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
    })
    if (res.ok) { setPwSaved(true); setPw({ current: "", next: "", confirm: "" }); setTimeout(() => setPwSaved(false), 3000) }
    else { const d = await res.json(); setPwError(d.error ?? t('profile.failedToUpdatePassword')) }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF8F4' }}>
      <p className="text-sm text-gray-400">{t('common.loading')}</p>
    </div>
  }

  const plan = profile?.subscriptionPlan ?? "STARTER"
  const ownerName = profile?.name ?? profile?.email ?? "Owner"
  const memberSince = profile ? new Date(profile.createdAt) : new Date()
  const monthsAsMember = Math.max(1, Math.round((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24 * 30)))
  const fmtMember = memberSince.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
  const fmtEUR = (n: number) =>
    new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
  const fmtDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : ''

  const tier = PLAN_TIER_NAMES[plan]
  // The t() helper only returns strings; perks live as arrays under
  // clientProfileMember.perks.{plan} so we read them straight from messages.
  const planKey = plan.toLowerCase()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const perksRaw = (messages as any)?.clientProfileMember?.perks?.[planKey]
  const perks: string[] = Array.isArray(perksRaw) ? perksRaw : []

  const tt = (k: string, replacements?: Record<string, string>) => {
    let s = t(`clientProfileMember.${k}`)
    if (replacements) for (const [rk, rv] of Object.entries(replacements)) s = s.replace(`{${rk}}`, rv)
    return s
  }

  return (
    <div className="min-h-screen pb-12" style={{ background: '#FAF8F4' }}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">

        {/* HERO — top gold accent, tier-specific gradient, gold-ringed avatar, progress ring */}
        <section className="rounded-2xl overflow-hidden shadow-md relative"
                 style={{ background: HERO_GRADIENT[plan] ?? HERO_GRADIENT.STARTER }}>
          {/* Top gold accent bar */}
          <div className="absolute top-0 left-0 right-0 h-0.5"
               style={{ background: 'linear-gradient(90deg, transparent 0%, #B08A3E 50%, transparent 100%)' }} />

          <div className="p-6 sm:p-8 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar — gold ring + soft glow */}
              <div className="relative shrink-0">
                <div
                  className="h-24 w-24 rounded-full overflow-hidden flex items-center justify-center transition-transform hover:scale-[1.02]"
                  style={{
                    background: '#142B4D',
                    border: '3px solid #B08A3E',
                    boxShadow: '0 0 0 4px rgba(176,138,62,0.18), 0 8px 24px rgba(0,0,0,0.25)',
                  }}
                >
                  {form.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <User className="h-10 w-10" style={{ color: 'rgba(176,138,62,0.5)' }} />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 rounded-full p-2 shadow-md hover:brightness-110 transition-all"
                  style={{ background: '#B08A3E' }}
                  aria-label="Change photo"
                >
                  <Camera className="h-3.5 w-3.5" style={{ color: '#0B1E3A' }} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
                    style={{
                      background: 'rgba(176,138,62,0.20)',
                      color: '#B08A3E',
                      border: '1px solid rgba(176,138,62,0.4)',
                    }}
                  >
                    <Crown className="h-3.5 w-3.5" />
                    {tt('memberTier', { tier })}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">{ownerName}</h1>
                <p className="text-sm mt-1.5 flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.75)' }}>
                  <Mail className="h-3.5 w-3.5" />
                  {profile?.email}
                </p>
                <p className="text-xs mt-1 italic" style={{ color: 'rgba(255,255,255,0.55)' }}>
                  {tt('memberSince', { date: fmtMember })}
                </p>
              </div>

              {/* Profile completion — SVG ring */}
              <div className="flex flex-col items-center sm:items-end shrink-0 gap-1.5">
                <ProgressRing pct={stats?.profileCompletion ?? 0} />
                <p className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  {tt('completionPct')}
                </p>
                {stats && stats.profileCompletion < 100 && (
                  <button
                    onClick={openInfoFormAndScroll}
                    className="text-[11px] underline mt-0.5 hover:text-white transition-colors"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    {tt('completionCta')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* STATS STRIP — premium variant: serif numbers, gold icon disc, hover lift */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Calendar,   label: tt('statMember'),         value: monthsAsMember === 1 ? tt('statMonth') : tt('statMonths', { n: String(monthsAsMember) }) },
            { icon: Building2,  label: tt('statProperties'),     value: String(stats?.propertyCount ?? 0) },
            { icon: TrendingUp, label: tt('statLifetimePayouts'),value: fmtEUR(stats?.totalPayouts ?? 0) },
            { icon: Mail,       label: tt('statUpdates'),        value: String(stats?.broadcastsReceived ?? 0) },
          ].map(s => {
            const Icon = s.icon
            return (
              <div
                key={s.label}
                className="group rounded-xl border bg-white p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ borderColor: '#E8E3D8' }}
              >
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                  style={{ background: 'rgba(176,138,62,0.12)' }}
                >
                  <Icon className="h-4 w-4" style={{ color: '#B08A3E' }} />
                </div>
                <div className="font-serif text-2xl font-bold leading-none" style={{ color: '#0B1E3A' }}>{s.value}</div>
                <div className="text-[10px] uppercase tracking-widest text-gray-400 mt-1.5">{s.label}</div>
              </div>
            )
          })}
        </section>

        {/* MEMBERSHIP PERKS — gradient header, sparkle gold icons */}
        <section className="rounded-2xl border bg-white overflow-hidden"
                 style={{ borderColor: '#E8E3D8' }}>
          <header className="px-6 py-4 border-b flex items-center justify-between"
                  style={{
                    background: plan === 'PREMIUM'
                      ? 'linear-gradient(180deg, rgba(176,138,62,0.10) 0%, #ffffff 100%)'
                      : 'linear-gradient(180deg, #FAF8F4 0%, #ffffff 100%)',
                    borderColor: '#E8E3D8',
                  }}>
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4" style={{ color: '#B08A3E' }} />
              <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#0B1E3A' }}>
                {tt('benefitsTitle', { tier })}
              </h2>
            </div>
            <Link href="/client/plan" className="text-xs font-semibold inline-flex items-center gap-1 hover:underline"
                  style={{ color: '#B08A3E' }}>
              {tt('benefitsViewPlan')} <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </header>
          <ul className="divide-y" style={{ borderColor: '#f5f0e3' }}>
            {perks.map((perk, i) => (
              <li key={i} className="flex items-start gap-3 px-6 py-3 group hover:bg-amber-50/20 transition-colors">
                <Sparkles className="h-4 w-4 shrink-0 mt-0.5 transition-transform group-hover:scale-110"
                          style={{ color: '#B08A3E' }} />
                <span className="text-sm text-gray-700">{perk}</span>
              </li>
            ))}
          </ul>
          {plan !== 'PREMIUM' && (
            <Link href="/client/plan"
                  className="block px-6 py-3 border-t text-xs font-semibold hover:bg-amber-50/40 transition-colors"
                  style={{ background: 'rgba(176,138,62,0.04)', borderColor: '#f5f0e3', color: '#B08A3E' }}>
              <span className="inline-flex items-center gap-1">
                {tt('benefitsUpgrade')} <ChevronRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          )}
        </section>

        {/* RECENT BROADCASTS */}
        {stats && stats.recentBroadcasts.length > 0 && (
          <section className="rounded-2xl border bg-white overflow-hidden"
                   style={{ borderColor: '#E8E3D8' }}>
            <header className="px-6 py-4 border-b flex items-center justify-between"
                    style={{ borderColor: '#E8E3D8' }}>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" style={{ color: '#B08A3E' }} />
                <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#0B1E3A' }}>
                  {tt('recentTitle')}
                </h2>
              </div>
              <Link href="/client/broadcasts" className="text-xs font-semibold inline-flex items-center gap-1 hover:underline"
                    style={{ color: '#B08A3E' }}>
                {tt('recentViewAll')} <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </header>
            <ul className="divide-y" style={{ borderColor: '#f5f0e3' }}>
              {stats.recentBroadcasts.map(b => (
                <li key={b.id}>
                  <Link href={`/client/broadcasts/${b.id}`}
                        className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-amber-50/30 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {!b.readAt && <span className="h-2 w-2 rounded-full shrink-0" style={{ background: '#B08A3E' }} />}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${!b.readAt ? 'font-bold' : 'font-medium text-gray-700'}`}
                           style={!b.readAt ? { color: '#0B1E3A' } : {}}>
                          {b.subject}
                        </p>
                        <p className="text-[11px] text-gray-400">{b.sender} · {fmtDate(b.sentAt)}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* YOUR INFORMATION (collapsible) */}
        <section ref={infoFormRef} className="rounded-2xl border bg-white overflow-hidden scroll-mt-6"
                 style={{ borderColor: '#E8E3D8' }}>
          <button
            type="button"
            onClick={() => setShowInfoForm(s => !s)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" style={{ color: '#B08A3E' }} />
              <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#0B1E3A' }}>
                {tt('infoSection')}
              </h2>
            </div>
            {showInfoForm ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
          </button>
          {showInfoForm && (
            <form onSubmit={save} className="px-6 py-5 border-t space-y-4" style={{ borderColor: '#f5f0e3' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{t('profile.fullName')}</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold focus:border-transparent"
                    style={{ borderColor: '#E8E3D8' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{t('common.phone')}</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold focus:border-transparent"
                    placeholder="+34 600 000 000"
                    style={{ borderColor: '#E8E3D8' }} />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{t('auth.email')}</label>
                  <input value={profile?.email ?? ""} disabled
                    className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                    style={{ borderColor: '#E8E3D8' }} />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex items-center justify-between">
                {saved && <span className="text-sm font-medium text-emerald-600">{t('profile.savedSuccessfully')}</span>}
                <button type="submit" disabled={saving}
                  className="ml-auto inline-flex items-center gap-2 rounded-xl text-white px-4 py-2.5 text-sm font-semibold hover:brightness-110 disabled:opacity-50 transition-all"
                  style={{ background: '#0B1E3A' }}>
                  <Save className="h-4 w-4" /> {saving ? t('profile.saving') : t('profile.saveChanges')}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* DOCUMENTS — premium card style */}
        <section className="rounded-2xl border bg-white overflow-hidden"
                 style={{ borderColor: '#E8E3D8' }}>
          <header className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: '#E8E3D8' }}>
            <FileText className="h-4 w-4" style={{ color: '#B08A3E' }} />
            <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#0B1E3A' }}>
              {tt('docsSection')}
            </h2>
          </header>
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { type: "management" as const, title: 'Management Agreement', desc: 'Service contract' },
              { type: "rules" as const,      title: 'House Rules',           desc: 'Standard rules' },
              { type: "guide" as const,      title: 'Owner Guide',           desc: 'Get the most out' },
            ].map(doc => (
              <div key={doc.type}
                   className="group rounded-xl border p-4 hover:border-hm-gold hover:shadow-sm transition-all"
                   style={{ borderColor: '#E8E3D8' }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-3 transition-transform group-hover:scale-110"
                     style={{ background: 'rgba(176,138,62,0.12)' }}>
                  <FileText className="h-5 w-5" style={{ color: '#B08A3E' }} />
                </div>
                <p className="text-sm font-bold leading-tight" style={{ color: '#0B1E3A' }}>{doc.title}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{doc.desc}</p>
                <button
                  onClick={() => downloadDoc(doc.type, ownerName)}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                  style={{ color: '#B08A3E' }}
                >
                  <Download className="h-3 w-3" /> {t('common.download')}
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* SECURITY (collapsible) */}
        <section className="rounded-2xl border bg-white overflow-hidden"
                 style={{ borderColor: '#E8E3D8' }}>
          <button
            type="button"
            onClick={() => setShowSecurity(s => !s)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" style={{ color: '#B08A3E' }} />
              <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#0B1E3A' }}>
                {tt('securitySection')}
              </h2>
            </div>
            {showSecurity ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
          </button>
          {showSecurity && (
            <form onSubmit={savePassword} className="px-6 py-5 border-t space-y-4" style={{ borderColor: '#f5f0e3' }}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  [t('profile.currentPassword'), 'current'],
                  [t('profile.newPassword'), 'next'],
                  [t('profile.confirmNew'), 'confirm'],
                ].map(([label, key]) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
                    <input
                      type="password"
                      value={pw[key as keyof typeof pw]}
                      onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold focus:border-transparent"
                      style={{ borderColor: '#E8E3D8' }}
                    />
                  </div>
                ))}
              </div>
              {pwError && <p className="text-sm text-red-600">{pwError}</p>}
              <div className="flex items-center justify-between">
                {pwSaved && <span className="text-sm font-medium text-emerald-600">{t('profile.passwordUpdated')}</span>}
                <button
                  type="submit"
                  className="ml-auto inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
                  style={{ borderColor: '#E8E3D8' }}
                >
                  {t('profile.updatePassword')}
                </button>
              </div>
            </form>
          )}
        </section>

      </div>
    </div>
  )
}
