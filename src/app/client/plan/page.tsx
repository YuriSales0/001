"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Star, ArrowRight, Loader2 } from "lucide-react"
import { PlanBadge } from "@/components/hm/plan-badge"
import { useLocale } from "@/i18n/provider"
import { showToast } from "@/components/hm/toast"

type PlanId = "STARTER" | "BASIC" | "MID" | "PREMIUM"

interface PlanConfig {
  id: PlanId
  monthlyFee: number | null
  annualFee: number | null
  commission: number
  firstMonthFree: boolean
  color: string
  accent: string
  featureKeys: string[]
  noteKey?: string
}

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

export default function OwnerPlan() {
  const { t } = useLocale()

  const PLANS: PlanConfig[] = [
    {
      id: "STARTER", monthlyFee: null, annualFee: null, commission: 22, firstMonthFree: false,
      color: "bg-hm-sand", accent: "text-hm-slate",
      featureKeys: ['feat_fullStr', 'feat_listings', 'feat_guestComms', 'feat_monthlyStatement', 'feat_dashboard', 'feat_cleaningStarter'],
      noteKey: 'maintenanceNotIncl',
    },
    {
      id: "BASIC", monthlyFee: 89, annualFee: 890, commission: 20, firstMonthFree: true,
      color: "bg-hm-blue/5", accent: "text-hm-blue",
      featureKeys: ['feat_everything', 'feat_preventive', 'feat_inspection', 'feat_docMgmt', 'feat_cleaningBasic'],
      noteKey: 'correctiveMaintNote',
    },
    {
      id: "MID", monthlyFee: 159, annualFee: 1590, commission: 17, firstMonthFree: true,
      color: "bg-hm-gold/8", accent: "text-hm-gold-dk",
      featureKeys: ['feat_everything', 'feat_aiPricing', 'feat_priority12h', 'feat_anyLanguage', 'feat_cleaningMid'],
      noteKey: 'correctiveMaintNote',
    },
    {
      id: "PREMIUM", monthlyFee: 269, annualFee: 2690, commission: 13, firstMonthFree: false,
      color: "bg-hm-black", accent: "text-hm-gold",
      featureKeys: ['feat_everything', 'feat_fiscal', 'feat_upsells', 'feat_emergency4h', 'feat_cleaningPremium'],
    },
  ]

  const [currentPlan, setCurrentPlan] = useState<PlanId>("STARTER")
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/me")
      .then(r => r.ok ? r.json() : null)
      .then((me: { subscriptionPlan?: PlanId | null } | null) => {
        const plan = me?.subscriptionPlan as PlanId | null
        setCurrentPlan(plan ?? "STARTER")
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="h-64 rounded-hm bg-hm-sand animate-pulse" />
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-hm-black">{t('client.plan.myPlan')}</h1>
        <p className="mt-1 font-sans text-lg text-hm-slate/70">
          {t('client.plan.subtitle')}
        </p>
      </div>

      {/* Current plan */}
      <div className="rounded-hm border border-hm-border p-6"
           style={{ background: 'var(--hm-sand)' }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-sans text-xs uppercase tracking-widest text-hm-slate/60 mb-1">
              {t('client.plan.yourCurrentPlan')}
            </p>
            <PlanBadge plan={currentPlan} size="lg" />
          </div>
          <div className="flex items-center gap-1.5 font-sans text-sm text-hm-green">
            <CheckCircle2 className="h-4 w-4" />
            {t('common.active')}
          </div>
        </div>
        <div className="mt-4 font-sans text-sm text-hm-slate/70">
          {t('client.plan.commissionRate')}: <strong className="text-hm-black">
            {PLANS.find(p => p.id === currentPlan)?.commission}%
          </strong> {t('client.plan.onBookings')}
        </div>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-2">
        <div className="flex rounded-lg border border-hm-border p-1"
             style={{ background: 'var(--hm-sand)' }}>
          <button
            onClick={() => setBilling("monthly")}
            className={`px-5 py-2 rounded-md font-sans text-sm font-medium transition-colors ${
              billing === "monthly" ? "bg-hm-black text-white" : "text-hm-slate hover:bg-hm-border/60"
            }`}
          >
            {t('client.plan.monthly')}
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`px-5 py-2 rounded-md font-sans text-sm font-medium transition-colors ${
              billing === "annual" ? "bg-hm-black text-white" : "text-hm-slate hover:bg-hm-border/60"
            }`}
          >
            {t('client.plan.annual')}
            <span className="ml-1.5 rounded-full bg-hm-green text-white text-[10px] px-1.5 py-0.5">
              {t('client.plan.twoMonthsFree')}
            </span>
          </button>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PLANS.map(plan => {
          const isCurrent = plan.id === currentPlan
          const isUpgrade = PLANS.findIndex(p => p.id === plan.id) >
                            PLANS.findIndex(p => p.id === currentPlan)
          const isPremium = plan.id === "PREMIUM"

          const price = billing === "annual" ? plan.annualFee : plan.monthlyFee

          return (
            <div
              key={plan.id}
              className={`rounded-hm border-2 overflow-hidden transition-all ${
                isCurrent
                  ? "border-hm-gold"
                  : "border-hm-border hover:border-hm-gold/40"
              }`}
            >
              {/* Card header */}
              <div className={`px-6 py-5 ${
                isPremium ? "bg-hm-black" : "bg-hm-sand"
              }`}>
                <div className="flex items-start justify-between">
                  <PlanBadge plan={plan.id} size="md" />
                  {isCurrent && (
                    <span className="flex items-center gap-1 text-xs font-sans font-semibold text-hm-gold">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      {t('client.plan.current')}
                    </span>
                  )}
                </div>

                {/* Price */}
                <div className="mt-4">
                  {price !== null ? (
                    <>
                      <span className={`text-4xl font-serif font-bold ${isPremium ? "text-white" : "text-hm-black"}`}>
                        {fmtEUR(price)}
                      </span>
                      <span className={`font-sans text-sm ml-1 ${isPremium ? "text-white/60" : "text-hm-slate/60"}`}>
                        /{billing === "annual" ? t('client.plan.year') : t('client.plan.month')}
                      </span>
                      {billing === "annual" && plan.monthlyFee && (
                        <div className={`font-sans text-sm mt-1 ${isPremium ? "text-white/50" : "text-hm-slate/50"}`}>
                          ({fmtEUR(Math.round(price / 12))}/{t('client.plan.month')})
                        </div>
                      )}
                      {plan.firstMonthFree && billing === "monthly" && (
                        <div className="mt-1 font-sans text-sm text-hm-green font-semibold">
                          {t('client.plan.firstMonthFree')}
                        </div>
                      )}
                    </>
                  ) : (
                    <span className={`text-4xl font-serif font-bold ${isPremium ? "text-white" : "text-hm-black"}`}>
                      {t('client.plan.free')}
                    </span>
                  )}
                </div>
                <p className={`mt-1 font-sans text-sm ${isPremium ? "text-white/60" : "text-hm-slate/60"}`}>
                  + {plan.commission}% {t('client.plan.commissionOnBookings')}
                </p>
              </div>

              {/* Features */}
              <div className="px-6 py-5 space-y-2.5 border-t border-hm-border"
                   style={{ background: 'var(--hm-ivory)' }}>
                {plan.featureKeys.map(fk => (
                  <div key={fk} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-hm-green mt-0.5 shrink-0" />
                    <span className="font-sans text-sm text-hm-slate">{t(`client.plan.${fk}`)}</span>
                  </div>
                ))}
                {plan.noteKey && (
                  <p className="font-sans text-xs text-hm-slate/50 italic mt-3">{t(`client.plan.${plan.noteKey}`)}</p>
                )}
              </div>

              {/* CTA */}
              {!isCurrent && isUpgrade && (
                <div className="px-6 pb-5" style={{ background: 'var(--hm-ivory)' }}>
                  <UpgradeButton planId={plan.id} planLabel={t(`client.plan.${plan.id.toLowerCase()}Name`)} isPremium={isPremium} t={t} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Annual savings */}
      {billing === "annual" && (
        <div className="rounded-hm border border-hm-green/30 p-5 text-center"
             style={{ background: 'rgba(42,122,79,0.06)' }}>
          <p className="font-serif font-bold text-hm-green text-lg">
            {t('client.plan.annualSavings')}
          </p>
          <p className="font-sans text-sm text-hm-slate/70 mt-1">
            {t('client.plan.annualSavingsSub')}
          </p>
        </div>
      )}

      {/* Contact */}
      <div className="text-center font-sans text-sm text-hm-slate/60">
        {t('client.plan.questionsAboutPlan')}{" "}
        <a href="mailto:hello@hostmasters.es" className="text-hm-gold-dk underline">
          {t('client.plan.contactUs')}
        </a>{" "}
        {t('client.plan.happyToHelp')}
      </div>
    </div>
  )
}

function UpgradeButton({ planId, planLabel, isPremium, t }: {
  planId: string; planLabel: string; isPremium: boolean; t: (k: string) => string
}) {
  const [loading, setLoading] = useState(false)

  const handleUpgrade = async () => {
    setLoading(true)
    try {
      const meRes = await fetch('/api/me')
      const me = await meRes.json()
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, userId: me.id }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast(data.error ?? t('client.plan.checkoutError'), 'error')
        return
      }
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      showToast(t('client.plan.connectionError'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      className="flex items-center justify-center gap-2 w-full rounded-lg py-3 font-sans font-semibold text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
      style={{ background: isPremium ? 'var(--hm-gold)' : 'var(--hm-black)', minHeight: '48px' }}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{t('client.plan.upgradeTo')} {planLabel} <ArrowRight className="h-4 w-4" /></>}
    </button>
  )
}
