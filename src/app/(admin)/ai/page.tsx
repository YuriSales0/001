'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Sparkles, TrendingUp, BarChart3, Calendar, AlertCircle, MapPin, Cpu, ArrowUpRight, ArrowDownRight, Minus, Target } from 'lucide-react'

// Market Map — client-only (deck.gl needs window)
const MarketMap = dynamic(
  () => import('@/components/market/market-map').then(m => m.MarketMap),
  { ssr: false, loading: () => (
    <div className="h-[calc(100vh-10rem)] w-full flex items-center justify-center bg-[#0a0e1a] rounded-xl text-white/50 text-sm">
      A preparar o mapa…
    </div>
  )},
)

type Tab = 'pricing' | 'engine' | 'market'

type PricingFactor = {
  name: string
  effect: number
  description: string
}

type PricingSuggestion = {
  basePrice: number
  suggestedPrice: number
  confidence: 'LOW' | 'MEDIUM' | 'HIGH'
  factors: PricingFactor[]
  competitorMedian: number | null
  competitorCount: number
  dataPoints: number
  percentile: number | null
}

type PropertySuggestion = {
  propertyId: string
  propertyName: string
  zoneId: string | null
  bedrooms: number
  suggestion: PricingSuggestion
}

type EngineData = {
  targetMonth: number
  targetDayOfWeek: number
  propertyCount: number
  competitorCount: number
  suggestions: PropertySuggestion[]
}

