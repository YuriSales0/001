"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Zap, ArrowRight, Lock, X, Camera, Package, Home, Wrench, FileText,
  Sparkles, Brain, Shield, MessageCircle, Phone, BarChart3, Activity,
  TrendingUp, Globe, Check, Star, Calendar, Euro, Target, Award,
  MapPin, ChevronRight, Gem, LineChart,
} from "lucide-react"
import { useLocale } from "@/i18n/provider"
import {
  ONE_TIME_SERVICES, PLATFORM_FEATURES,
  featuresUnavailableForTier,
  type OneTimeService,
} from "@/lib/platform-catalog"

const ICONS: Record<string, any> = {
  Sparkles, Brain, Shield, MessageCircle, Phone, BarChart3, Wrench, Lock,
  Receipt: FileText, FileText, Activity, Star, TrendingUp, Calendar, Globe,
  Camera, Package, Home,
}

// ROI-ordered feature buckets for the drawer
const FEATURE_BUCKETS = [
  {
    id: 'revenue',
    label: 'More revenue',
    icon: TrendingUp,
    accent: 'emerald',
    desc: 'Features that directly grow your rental income.',
    features: ['ai_pricing', 'market_intelligence', 'pricing_analytics', 'vagf_voice_feedback'],
  },
  {
    id: 'timesave',
    label: 'Less work for you',
    icon: Zap,
    accent: 'amber',
    desc: 'The platform handles operations so you don\'t have to.',
    features: ['smart_lock', 'preventive_maintenance', 'ai_monitor', 'emergency_response', 'ai_team_chat'],
  },
  {
    id: 'protection',
    label: 'Protection & compliance',
    icon: Shield,
    accent: 'blue',
    desc: 'Legal compliance and property protection built in.',
    features: ['tax_compliance', 'multilang_statements'],
  },
]

const TIER_META: Record<string, { label: string; price: number }> = {
  BASIC:   { label: 'Basic',   price: 89 },
  MID:     { label: 'Mid',     price: 159 },
  PREMIUM: { label: 'Premium', price: 269 },
}

