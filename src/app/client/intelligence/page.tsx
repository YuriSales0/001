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
      .then(d => { if (d && d.length > 0) setData(d[0]) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 rounded bg-gray-100 w-64" />
      <div className="h-48 rounded-hm bg-gray-100" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-hm-black">{t('client.intelligence.title')}</h1>
          <span className="rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: 'rgba(176,138,62,0.15)', color: '#B08A3E' }}>Beta</span>
        </div>
        <p className="text-sm text-gray-500 mt-1">{t('client.intelligence.subtitle')}</p>
      </div>

      <div className="rounded-hm border p-4 flex items-start gap-3" style={{ background: 'rgba(176,138,62,0.04)', borderColor: 'rgba(176,138,62,0.15)' }}>
        <Info className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#B08A3E' }} />
        <div>
          <p className="text-sm font-semibold text-hm-black">{t('client.intelligence.monitoring')}</p>
          <p className="text-xs text-gray-500 mt-1">{t('client.intelligence.monitoringDesc')}</p>
        </div>
      </div>

      {data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard icon={BarChart3} label={t('client.intelligence.avgPrice')} value={data.avgPrice ? `€${data.avgPrice.toFixed(0)}` : '—'} sub={t('client.intelligence.costaAvg')} />
            <StatCard icon={TrendingUp} label={t('client.intelligence.avgOccupancy')} value={data.avgOccupancy ? `${data.avgOccupancy.toFixed(0)}%` : '—'} sub={t('client.intelligence.allListings')} />
            <StatCard icon={MapPin} label={t('client.intelligence.listingsTracked')} value={data.listingsScraped.toString()} sub="Almuñécar · Nerja · Salobreña · Motril" />
          </div>
          {data.topInsight && (
            <div className="rounded-hm border bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{t('client.intelligence.weeklyInsight')}</p>
              <p className="text-sm text-gray-700 leading-relaxed">{data.topInsight}</p>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-hm border bg-white p-10 text-center">
          <BarChart3 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
          <h3 className="font-semibold text-hm-black mb-1">{t('client.intelligence.dataCollection')}</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">{t('client.intelligence.dataCollectionDesc')}</p>
        </div>
      )}

      <div className="rounded-hm border bg-gray-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">{t('client.intelligence.howItWorks')}</p>
        <div className="grid sm:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-semibold text-hm-black mb-1">{t('client.intelligence.phase1')}</p>
            <p className="text-xs text-gray-500">{t('client.intelligence.phase1Desc')}</p>
          </div>
          <div>
            <p className="font-semibold text-hm-black mb-1">{t('client.intelligence.phase2')}</p>
            <p className="text-xs text-gray-500">{t('client.intelligence.phase2Desc')}</p>
          </div>
          <div>
            <p className="font-semibold text-hm-black mb-1">{t('client.intelligence.phase3')}</p>
            <p className="text-xs text-gray-500">{t('client.intelligence.phase3Desc')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-hm border bg-white p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="h-4 w-4" style={{ color: '#B08A3E' }} />
        <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold text-hm-black">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  )
}
