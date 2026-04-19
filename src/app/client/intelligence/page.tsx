"use client"

import { useEffect, useState } from "react"
import { BarChart3, TrendingUp, MapPin, Info } from "lucide-react"
import { useLocale } from "@/i18n/provider"

type MarketData = {
  avgPrice: number | null
  avgOccupancy: number | null
  listingsScraped: number
  topInsight: string | null
  weekOf: string
}

export default function ClientIntelligencePage() {
  const { t } = useLocale()
  const [data, setData] = useState<MarketData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/market-intelligence')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d && d.length > 0) setData(d[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 rounded bg-gray-100 w-64" />
        <div className="h-48 rounded-xl bg-gray-100" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-28 rounded-xl bg-gray-100" />
          <div className="h-28 rounded-xl bg-gray-100" />
          <div className="h-28 rounded-xl bg-gray-100" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold text-navy-900">Market Intelligence</h1>
            <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: 'rgba(176,138,62,0.15)', color: '#B08A3E' }}>
              Beta
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Costa Tropical short-term rental market data. Updated weekly.
          </p>
        </div>
      </div>

      {/* Contribution banner */}
      <div className="rounded-xl border p-4 flex items-start gap-3" style={{ background: 'rgba(176,138,62,0.04)', borderColor: 'rgba(176,138,62,0.15)' }}>
        <Info className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#B08A3E' }} />
        <div>
          <p className="text-sm font-semibold text-navy-900">HostMasters is monitoring the market for you</p>
          <p className="text-xs text-gray-500 mt-1">
            Your property data contributes to our dataset. The more properties we manage, the more accurate our pricing and occupancy predictions become. Together we build better intelligence.
          </p>
        </div>
      </div>

      {/* Market stats */}
      {data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              icon={BarChart3}
              label="Avg. nightly price"
              value={data.avgPrice ? `€${data.avgPrice.toFixed(0)}` : '—'}
              sub="Costa Tropical average"
            />
            <StatCard
              icon={TrendingUp}
              label="Avg. occupancy"
              value={data.avgOccupancy ? `${data.avgOccupancy.toFixed(0)}%` : '—'}
              sub="Across all monitored listings"
            />
            <StatCard
              icon={MapPin}
              label="Listings tracked"
              value={data.listingsScraped.toString()}
              sub="Almuñécar · Nerja · Salobreña · Motril"
            />
          </div>

          {data.topInsight && (
            <div className="rounded-xl border bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Weekly insight</p>
              <p className="text-sm text-gray-700 leading-relaxed">{data.topInsight}</p>
              <p className="text-[10px] text-gray-400 mt-2">
                Week of {new Date(data.weekOf).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border bg-white p-10 text-center">
          <BarChart3 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <h3 className="font-semibold text-navy-900 mb-1">Data collection in progress</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            We are building the Costa Tropical dataset. Market intelligence will appear here as data becomes available. Your property is already contributing.
          </p>
        </div>
      )}

      {/* Phase explanation */}
      <div className="rounded-xl border bg-gray-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">How it works</p>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-semibold text-navy-900 mb-1">Phase 1 — Now</p>
            <p className="text-xs text-gray-500">Weekly market scraping. Average prices, occupancy rates, and competitor analysis across the Costa Tropical.</p>
          </div>
          <div>
            <p className="font-semibold text-navy-900 mb-1">Phase 2 — Coming</p>
            <p className="text-xs text-gray-500">AI-powered pricing recommendations based on seasonality, events, and your property's specific performance data.</p>
          </div>
          <div>
            <p className="font-semibold text-navy-900 mb-1">Phase 3 — Future</p>
            <p className="text-xs text-gray-500">Automated dynamic pricing. The system adjusts your nightly rate in real-time based on demand, competition, and historical patterns.</p>
          </div>
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
      <p className="text-2xl font-bold text-navy-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  )
}
