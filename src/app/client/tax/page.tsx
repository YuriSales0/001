"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  FileText, AlertTriangle, CheckCircle2, Clock, Lock,
  Shield, ArrowRight, Download, Calendar as CalendarIcon,
} from "lucide-react"

type Obligation = {
  id: string
  type: string
  status: string
  periodLabel: string
  dueDate: string | null
  completedAt: string | null
  documentUrl: string | null
  notes: string | null
  property: { id: string; name: string } | null
}

const TYPE_LABEL: Record<string, string> = {
  VUT_LICENSE: "VUT — Tourist License",
  MODELO_179: "Modelo 179 — Quarterly Guest Report",
  IRNR_MODELO_210: "IRNR — Non-Resident Income Tax",
  NIE: "NIE — Foreign ID Number",
  ENERGY_CERTIFICATE: "Energy Performance Certificate",
  FISCAL_REPRESENTATIVE: "Fiscal Representative",
  IBI: "IBI — Property Tax",
  OTHER: "Other",
}

const TYPE_DESC: Record<string, string> = {
  VUT_LICENSE: "Mandatory license from Junta de Andalucía to operate short-term rentals",
  MODELO_179: "Quarterly declaration of guests to Spanish Tax Agency — €20 fine per guest not reported",
  IRNR_MODELO_210: "19% income tax on rental earnings (24% for non-EU residents), filed quarterly",
  NIE: "Required for all non-resident owners — foundation of your Spanish fiscal identity",
  ENERGY_CERTIFICATE: "Mandatory for all rentals, valid for 10 years (up to €6,000 fine without it)",
  FISCAL_REPRESENTATIVE: "Mandatory for non-EU residents — receives official notifications",
  IBI: "Annual property tax from the local city council",
  OTHER: "Other fiscal obligation",
}

const STATUS_COLOR: Record<string, { bg: string; text: string; label: string }> = {
  NOT_STARTED:     { bg: "bg-gray-100",   text: "text-gray-600",   label: "Not started" },
  IN_PROGRESS:     { bg: "bg-blue-100",   text: "text-blue-700",   label: "In progress" },
  ACTION_REQUIRED: { bg: "bg-amber-100",  text: "text-amber-700",  label: "Action required" },
  COMPLETED:       { bg: "bg-green-100",  text: "text-green-700",  label: "Completed" },
  EXPIRED:         { bg: "bg-red-100",    text: "text-red-700",    label: "Expired" },
  NOT_APPLICABLE:  { bg: "bg-gray-50",    text: "text-gray-400",   label: "N/A" },
}

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"

