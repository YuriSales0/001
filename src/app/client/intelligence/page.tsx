"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { BarChart3, TrendingUp, MapPin, Info, Rocket, Brain, Eye, Zap, Lock } from "lucide-react"
import { useLocale } from "@/i18n/provider"

const MarketMap = dynamic(
  () => import("@/components/market/market-map").then(m => ({ default: m.MarketMap })),
  { ssr: false, loading: () => <MapSkeleton /> },
)

type MarketData = {
  avgPrice: number | null
  avgOccupancy: number | null
  listingsScraped: number
  topInsight: string | null
  weekOf: string
}

type UserPlan = 'STARTER' | 'BASIC' | 'MID' | 'PREMIUM' | null

function MapSkeleton() {
  return (
    <div className="rounded-xl bg-gray-900 flex items-center justify-center" style={{ height: 520 }}>
      <div className="flex items-center gap-2 text-white/40 text-sm">
        <div className="h-2 w-2 rounded-full bg-[#B08A3E] animate-pulse" />
        Loading market map…
      </div>
    </div>
  )
}

export default function ClientIntelligencePage() {
  const { t } = useLocale()
  const [data, setData] = useState<MarketData | null>(null)
  const [plan, setPlan] = useState<UserPlan>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    Promise.all([
      fetch('/api/market-intelligence').then(r => r.ok ? r.json() : null),
      fetch('/api/me').then(r => r.ok ? r.json() : null),
    ]).then(([intel, me]) => {
      if (intel && intel.length > 0) setData(intel[0])
      if (me?.subscriptionPlan) setPlan(me.subscriptionPlan as UserPlan)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const isPaid = plan === 'BASIC' || plan === 'MID' || plan === 'PREMIUM'

  if (!mounted || loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 rounded bg-gray-100 w-64" />
      <div className="h-48 rounded-xl bg-gray-100" />
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-serif font-bold text-hm-black">{t('client.intelligence.title')}</h1>
          <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: 'rgba(176,138,62,0.15)', color: '#B08A3E' }}>Beta</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">{t('client.intelligence.subtitle')}</p>
      </div>

      {/* Info banner */}
      <div className="rounded-xl border p-4 flex items-start gap-3" style={{ background: 'rgba(176,138,62,0.04)', borderColor: 'rgba(176,138,62,0.15)' }}>
        <Info className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#B08A3E' }} />
        <div>
          <p className="text-sm font-semibold text-hm-black">{t('client.intelligence.monitoring')}</p>
          <p className="text-xs text-gray-500 mt-1">{t('client.intelligence.monitoringDesc')}</p>
        </div>
      </div>

      {/* Deck.gl Map — paid subscribers see the interactive map with demo data */}
      {isPaid ? (
        <div className="rounded-xl overflow-hidden border" style={{ height: 520, borderColor: 'rgba(176,138,62,0.2)' }}>
          <MarketMap />
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden relative" style={{ height: 340, borderColor: 'rgba(176,138,62,0.2)' }}>
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center">
            <div className="text-center px-6 max-w-md">
              <div className="h-14 w-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                   style={{ background: 'rgba(176,138,62,0.2)' }}>
                <Lock className="h-7 w-7" style={{ color: '#D4AF5A' }} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Interactive Market Map</h3>
              <p className="text-sm text-white/60 mb-4">
                Explore Costa Tropical with our real-time Deck.gl map — heatmaps, 3D columns, zone analysis,
                and competitor benchmarking. Available on Basic, Mid, and Premium plans.
              </p>
              <a href="/client/plan"
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold"
                style={{ background: '#B08A3E', color: '#0B1E3A' }}>
                <Zap className="h-4 w-4" />
                Upgrade to unlock
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Stats cards */}
      {data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={BarChart3} label={t('client.intelligence.avgPrice')} value={data.avgPrice ? `€${data.avgPrice.toFixed(0)}` : '—'} sub={t('client.intelligence.costaAvg')} />
            <StatCard icon={TrendingUp} label={t('client.intelligence.avgOccupancy')} value={data.avgOccupancy ? `${data.avgOccupancy.toFixed(0)}%` : '—'} sub={t('client.intelligence.allListings')} />
            <StatCard icon={MapPin} label={t('client.intelligence.listingsTracked')} value={data.listingsScraped.toString()} sub="Almuñécar · Nerja · Salobreña · Motril" />
          </div>
          {data.topInsight && (
            <div className="rounded-xl border bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{t('client.intelligence.weeklyInsight')}</p>
              <p className="text-sm text-gray-700 leading-relaxed">{data.topInsight}</p>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border bg-white p-10 text-center">
          <BarChart3 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <h3 className="font-semibold text-hm-black mb-1">{t('client.intelligence.dataCollection')}</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">{t('client.intelligence.dataCollectionDesc')}</p>
        </div>
      )}

      {/* Roadmap — what the platform is building */}
      <div className="rounded-xl border bg-gradient-to-br from-[#0B1E3A] to-[#132d55] p-6 text-white">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(176,138,62,0.2)' }}>
            <Rocket className="h-4 w-4" style={{ color: '#D4AF5A' }} />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#D4AF5A' }}>
              {t('client.intelligence.howItWorks')}
            </p>
            <p className="text-sm text-white/70">What HostMasters is building for your property</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <RoadmapCard
            icon={Eye}
            phase={t('client.intelligence.phase1')}
            desc={t('client.intelligence.phase1Desc')}
            status="live"
          />
          <RoadmapCard
            icon={Brain}
            phase={t('client.intelligence.phase2')}
            desc={t('client.intelligence.phase2Desc')}
            status="building"
          />
          <RoadmapCard
            icon={Zap}
            phase={t('client.intelligence.phase3')}
            desc={t('client.intelligence.phase3Desc')}
            status="planned"
          />
        </div>

        <div className="mt-5 pt-4 border-t border-white/10">
          <p className="text-xs text-white/50 leading-relaxed">
            Our AI scrapes 500+ competitor listings weekly across Costa Tropical. Combined with your property&apos;s performance data,
            this feeds the pricing engine that optimises your nightly rates. Mid and Premium subscribers already benefit from +18–25% revenue
            uplift through AI dynamic pricing. The interactive map above visualises this data — explore zones, compare competitors, and
            understand exactly where your property stands in the market.
          </p>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4" style={{ color: '#B08A3E' }} />
        <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-hm-black">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  )
}

function RoadmapCard({ icon: Icon, phase, desc, status }: {
  icon: React.ElementType
  phase: string
  desc: string
  status: 'live' | 'building' | 'planned'
}) {
  const badge = status === 'live'
    ? { label: 'LIVE', bg: 'bg-emerald-500/20', text: 'text-emerald-400' }
    : status === 'building'
    ? { label: 'BUILDING', bg: 'bg-amber-500/20', text: 'text-amber-400' }
    : { label: 'PLANNED', bg: 'bg-blue-500/20', text: 'text-blue-400' }

  return (
    <div className="rounded-lg bg-white/5 border border-white/10 p-4">
      <div className="flex items-center justify-between mb-2">
        <Icon className="h-4 w-4" style={{ color: '#D4AF5A' }} />
        <span className={`text-[9px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 ${badge.bg} ${badge.text}`}>
          {badge.label}
        </span>
      </div>
      <p className="font-semibold text-white text-sm mb-1">{phase}</p>
      <p className="text-xs text-white/60 leading-relaxed">{desc}</p>
    </div>
  )
}