type StatsData = {
  totalPoints: number
  byMonth: { monthOfYear: number; _avg: { priceCharged: number | null }; _count: number }[]
  byPlatform: { platform: string | null; _avg: { priceCharged: number | null }; _count: number }[]
  byDayOfWeek: { dayOfWeek: number; _avg: { priceCharged: number | null }; _count: number }[]
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_NAMES   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export default function AIPage() {
  const [tab, setTab] = useState<Tab>('pricing')
  const [stats, setStats] = useState<StatsData | null>(null)
  const [engine, setEngine] = useState<EngineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [engineLoading, setEngineLoading] = useState(false)
  const [engineMonth, setEngineMonth] = useState(new Date().getMonth() + 1)
  const [engineDay, setEngineDay] = useState(5) // Saturday

  useEffect(() => {
    fetch('/api/ai/stats')
      .then(r => r.ok ? r.json() : null)
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const loadEngine = (month: number, day: number) => {
    setEngineLoading(true)
    fetch(`/api/ai/pricing-engine?month=${month}&dayOfWeek=${day}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setEngine(d); setEngineLoading(false) })
      .catch(() => setEngineLoading(false))
  }

  useEffect(() => {
    if (tab === 'engine' && !engine) loadEngine(engineMonth, engineDay)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  const totalPoints = stats?.totalPoints ?? 0
  const byMonth = stats?.byMonth ?? []
  const byPlatform = stats?.byPlatform ?? []
  const byDayOfWeek = stats?.byDayOfWeek ?? []
  const maxMonthAvg = Math.max(...byMonth.map(m => m._avg.priceCharged ?? 0), 1)
  const maxDayAvg   = Math.max(...byDayOfWeek.map(d => d._avg.priceCharged ?? 0), 1)

  return (
    <div className="p-6 space-y-6">
      {/* Header + Tabs */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-hm-black flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-amber-500" />
            AI Pricing Intelligence
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Dados de pricing + inteligência geospatial do mercado — tudo num só lugar
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-gray-100 p-1 w-fit">
        <button
          onClick={() => setTab('pricing')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            tab === 'pricing' ? 'bg-white text-hm-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Pricing Data
        </button>
        <button
          onClick={() => setTab('engine')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            tab === 'engine' ? 'bg-white text-hm-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Cpu className="h-4 w-4" />
          Motor de Pricing
        </button>
        <button
          onClick={() => setTab('market')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
            tab === 'market' ? 'bg-white text-hm-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <MapPin className="h-4 w-4" />
          Market Intelligence
        </button>
      </div>

      {/* ═══ Tab: Pricing Data ═══ */}
      {tab === 'pricing' && (
        <>
          {loading ? (
            <div className="text-center py-12 text-gray-500 text-sm">A carregar...</div>
          ) : (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border bg-white p-5">
                  <div className="text-xs uppercase text-gray-500">Noites recolhidas</div>
                  <div className="text-3xl font-bold text-hm-black mt-1">{totalPoints.toLocaleString()}</div>
                  <div className="text-xs text-gray-400 mt-1">dados de preço acumulados</div>
                </div>
                <div className="rounded-xl border bg-white p-5">
                  <div className="text-xs uppercase text-gray-500">Preço médio/noite</div>
                  <div className="text-3xl font-bold text-hm-black mt-1">
                    {totalPoints > 0
                      ? `€${(byMonth.reduce((s, m) => s + (m._avg.priceCharged ?? 0) * m._count, 0) / Math.max(totalPoints, 1)).toFixed(0)}`
                      : '—'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">média geral todas as propriedades</div>
                </div>
                <div className="rounded-xl border bg-amber-50 border-amber-200 p-5">
                  <div className="text-xs uppercase text-amber-600">Estado do modelo</div>
                  <div className="text-lg font-bold text-amber-700 mt-1">
                    {totalPoints < 100 ? 'Recolha inicial' : totalPoints < 500 ? 'Em aprendizagem' : 'Dados suficientes'}
                  </div>
                  <div className="text-xs text-amber-600 mt-1">
                    {totalPoints < 100
                      ? `${totalPoints}/100 noites para primeiras análises`
                      : totalPoints < 500
                      ? `${totalPoints}/500 para alta assertividade`
                      : 'Modelo com dados regionais sólidos'}
                  </div>
                </div>
              </div>

              {totalPoints === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
                  <Sparkles className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-700 mb-1">Sem dados ainda</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto">
                    Os dados de pricing são recolhidos automaticamente a cada reserva criada.
                    Cria reservas para começar a acumular o dataset.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* By month */}
                  <div className="rounded-xl border bg-white p-5">
                    <h3 className="font-semibold text-hm-black mb-4 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      Preço médio por mês
                    </h3>
                    <div className="space-y-2">
                      {byMonth.map(m => (
                        <div key={m.monthOfYear} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-7">{MONTH_NAMES[(m.monthOfYear - 1)]}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                            <div
                              className="h-full bg-amber-400 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${((m._avg.priceCharged ?? 0) / maxMonthAvg) * 100}%` }}
                            >
                              <span className="text-[10px] font-bold text-amber-900">
                                €{(m._avg.priceCharged ?? 0).toFixed(0)}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 w-8 text-right">{m._count}n</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* By day of week */}
                  <div className="rounded-xl border bg-white p-5">
                    <h3 className="font-semibold text-hm-black mb-4 flex items-center gap-2">
                      <BarChart3 className="h-4 w-4 text-gray-400" />
                      Preço médio por dia da semana
                    </h3>
                    <div className="space-y-2">
                      {byDayOfWeek.map(d => (
                        <div key={d.dayOfWeek} className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 w-7">{DAY_NAMES[d.dayOfWeek]}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                            <div
                              className="h-full rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${((d._avg.priceCharged ?? 0) / maxDayAvg) * 100}%`, background: d.dayOfWeek >= 5 ? '#60a5fa' : '#93c5fd' }}
                            >
                              <span className="text-[10px] font-bold text-blue-900">
                                €{(d._avg.priceCharged ?? 0).toFixed(0)}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-gray-400 w-8 text-right">{d._count}n</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* By platform */}
                  <div className="rounded-xl border bg-white p-5">
                    <h3 className="font-semibold text-hm-black mb-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-gray-400" />
                      Preço médio por plataforma
                    </h3>
                    <div className="space-y-3">
                      {byPlatform.map(p => (
                        <div key={p.platform ?? 'direct'} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                          <span className="text-sm font-medium text-gray-700">{p.platform ?? 'Direct'}</span>
                          <div className="text-right">
                            <div className="text-sm font-bold text-hm-black">€{(p._avg.priceCharged ?? 0).toFixed(0)}/noite</div>
                            <div className="text-xs text-gray-400">{p._count} noites</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Roadmap */}
                  <div className="rounded-xl border bg-white p-5">
                    <h3 className="font-semibold text-hm-black mb-4">Roadmap de integração</h3>
                    <div className="space-y-3">
                      {[
                        { phase: '1', label: 'Recolha de dados próprios', status: 'active', note: 'A decorrer — cada reserva gera dados' },
                        { phase: '2', label: 'PriceLabs API (Mid/Premium)', status: 'next', note: 'Dados de concorrência + ocupação regional' },
                        { phase: '3', label: 'Validação cruzada dados próprios vs API', status: 'future', note: 'Claude analisa discrepâncias e aprende' },
                        { phase: '4', label: 'Modelo próprio Costa Tropical', status: 'future', note: 'Alta assertividade, custo só em tokens' },
                      ].map(item => (
                        <div key={item.phase} className="flex items-start gap-3">
                          <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            item.status === 'active' ? 'bg-green-100 text-green-700' :
                            item.status === 'next'   ? 'bg-amber-100 text-amber-700' :
                                                       'bg-gray-100 text-gray-400'
                          }`}>{item.phase}</div>
                          <div>
                            <div className="text-sm font-medium text-hm-black">{item.label}</div>
                            <div className="text-xs text-gray-500">{item.note}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <strong>Próximo passo:</strong> Activar integração PriceLabs para clientes Mid e Premium —
                  os dados desta página alimentarão o modelo de validação cruzada assim que a API estiver ligada.
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ═══ Tab: Motor de Pricing ═══ */}
      {tab === 'engine' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Mês alvo</label>
              <select value={engineMonth} onChange={e => { const m = parseInt(e.target.value); setEngineMonth(m); loadEngine(m, engineDay) }}
                className="rounded-lg border px-3 py-2 text-sm">
                {MONTH_NAMES.map((n, i) => <option key={i} value={i + 1}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Dia da semana</label>
              <select value={engineDay} onChange={e => { const d = parseInt(e.target.value); setEngineDay(d); loadEngine(engineMonth, d) }}
                className="rounded-lg border px-3 py-2 text-sm">
                {DAY_NAMES.map((n, i) => <option key={i} value={i}>{n}</option>)}
              </select>
            </div>
            {engine && (
              <div className="ml-auto flex items-center gap-4 text-xs text-gray-500">
                <span>{engine.propertyCount} propriedades</span>
                <span>{engine.competitorCount} competitors</span>
              </div>
            )}
          </div>

          {engineLoading && <div className="text-center py-12 text-gray-500 text-sm">A calcular sugestões...</div>}

          {engine && !engineLoading && engine.suggestions.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
              <Target className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-700 mb-1">Sem propriedades activas</h3>
              <p className="text-sm text-gray-500">Adiciona propriedades com reservas para gerar sugestões de preço.</p>
            </div>
          )}

          {engine && !engineLoading && engine.suggestions.length > 0 && (
            <div className="space-y-3">
              {engine.suggestions.map(ps => {
                const s = ps.suggestion
                const delta = s.suggestedPrice - s.basePrice
                const deltaPct = s.basePrice > 0 ? (delta / s.basePrice) * 100 : 0
                const confColor = s.confidence === 'HIGH' ? 'bg-green-100 text-green-700' : s.confidence === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'

                return (
                  <div key={ps.propertyId} className="rounded-xl border bg-white overflow-hidden">
                    {/* Header */}
                    <div className="px-5 py-4 flex items-center justify-between gap-4 border-b">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-hm-black">{ps.propertyName}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          {ps.bedrooms > 0 && `${ps.bedrooms} quartos · `}
                          {ps.zoneId?.replace('zone-', '').replace(/-/g, ' ') ?? 'zona desconhecida'}
                          {s.competitorCount > 0 && ` · ${s.competitorCount} competitors na zona`}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-2xl font-bold text-hm-black">€{s.suggestedPrice}</div>
                        <div className="flex items-center justify-end gap-1 mt-0.5">
                          {delta > 0 ? <ArrowUpRight className="h-3 w-3 text-green-600" /> : delta < 0 ? <ArrowDownRight className="h-3 w-3 text-red-500" /> : <Minus className="h-3 w-3 text-gray-400" />}
                          <span className={`text-xs font-semibold ${delta > 0 ? 'text-green-600' : delta < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                            {delta > 0 ? '+' : ''}{deltaPct.toFixed(0)}% vs. base €{s.basePrice}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="px-5 py-3 flex items-center gap-4 text-xs bg-gray-50 border-b">
                      <span className={`rounded-full px-2 py-0.5 font-bold ${confColor}`}>{s.confidence}</span>
                      <span className="text-gray-500">{s.dataPoints} noites próprias</span>
                      {s.competitorMedian && <span className="text-gray-500">Mediana mercado: €{s.competitorMedian}</span>}
                      {s.percentile !== null && <span className="text-gray-500">Percentil {s.percentile}%</span>}
                    </div>

                    {/* Factors */}
                    <div className="px-5 py-3">
                      <div className="flex flex-wrap gap-2">
                        {s.factors.map((f, i) => {
                          const isUp = f.effect > 1.01
                          const isDown = f.effect < 0.99
                          return (
                            <div key={i} className={`rounded-lg border px-2.5 py-1.5 text-xs ${isUp ? 'border-green-200 bg-green-50 text-green-700' : isDown ? 'border-red-200 bg-red-50 text-red-600' : 'border-gray-200 bg-gray-50 text-gray-500'}`}
                              title={f.description}>
                              <span className="font-semibold">{f.name}</span>
                              <span className="ml-1">
                                {isUp ? `+${((f.effect - 1) * 100).toFixed(0)}%` : isDown ? `${((f.effect - 1) * 100).toFixed(0)}%` : '0%'}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Methodology note */}
          <div className="flex items-start gap-3 rounded-xl bg-gray-50 border p-4 text-sm text-gray-600">
            <Cpu className="h-5 w-5 shrink-0 mt-0.5 text-gray-400" />
            <div>
              <strong>Motor v1 (estatístico)</strong> — combina dados próprios + competitors com 7 factores: sazonalidade Costa Tropical,
              dia da semana, lead time, ocupação, posicionamento vs. mercado, rating e superhost.
              Assertividade validada via MAPE quando houver volume. Próxima versão: XGBoost (Python).
            </div>
          </div>
        </div>
      )}

      {/* ═══ Tab: Market Intelligence ═══ */}
      {tab === 'market' && (
        <div className="rounded-xl overflow-hidden border border-gray-200" style={{ height: 'calc(100vh - 14rem)' }}>
          <MarketMap />
        </div>
      )}
    </div>
  )
}