export function StarterDashboard() {
  const { t } = useLocale()
  const [requesting, setRequesting] = useState<string | null>(null)
  const [requested, setRequested] = useState<Record<string, boolean>>({})
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Revenue calculator state
  const [nights, setNights] = useState(120)
  const [avgPrice, setAvgPrice] = useState(110)

  const locked = featuresUnavailableForTier('STARTER')

  // DIY revenue estimate: static price × occupancy
  const diyRevenue = Math.round(nights * avgPrice)
  // Managed revenue: +25% from AI pricing, +10% from better occupancy via reviews/intel
  const managedRevenue = Math.round(diyRevenue * 1.38)
  const uplift = managedRevenue - diyRevenue
  // Mid plan annual cost + 17% commission on gross
  const midAnnualCost = 159 * 12
  const midCommission = Math.round(managedRevenue * 0.17)
  const midNet = managedRevenue - midAnnualCost - midCommission
  const diyNet = diyRevenue // Starter has no commission on rental ops (they manage themselves)

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
    <div className="space-y-8">
      {/* ═══════════════════════════════════════════════════ */}
      {/* HERO: Dramatic revenue potential                    */}
      {/* ═══════════════════════════════════════════════════ */}
      <section
        className="rounded-3xl overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #0B1E3A 0%, #142B4D 45%, #1F3A66 100%)' }}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />

        <div className="relative px-6 py-8 md:px-10 md:py-12 text-white">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#B08A3E' }}>
            <MapPin className="h-4 w-4" /> Costa Tropical Market Analysis
          </div>

          <h1 className="text-3xl md:text-5xl font-serif font-bold leading-[1.1] mb-4 max-w-3xl">
            Your property could earn{' '}
            <span style={{ color: '#B08A3E' }}>€{managedRevenue.toLocaleString('de-DE')}</span>{' '}
            <span className="text-white/50">/year</span>
          </h1>

          <p className="text-white/70 text-base md:text-lg max-w-2xl mb-6 leading-relaxed">
            Based on {nights} rented nights at an <span className="text-white">AI-optimised price</span>.
            Today, without our data intelligence, you're likely leaving{' '}
            <span className="font-bold" style={{ color: '#B08A3E' }}>€{uplift.toLocaleString('de-DE')}/year</span>{' '}
            on the table.
          </p>

          {/* Revenue comparison bars */}
          <div className="grid grid-cols-2 gap-3 max-w-2xl mb-6">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-[10px] uppercase tracking-wider text-white/50 mb-1">Your current setup</p>
              <p className="text-2xl font-bold text-white/80">€{diyRevenue.toLocaleString('de-DE')}</p>
              <p className="text-[10px] text-white/40 mt-1">DIY · static pricing · no reviews signal</p>
              <div className="mt-2 h-1 rounded-full bg-white/5">
                <div className="h-full rounded-full bg-white/30" style={{ width: '72%' }} />
              </div>
            </div>
            <div className="rounded-xl border-2 p-4" style={{ borderColor: '#B08A3E', background: 'rgba(176,138,62,0.08)' }}>
              <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: '#B08A3E' }}>With HostMasters Mid</p>
              <p className="text-2xl font-bold" style={{ color: '#B08A3E' }}>€{managedRevenue.toLocaleString('de-DE')}</p>
              <p className="text-[10px] text-white/60 mt-1">AI pricing · market intel · guest AI</p>
              <div className="mt-2 h-1 rounded-full bg-white/5">
                <div className="h-full rounded-full" style={{ width: '100%', background: '#B08A3E' }} />
              </div>
            </div>
          </div>

          {/* Interactive sliders */}
          <div className="rounded-xl bg-black/20 border border-white/10 p-4 mb-6 max-w-2xl">
            <p className="text-[10px] uppercase tracking-wider text-white/50 mb-3">Adjust to your property</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/70 flex justify-between mb-1">
                  <span>Rented nights / year</span>
                  <span className="font-bold text-white">{nights}</span>
                </label>
                <input type="range" min={30} max={300} value={nights}
                  onChange={e => setNights(Number(e.target.value))}
                  className="w-full accent-hm-gold" />
              </div>
              <div>
                <label className="text-xs text-white/70 flex justify-between mb-1">
                  <span>Avg price / night</span>
                  <span className="font-bold text-white">€{avgPrice}</span>
                </label>
                <input type="range" min={50} max={350} value={avgPrice}
                  onChange={e => setAvgPrice(Number(e.target.value))}
                  className="w-full accent-hm-gold" />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-transform hover:scale-[1.03]"
              style={{ background: '#B08A3E', color: '#0B1E3A' }}>
              See the 10 features unlocking this <ArrowRight className="h-4 w-4" />
            </button>
            <Link href="/client/plan"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5">
              Compare plans
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* STORYTELLING: Why HostMasters specifically          */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StoryCard
          icon={Brain}
          title="Costa Tropical pricing specialists"
          stat="5 zones · 500+ data points / week"
          body="We scrape Airbnb and Booking.com across Almuñécar, La Herradura, Salobreña, Motril and Nerja every week. Your pricing reflects what's actually happening in your neighbourhood — not last year's guess."
        />
        <StoryCard
          icon={LineChart}
          title="AI that pays for itself"
          stat="+25% revenue typical"
          body="Our algorithm reads 7 signals every night: seasonality, local events, competitor prices, demand, lead time, rating, occupancy. The uplift covers the Mid subscription in roughly 2 weeks."
        />
        <StoryCard
          icon={Gem}
          title="You stop being an ops team of one"
          stat="70% guest questions auto-resolved"
          body="Guest AI handles WiFi, door codes, tips, emergencies in their own language. Voice feedback captures NPS post-checkout. You get the reports — not the midnight messages."
        />
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* THE MATH: Why subscription beats one-time           */}
      {/* ═══════════════════════════════════════════════════ */}
      <section className="rounded-2xl border-2 p-6 md:p-7"
        style={{ borderColor: 'rgba(176,138,62,0.3)', background: 'linear-gradient(135deg, rgba(176,138,62,0.06) 0%, rgba(176,138,62,0.01) 100%)' }}>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#B08A3E' }}>
          <Target className="h-3.5 w-3.5" /> The math
        </div>
        <h3 className="text-2xl font-serif font-bold text-hm-black mb-5">
          Paying piece by piece costs you more
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MathRow
            oneTime="Smart Lock install: €249 one-off"
            subscription="Mid plan: €159/mo includes smart lock rotating codes + AI pricing + market intel + Guest AI"
            verdict="Mid pays back in 2 months via AI pricing alone."
          />
          <MathRow
            oneTime="3× Deep cleanings: €285"
            subscription="Basic plan: €89/mo includes preventive maintenance monthly + cleaning discount to €60"
            verdict="Basic breaks even at 4 cleanings/year."
          />
          <MathRow
            oneTime="IRNR filing one-off: €75 × 4 (quarterly) = €300/year"
            subscription="Premium plan: €269/mo includes full fiscal compliance + 43 daily AI checks + <4h emergency"
            verdict="Premium absorbs all fiscal costs + AI monitor + priority response."
          />
          <MathRow
            oneTime="Photography €199 + Channel setup €149 = €348"
            subscription="Basic plan: €89/mo includes pre/post-stay inspection + voice feedback + docs management"
            verdict="Basic recovers setup cost in 4 months + keeps working."
          />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* ONE-TIME SERVICES (still available, de-emphasised)  */}
      {/* ═══════════════════════════════════════════════════ */}
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h2 className="text-xl font-serif font-bold text-hm-black">Services for your property</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Still prefer pay-per-use? Your Manager will contact you to confirm.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ONE_TIME_SERVICES.map(s => {
            const Icon = ICONS[s.icon] ?? Package
            const done = requested[s.id]
            return (
              <div key={s.id} className="rounded-xl border bg-white p-4 flex flex-col gap-2.5 hover:shadow-md transition-shadow relative">
                {s.popular && (
                  <span className="absolute -top-2 left-3 text-[9px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5"
                    style={{ background: '#B08A3E', color: '#0B1E3A' }}>
                    Popular
                  </span>
                )}
                <div className="flex items-start justify-between">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(176,138,62,0.1)' }}>
                    <Icon className="h-4 w-4" style={{ color: '#B08A3E' }} />
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-hm-black">€{s.price}</p>
                    {s.durationLabel && <p className="text-[9px] text-gray-400">{s.durationLabel}</p>}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-hm-black mb-0.5 leading-tight">{s.title}</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{s.desc.slice(0, 90)}…</p>
                </div>
                <button
                  onClick={() => requestService(s)}
                  disabled={!!requesting || done}
                  className={`w-full rounded-lg py-2 text-xs font-bold transition-all ${
                    done
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-white hover:opacity-90 disabled:opacity-50'
                  }`}
                  style={done ? {} : { background: '#0B1E3A' }}
                >
                  {done
                    ? <><Check className="inline h-3 w-3 mr-1" /> Requested</>
                    : requesting === s.id
                    ? 'Sending…'
                    : 'Request'}
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════ */}
      {/* DRAWER: What you're missing (redesigned, ROI-first) */}
      {/* ═══════════════════════════════════════════════════ */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" onClick={() => setDrawerOpen(false)}>
          <div className="absolute inset-0 backdrop-blur-sm" style={{ background: 'rgba(11,30,58,0.55)' }} />
          <div onClick={e => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-white shadow-2xl overflow-y-auto">

            {/* Drawer header */}
            <div className="sticky top-0 z-10 px-6 py-5 border-b flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg, #0B1E3A 0%, #1F3A66 100%)' }}>
              <div className="text-white">
                <div className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: '#B08A3E' }}>
                  What you're missing
                </div>
                <h2 className="text-xl font-serif font-bold">
                  €{uplift.toLocaleString('de-DE')}/year on the table
                </h2>
                <p className="text-xs text-white/60 mt-0.5">
                  {locked.length} features · grouped by the impact they have on your return
                </p>
              </div>
              <button onClick={() => setDrawerOpen(false)}
                className="rounded-lg p-2 hover:bg-white/10 text-white/70 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Drawer body — ROI-bucketed */}
            <div className="p-6 space-y-6">
              {FEATURE_BUCKETS.map(bucket => {
                const bucketFeatures = locked.filter(f => bucket.features.includes(f.id))
                if (bucketFeatures.length === 0) return null
                const Icon = bucket.icon
                const accentBg = bucket.accent === 'emerald' ? 'bg-emerald-50' : bucket.accent === 'amber' ? 'bg-amber-50' : 'bg-blue-50'
                const accentText = bucket.accent === 'emerald' ? 'text-emerald-700' : bucket.accent === 'amber' ? 'text-amber-700' : 'text-blue-700'
                const accentBorder = bucket.accent === 'emerald' ? 'border-emerald-200' : bucket.accent === 'amber' ? 'border-amber-200' : 'border-blue-200'
                return (
                  <div key={bucket.id}>
                    <div className={`flex items-start gap-3 mb-3 rounded-xl border ${accentBorder} ${accentBg} p-4`}>
                      <div className={`h-10 w-10 rounded-lg bg-white flex items-center justify-center ${accentText} shrink-0`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className={`font-bold ${accentText}`}>{bucket.label}</h3>
                        <p className="text-xs text-gray-600 mt-0.5">{bucket.desc}</p>
                      </div>
                    </div>
                    <div className="space-y-2 ml-4">
                      {bucketFeatures.map(f => {
                        const FIcon = ICONS[f.icon] ?? Sparkles
                        const tierPrice = TIER_META[f.minTier]?.price
                        return (
                          <div key={f.id} className="rounded-lg border bg-white p-3 hover:border-hm-gold/40 transition-colors">
                            <div className="flex items-start gap-3">
                              <FIcon className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-semibold text-sm text-hm-black">{f.title}</h4>
                                  <span className="text-[9px] font-bold rounded-full px-2 py-0.5 bg-gray-100 text-gray-600">
                                    {f.minTier} · €{tierPrice}/mo
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{f.desc}</p>
                                {f.highlight && (
                                  <p className="text-xs font-bold mt-1 inline-flex items-center gap-1" style={{ color: '#B08A3E' }}>
                                    <Award className="h-3 w-3" /> {f.highlight}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {/* Plans comparison */}
              <div className="pt-6 border-t space-y-4">
                <div>
                  <h3 className="text-xl font-serif font-bold text-hm-black">Unlock everything</h3>
                  <p className="text-sm text-gray-500 mt-1">First month free on Premium. Cancel anytime.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['BASIC', 'MID', 'PREMIUM'] as const).map(tier => {
                    const featureCount = PLATFORM_FEATURES.filter(f => {
                      const order = ['STARTER', 'BASIC', 'MID', 'PREMIUM']
                      return order.indexOf(f.minTier) <= order.indexOf(tier) && f.minTier !== 'STARTER'
                    }).length
                    const recommended = tier === 'MID'
                    return (
                      <Link key={tier} href="/client/plan"
                        className={`rounded-xl border-2 p-4 block transition-all hover:shadow-lg ${
                          recommended ? 'border-hm-gold bg-hm-gold/5' : 'border-gray-200 bg-white hover:border-hm-gold/50'
                        }`}>
                        {recommended && (
                          <span className="inline-block text-[9px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 mb-2"
                            style={{ background: '#B08A3E', color: '#0B1E3A' }}>
                            Recommended
                          </span>
                        )}
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{TIER_META[tier].label}</p>
                        <p className="text-2xl font-bold text-hm-black mt-1">€{TIER_META[tier].price}<span className="text-sm text-gray-400 font-normal">/mo</span></p>
                        <p className="text-xs text-gray-500 mt-2">+{featureCount} features</p>
                        <div className="mt-3 text-xs font-bold flex items-center gap-1" style={{ color: '#B08A3E' }}>
                          Upgrade <ArrowRight className="h-3 w-3" />
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StoryCard({ icon: Icon, title, stat, body }: {
  icon: any
  title: string
  stat: string
  body: string
}) {
  return (
    <div className="rounded-2xl border p-5 bg-white hover:border-hm-gold/40 transition-colors">
      <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(176,138,62,0.1)' }}>
        <Icon className="h-5 w-5" style={{ color: '#B08A3E' }} />
      </div>
      <p className="text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: '#B08A3E' }}>{stat}</p>
      <h3 className="font-serif font-bold text-hm-black mb-2">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed">{body}</p>
    </div>
  )
}

function MathRow({ oneTime, subscription, verdict }: {
  oneTime: string
  subscription: string
  verdict: string
}) {
  return (
    <div className="rounded-xl bg-white border p-4 space-y-2">
      <div className="text-xs text-gray-600">
        <span className="text-red-600 font-semibold">One-time route:</span> {oneTime}
      </div>
      <div className="text-xs text-gray-600">
        <span className="font-semibold" style={{ color: '#B08A3E' }}>Subscription:</span> {subscription}
      </div>
      <div className="pt-2 border-t text-xs font-bold text-emerald-700 flex items-start gap-1.5">
        <Check className="h-3.5 w-3.5 shrink-0 mt-0.5" /> {verdict}
      </div>
    </div>
  )
}