const daysUntil = (s: string | null): number | null => {
  if (!s) return null
  const ms = new Date(s).getTime() - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

export default function ClientTaxPage() {
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [plan, setPlan] = useState<string>("STARTER")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/tax-obligations").then(r => r.ok ? r.json() : []),
      fetch("/api/me").then(r => r.ok ? r.json() : null),
    ]).then(([obls, me]) => {
      setObligations(obls)
      setPlan(me?.subscriptionPlan ?? "STARTER")
      setLoading(false)
    })
  }, [])

  const hasAccess = plan === "MID" || plan === "PREMIUM"
  const isPremium = plan === "PREMIUM"

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 rounded bg-gray-100 w-64" />
        <div className="h-40 rounded-xl bg-gray-100" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-xl bg-gray-100" />)}
        </div>
      </div>
    )
  }

  // STARTER / BASIC — upsell gate
  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-hm-black">
            Tax & Compliance
          </h1>
          <p className="mt-1 font-sans text-hm-slate/70 text-base">
            Stay on top of every fiscal obligation for your property in Spain.
          </p>
        </div>

        {/* Risk callout — what you're exposed to without compliance */}
        <div className="rounded-hm border-2 border-red-300 p-6" style={{ background: "rgba(239,68,68,0.04)" }}>
          <div className="flex items-start gap-3 mb-4">
            <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(239,68,68,0.15)" }}>
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-hm-black text-lg">What unmanaged compliance costs you</h2>
              <p className="font-sans text-sm text-hm-slate/70 mt-0.5">
                Real fines from the Junta de Andalucía and Agencia Tributaria for short-term rental owners in 2025.
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <FineCard
              label="No VUT licence"
              fine="€3,000 – €30,000"
              detail="Operating without registered tourist licence (Decreto 28/2016, Junta de Andalucía)"
            />
            <FineCard
              label="No NRU registration"
              fine="Listing removed"
              detail="Mandatory since 1 Jul 2025 — Airbnb / Booking de-list properties without it"
            />
            <FineCard
              label="Modelo 179 not filed"
              fine="€20 per guest"
              detail="Quarterly guest report. A property with 80 guests/year = €1,600+ in penalties"
            />
            <FineCard
              label="No Energy Certificate"
              fine="up to €6,000"
              detail="Mandatory for any rental — fine on top of being unable to advertise legally"
            />
            <FineCard
              label="IRNR not filed"
              fine="50% – 150% of tax owed"
              detail="Non-resident income tax (Modelo 210) — penalties stack quarterly + interest"
            />
            <FineCard
              label="No fiscal representative (non-EU)"
              fine="€1,000 – €6,000"
              detail="Mandatory for UK / Norwegian / Swiss owners — Spanish state must reach you"
            />
          </div>
        </div>

        <div className="rounded-hm border border-hm-border p-10 text-center" style={{ background: "var(--hm-sand)" }}>
          <div className="h-16 w-16 rounded-full mx-auto mb-5 flex items-center justify-center"
               style={{ background: "var(--hm-gold)", opacity: 0.9 }}>
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-hm-black mb-2">
            Unlock Tax &amp; Compliance tracking
          </h2>
          <p className="font-sans text-hm-slate/70 max-w-md mx-auto mb-6">
            Stop carrying the risk yourself. Track VUT, NRU, Modelo 179, IRNR, NIE and energy certificate in one place — with deadline alerts months before fines hit.
          </p>
          <div className="max-w-md mx-auto text-left mb-6 space-y-2">
            {[
              { f: "Mid", t: "Deadline tracking for every Spanish fiscal obligation" },
              { f: "Mid", t: "Document vault for licences and certificates" },
              { f: "Mid", t: "Automatic alerts 60 / 30 / 7 days before each deadline" },
              { f: "Premium", t: "Full service — Modelo 179 + IRNR filed by our certified tax advisor" },
              { f: "Premium", t: "NRU registration handled for you" },
              { f: "Premium", t: "Fiscal representative service for non-EU residents" },
            ].map((feat, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--hm-gold)" }} />
                <span className="text-hm-slate flex-1">{feat.t}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0"
                      style={{ background: feat.f === "Premium" ? "rgba(176,138,62,0.2)" : "rgba(27,79,138,0.1)",
                               color: feat.f === "Premium" ? "var(--hm-gold-dk)" : "var(--hm-blue)" }}>
                  {feat.f}
                </span>
              </div>
            ))}
          </div>
          <Link href="/client/plan"
            className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-sans font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: "var(--hm-black)" }}
          >
            See plans <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-xs text-hm-slate/50 mt-3">
            Mid €159/mo · Premium €269/mo — both are tax-deductible against your rental income.
          </p>
        </div>
      </div>
    )
  }

  // MID / PREMIUM — full view
  const upcoming = obligations.filter(o => {
    if (o.status === "COMPLETED" || o.status === "NOT_APPLICABLE") return false
    const days = daysUntil(o.dueDate)
    return days !== null && days <= 60
  })

  const completed = obligations.filter(o => o.status === "COMPLETED")
  const actionRequired = obligations.filter(o => o.status === "ACTION_REQUIRED" || o.status === "EXPIRED")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-hm-black">
            Tax & Compliance
          </h1>
          <p className="mt-1 font-sans text-hm-slate/70 text-base">
            Your Spanish fiscal obligations at a glance.
          </p>
        </div>
        <span className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{
          background: isPremium ? "rgba(176,138,62,0.15)" : "rgba(27,79,138,0.1)",
          color: isPremium ? "var(--hm-gold-dk)" : "var(--hm-blue)",
        }}>
          {isPremium ? "Premium · Full service" : "Mid · Tracking & alerts"}
        </span>
      </div>

      {/* Action required alert */}
      {actionRequired.length > 0 && (
        <div className="rounded-xl border-2 border-amber-300 p-5 flex items-start gap-4" style={{ background: "rgba(245,158,11,0.08)" }}>
          <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="font-serif font-semibold text-hm-black">
              {actionRequired.length} obligation{actionRequired.length > 1 ? "s" : ""} require{actionRequired.length === 1 ? "s" : ""} attention
            </p>
            <p className="font-sans text-sm text-hm-slate/70 mt-0.5">
              Contact your manager to resolve pending items before they expire.
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard icon={Clock} label="Upcoming (60d)" value={upcoming.length} color="#B08A3E" />
        <SummaryCard icon={AlertTriangle} label="Action required" value={actionRequired.length} color="#A32D2D" />
        <SummaryCard icon={CheckCircle2} label="Completed" value={completed.length} color="#2A7A4F" />
        <SummaryCard icon={FileText} label="Total tracked" value={obligations.length} color="#1B4F8A" />
      </div>

      {/* Obligations list */}
      <div className="rounded-hm border border-hm-border overflow-hidden" style={{ background: "var(--hm-sand)" }}>
        <div className="px-6 py-4 border-b border-hm-border">
          <h2 className="font-serif font-bold text-hm-black text-lg">All obligations</h2>
        </div>
        {obligations.length === 0 ? (
          <div className="p-10 text-center font-sans text-hm-slate/60">
            No obligations tracked yet. Your manager will set these up for you.
          </div>
        ) : (
          <div className="divide-y divide-hm-border">
            {obligations.map(o => (
              <ObligationRow key={o.id} obligation={o} />
            ))}
          </div>
        )}
      </div>

      {/* Premium service info */}
      {isPremium ? (
        <div className="rounded-hm border border-hm-border p-6" style={{ background: "var(--hm-black)" }}>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--hm-gold)" }}>
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-white">Premium fiscal service</h3>
              <p className="font-sans text-sm text-white/60 mt-1">
                Your Modelo 179, IRNR and fiscal representative are handled by our team in coordination with a certified Spanish tax advisor.
                If you need anything, message your manager directly.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <Link href="/client/plan" className="block rounded-hm border-2 border-dashed border-hm-gold/30 p-6 hover:border-hm-gold/60 transition-colors">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--hm-gold)", opacity: 0.9 }}>
              <Lock className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-serif font-semibold text-hm-black">Want us to file for you?</p>
              <p className="font-sans text-sm text-hm-slate/70">
                Upgrade to Premium — we handle Modelo 179 and IRNR with a certified Spanish tax advisor.
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-hm-gold-dk" />
          </div>
        </Link>
      )}
    </div>
  )
}

