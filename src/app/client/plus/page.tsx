"use client"

import { useEffect, useState } from "react"
import { useLocale } from "@/i18n/provider"
import {
  Sparkles, Brain, Shield, MessageCircle, Phone, BarChart3, Wrench, Lock,
  Receipt, FileText, Activity, Star, TrendingUp, Calendar, Globe,
  Camera, Package, Home, Check, X, Zap, ArrowRight,
} from "lucide-react"
import {
  PLATFORM_FEATURES, ONE_TIME_SERVICES,
  type PlatformFeature, type OneTimeService, type PlanTier,
} from "@/lib/platform-catalog"

const ICONS = {
  Sparkles, Brain, Shield, MessageCircle, Phone, BarChart3, Wrench, Lock,
  Receipt, FileText, Activity, Star, TrendingUp, Calendar, Globe,
  Camera, Package, Home,
} as const

const TIER_META: Record<PlanTier, { label: string; color: string; monthly: number }> = {
  STARTER: { label: 'Starter', color: 'bg-gray-100 text-gray-700', monthly: 0 },
  BASIC:   { label: 'Basic',   color: 'bg-blue-50 text-blue-700',  monthly: 89 },
  MID:     { label: 'Mid',     color: 'bg-amber-50 text-amber-700', monthly: 159 },
  PREMIUM: { label: 'Premium', color: 'bg-emerald-50 text-emerald-700', monthly: 269 },
}

const TIER_ORDER: PlanTier[] = ['STARTER', 'BASIC', 'MID', 'PREMIUM']

const CATEGORY_META = {
  operations: { label: 'Operations',        color: 'text-blue-700',    icon: Wrench },
  ai:         { label: 'AI Intelligence',   color: 'text-amber-700',   icon: Brain },
  guest:      { label: 'Guest Experience',  color: 'text-emerald-700', icon: MessageCircle },
  fiscal:     { label: 'Fiscal Compliance', color: 'text-red-700',     icon: FileText },
  finance:    { label: 'Finance & Reports', color: 'text-gray-700',    icon: TrendingUp },
} as const

