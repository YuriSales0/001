'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, BarChart3, Download } from 'lucide-react'
import { generateReportSummaryPDF } from '@/lib/pdf'
import { useLocale } from '@/i18n/provider'

type PeriodData = {
  grossRevenue: number
  hmCommission: number
  hmTotalRevenue: number
  receiptRevenue: number
  netToOwners: number
  payoutCount: number
  reservations: number
  totalNights: number
  avgPricePerNight: number
  activeProperties: number
  totalClients: number
}

type AdminReport = {
  role: 'ADMIN'
  period: string
  previousPeriod: string
  current: PeriodData
  previous: PeriodData
  delta: Record<string, number | null>
}

type ManagerEarnings = { fromSubscriptions: number; fromCommissions: number; total: number }

type ManagerPeriodData = {
  clientCount: number
  clients: { name: string | null; plan: string | null }[]
  grossRevenue: number
  hmCommission: number
  netToOwners: number
  reservations: number
  subscriptionFees: number
  managerEarnings: ManagerEarnings
}

type ManagerReport = {
  role: 'MANAGER'
  managerName: string
  period: string
  previousPeriod: string
  compensationRates: { subscriptionShare: number; commissionShare: number }
  current: ManagerPeriodData
  previous: ManagerPeriodData
  delta: Record<string, number | null>
}

type Report = AdminReport | ManagerReport

