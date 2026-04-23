"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Zap, ArrowRight, Lock, X, Camera, Package, Home, Wrench, FileText,
  Sparkles, Brain, Shield, MessageCircle, Phone, BarChart3, Activity,
  TrendingUp, Globe, Check, Star, Calendar,
} from "lucide-react"
import { useLocale } from "@/i18n/provider"
import { gt } from "@/lib/guest-i18n"
import {
  ONE_TIME_SERVICES, PLATFORM_FEATURES,
  featuresUnavailableForTier,
  type OneTimeService, type PlanTier,
} from "@/lib/platform-catalog"

const ICONS: Record<string, any> = {
  Sparkles, Brain, Shield, MessageCircle, Phone, BarChart3, Wrench, Lock,
  Receipt: FileText, FileText, Activity, Star, TrendingUp, Calendar, Globe,
  Camera, Package, Home,
}

const TIER_META: Record<string, { label: string; price: number }> = {
  BASIC:   { label: 'Basic',   price: 89 },
  MID:     { label: 'Mid',     price: 159 },
  PREMIUM: { label: 'Premium', price: 269 },
}

/**
 * Starter-specific dashboard.
 * Replaces the standard dashboard for users on the free (€0) plan.
 * Shows: one-time services + upsell banner + "what you're missing" drawer.
 */
export function StarterDashboard() {
  const { t, locale } = useLocale()
  const [requesting, setRequesting] = useState<string | null>(null)
  const [requested, setRequested] = useState<Record<string, boolean>>({})
  const [drawerOpen, setDrawerOpen] = useState(false)

  const locked = featuresUnavailableForTier('STARTER')

  const requestService = async (s: OneTimeService) => {
    if (requesting) return
    setRequesting(s.id)
    const res = await fetch('/api/client/service-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId: s.id }),
    })
    setRequesting(null)
    if (res.ok) setRequested(prev => ({ ...prev, [s.id]: true }))
  }

  return (
    <div className="space-y-6">
      {/* ━━━ BANNER: Low performance warning ━━━ */}
      <section
        className="rounded-2xl overflow-hidden cursor-pointer group transition-transform hover:scale-[1.002]"
        onClick={() => setDrawerOpen(true)}
        style={{ background: 'linear-gradient(135deg, #0B1E3A 0%, #1F3A66 100%)' }}
      >
        <div className="px-6 py-6 md:px-8 md:py-8 text-white relative">
          <div className="absolute top-4 right-4 opacity-15 group-hover:opacity-30 transition-opacity">
            <Lock className="h-20 w-20" style={{ color: '#B08A3E' }} />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#B08A3E' }}>
            <Zap className="h-4 w-4" /> {t('client.plus.badge')}
          </div>
          <h2 className="text-2xl md:text-3xl font-serif font-bold leading-tight mb-2">
            {t('client.plus.heroTitle')}
          </h2>
          <p className="text-white/60 text-sm md:text-base max-w-xl mb-4">
            {locked.length} features that your competitors are already using. AI pricing, smart lock, fiscal compliance, voice feedback.
          </p>
          <div className="inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold group-hover:scale-105 transition-transform"
            style={{ background: '#B08A3E', color: '#0B1E3A' }}>
            {t('client.plus.cardCta')} <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </section>

      {/* ━━━ ONE-TIME SERVICES — Main content ━━━ */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-hm-black">Services for your property</h2>
            <p className="text-sm text-gray-500 mt-0.5">No subscription. Buy only what you need.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {ONE_TIME_SERVICES.map(s => {
            const Icon = ICONS[s.icon] ?? Package
            const done = requested[s.id]
            return (
              <div key={s.id} className="rounded-xl border bg-white p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow relative">
                {s.popular && (
                  <span className="absolute -top-2.5 left-4 text-[9px] font-bold uppercase tracking-wider rounded-full px-2.5 py-0.5"
                    style={{ background: '#B08A3E', color: '#0B1E3A' }}>
                    Popular
                  </span>
                )}
                <div className="flex items-start justify-between">
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(176,138,62,0.1)' }}>
                    <Icon className="h-5 w-5" style={{ color: '#B08A3E' }} />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-hm-black">€{s.price}</p>
                    {s.durationLabel && <p className="text-[10px] text-gray-400">{s.durationLabel}</p>}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm text-hm-black mb-1">{s.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
                </div>
                <button
                  onClick={() => requestService(s)}
                  disabled={!!requesting || done}
                  className={`mt-auto w-full rounded-xl py-2.5 text-sm font-bold transition-all ${
                    done
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'text-white hover:opacity-90 disabled:opacity-50'
                  }`}
                  style={done ? {} : { background: '#0B1E3A' }}
                >
                  {done
                    ? <><Check className="inline h-3.5 w-3.5 mr-1" /> Requested — Manager will contact you</>
                    : requesting === s.id
                    ? 'Sending…'
                    : 'Request this service'}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* ━━━ DRAWER: What you're missing ━━━ */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <div onClick={e => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-white shadow-2xl overflow-y-auto animate-[slideIn_0.2s_ease-out]">
            <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-serif font-bold text-hm-black">{t('client.plus.missing')}</h2>
                <p className="text-xs text-gray-500">{locked.length} features you don't have yet</p>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="rounded-lg p-2 hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {locked.map(f => {
                const Icon = ICONS[f.icon] ?? Sparkles
                const tierColor = f.minTier === 'PREMIUM'
                  ? 'bg-emerald-50 text-emerald-700'
                  : f.minTier === 'MID'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-blue-50 text-blue-700'
                return (
                  <div key={f.id} className="rounded-xl border p-4 hover:border-hm-gold/40 transition-colors">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-sm text-hm-black">{f.title}</h4>
                          <span className={`text-[9px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 ${tierColor}`}>
                            {f.minTier}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
                        {f.highlight && (
                          <p className="text-xs font-bold mt-1" style={{ color: '#B08A3E' }}>{f.highlight}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* Plans at the bottom of the drawer */}
              <div className="pt-6 border-t space-y-3">
                <h3 className="text-lg font-serif font-bold text-hm-black">Unlock everything</h3>
                <p className="text-sm text-gray-500">Choose a plan. First month free on Premium.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['BASIC', 'MID', 'PREMIUM'] as const).map(tier => (
                    <Link key={tier} href="/client/plan"
                      className="rounded-xl border-2 bg-white p-4 hover:border-hm-gold transition-colors block">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{TIER_META[tier].label}</p>
                      <p className="text-2xl font-bold text-hm-black mt-1">€{TIER_META[tier].price}<span className="text-sm text-gray-400 font-normal">/mo</span></p>
                      <div className="mt-2 text-xs font-semibold flex items-center gap-1" style={{ color: '#B08A3E' }}>
                        Upgrade <ArrowRight className="h-3 w-3" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