export default function ClientPlusPage() {
  const { t } = useLocale()
  const [myPlan, setMyPlan] = useState<PlanTier>('STARTER')
  const [loading, setLoading] = useState(true)
  const [requesting, setRequesting] = useState<string | null>(null)
  const [requested, setRequested] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)

  // Revenue calculator state
  const [nights, setNights] = useState(120)
  const [avgPrice, setAvgPrice] = useState(110)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.json())
      .then(p => {
        setMyPlan((p.subscriptionPlan as PlanTier) ?? 'STARTER')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const myTierIdx = TIER_ORDER.indexOf(myPlan)

  const requestService = async (service: OneTimeService) => {
    if (requesting) return
    setRequesting(service.id)
    const res = await fetch('/api/client/service-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId: service.id }),
    })
    setRequesting(null)
    if (res.ok) {
      setRequested(prev => ({ ...prev, [service.id]: true }))
    }
  }

  // Client-only render — eliminates all server/client hydration mismatches
  // (useLocale cookie reads, toLocaleString, plan-dependent conditionals)
  if (!mounted || loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="h-48 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          <div className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          <div className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          <div className="h-24 rounded-xl bg-gray-100 animate-pulse" />
        </div>
      </div>
    )
  }

  const unlocked = PLATFORM_FEATURES.filter(f => TIER_ORDER.indexOf(f.minTier) <= myTierIdx)
  const locked = PLATFORM_FEATURES.filter(f => TIER_ORDER.indexOf(f.minTier) > myTierIdx)
  const byCategory = <T extends { category: string }>(arr: T[]) =>
    arr.reduce<Record<string, T[]>>((acc, it) => {
      (acc[it.category] ??= []).push(it); return acc
    }, {})

  const lockedByCat = byCategory(locked)

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Hero */}
      <section className="rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0B1E3A 0%, #1F3A66 100%)' }}>
        <div className="px-6 py-10 md:px-10 md:py-14 text-white">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#D4AF5A' }}>
            <Zap className="h-3.5 w-3.5" /> {t('client.plus.badge') || 'Your property is underperforming'}
          </div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold leading-tight mb-3">
            {t('client.plus.heroTitle') || 'Unlock what your property is missing'}
          </h1>
          <p className="text-white/85 text-base md:text-lg max-w-2xl leading-relaxed">
            {t('client.plus.heroSub') ||
              'You are on the Starter plan. Your property works — but it is not growing. Discover what HostMasters can do for you.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#upgrade"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-transform hover:scale-[1.02]"
              style={{ background: '#B08A3E', color: '#0B1E3A' }}>
              See plans <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#onetime"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10">
              No commitment? Browse one-time services
            </a>
          </div>
        </div>
      </section>

      {/* ═══ REVENUE CALCULATOR + PLAN SIMULATION ═══ */}
      <PriceSimulator nights={nights} setNights={setNights} avgPrice={avgPrice} setAvgPrice={setAvgPrice} />

      {/* What you HAVE */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xl font-serif font-bold text-hm-black">Your current plan: {TIER_META[myPlan].label}</h2>
          <span className="text-xs text-gray-500">{unlocked.length} features included</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {unlocked.slice(0, 6).map(f => <FeatureCard key={f.id} feature={f} locked={false} />)}
        </div>
      </section>

      {/* What you're MISSING — the main event */}
      {locked.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-baseline justify-between">
            <div>
              <h2 className="text-2xl font-serif font-bold text-hm-black">
                {t('client.plus.missing') || "What you're missing"}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {locked.length} features your competitors already use. Upgrade or buy individually.
              </p>
            </div>
          </div>

          {Object.entries(lockedByCat).map(([cat, features]) => {
            const meta = CATEGORY_META[cat as keyof typeof CATEGORY_META]
            const Icon = meta.icon
            return (
              <div key={cat}>
                <div className={`flex items-center gap-2 mb-3 ${meta.color}`}>
                  <Icon className="h-4 w-4" />
                  <h3 className="font-bold uppercase tracking-wider text-sm">{meta.label}</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {features.map(f => <FeatureCard key={f.id} feature={f} locked={true} />)}
                </div>
              </div>
            )
          })}
        </section>
      )}

      {/* Upgrade CTA */}
      <section id="upgrade" className="rounded-2xl border-2 border-hm-gold/40 p-6 md:p-8"
        style={{ background: 'linear-gradient(135deg, rgba(176,138,62,0.08) 0%, rgba(176,138,62,0.02) 100%)' }}>
        <div className="flex items-center gap-2 text-hm-gold text-xs font-bold uppercase tracking-widest mb-2">
          <Sparkles className="h-3.5 w-3.5" /> Recommended
        </div>
        <h3 className="text-2xl font-serif font-bold text-hm-black mb-2">
          Ready to unlock the full platform?
        </h3>
        <p className="text-sm text-gray-600 mb-6 max-w-2xl">
          Upgrade to any paid plan and get all those features immediately. No setup fees.
          First month free on Premium.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(['BASIC', 'MID', 'PREMIUM'] as const).map(tier => (
            <a key={tier} href="/client/plan"
              className="rounded-xl border-2 bg-white p-4 hover:border-hm-gold transition-colors text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{TIER_META[tier].label}</p>
              <p className="text-2xl font-bold text-hm-black mt-1">€{TIER_META[tier].monthly}<span className="text-sm text-gray-400 font-normal">/mo</span></p>
              <p className="text-xs text-gray-600 mt-2">
                +{PLATFORM_FEATURES.filter(f => TIER_ORDER.indexOf(f.minTier) <= TIER_ORDER.indexOf(tier) && TIER_ORDER.indexOf(f.minTier) > myTierIdx).length} features unlocked
              </p>
              <div className="mt-3 text-hm-gold text-xs font-semibold flex items-center gap-1">
                Upgrade <ArrowRight className="h-3 w-3" />
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* One-time services — no commitment */}
      <section id="onetime" className="space-y-4">
        <div>
          <div className="flex items-center gap-2 text-hm-gold text-xs font-bold uppercase tracking-widest mb-1">
            <Package className="h-3.5 w-3.5" /> No subscription required
          </div>
          <h2 className="text-2xl font-serif font-bold text-hm-black">One-time services</h2>
          <p className="text-sm text-gray-500 mt-1">
            Keep your Starter plan. Buy only what you need, when you need it.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {ONE_TIME_SERVICES.map(s => (
            <OneTimeServiceCard
              key={s.id}
              service={s}
              requesting={requesting === s.id}
              requested={!!requested[s.id]}
              onRequest={() => requestService(s)}
            />
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="rounded-2xl bg-hm-black text-white p-6 md:p-10 text-center">
        <h3 className="text-xl md:text-2xl font-serif font-bold mb-2">
          Not sure which plan is right for you?
        </h3>
        <p className="text-white/85 text-sm mb-5 max-w-xl mx-auto">
          Your Manager knows your property. Ask them — or let us recommend based on your goals.
        </p>
        <a href="/client/messages"
          className="inline-flex items-center gap-2 rounded-xl bg-white text-hm-black px-5 py-2.5 text-sm font-bold">
          <MessageCircle className="h-4 w-4" /> Message my Manager
        </a>
      </section>
    </div>
  )
}

function FeatureCard({ feature, locked }: { feature: PlatformFeature; locked: boolean }) {
  const Icon = ICONS[feature.icon]
  const tier = TIER_META[feature.minTier]
  return (
    <div className={`rounded-xl border p-4 transition-all relative ${
      locked ? 'bg-white border-gray-200 hover:border-hm-gold/50 hover:shadow-md' : 'bg-white border-emerald-200'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
          locked ? 'bg-gray-50' : 'bg-emerald-50'
        }`}>
          <Icon className={`h-5 w-5 ${locked ? 'text-gray-400' : 'text-emerald-600'}`} />
        </div>
        <div className="flex items-center gap-1.5">
          {locked && <Lock className="h-3 w-3 text-gray-400" />}
          <span className={`text-[9px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 ${tier.color}`}>
            {tier.label}
          </span>
        </div>
      </div>
      <h3 className="font-semibold text-sm text-hm-black mb-1">{feature.title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{feature.desc}</p>
      {feature.highlight && (
        <p className="text-xs font-bold mt-2" style={{ color: '#B08A3E' }}>
          {feature.highlight}
        </p>
      )}
    </div>
  )
}

function OneTimeServiceCard({ service: s, requesting, requested, onRequest }: {
  service: OneTimeService
  requesting: boolean
  requested: boolean
  onRequest: () => void
}) {
  const Icon = ICONS[s.icon]
  return (
    <div className="rounded-xl border bg-white p-4 flex flex-col gap-3 hover:shadow-md transition-shadow relative">
      {s.popular && (
        <span className="absolute -top-2 left-4 text-[9px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 bg-hm-gold text-hm-black">
          Popular
        </span>
      )}
      <div className="flex items-start justify-between">
        <div className="h-10 w-10 rounded-lg bg-hm-gold/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-hm-gold" />
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-hm-black">€{s.price}</p>
          {s.durationLabel && <p className="text-[10px] text-gray-500">{s.durationLabel}</p>}
        </div>
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-sm text-hm-black mb-1">{s.title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
      </div>
      <button
        onClick={onRequest}
        disabled={requesting || requested}
        className={`mt-auto w-full rounded-lg py-2 text-xs font-semibold transition-colors ${
          requested ? 'bg-emerald-50 text-emerald-700' : 'bg-hm-black text-white hover:bg-hm-black/90 disabled:opacity-50'
        }`}
      >
        {requested ? <><Check className="inline h-3 w-3 mr-1" /> Requested — Manager will contact you</> :
         requesting ? 'Sending…' : 'Request this service'}
      </button>
    </div>
  )
}

// ── Price Simulator ──────────────────────────────────────────────────

const PLAN_COMMISSION: Record<string, number> = {
  STARTER: 0.22, BASIC: 0.20, MID: 0.17, PREMIUM: 0.13,
}
const PLAN_MONTHLY: Record<string, number> = {
  STARTER: 0, BASIC: 89, MID: 159, PREMIUM: 269,
}
const PLAN_CLEANING: Record<string, number> = {
  STARTER: 70, BASIC: 60, MID: 45, PREMIUM: 35,
}

function PriceSimulator({
  nights, setNights, avgPrice, setAvgPrice,
}: {
  nights: number
  setNights: (n: number) => void
  avgPrice: number
  setAvgPrice: (n: number) => void
}) {
  // Deterministic number format (avoids hydration mismatch from locale-dependent toLocaleString)
  const fmt = (n: number) => {
    const abs = Math.abs(n)
    const parts = abs.toString().split('.')
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return (n < 0 ? '-' : '') + parts.join(',')
  }

  const avgTurnovers = Math.ceil(nights / 4.5)
  const grossAnnual = nights * avgPrice

  const plans = (['STARTER', 'BASIC', 'MID', 'PREMIUM'] as const).map(tier => {
    // AI pricing uplift estimate — only on Mid/Premium
    const pricingUplift = tier === 'MID' ? 1.18 : tier === 'PREMIUM' ? 1.25 : 1.0
    const occupancyUplift = tier === 'MID' || tier === 'PREMIUM' ? 1.08 : tier === 'BASIC' ? 1.04 : 1.0
    const adjustedGross = Math.round(grossAnnual * pricingUplift * occupancyUplift)
    const commission = Math.round(adjustedGross * PLAN_COMMISSION[tier])
    const monthlyFee = PLAN_MONTHLY[tier] * 12
    const cleaningCost = avgTurnovers * PLAN_CLEANING[tier]
    const totalCost = commission + monthlyFee + cleaningCost
    const net = adjustedGross - totalCost
    return {
      tier,
      label: tier.charAt(0) + tier.slice(1).toLowerCase(),
      adjustedGross,
      commission,
      monthlyFee,
      cleaningCost,
      totalCost,
      net,
      pricingUplift,
    }
  })

  const best = plans.reduce((a, b) => a.net > b.net ? a : b)
  const starter = plans[0]

  return (
    <section className="rounded-2xl border-2 p-6 md:p-8 bg-white" style={{ borderColor: 'rgba(176,138,62,0.4)' }}>
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#B08A3E' }}>
        <TrendingUp className="h-3.5 w-3.5" /> Revenue simulator
      </div>
      <h3 className="text-2xl font-serif font-bold text-hm-black mb-1">
        See exactly how much you keep with each plan
      </h3>
      <p className="text-sm text-gray-500 mb-6">
        Adjust to your property. Numbers include AI pricing uplift, commission, fees and cleaning costs.
      </p>

      {/* Sliders */}
      <div className="grid grid-cols-2 gap-6 mb-6 max-w-2xl">
        <div>
          <label className="text-xs text-gray-600 flex justify-between mb-1">
            <span>Rented nights / year</span>
            <span className="font-bold text-hm-black">{nights}</span>
          </label>
          <input type="range" min={30} max={300} value={nights}
            onChange={e => setNights(Number(e.target.value))}
            className="w-full accent-hm-gold" />
          <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
            <span>30</span><span>150</span><span>300</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-600 flex justify-between mb-1">
            <span>Avg price / night (€)</span>
            <span className="font-bold text-hm-black">€{avgPrice}</span>
          </label>
          <input type="range" min={50} max={350} value={avgPrice}
            onChange={e => setAvgPrice(Number(e.target.value))}
            className="w-full accent-hm-gold" />
          <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
            <span>€50</span><span>€200</span><span>€350</span>
          </div>
        </div>
      </div>

      {/* Plan comparison table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2">
              <th className="text-left py-3 pr-4 text-xs text-gray-500 font-semibold" />
              {plans.map(p => (
                <th key={p.tier} className={`text-center py-3 px-3 ${p.tier === best.tier ? 'bg-hm-gold/5 rounded-t-xl' : ''}`}>
                  <span className={`text-xs font-bold ${p.tier === best.tier ? '' : 'text-gray-700'}`}
                    style={p.tier === best.tier ? { color: '#B08A3E' } : {}}>
                    {p.label}
                  </span>
                  {p.tier === best.tier && (
                    <span className="block text-[9px] font-bold uppercase tracking-wider mt-0.5"
                      style={{ color: '#B08A3E' }}>Best for you</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-xs">
            <SimRow label="Gross revenue" values={plans.map(p => `€${fmt(p.adjustedGross)}`)}
              sublabel={plans.map(p => p.pricingUplift > 1 ? `+${Math.round((p.pricingUplift - 1) * 100)}% AI` : 'static')}
              bestIdx={plans.findIndex(p => p.tier === best.tier)} />
            <SimRow label="Commission" values={plans.map(p => `-€${fmt(p.commission)}`)}
              sublabel={plans.map(p => `${Math.round(PLAN_COMMISSION[p.tier] * 100)}%`)}
              bestIdx={plans.findIndex(p => p.tier === best.tier)} neg />
            <SimRow label="Monthly fee (×12)" values={plans.map(p => p.monthlyFee ? `-€${fmt(p.monthlyFee)}` : '€0')}
              sublabel={plans.map(p => p.monthlyFee ? `€${PLAN_MONTHLY[p.tier]}/mo` : 'free')}
              bestIdx={plans.findIndex(p => p.tier === best.tier)} neg />
            <SimRow label={`Cleaning (×${avgTurnovers})`} values={plans.map(p => `-€${fmt(p.cleaningCost)}`)}
              sublabel={plans.map(p => `€${PLAN_CLEANING[p.tier]}/turn`)}
              bestIdx={plans.findIndex(p => p.tier === best.tier)} neg />
            <tr className="border-t-2 font-bold">
              <td className="py-3 pr-4 text-hm-black">You keep</td>
              {plans.map((p, i) => (
                <td key={p.tier} className={`text-center py-3 px-3 text-base ${
                  p.tier === best.tier ? 'bg-hm-gold/5 rounded-b-xl' : ''
                }`}>
                  <span className={p.net === best.net ? '' : p.net < starter.net ? 'text-red-600' : 'text-emerald-600'}
                    style={p.net === best.net ? { color: '#B08A3E' } : {}}>
                    €{fmt(p.net)}
                  </span>
                  {p.tier !== 'STARTER' && (
                    <span className={`block text-[10px] font-semibold mt-0.5 ${
                      p.net > starter.net ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {p.net > starter.net ? '+' : ''}{fmt(p.net - starter.net)}/yr vs Starter
                    </span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-gray-500 mt-4 text-center">
        Estimates based on Costa Tropical market data. AI pricing uplift: +18% (Mid), +25% (Premium).
        Occupancy uplift: +4% (Basic), +8% (Mid/Premium). Actual results vary by property and season.
      </p>
    </section>
  )
}

function SimRow({ label, values, sublabel, bestIdx, neg }: {
  label: string
  values: string[]
  sublabel?: string[]
  bestIdx: number
  neg?: boolean
}) {
  return (
    <tr className="border-b">
      <td className="py-2.5 pr-4 text-gray-600">{label}</td>
      {values.map((v, i) => (
        <td key={i} className={`text-center py-2.5 px-3 ${i === bestIdx ? 'bg-hm-gold/5' : ''}`}>
          <span className={neg ? 'text-gray-500' : 'text-hm-black font-semibold'}>{v}</span>
          {sublabel?.[i] && (
            <span className="block text-[9px] text-gray-500">{sublabel[i]}</span>
          )}
        </td>
      ))}
    </tr>
  )
}
