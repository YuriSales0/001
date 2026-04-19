'use client'

import { useEffect, useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Home, CalendarDays, Euro, BarChart3, Download } from 'lucide-react'
import { generateReportSummaryPDF } from '@/lib/pdf'

type Reservation = {
  id: string
  guestName: string
  checkIn: string
  checkOut: string
  amount: number
  platform: string | null
  status: string
  property: { id: string; name: string }
}

type Payout = {
  id: string
  grossAmount: number
  commission: number
  commissionRate: number
  netAmount: number
  status: string
  scheduledFor: string
  paidAt: string | null
  property: { id: string; name: string }
  reservation: { id: string; guestName: string; checkIn: string; checkOut: string }
}

type Property = { id: string; name: string }

const fmt = (n: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n)

const fmtPct = (n: number) => `${Math.round(n)}%`

function nightsBetween(a: string, b: string) {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000))
}

function monthKey(d: string) {
  return d.slice(0, 7) // "YYYY-MM"
}

function monthLabel(key: string) {
  const [y, m] = key.split('-')
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' })
}

// Days in a month for occupancy
function daysInMonth(key: string) {
  const [y, m] = key.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export default function ClientReportsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [propFilter, setPropFilter] = useState('ALL')

  const [summary, setSummary] = useState<{
    period: string; previousPeriod: string
    current: { grossRevenue: number; commission: number; netReceived: number; reservations: number; occupancy: number; avgPricePerNight: number; totalNights: number }
    previous: { grossRevenue: number; commission: number; netReceived: number; reservations: number; occupancy: number; avgPricePerNight: number; totalNights: number }
    delta: Record<string, number | null>
  } | null>(null)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/reservations').then(r => r.ok ? r.json() : []),
      fetch('/api/payouts').then(r => r.ok ? r.json() : []),
      fetch('/api/properties').then(r => r.ok ? r.json() : []),
      fetch('/api/reports/summary').then(r => r.ok ? r.json() : null),
    ]).then(([res, pay, props, sum]) => {
      setReservations(Array.isArray(res) ? res : [])
      setPayouts(Array.isArray(pay) ? pay : [])
      setProperties(Array.isArray(props) ? props : [])
      setSummary(sum)
      setLoading(false)
    }).catch(() => {
      setLoadError(true)
      setLoading(false)
    })
  }, [])

  const filteredRes = useMemo(
    () => {
      const valid = reservations.filter(r => r && r.property)
      return propFilter === 'ALL' ? valid : valid.filter(r => r.property.id === propFilter)
    },
    [reservations, propFilter]
  )

  const filteredPay = useMemo(
    () => {
      const valid = payouts.filter(p => p && p.property && p.reservation)
      return propFilter === 'ALL' ? valid : valid.filter(p => p.property.id === propFilter)
    },
    [payouts, propFilter]
  )

  // KPIs — all time
  const totalGross = filteredPay.reduce((s, p) => s + p.grossAmount, 0)
  const totalCommission = filteredPay.reduce((s, p) => s + p.commission, 0)
  const totalNet = filteredPay.reduce((s, p) => s + p.netAmount, 0)
  const totalNights = filteredRes.reduce((s, r) => s + nightsBetween(r.checkIn, r.checkOut), 0)
  const avgNightly = totalNights > 0 ? totalGross / totalNights : 0

  // Monthly breakdown — last 12 months
  const monthlyData = useMemo(() => {
    const map: Record<string, { gross: number; commission: number; net: number; nights: number; reservations: number }> = {}

    filteredPay.forEach(p => {
      if (!p.reservation?.checkOut) return
      const k = monthKey(p.reservation.checkOut)
      if (!map[k]) map[k] = { gross: 0, commission: 0, net: 0, nights: 0, reservations: 0 }
      map[k].gross += p.grossAmount
      map[k].commission += p.commission
      map[k].net += p.netAmount
    })

    filteredRes.forEach(r => {
      if (!r.checkOut) return
      const k = monthKey(r.checkOut)
      if (!map[k]) map[k] = { gross: 0, commission: 0, net: 0, nights: 0, reservations: 0 }
      map[k].nights += nightsBetween(r.checkIn, r.checkOut)
      map[k].reservations += 1
    })

    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a))
      .slice(0, 12)
  }, [filteredPay, filteredRes])

  // Occupancy per property (based on all reservations)
  const occupancyByProperty = useMemo(() => {
    const today = new Date()
    const thisYear = today.getFullYear()

    const byProp: Record<string, { name: string; nights: number }> = {}
    reservations.forEach(r => {
      if (!r || !r.property) return
      const checkIn = new Date(r.checkIn)
      if (checkIn.getFullYear() !== thisYear) return
      if (!byProp[r.property.id]) byProp[r.property.id] = { name: r.property.name, nights: 0 }
      byProp[r.property.id].nights += nightsBetween(r.checkIn, r.checkOut)
    })

    const daysSoFar = Math.min(
      Math.ceil((today.getTime() - new Date(thisYear, 0, 1).getTime()) / 86_400_000),
      365
    )

    return Object.entries(byProp).map(([id, d]) => ({
      id,
      name: d.name,
      nights: d.nights,
      occupancy: (d.nights / daysSoFar) * 100,
    }))
  }, [reservations])

  // Top months for bar chart (net)
  const maxNet = Math.max(...monthlyData.map(([, d]) => d.net), 1)

  if (loading) return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-10 rounded-hm bg-hm-sand w-64" />
      <div className="h-48 rounded-hm bg-hm-sand" />
    </div>
  )
  if (loadError) return <div className="p-4 text-sm text-red-500">Failed to load data. Try refreshing.</div>

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-hm-black">Relatórios</h1>
          <p className="text-sm text-gray-500">
            Resumo financeiro e de ocupação das tuas propriedades
            {summary && <span className="text-gray-400"> · {summary.period} vs. {summary.previousPeriod}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={propFilter}
            onChange={e => setPropFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
          >
            <option value="ALL">Todas as propriedades</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <button
            onClick={() => {
              if (!summary) return
              const fmtD = (d: number | null) => d === null ? '—' : `${d > 0 ? '+' : ''}${d.toFixed(1)}%`
              const doc = generateReportSummaryPDF({
                title: 'Owner Report',
                period: summary.period,
                previousPeriod: summary.previousPeriod,
                role: 'CLIENT',
                kpis: [
                  { label: 'Receita bruta', value: fmt(summary.current.grossRevenue), previous: fmt(summary.previous.grossRevenue), delta: fmtD(summary.delta.grossRevenue) },
                  { label: 'Comissão HM', value: fmt(summary.current.commission), previous: fmt(summary.previous.commission), delta: null },
                  { label: 'Receita líquida', value: fmt(summary.current.netReceived), previous: fmt(summary.previous.netReceived), delta: fmtD(summary.delta.netReceived) },
                  { label: 'Reservas', value: String(summary.current.reservations), previous: String(summary.previous.reservations), delta: fmtD(summary.delta.reservations) },
                  { label: 'Noites ocupadas', value: String(summary.current.totalNights), previous: String(summary.previous.totalNights), delta: null },
                  { label: 'Ocupação', value: `${summary.current.occupancy}%`, previous: `${summary.previous.occupancy}%`, delta: fmtD(summary.delta.occupancy) },
                  { label: 'Preço médio/noite', value: fmt(summary.current.avgPricePerNight), previous: fmt(summary.previous.avgPricePerNight), delta: null },
                ],
              })
              doc.save(`hostmasters-report-owner-${summary.period.replace(/\s/g, '-')}.pdf`)
            }}
            disabled={!summary}
            className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Period comparison */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Receita líquida', value: fmt(summary.current.netReceived), delta: summary.delta.netReceived, prev: fmt(summary.previous.netReceived) },
            { label: 'Reservas', value: String(summary.current.reservations), delta: summary.delta.reservations, prev: String(summary.previous.reservations) },
            { label: 'Ocupação', value: `${summary.current.occupancy}%`, delta: summary.delta.occupancy, prev: `${summary.previous.occupancy}%` },
            { label: 'Preço médio', value: fmt(summary.current.avgPricePerNight), delta: null, prev: fmt(summary.previous.avgPricePerNight) },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-hm border bg-white p-4">
              <div className="text-xs uppercase text-gray-500">{kpi.label}</div>
              <div className="text-xl font-bold text-hm-black mt-1">{kpi.value}</div>
              <div className="flex items-center gap-1.5 mt-1">
                {kpi.delta !== null && kpi.delta !== undefined && (
                  <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${kpi.delta > 0 ? 'text-green-600' : kpi.delta < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {kpi.delta > 0 ? <TrendingUp className="h-3 w-3" /> : kpi.delta < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    {kpi.delta > 0 ? '+' : ''}{kpi.delta.toFixed(1)}%
                  </span>
                )}
                <span className="text-xs text-gray-400">ant. {kpi.prev}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-hm border bg-white p-4">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <Euro className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide font-medium">Receita Bruta</span>
          </div>
          <div className="text-2xl font-bold text-hm-black">{fmt(totalGross)}</div>
          <div className="text-xs text-gray-400 mt-0.5">total acumulado</div>
        </div>

        <div className="rounded-hm border bg-white p-4">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide font-medium">Receita Líquida</span>
          </div>
          <div className="text-2xl font-bold text-green-700">{fmt(totalNet)}</div>
          <div className="text-xs text-gray-400 mt-0.5">após comissão</div>
        </div>

        <div className="rounded-hm border bg-white p-4">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <CalendarDays className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide font-medium">Noites Reservadas</span>
          </div>
          <div className="text-2xl font-bold text-hm-black">{totalNights}</div>
          <div className="text-xs text-gray-400 mt-0.5">total</div>
        </div>

        <div className="rounded-hm border bg-white p-4">
          <div className="flex items-center gap-2 mb-2 text-gray-500">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs uppercase tracking-wide font-medium">Preço Médio/Noite</span>
          </div>
          <div className="text-2xl font-bold text-hm-black">{fmt(avgNightly)}</div>
          <div className="text-xs text-gray-400 mt-0.5">gross / noite</div>
        </div>
      </div>

      {/* Occupancy by property */}
      {occupancyByProperty.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-hm-black mb-3 flex items-center gap-2">
            <Home className="h-4 w-4" />
            Ocupação este ano (por propriedade)
          </h2>
          <div className="space-y-3">
            {occupancyByProperty.map(p => (
              <div key={p.id} className="rounded-hm border bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-hm-black">{p.name}</span>
                  <span className="text-sm font-bold text-hm-black">{fmtPct(p.occupancy)}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full bg-hm-black transition-all"
                    style={{ width: `${Math.min(p.occupancy, 100)}%` }}
                  />
                </div>
                <div className="text-xs text-gray-400 mt-1">{p.nights} noites reservadas</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Monthly breakdown */}
      <section>
        <h2 className="text-base font-semibold text-hm-black mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Desempenho mensal (últimos 12 meses)
        </h2>

        {monthlyData.length === 0 ? (
          <div className="rounded-hm border bg-white p-8 text-center text-gray-400 text-sm">
            Sem dados de reservas ainda.
          </div>
        ) : (
          <>
            {/* Mini bar chart */}
            <div className="rounded-hm border bg-white p-4 mb-4">
              <div className="flex items-end gap-1 h-24">
                {[...monthlyData].reverse().map(([key, d]) => (
                  <div key={key} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div
                      className="w-full rounded-t bg-hm-black min-h-[2px] transition-all"
                      style={{ height: `${(d.net / maxNet) * 88}px` }}
                    />
                    <span className="text-[9px] text-gray-400 rotate-45 origin-left whitespace-nowrap mt-1">
                      {monthLabel(key)}
                    </span>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block bg-hm-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                      {monthLabel(key)}: {fmt(d.net)} líq.
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="rounded-hm border bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500 border-b">
                  <tr>
                    <th className="px-4 py-3">Mês</th>
                    <th className="px-4 py-3 text-center">Reservas</th>
                    <th className="px-4 py-3 text-center">Noites</th>
                    <th className="px-4 py-3 text-right">Gross</th>
                    <th className="px-4 py-3 text-right">Comissão</th>
                    <th className="px-4 py-3 text-right font-semibold">Líquido</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {monthlyData.map(([key, d]) => (
                    <tr key={key} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-hm-black capitalize">{monthLabel(key)}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{d.reservations}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{d.nights}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{fmt(d.gross)}</td>
                      <td className="px-4 py-3 text-right text-orange-600">{fmt(d.commission)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-green-700">{fmt(d.net)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t bg-gray-50">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-hm-black">Total</td>
                    <td className="px-4 py-3 text-center font-semibold">
                      {monthlyData.reduce((s, [, d]) => s + d.reservations, 0)}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">
                      {monthlyData.reduce((s, [, d]) => s + d.nights, 0)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {fmt(monthlyData.reduce((s, [, d]) => s + d.gross, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-orange-600">
                      {fmt(monthlyData.reduce((s, [, d]) => s + d.commission, 0))}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">
                      {fmt(monthlyData.reduce((s, [, d]) => s + d.net, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
