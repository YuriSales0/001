"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, Save, Lock, FileText, Download, Star, User } from "lucide-react"
import { useLocale } from "@/i18n/provider"

interface Profile {
  id: string; name: string | null; email: string; phone: string | null
  image: string | null; bio: string | null; subscriptionPlan: string | null
  subscriptionStatus: string | null; role: string; createdAt: string
}

const PLAN_COLOR: Record<string, string> = {
  STARTER: "bg-gray-100 text-gray-700",
  BASIC:   "bg-blue-100 text-blue-800",
  MID:     "bg-violet-100 text-violet-800",
  PREMIUM: "bg-amber-100 text-amber-800",
}

const PLAN_DESC: Record<string, string> = {
  STARTER: "Essentials — Check-in, Check-out, Cleaning",
  BASIC:   "Basic + Pre/Post Inspection",
  MID:     "Mid + Extended support",
  PREMIUM: "Full service — Inspection, Shopping, Transfer, Laundry",
}

async function downloadDoc(type: "management" | "rules" | "guide", ownerName: string) {
  const { jsPDF } = await import("jspdf")
  const doc = new jsPDF()
  const W = doc.internal.pageSize.getWidth()

  // Header
  doc.setFillColor(15, 15, 15)
  doc.rect(0, 0, W, 20, "F")
  doc.setFillColor(180, 145, 75)
  doc.rect(0, 0, W, 2, "F")
  doc.setFont("helvetica", "bold")
  doc.setFontSize(12)
  doc.setTextColor(180, 145, 75)
  doc.text("HostMasters", 20, 13)

  doc.setFontSize(9)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(180, 180, 180)

  if (type === "management") {
    doc.text("Property Management Agreement", W - 20, 13, { align: "right" })
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(15, 15, 15)
    doc.text("Property Management Agreement", 20, 40)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(80, 80, 80)
    const lines = [
      `Owner: ${ownerName}`,
      `Date: ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`,
      "",
      "This agreement is entered into between HostMasters (the Company) and the",
      "property owner identified above (the Client).",
      "",
      "1. SERVICES",
      "HostMasters agrees to provide short-term rental management services including",
      "guest coordination, maintenance oversight, and financial reporting.",
      "",
      "2. COMMISSION",
      "The Company will charge a management commission as agreed in the subscription",
      "plan. Commission is deducted from gross rental income before payout.",
      "",
      "3. OWNER OBLIGATIONS",
      "The Owner agrees to keep the property in good condition, maintain valid insurance,",
      "and provide access for approved maintenance and guest visits.",
      "",
      "4. TERM",
      "This agreement renews automatically on a monthly basis unless either party",
      "provides 30 days written notice of termination.",
      "",
      "5. CONFIDENTIALITY",
      "Both parties agree to keep financial terms and guest information confidential.",
    ]
    let y = 55
    lines.forEach(line => {
      if (line.match(/^\d\./)) {
        doc.setFont("helvetica", "bold")
        doc.setTextColor(15, 15, 15)
      } else {
        doc.setFont("helvetica", "normal")
        doc.setTextColor(80, 80, 80)
      }
      doc.text(line, 20, y)
      y += 6.5
    })
    doc.save("HostMasters_Management_Agreement.pdf")

  } else if (type === "rules") {
    doc.text("House Rules & Property Regulations", W - 20, 13, { align: "right" })
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(15, 15, 15)
    doc.text("House Rules", 20, 40)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(80, 80, 80)
    const sections = [
      ["CHECK-IN / CHECK-OUT", ["Check-in: 15:00 | Check-out: 11:00", "Early/late check-in subject to availability and prior arrangement."]],
      ["GUESTS", ["Maximum occupancy as stated in the listing.", "Unregistered guests are not permitted overnight."]],
      ["NOISE & RESPECT", ["Quiet hours: 22:00 – 08:00.", "No parties, events or large gatherings without written approval."]],
      ["SMOKING", ["Strictly no smoking inside the property.", "Designated outdoor area available."]],
      ["PETS", ["Pets allowed only if pre-approved in writing.", "Owner responsible for any pet-related damage."]],
      ["DAMAGE", ["Any damage must be reported immediately.", "Guests are liable for damages beyond normal wear."]],
      ["EMERGENCY", ["Emergency contact available 24/7 via the HostMasters app.", "For medical emergencies call 112."]],
    ]
    let y = 55
    sections.forEach(([title, items]) => {
      doc.setFont("helvetica", "bold")
      doc.setTextColor(180, 145, 75)
      doc.text(title as string, 20, y)
      y += 6
      doc.setFont("helvetica", "normal")
      doc.setTextColor(80, 80, 80)
      ;(items as string[]).forEach(item => {
        doc.text(`• ${item}`, 24, y)
        y += 5.5
      })
      y += 3
    })
    doc.save("HostMasters_House_Rules.pdf")

  } else {
    doc.text("Owner Welcome Guide", W - 20, 13, { align: "right" })
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(15, 15, 15)
    doc.text(`Welcome, ${ownerName.split(" ")[0]}`, 20, 40)
    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(80, 80, 80)
    doc.text("Your HostMasters Owner Guide", 20, 50)
    const sections = [
      ["YOUR DASHBOARD", [
        "Access financials, bookings, and maintenance at client.hostmasters.es",
        "Real-time notifications when crew completes a visit.",
        "Monthly reports sent automatically to your email.",
      ]],
      ["TASK FLOW", [
        "Every reservation triggers automatic tasks for our crew.",
        "Crew completes a check-out report after each stay.",
        "You receive the report summary by email.",
      ]],
      ["MAINTENANCE", [
        "Request corrective maintenance from the Care section.",
        "Preventive checks are included in MID and PREMIUM plans.",
        "All maintenance costs are logged and visible in your dashboard.",
      ]],
      ["PAYOUTS", [
        "Net payout = Gross revenue − Commission − Expenses.",
        "Payouts scheduled per your plan's payout calendar.",
        "All transactions visible in My Earnings.",
      ]],
      ["CONTACT", [
        "For urgent matters: WhatsApp us at the number in your dashboard.",
        "For general questions: use the Contact us section.",
      ]],
    ]
    let y = 62
    sections.forEach(([title, items]) => {
      doc.setFont("helvetica", "bold")
      doc.setTextColor(180, 145, 75)
      doc.setFontSize(10)
      doc.text(title as string, 20, y)
      y += 6
      doc.setFont("helvetica", "normal")
      doc.setTextColor(80, 80, 80)
      doc.setFontSize(9.5)
      ;(items as string[]).forEach(item => {
        doc.text(`• ${item}`, 24, y)
        y += 5.5
      })
      y += 3
    })
    doc.save("HostMasters_Owner_Welcome_Guide.pdf")
  }
}

