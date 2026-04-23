"use client"

import { useEffect, useState } from "react"
import { useLocale } from "@/i18n/provider"
import { Wallet, Calendar, CheckCircle2, Clock, AlertCircle, TrendingUp } from "lucide-react"

interface ManagerPayout {
  id: string
  periodYear: number
  periodMonth: number
  subscriptionEarnings: string | number
  rentalEarnings: string | number
  portfolioBonus: string | number
  acquisitionBonus: string | number
  finalAmount: string | number
  clientCount: number
  activePropertyCount: number
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'CANCELLED'
  payBy: string
  paidAt: string | null
  stripeTransferId: string | null
  breakdown: any
}

const MONTHS_EN = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const STATUS_STYLE: Record<string, { bg: string; text: string; icon: any }> = {
  PENDING:   { bg: 'bg-amber-50',   text: 'text-amber-700',   icon: Clock },
  APPROVED:  { bg: 'bg-blue-50',    text: 'text-blue-700',    icon: CheckCircle2 },
  PAID:      { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle2 },
  CANCELLED: { bg: 'bg-red-50',     text: 'text-red-600',     icon: AlertCircle },
}

const fmt = (n: string | number) => `€${Number(n).toFixed(2)}`

export default function ManagerCommissionPage() {
  const { t } = useLocale()
  const [payouts, setPayouts] = useState<ManagerPayout[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    fetch('/api/manager/my-payouts')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setPayouts(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  if (!mounted || loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 rounded bg-gray-100 animate-pulse" />
        <div className="h-32 rounded-xl bg-gray-100 animate-pulse" />
      </div>
    )
  }

  // Aggregate this year
  const thisYear = new Date().getFullYear()
  const thisYearPayouts = payouts.filter(p => p.periodYear === thisYear)
  const ytdEarnings = thisYearPayouts.reduce((sum, p) => sum + Number(p.finalAmount), 0)
  const ytdPaid = thisYearPayouts.filter(p => p.status === 'PAID').reduce((sum, p) => sum + Number(p.finalAmount), 0)
  const ytdPending = ytdEarnings - ytdPaid

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-serif font-bold text-hm-black">
          {t('manager.myCommission.title') || 'My Commission'}
        </h1>
        <p className="text-sm text-gray-500">
          {t('manager.myCommission.subtitle') ||
            'Your monthly compensation from HostMasters. Calculated automatically on the 5th, paid by the 10th.'}
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard
          label={t('manager.myCommission.ytd') || `Earned in ${thisYear}`}
          value={fmt(ytdEarnings)}
          sub={`${thisYearPayouts.length} ${thisYearPayouts.length === 1 ? 'month' : 'months'}`}
          icon={TrendingUp}
          accent="emerald"
        />
        <KpiCard
          label={t('manager.myCommission.paid') || 'Paid so far'}
          value={fmt(ytdPaid)}
          sub={`${thisYearPayouts.filter(p => p.status === 'PAID').length} transfers`}
          icon={CheckCircle2}
          accent="blue"
        />
        <KpiCard
          label={t('manager.myCommission.pending') || 'Pending approval/payment'}
          value={fmt(ytdPending)}
          sub={thisYearPayouts.filter(p => p.status !== 'PAID').map(p => MONTHS_EN[p.periodMonth]).join(', ') || 'None'}
          icon={Clock}
          accent="amber"
        />
      </div>

      {/* Payouts table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold text-hm-black">
            {t('manager.myCommission.history') || 'Monthly history'}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Each record: 15% of client subscriptions + 3% of rental revenue + portfolio bonus + acquisition bonus.
          </p>
        </div>

        {payouts.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="h-10 w-10 mx-auto text-gray-300 mb-3" />
            <p className="font-semibold text-hm-black">
              {t('manager.myCommission.noData') || 'No commission records yet'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Your first monthly commission is calculated on the 5th of next month.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-3">Period</th>
                  <th className="px-3 py-3 text-right">Subscriptions 15%</th>
                  <th className="px-3 py-3 text-right">Rental 3%</th>
                  <th className="px-3 py-3 text-right">Portfolio bonus</th>
                  <th className="px-3 py-3 text-right">Acquisition bonus</th>
                  <th className="px-3 py-3 text-right">Total</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Pay by</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {payouts.map(p => {
                  const style = STATUS_STYLE[p.status]
                  const Icon = style.icon
                  return (
                    <tr key={p.id}>
                      <td className="px-5 py-3 text-hm-black font-semibold">
                        {MONTHS_EN[p.periodMonth]} {p.periodYear}
                        <span className="block text-[10px] text-gray-400 font-normal">
                          {p.clientCount} client{p.clientCount !== 1 ? 's' : ''} · {p.activePropertyCount} props
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right text-gray-700">{fmt(p.subscriptionEarnings)}</td>
                      <td className="px-3 py-3 text-right text-gray-700">{fmt(p.rentalEarnings)}</td>
                      <td className="px-3 py-3 text-right text-gray-700">{Number(p.portfolioBonus) > 0 ? fmt(p.portfolioBonus) : '—'}</td>
                      <td className="px-3 py-3 text-right text-gray-700">{Number(p.acquisitionBonus) > 0 ? fmt(p.acquisitionBonus) : '—'}</td>
                      <td className="px-3 py-3 text-right font-bold text-hm-black">{fmt(p.finalAmount)}</td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.bg} ${style.text}`}>
                          <Icon className="h-3 w-3" /> {p.status}
                        </span>
                        {p.stripeTransferId && (
                          <span className="block text-[9px] text-gray-400 mt-1 font-mono">{p.stripeTransferId.slice(0, 14)}…</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-gray-500 text-xs">
                        {p.paidAt
                          ? <><CheckCircle2 className="inline h-3 w-3 mr-1 text-emerald-600" />{new Date(p.paidAt).toLocaleDateString('en-GB')}</>
                          : <><Calendar className="inline h-3 w-3 mr-1" />{new Date(p.payBy).toLocaleDateString('en-GB')}</>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* How it's calculated */}
      <div className="rounded-xl border bg-blue-50/50 border-blue-200 p-5">
        <h3 className="font-semibold text-blue-900 mb-2">
          {t('manager.myCommission.howTitle') || 'How your commission is calculated'}
        </h3>
        <ul className="space-y-1.5 text-sm text-blue-900/80">
          <li>• 15% of client subscription fees actually paid that month (Basic/Mid/Premium — Starter = €0)</li>
          <li>• 3% of gross rental revenue from your clients&apos; properties that month</li>
          <li>• Portfolio bonus (cumulative, largest tier applies): +€150 at 10 Basic+ props, +€400 at 20, +€750 at 30</li>
          <li>• Acquisition bonus: €50 Basic, €100 Mid, €150 Premium — paid in 2nd month after client activation (one-time)</li>
        </ul>
        <p className="text-[11px] text-blue-900/60 mt-3">
          Calculated on the 5th of each month for the previous month. HostMasters pays by the 10th via Stripe Connect
          (configure in your profile to enable automatic transfers).
        </p>
      </div>
    </div>
  )
}

function KpiCard({ label, value, sub, icon: Icon, accent }: {
  label: string
  value: string
  sub: string
  icon: any
  accent: 'emerald' | 'blue' | 'amber'
}) {
  const accentBg = accent === 'emerald' ? 'bg-emerald-50' : accent === 'blue' ? 'bg-blue-50' : 'bg-amber-50'
  const accentText = accent === 'emerald' ? 'text-emerald-700' : accent === 'blue' ? 'text-blue-700' : 'text-amber-700'
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`h-7 w-7 rounded-lg ${accentBg} ${accentText} flex items-center justify-center`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      </div>
      <p className="text-2xl font-bold text-hm-black">{value}</p>
      <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
    </div>
  )
}