function FineCard({ label, fine, detail }: { label: string; fine: string; detail: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-white p-3">
      <p className="font-sans text-xs font-semibold text-hm-slate/70 uppercase tracking-wider">{label}</p>
      <p className="font-serif text-lg font-bold text-red-700 mt-1">{fine}</p>
      <p className="font-sans text-[11px] text-hm-slate/60 mt-1 leading-snug">{detail}</p>
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border border-hm-border p-4" style={{ background: "var(--hm-sand)" }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4" style={{ color }} />
        <span className="font-sans text-xs uppercase tracking-widest text-hm-slate/60">{label}</span>
      </div>
      <p className="font-serif text-2xl font-bold text-hm-black">{value}</p>
    </div>
  )
}

function ObligationRow({ obligation: o }: { obligation: Obligation }) {
  const statusMeta = STATUS_COLOR[o.status] ?? STATUS_COLOR.NOT_STARTED
  const days = daysUntil(o.dueDate)
  const isUrgent = days !== null && days <= 14 && o.status !== "COMPLETED"

  return (
    <div className="px-6 py-4 hover:bg-hm-ivory/50 transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-serif font-semibold text-hm-black">{TYPE_LABEL[o.type] ?? o.type}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusMeta.bg} ${statusMeta.text}`}>
              {statusMeta.label}
            </span>
            <span className="text-xs text-hm-slate/60">· {o.periodLabel}</span>
            {o.property && <span className="text-xs text-hm-slate/50">· {o.property.name}</span>}
          </div>
          <p className="font-sans text-xs text-hm-slate/70 mb-2">{TYPE_DESC[o.type] ?? ""}</p>
          {o.notes && (
            <p className="font-sans text-xs text-hm-slate/60 italic border-l-2 border-hm-border pl-2 mt-1">{o.notes}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          {o.dueDate && o.status !== "COMPLETED" && (
            <>
              <div className="flex items-center gap-1.5 text-xs text-hm-slate/60 justify-end">
                <CalendarIcon className="h-3 w-3" /> {fmtDate(o.dueDate)}
              </div>
              {days !== null && (
                <p className={`text-xs mt-0.5 font-semibold ${isUrgent ? "text-hm-red" : "text-hm-slate/60"}`}>
                  {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days}d left`}
                </p>
              )}
            </>
          )}
          {o.status === "COMPLETED" && o.completedAt && (
            <p className="text-xs text-hm-green">Completed {fmtDate(o.completedAt)}</p>
          )}
          {o.documentUrl && (
            <a href={o.documentUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-hm-gold-dk hover:underline mt-1">
              <Download className="h-3 w-3" /> Document
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