const fmtEUR = (n: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

function DeltaBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-xs text-gray-400">n/a</span>
  const isUp = value > 0
  const isDown = value < 0
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${isUp ? 'text-green-600' : isDown ? 'text-red-500' : 'text-gray-400'}`}>
      {isUp ? <TrendingUp className="h-3 w-3" /> : isDown ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
      {isUp ? '+' : ''}{value.toFixed(1)}%
    </span>
  )
}

function KPI({ label, value, delta, sub }: { label: string; value: string; delta?: number | null; sub?: string }) {
  return (
    <div className="rounded-hm border bg-white p-5">
      <div className="text-xs uppercase text-gray-500">{label}</div>
      <div className="text-2xl font-bold text-hm-black mt-1">{value}</div>
      <div className="flex items-center gap-2 mt-1">
        {delta !== undefined && <DeltaBadge value={delta} />}
        {sub && <span className="text-xs text-gray-400">{sub}</span>}
      </div>
    </div>
  )
}

type PeriodPreset = 'current' | 'previous' | 'year' | 'custom'

export default function ReportsPage() {
  const { t } = useLocale()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [preset, setPreset] = useState<PeriodPreset>('current')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [compareFrom, setCompareFrom] = useState('')
  const [compareTo, setCompareTo] = useState('')

  const loadReport = (p: PeriodPreset, from?: string, to?: string, cFrom?: string, cTo?: string) => {
    setLoading(true)
    let url = '/api/reports/summary'
    if (p === 'custom' && from && to) {
      url += `?from=${from}&to=${to}`
      if (cFrom && cTo) url += `&compareFrom=${cFrom}&compareTo=${cTo}`
    } else {
      url += `?period=${p}`
    }
    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setReport(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadReport('current') }, [])

  const periodSelector = (
    <div className="rounded-hm border bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {([
            { key: 'current', label: t('admin.reportSummary.thisMonth') },
            { key: 'previous', label: t('admin.reportSummary.previousMonth') },
            { key: 'year', label: t('admin.reportSummary.year') },
            { key: 'custom', label: t('admin.reportSummary.custom') },
          ] as { key: PeriodPreset; label: string }[]).map(opt => (
            <button
              key={opt.key}
              onClick={() => { setPreset(opt.key); if (opt.key !== 'custom') loadReport(opt.key) }}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                preset === opt.key ? 'bg-white text-hm-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {preset === 'custom' && (
          <>
            <div className="flex items-center gap-2">
              <div>
                <label className="block text-[10px] uppercase text-gray-500 mb-0.5">{t('admin.reportSummary.period')}</label>
                <div className="flex gap-1">
                  <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                    className="rounded-md border px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-hm-gold" />
                  <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                    className="rounded-md border px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-hm-gold" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase text-gray-500 mb-0.5">{t('admin.reportSummary.compareWith')}</label>
                <div className="flex gap-1">
                  <input type="date" value={compareFrom} onChange={e => setCompareFrom(e.target.value)}
                    className="rounded-md border px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-hm-gold" />
                  <input type="date" value={compareTo} onChange={e => setCompareTo(e.target.value)}
                    className="rounded-md border px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-hm-gold" />
                </div>
              </div>
              <button
                onClick={() => loadReport('custom', fromDate, toDate, compareFrom, compareTo)}
                disabled={!fromDate || !toDate}
                className="rounded-lg bg-hm-black text-white px-4 py-2 text-xs font-semibold hover:bg-hm-black/90 disabled:opacity-40 self-end"
              >
                {t('admin.reportSummary.apply')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )

  if (loading) return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-serif font-bold text-hm-black flex items-center gap-2">
        <BarChart3 className="h-7 w-7 text-gray-400" /> {t('admin.reportSummary.title')}
      </h1>
      {periodSelector}
      <div className="space-y-4 animate-pulse py-4"><div className="h-8 rounded-hm bg-hm-sand w-48" /><div className="h-40 rounded-hm bg-hm-sand" /></div>
    </div>
  )
  if (!report) return <div className="p-6 text-gray-500 text-sm">{t('admin.reportSummary.loadError')}</div>

  const exportPDF = () => {
    if (!report) return
    const fmtDelta = (d: number | null) => d === null ? '—' : `${d > 0 ? '+' : ''}${d.toFixed(1)}%`

    if (report.role === 'ADMIN') {
      const r = report as AdminReport
      const c = r.current, p = r.previous
      const doc = generateReportSummaryPDF({
        title: 'Report Admin',
        period: r.period,
        previousPeriod: r.previousPeriod,
        role: 'ADMIN',
        kpis: [
          { label: t('admin.reportSummary.grossRevenue'), value: fmtEUR(c.grossRevenue), previous: fmtEUR(p.grossRevenue), delta: fmtDelta(r.delta.grossRevenue) },
          { label: t('admin.reportSummary.hmCommission'), value: fmtEUR(c.hmCommission), previous: fmtEUR(p.hmCommission), delta: fmtDelta(r.delta.hmCommission) },
          { label: t('admin.reportSummary.hmTotalRevenue'), value: fmtEUR(c.hmTotalRevenue), previous: fmtEUR(p.hmTotalRevenue), delta: null },
          { label: t('admin.reportSummary.invoicesPaid'), value: fmtEUR(c.receiptRevenue), previous: fmtEUR(p.receiptRevenue), delta: null },
          { label: t('admin.reportSummary.paidToOwners'), value: fmtEUR(c.netToOwners), previous: fmtEUR(p.netToOwners), delta: null },
          { label: t('admin.reportSummary.reservations'), value: String(c.reservations), previous: String(p.reservations), delta: fmtDelta(r.delta.reservations) },
          { label: t('admin.reportSummary.avgPricePerNight'), value: fmtEUR(c.avgPricePerNight), previous: fmtEUR(p.avgPricePerNight), delta: fmtDelta(r.delta.avgPrice) },
          { label: t('admin.reportSummary.nightsOccupied'), value: String(c.totalNights), previous: String(p.totalNights), delta: fmtDelta(r.delta.occupancyNights) },
          { label: t('admin.reportSummary.activeProperties'), value: String(c.activeProperties), previous: String(p.activeProperties), delta: null },
          { label: t('admin.reportSummary.clients'), value: String(c.totalClients), previous: String(p.totalClients), delta: null },
        ],
      })
      doc.save(`hostmasters-report-admin-${r.period.replace(/\s/g, '-')}.pdf`)
    }

    if (report.role === 'MANAGER') {
      const r = report as ManagerReport
      const c = r.current, p = r.previous
      const rates = r.compensationRates
      const doc = generateReportSummaryPDF({
        title: `Report Manager — ${r.managerName}`,
        period: r.period,
        previousPeriod: r.previousPeriod,
        role: 'MANAGER',
        kpis: [
          { label: t('admin.reportSummary.clientCount'), value: String(c.clientCount), previous: String(p.clientCount), delta: fmtDelta(r.delta.clientCount) },
          { label: t('admin.reportSummary.grossRevenuePortfolio'), value: fmtEUR(c.grossRevenue), previous: fmtEUR(p.grossRevenue), delta: fmtDelta(r.delta.grossRevenue) },
          { label: t('admin.reportSummary.reservations'), value: String(c.reservations), previous: String(p.reservations), delta: fmtDelta(r.delta.reservations) },
          { label: t('admin.reportSummary.subscriptionsPerMonth'), value: fmtEUR(c.subscriptionFees), previous: fmtEUR(p.subscriptionFees), delta: null },
        ],
        managerEarnings: {
          fromSubscriptions: fmtEUR(c.managerEarnings.fromSubscriptions),
          fromCommissions: fmtEUR(c.managerEarnings.fromCommissions),
          total: fmtEUR(c.managerEarnings.total),
          rates: `${(rates.subscriptionShare * 100).toFixed(0)}% ${t('admin.reportSummary.subscriptions').toLowerCase()} + ${(rates.commissionShare * 100).toFixed(0)}% ${t('admin.reportSummary.commissions').toLowerCase()}`,
        },
        clients: c.clients.map(cl => ({ name: cl.name ?? t('admin.reportSummary.noName'), plan: cl.plan ?? 'STARTER' })),
      })
      doc.save(`hostmasters-report-manager-${r.period.replace(/\s/g, '-')}.pdf`)
    }
  }

  if (report.role === 'ADMIN') {
    const r = report as AdminReport
    const c = r.current
    const p = r.previous
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-hm-black flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-gray-400" />
              {t('admin.reportSummary.title')}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {r.period} vs. {r.previousPeriod}
            </p>
          </div>
          <button onClick={exportPDF}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" />
            {t('admin.reportSummary.exportPdf')}
          </button>
        </div>

        {periodSelector}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPI label={t('admin.reportSummary.grossRevenue')} value={fmtEUR(c.grossRevenue)} delta={r.delta.grossRevenue} sub={`${t('admin.reportSummary.prev')} ${fmtEUR(p.grossRevenue)}`} />
          <KPI label={t('admin.reportSummary.hmCommission')} value={fmtEUR(c.hmCommission)} delta={r.delta.hmCommission} sub={`${t('admin.reportSummary.prev')} ${fmtEUR(p.hmCommission)}`} />
          <KPI label={t('admin.reportSummary.reservations')} value={String(c.reservations)} delta={r.delta.reservations} sub={`${t('admin.reportSummary.prev')} ${p.reservations}`} />
          <KPI label={t('admin.reportSummary.avgPricePerNight')} value={fmtEUR(c.avgPricePerNight)} delta={r.delta.avgPrice} sub={`${t('admin.reportSummary.prev')} ${fmtEUR(p.avgPricePerNight)}`} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPI label={t('admin.reportSummary.hmTotalRevenue')} value={fmtEUR(c.hmTotalRevenue)} sub={t('admin.reportSummary.commissionPlusInvoices')} />
          <KPI label={t('admin.reportSummary.invoicesPaid')} value={fmtEUR(c.receiptRevenue)} sub={t('admin.reportSummary.subscriptionsAndAdjustments')} />
          <KPI label={t('admin.reportSummary.paidToOwners')} value={fmtEUR(c.netToOwners)} sub={`${c.payoutCount} ${t('common.payouts').toLowerCase()}`} />
          <KPI label={t('admin.reportSummary.nightsOccupied')} value={String(c.totalNights)} delta={r.delta.occupancyNights} sub={`${t('admin.reportSummary.prev')} ${p.totalNights}`} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-hm border bg-white p-5">
            <div className="text-xs uppercase text-gray-500 mb-3">{t('admin.reportSummary.activeProperties')}</div>
            <div className="text-3xl font-bold text-hm-black">{c.activeProperties}</div>
          </div>
          <div className="rounded-hm border bg-white p-5">
            <div className="text-xs uppercase text-gray-500 mb-3">{t('admin.reportSummary.clients')}</div>
            <div className="text-3xl font-bold text-hm-black">{c.totalClients}</div>
          </div>
        </div>
      </div>
    )
  }

  if (report.role === 'MANAGER') {
    const r = report as ManagerReport
    const c = r.current
    const p = r.previous
    const rates = r.compensationRates
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-serif font-bold text-hm-black flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-gray-400" />
              {t('admin.reportSummary.myReport')}
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              {r.period} vs. {r.previousPeriod}
            </p>
          </div>
          <button onClick={exportPDF}
            className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="h-4 w-4" />
            {t('admin.reportSummary.exportPdf')}
          </button>
        </div>

        {periodSelector}

        {/* Manager earnings highlight */}
        <div className="rounded-hm border-2 border-[#B08A3E] bg-[#B08A3E]/5 p-5">
          <div className="text-xs uppercase text-[#92681a] font-bold tracking-wider mb-3">{t('admin.reportSummary.myCommission')}</div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-xs text-gray-500">{t('admin.reportSummary.subscriptions')} ({(rates.subscriptionShare * 100).toFixed(0)}%)</div>
              <div className="text-xl font-bold text-hm-black mt-0.5">{fmtEUR(c.managerEarnings.fromSubscriptions)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">{t('admin.reportSummary.commissions')} ({(rates.commissionShare * 100).toFixed(0)}%)</div>
              <div className="text-xl font-bold text-hm-black mt-0.5">{fmtEUR(c.managerEarnings.fromCommissions)}</div>
            </div>
            <div>
              <div className="text-xs text-[#92681a] font-semibold">{t('admin.reportSummary.total')}</div>
              <div className="text-2xl font-bold text-[#92681a] mt-0.5">{fmtEUR(c.managerEarnings.total)}</div>
              <DeltaBadge value={r.delta.managerTotal} />
            </div>
          </div>
          {p.managerEarnings.total > 0 && (
            <div className="text-xs text-gray-400 mt-2">
              {t('admin.reportSummary.previousPeriod')}: {fmtEUR(p.managerEarnings.total)}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPI label={t('admin.reportSummary.clientCount')} value={String(c.clientCount)} delta={r.delta.clientCount} />
          <KPI label={t('admin.reportSummary.grossRevenuePortfolio')} value={fmtEUR(c.grossRevenue)} delta={r.delta.grossRevenue} />
          <KPI label={t('admin.reportSummary.reservations')} value={String(c.reservations)} delta={r.delta.reservations} />
          <KPI label={t('admin.reportSummary.subscriptionsPerMonth')} value={fmtEUR(c.subscriptionFees)} sub={t('admin.reportSummary.fromYourClients')} />
        </div>

        {/* Client breakdown */}
        <div className="rounded-hm border bg-white p-5">
          <div className="text-xs uppercase text-gray-500 mb-3">{t('admin.reportSummary.clientsInPortfolio')}</div>
          <div className="space-y-2">
            {c.clients.length === 0 && <div className="text-sm text-gray-400">{t('admin.reportSummary.noClients')}</div>}
            {c.clients.map((client, i) => (
              <div key={i} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5">
                <span className="text-sm font-medium text-gray-700">{client.name ?? t('admin.reportSummary.noName')}</span>
                <span className="text-xs font-semibold rounded-full bg-gray-200 px-2 py-0.5">{client.plan ?? 'STARTER'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return null
}
