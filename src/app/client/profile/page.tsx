"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  Camera, Save, Lock, FileText, Download, User, Crown,
  Mail, Building2, TrendingUp, Calendar, ChevronRight, ChevronDown,
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

const PLAN_PERKS: Record<string, string[]> = {
  STARTER: [
    'Comissão 22% sobre rental líquido',
    'Listagem em Airbnb, Booking.com, VRBO',
    'Smart Lock incluído',
    'Comunicação 24/7 com hóspedes',
    'Relatórios mensais simples',
  ],
  BASIC: [
    'Comissão 19% sobre rental líquido',
    'Tudo do Starter',
    'Manutenção preventiva mensal',
    'VAGF — feedback por voz após checkout',
    'Payouts semanais via Stripe',
    'Relatórios premium em PDF',
  ],
  MID: [
    'Comissão 17% sobre rental líquido',
    'Tudo do Basic',
    'AI Pricing dinâmico (+18% receita estimada)',
    'Limpeza incluída em estadias ≥4 noites',
    'Market Intelligence — concorrência local',
    'Resposta prioritária <12h ao owner',
  ],
  PREMIUM: [
    'Comissão 13% sobre rental líquido',
    'Tudo do Mid',
    'AI Pricing optimizado (+25% receita estimada)',
    'Limpeza incluída em estadias ≥3 noites',
    'Compliance fiscal completo (Modelo 179 + IRNR)',
    'Transfer aeroporto Málaga/Granada',
    'Lavandaria e roupa de cama premium',
    'Resposta a emergências em <4h',
  ],
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

export default function ClientProfilePage() {
  const { t } = useLocale()
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

  // H6 fix — scroll into view when admin/owner clicks "Complete your profile"
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
    return <div className="p-8 text-sm text-gray-400">{t('common.loading')}</div>
  }

  const plan = profile?.subscriptionPlan ?? "STARTER"
  const ownerName = profile?.name ?? profile?.email ?? "Owner"
  const memberSince = profile ? new Date(profile.createdAt) : new Date()
  const monthsAsMember = Math.max(1, Math.round((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24 * 30)))
  const fmtMember = memberSince.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
  const fmtEUR = (n: number) =>
    new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
  const fmtDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }) : ''

  const tier = PLAN_TIER_NAMES[plan]
  const perks = PLAN_PERKS[plan] ?? []

  return (
    <div className="min-h-screen pb-12" style={{ background: '#FAF8F4' }}>
      <div className="max-w-4xl mx-auto p-6 space-y-6">

        {/* HERO */}
        <section className="rounded-2xl overflow-hidden shadow-md"
                 style={{ background: 'linear-gradient(135deg, #0B1E3A 0%, #142B4D 100%)' }}>
          <div className="p-6 sm:p-8 text-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="h-24 w-24 rounded-full overflow-hidden flex items-center justify-center"
                     style={{ background: '#142B4D', border: '3px solid #B08A3E', boxShadow: '0 0 0 4px rgba(176,138,62,0.15)' }}>
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
                >
                  <Camera className="h-3.5 w-3.5" style={{ color: '#0B1E3A' }} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
              </div>

              {/* Identity */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                        style={{ background: 'rgba(176,138,62,0.18)', color: '#B08A3E' }}>
                    <Crown className="h-3 w-3" /> {tier} Member
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">{ownerName}</h1>
                <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  <Mail className="inline h-3.5 w-3.5 mr-1" />{profile?.email}
                </p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Member since {fmtMember}
                </p>
              </div>

              {/* Profile completion */}
              <div className="text-center sm:text-right shrink-0">
                <div className="text-[10px] uppercase tracking-widest mb-1"
                     style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Profile completion
                </div>
                <div className="text-3xl font-serif font-bold" style={{ color: '#B08A3E' }}>
                  {stats?.profileCompletion ?? 0}%
                </div>
                {stats && stats.profileCompletion < 100 && (
                  <button
                    onClick={openInfoFormAndScroll}
                    className="text-[11px] underline mt-1"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    Complete your profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* STATS STRIP */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Calendar, label: 'Member', value: `${monthsAsMember} ${monthsAsMember === 1 ? 'month' : 'months'}` },
            { icon: Building2, label: 'Properties', value: String(stats?.propertyCount ?? 0) },
            { icon: TrendingUp, label: 'Lifetime payouts', value: fmtEUR(stats?.totalPayouts ?? 0) },
            { icon: Mail, label: 'Updates', value: String(stats?.broadcastsReceived ?? 0) },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="rounded-xl border bg-white p-4"
                   style={{ borderColor: '#E8E3D8' }}>
                <Icon className="h-4 w-4 mb-2" style={{ color: '#B08A3E' }} />
                <div className="text-lg font-bold" style={{ color: '#0B1E3A' }}>{s.value}</div>
                <div className="text-[10px] uppercase tracking-widest text-gray-400">{s.label}</div>
              </div>
            )
          })}
        </section>

        {/* MEMBERSHIP PERKS */}
        <section className="rounded-2xl border bg-white overflow-hidden"
                 style={{ borderColor: '#E8E3D8' }}>
          <header className="px-6 py-4 border-b flex items-center justify-between"
                  style={{ background: 'linear-gradient(180deg, #FAF8F4 0%, #ffffff 100%)', borderColor: '#E8E3D8' }}>
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4" style={{ color: '#B08A3E' }} />
              <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#0B1E3A' }}>
                Your {tier} benefits
              </h2>
            </div>
            <Link href="/client/plan" className="text-xs font-semibold inline-flex items-center gap-1"
                  style={{ color: '#B08A3E' }}>
              Plan details <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </header>
          <ul className="divide-y" style={{ borderColor: '#f5f0e3' }}>
            {perks.map((perk, i) => (
              <li key={i} className="flex items-start gap-3 px-6 py-3">
                <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                     style={{ background: 'rgba(176,138,62,0.12)' }}>
                  <span style={{ color: '#B08A3E', fontSize: 12, fontWeight: 700 }}>✓</span>
                </div>
                <span className="text-sm text-gray-700">{perk}</span>
              </li>
            ))}
          </ul>
          {plan !== 'PREMIUM' && (
            <div className="px-6 py-3 border-t bg-amber-50/40" style={{ borderColor: '#f5f0e3' }}>
              <Link href="/client/plan" className="text-xs font-semibold inline-flex items-center gap-1"
                    style={{ color: '#B08A3E' }}>
                Unlock more — upgrade your plan <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
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
                  From the founder
                </h2>
              </div>
              <Link href="/client/broadcasts" className="text-xs font-semibold inline-flex items-center gap-1"
                    style={{ color: '#B08A3E' }}>
                View all <ChevronRight className="h-3.5 w-3.5" />
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
                Your information
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
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
                    style={{ borderColor: '#E8E3D8' }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{t('common.phone')}</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
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
                  className="ml-auto inline-flex items-center gap-2 rounded-xl text-white px-4 py-2.5 text-sm font-semibold hover:brightness-110 disabled:opacity-50"
                  style={{ background: '#0B1E3A' }}>
                  <Save className="h-4 w-4" /> {saving ? t('profile.saving') : t('profile.saveChanges')}
                </button>
              </div>
            </form>
          )}
        </section>

        {/* DOCUMENTS */}
        <section className="rounded-2xl border bg-white overflow-hidden"
                 style={{ borderColor: '#E8E3D8' }}>
          <header className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: '#E8E3D8' }}>
            <FileText className="h-4 w-4" style={{ color: '#B08A3E' }} />
            <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#0B1E3A' }}>
              Your documents
            </h2>
          </header>
          <div className="divide-y" style={{ borderColor: '#f5f0e3' }}>
            {[
              { type: "management" as const, title: 'Management Agreement', desc: 'Your service contract with HostMasters' },
              { type: "rules" as const,      title: 'House Rules',           desc: 'Standard rules applied to your property' },
              { type: "guide" as const,      title: 'Owner Welcome Guide',   desc: 'How to get the most out of HostMasters' },
            ].map(doc => (
              <div key={doc.type} className="flex items-center gap-3 px-6 py-3 hover:bg-amber-50/20 transition-colors">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0"
                     style={{ background: 'rgba(176,138,62,0.12)' }}>
                  <FileText className="h-4 w-4" style={{ color: '#B08A3E' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold" style={{ color: '#0B1E3A' }}>{doc.title}</p>
                  <p className="text-xs text-gray-400">{doc.desc}</p>
                </div>
                <button
                  onClick={() => downloadDoc(doc.type, ownerName)}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 transition-colors flex-shrink-0"
                  style={{ borderColor: '#E8E3D8' }}
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
                Security
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
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none"
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
                  className="ml-auto inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
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
