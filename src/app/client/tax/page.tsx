"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  FileText, AlertTriangle, CheckCircle2, Clock, Lock,
  Shield, ArrowRight, Download, Calendar as CalendarIcon,
} from "lucide-react"
import { useLocale } from "@/i18n/provider"

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

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"

const daysUntil = (s: string | null): number | null => {
  if (!s) return null
  const ms = new Date(s).getTime() - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

export default function ClientTaxPage() {
  const { t } = useLocale()
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [plan, setPlan] = useState<string>("STARTER")
  const [loading, setLoading] = useState(true)

  const TYPE_LABEL: Record<string, string> = {
    VUT_LICENSE: t('client.tax.vut'),
    MODELO_179: t('client.tax.modelo179'),
    IRNR_MODELO_210: t('client.tax.irnr'),
    NIE: t('client.tax.nie'),
    ENERGY_CERTIFICATE: t('client.tax.energyCert'),
    FISCAL_REPRESENTATIVE: t('client.tax.fiscalRep'),
    IBI: t('client.tax.ibi'),
    OTHER: t('client.tax.other'),
  }

  const TYPE_DESC: Record<string, string> = {
    VUT_LICENSE: t('client.tax.descVut'),
    MODELO_179: t('client.tax.descModelo179'),
    IRNR_MODELO_210: t('client.tax.descIrnr'),
    NIE: t('client.tax.descNie'),
    ENERGY_CERTIFICATE: t('client.tax.descEnergyCert'),
    FISCAL_REPRESENTATIVE: t('client.tax.descFiscalRep'),
    IBI: t('client.tax.descIbi'),
    OTHER: t('client.tax.descOther'),
  }

  const STATUS_COLOR: Record<string, { bg: string; text: string; label: string }> = {
    NOT_STARTED:     { bg: "bg-gray-100",   text: "text-gray-600",   label: t('client.tax.notStarted') },
    IN_PROGRESS:     { bg: "bg-blue-100",   text: "text-blue-700",   label: t('client.tax.inProgress') },
    ACTION_REQUIRED: { bg: "bg-amber-100",  text: "text-amber-700",  label: t('client.tax.actionRequired') },
    COMPLETED:       { bg: "bg-green-100",  text: "text-green-700",  label: t('client.tax.statusCompleted') },
    EXPIRED:         { bg: "bg-red-100",    text: "text-red-700",    label: t('client.tax.statusExpired') },
    NOT_APPLICABLE:  { bg: "bg-gray-50",    text: "text-gray-400",   label: t('client.tax.notApplicable') },
  }

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
        <div className="h-40 rounded-hm bg-gray-100" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-hm bg-gray-100" />)}
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
            {t('client.tax.title')}
          </h1>
          <p className="mt-1 font-sans text-hm-slate/70 text-base">
            {t('client.tax.subtitle')}
          </p>
        </div>

        {/* Risk callout — what you're exposed to without compliance */}
        <div className="rounded-hm border-2 border-red-300 p-6" style={{ background: "rgba(239,68,68,0.04)" }}>
          <div className="flex items-start gap-3 mb-4">
            <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(239,68,68,0.15)" }}>
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-hm-black text-lg">{t('client.tax.riskTitle')}</h2>
              <p className="font-sans text-sm text-hm-slate/70 mt-0.5">
                {t('client.tax.riskDesc')}
              </p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <FineCard
              label={t('client.tax.fineNoVut')}
              fine={t('client.tax.fineNoVutAmount')}
              detail={t('client.tax.fineNoVutDetail')}
            />
            <FineCard
              label={t('client.tax.fineNoNru')}
              fine={t('client.tax.fineNoNruAmount')}
              detail={t('client.tax.fineNoNruDetail')}
            />
            <FineCard
              label={t('client.tax.fineModelo179')}
              fine={t('client.tax.fineModelo179Amount')}
              detail={t('client.tax.fineModelo179Detail')}
            />
            <FineCard
              label={t('client.tax.fineNoCert')}
              fine={t('client.tax.fineNoCertAmount')}
              detail={t('client.tax.fineNoCertDetail')}
            />
            <FineCard
              label={t('client.tax.fineIrnr')}
              fine={t('client.tax.fineIrnrAmount')}
              detail={t('client.tax.fineIrnrDetail')}
            />
            <FineCard
              label={t('client.tax.fineNoFiscalRep')}
              fine={t('client.tax.fineNoFiscalRepAmount')}
              detail={t('client.tax.fineNoFiscalRepDetail')}
            />
          </div>
        </div>

        <div className="rounded-hm border border-hm-border p-10 text-center" style={{ background: "var(--hm-sand)" }}>
          <div className="h-16 w-16 rounded-full mx-auto mb-5 flex items-center justify-center"
               style={{ background: "var(--hm-gold)", opacity: 0.9 }}>
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-hm-black mb-2">
            {t('client.tax.unlockTitle')}
          </h2>
          <p className="font-sans text-hm-slate/70 max-w-md mx-auto mb-6">
            {t('client.tax.unlockDesc')}
          </p>
          <div className="max-w-md mx-auto text-left mb-6 space-y-2">
            {[
              { f: "Mid", txt: t('client.tax.featMidDeadline') },
              { f: "Mid", txt: t('client.tax.featMidVault') },
              { f: "Mid", txt: t('client.tax.featMidAlerts') },
              { f: "Premium", txt: t('client.tax.featPremiumFiled') },
              { f: "Premium", txt: t('client.tax.featPremiumNru') },
              { f: "Premium", txt: t('client.tax.featPremiumFiscalRep') },
            ].map((feat, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--hm-gold)" }} />
                <span className="text-hm-slate flex-1">{feat.txt}</span>
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
            {t('client.tax.seePlans')} <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-xs text-hm-slate/50 mt-3">
            {t('client.tax.planPrices')}
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-hm-black">
            {t('client.tax.title')}
          </h1>
          <p className="mt-1 font-sans text-hm-slate/70 text-base">
            {t('client.tax.subtitleFull')}
          </p>
        </div>
        <span className="rounded-full px-3 py-1.5 text-xs font-semibold" style={{
          background: isPremium ? "rgba(176,138,62,0.15)" : "rgba(27,79,138,0.1)",
          color: isPremium ? "var(--hm-gold-dk)" : "var(--hm-blue)",
        }}>
          {isPremium ? t('client.tax.premiumFullService') : t('client.tax.midTracking')}
        </span>
      </div>

      {/* Action required alert */}
      {actionRequired.length > 0 && (
        <div className="rounded-hm border-2 border-amber-300 p-5 flex items-start gap-4" style={{ background: "rgba(245,158,11,0.08)" }}>
          <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="font-serif font-semibold text-hm-black">
              {t('client.tax.obligationsAttention').replace('{count}', String(actionRequired.length))}
            </p>
            <p className="font-sans text-sm text-hm-slate/70 mt-0.5">
              {t('client.tax.contactManagerResolve')}
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard icon={Clock} label={t('client.tax.upcoming60d')} value={upcoming.length} color="#B08A3E" />
        <SummaryCard icon={AlertTriangle} label={t('client.tax.actionRequired')} value={actionRequired.length} color="#A32D2D" />
        <SummaryCard icon={CheckCircle2} label={t('client.tax.statusCompleted')} value={completed.length} color="#2A7A4F" />
        <SummaryCard icon={FileText} label={t('client.tax.totalTracked')} value={obligations.length} color="#1B4F8A" />
      </div>

      {/* Obligations list */}
      <div className="rounded-hm border border-hm-border overflow-hidden" style={{ background: "var(--hm-sand)" }}>
        <div className="px-6 py-4 border-b border-hm-border">
          <h2 className="font-serif font-bold text-hm-black text-lg">{t('client.tax.allObligations')}</h2>
        </div>
        {obligations.length === 0 ? (
          <div className="p-10 text-center font-sans text-hm-slate/60">
            {t('client.tax.noObligations')}
          </div>
        ) : (
          <div className="divide-y divide-hm-border">
            {obligations.map(o => (
              <ObligationRow key={o.id} obligation={o} typeLabel={TYPE_LABEL} typeDesc={TYPE_DESC} statusColor={STATUS_COLOR} />
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
              <h3 className="font-serif font-bold text-white">{t('client.tax.premiumServiceTitle')}</h3>
              <p className="font-sans text-sm text-white/60 mt-1">
                {t('client.tax.premiumServiceDesc')}
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
              <p className="font-serif font-semibold text-hm-black">{t('client.tax.wantUsFiled')}</p>
              <p className="font-sans text-sm text-hm-slate/70">
                {t('client.tax.wantUsFiledDesc')}
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
    <div className="rounded-hm border border-hm-border p-4" style={{ background: "var(--hm-sand)" }}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4" style={{ color }} />
        <span className="font-sans text-xs uppercase tracking-widest text-hm-slate/60">{label}</span>
      </div>
      <p className="font-serif text-2xl font-bold text-hm-black">{value}</p>
    </div>
  )
}

function ObligationRow({ obligation: o, typeLabel, typeDesc, statusColor }: {
  obligation: Obligation
  typeLabel: Record<string, string>
  typeDesc: Record<string, string>
  statusColor: Record<string, { bg: string; text: string; label: string }>
}) {
  const { t } = useLocale()
  const statusMeta = statusColor[o.status] ?? statusColor.NOT_STARTED
  const days = daysUntil(o.dueDate)
  const isUrgent = days !== null && days <= 14 && o.status !== "COMPLETED"

  return (
    <div className="px-6 py-4 hover:bg-hm-ivory/50 transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-serif font-semibold text-hm-black">{typeLabel[o.type] ?? o.type}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusMeta.bg} ${statusMeta.text}`}>
              {statusMeta.label}
            </span>
            <span className="text-xs text-hm-slate/60">· {o.periodLabel}</span>
            {o.property && <span className="text-xs text-hm-slate/50">· {o.property.name}</span>}
          </div>
          <p className="font-sans text-xs text-hm-slate/70 mb-2">{typeDesc[o.type] ?? ""}</p>
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
                  {days < 0 ? `${Math.abs(days)}d ${t('client.tax.overdue')}` : days === 0 ? t('client.tax.todayLabel') : `${days}d ${t('client.tax.daysLeft')}`}
                </p>
              )}
            </>
          )}
          {o.status === "COMPLETED" && o.completedAt && (
            <p className="text-xs text-hm-green">{t('client.tax.completedOn')} {fmtDate(o.completedAt)}</p>
          )}
          {o.documentUrl && (
            <a href={o.documentUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-hm-gold-dk hover:underline mt-1">
              <Download className="h-3 w-3" /> {t('client.tax.document')}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