export default function ClientProfilePage() {
  const { t } = useLocale()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ name: "", phone: "", image: "" })
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" })
  const [pwError, setPwError] = useState("")
  const [pwSaved, setPwSaved] = useState(false)

  useEffect(() => {
    fetch("/api/profile").then(r => r.json()).then(d => {
      setProfile(d)
      setForm({ name: d.name ?? "", phone: d.phone ?? "", image: d.image ?? "" })
      setLoading(false)
    })
  }, [])

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
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

  if (loading) return <div className="p-8 text-sm text-gray-400">{t('common.loading')}</div>

  const plan = profile?.subscriptionPlan ?? "STARTER"
  const ownerName = profile?.name ?? profile?.email ?? "Owner"

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--hm-black)' }}>{t('common.myProfile')}</h1>
        <p className="text-sm text-gray-500">{t('profile.subtitle')}</p>
      </div>

      {/* Photo + identity */}
      <form onSubmit={save} className="rounded-xl border bg-white p-5 space-y-5">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center"
                 style={{ border: '3px solid var(--hm-gold)' }}>
              {form.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 rounded-full p-1.5 text-white shadow"
              style={{ background: 'var(--hm-gold)' }}>
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>
          <div>
            <p className="font-semibold" style={{ color: 'var(--hm-black)' }}>{profile?.name ?? profile?.email}</p>
            <p className="text-xs text-gray-500">{profile?.email}</p>
            <span className={`mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold ${PLAN_COLOR[plan]}`}>
              {plan} {t('profile.planSuffix')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">{t('profile.fullName')}</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': 'var(--hm-gold)' } as React.CSSProperties} />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">{t('common.phone')}</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
              placeholder="+34 600 000 000" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">{t('auth.email')}</label>
            <input value={profile?.email ?? ""} disabled
              className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center justify-between pt-1">
          {saved && <span className="text-sm font-medium" style={{ color: 'var(--hm-green)' }}>{t('profile.savedSuccessfully')}</span>}
          <button type="submit" disabled={saving}
            className="ml-auto inline-flex items-center gap-2 rounded-xl text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--hm-black)' }}>
            <Save className="h-4 w-4" /> {saving ? t('profile.saving') : t('profile.saveChanges')}
          </button>
        </div>
      </form>

      {/* Subscription plan */}
      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-4 w-4" style={{ color: 'var(--hm-gold)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--hm-black)' }}>{t('profile.subscriptionPlan')}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className={`rounded px-2.5 py-1 text-xs font-bold ${PLAN_COLOR[plan]}`}>{plan}</span>
            <p className="text-xs text-gray-500 mt-1.5">{PLAN_DESC[plan]}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">{t('common.status')}</p>
            <p className={`text-sm font-semibold ${profile?.subscriptionStatus === 'ACTIVE' ? 'text-emerald-600' : 'text-amber-600'}`}>
              {profile?.subscriptionStatus ?? t('common.active')}
            </p>
          </div>
        </div>
        <a href="/client/plan"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5 border hover:bg-gray-50 transition-colors"
          style={{ color: 'var(--hm-gold-dk)' }}>
          {t('profile.viewPlanDetails')} →
        </a>
      </div>

      {/* Documents */}
      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-semibold" style={{ color: 'var(--hm-black)' }}>{t('profile.yourDocuments')}</span>
        </div>
        <div className="space-y-3">
          {[
            { type: "management" as const, title: "Property Management Agreement", desc: "Your signed management contract with HostMasters." },
            { type: "rules" as const,      title: "House Rules",                   desc: "Rules and regulations for your property guests." },
            { type: "guide" as const,      title: "Owner Welcome Guide",           desc: "Everything you need to know as a HostMasters owner." },
          ].map(doc => (
            <div key={doc.type} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-gray-50 transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0"
                   style={{ background: 'rgba(180,145,75,0.1)' }}>
                <FileText className="h-4 w-4" style={{ color: 'var(--hm-gold)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'var(--hm-black)' }}>{doc.title}</p>
                <p className="text-xs text-gray-400">{doc.desc}</p>
              </div>
              <button
                onClick={() => downloadDoc(doc.type, ownerName)}
                className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-gray-100 transition-colors flex-shrink-0"
              >
                <Download className="h-3 w-3" /> {t('common.download')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Password */}
      <form onSubmit={savePassword} className="rounded-xl border bg-white p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-semibold" style={{ color: 'var(--hm-black)' }}>{t('profile.changePassword')}</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[[t('profile.currentPassword'), "current"], [t('profile.newPassword'), "next"], [t('profile.confirmNew'), "confirm"]].map(([label, key]) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
              <input type="password" value={pw[key as keyof typeof pw]}
                onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none" />
            </div>
          ))}
        </div>
        {pwError && <p className="text-sm text-red-600">{pwError}</p>}
        <div className="flex items-center justify-between">
          {pwSaved && <span className="text-sm font-medium text-emerald-600">{t('profile.passwordUpdated')}</span>}
          <button type="submit"
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white text-gray-700 px-4 py-2.5 text-sm font-medium hover:bg-gray-50">
            {t('profile.updatePassword')}
          </button>
        </div>
      </form>
    </div>
  )
}
