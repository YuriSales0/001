'use client'

import { useEffect, useState } from 'react'
import { Wallet, TrendingUp, TrendingDown, Minus, CheckCircle2, Clock, Zap } from 'lucide-react'
import { useLocale } from '@/i18n/provider'

type Task = {
  id: string
  title: string
  type: string
  status: string
  dueDate: string
  property: { name: string }
}

type CrewProfile = {
  crewContractType: string | null
  crewMonthlyRate: number | null
  crewTaskRate: number | null
}

type MonthData = {
  month: string
  tasksCompleted: number
  earnings: number
}

const fmtEUR = (n: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

export default function CrewEarningsPage() {
  const { t } = useLocale()
  const [tasks, setTasks] = useState<Task[]>([])
  const [profile, setProfile] = useState<CrewProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/tasks').then(r => { if (!r.ok) throw new Error(); return r.json() }),
      fetch('/api/me').then(r => { if (!r.ok) throw new Error(); return r.json() }),
    ]).then(([t, p]) => {
      setTasks(Array.isArray(t) ? t : [])
      setProfile(p)
    }).catch(() => {
      setLoadError(true)
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="p-6 text-sm text-gray-400">{t('crew.earnings.loading')}</div>
  if (loadError) return <div className="p-4 text-sm text-red-500">{t('crew.earnings.loadFailed')}</div>

  const contractType = profile?.crewContractType ?? 'FREELANCER'
  const monthlyRate = profile?.crewMonthlyRate ?? 0
  const taskRate = profile?.crewTaskRate ?? 0

  const completedTasks = tasks.filter(t => t.status === 'COMPLETED' || t.status === 'APPROVED')
  const pendingTasks = tasks.filter(t => t.status !== 'COMPLETED' && t.status !== 'APPROVED')

  // Group by month
  const byMonth: Record<string, Task[]> = {}
  completedTasks.forEach(t => {
    const key = t.dueDate.slice(0, 7)
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(t)
  })

  const monthlyBreakdown: MonthData[] = Object.entries(byMonth)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6)
    .map(([month, monthTasks]) => ({
      month,
      tasksCompleted: monthTasks.length,
      earnings: contractType === 'MONTHLY' ? monthlyRate : monthTasks.length * taskRate,
    }))

  const currentMonth = new Date().toISOString().slice(0, 7)
  const currentMonthTasks = byMonth[currentMonth]?.length ?? 0
  const currentEarnings = contractType === 'MONTHLY' ? monthlyRate : currentMonthTasks * taskRate

  const prevMonth = (() => {
    const d = new Date()
    d.setDate(1) // avoid month rollover issues (e.g. Mar 31 -> Feb 31 = Mar 3)
    d.setMonth(d.getMonth() - 1)
    return d.toISOString().slice(0, 7)
  })()
  const prevMonthTasks = byMonth[prevMonth]?.length ?? 0
  const prevEarnings = contractType === 'MONTHLY' ? monthlyRate : prevMonthTasks * taskRate

  const earningsDelta = prevEarnings > 0 ? ((currentEarnings - prevEarnings) / prevEarnings) * 100 : null

  const fmtMonth = (key: string) => {
    const [y, m] = key.split('-')
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
          <Wallet className="h-6 w-6 text-gray-400" />
          {t('crew.earnings.title')}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t('crew.earnings.contractLabel')} <span className="font-semibold">
            {contractType === 'MONTHLY'
              ? `${t('crew.earnings.contractMonthly')} (${fmtEUR(monthlyRate)}${t('crew.earnings.perMonth')})`
              : `${t('crew.earnings.contractFreelancer')} (${fmtEUR(taskRate)}${t('crew.earnings.perTask')})`}
          </span>
        </p>
      </div>

      {/* 24h payout banner */}
      <div className="rounded-hm border p-4 flex items-start gap-3" style={{ background: 'linear-gradient(90deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.03) 100%)', borderColor: 'rgba(34,197,94,0.25)' }}>
        <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(34,197,94,0.15)' }}>
          <Zap className="h-4.5 w-4.5 text-green-700" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-green-900">{t('crew.earnings.bannerTitle')}</p>
          <p className="text-xs text-green-800/80 mt-0.5">
            {contractType === 'MONTHLY'
              ? t('crew.earnings.bannerBodyMonthly').replace('{amount}', fmtEUR(monthlyRate))
              : t('crew.earnings.bannerBodyFreelancer')}
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-hm border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">{t('crew.earnings.thisMonth')}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{fmtEUR(currentEarnings)}</div>
          <div className="flex items-center gap-1 mt-1">
            {earningsDelta !== null && (
              <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${earningsDelta > 0 ? 'text-green-600' : earningsDelta < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                {earningsDelta > 0 ? <TrendingUp className="h-3 w-3" /> : earningsDelta < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                {earningsDelta > 0 ? '+' : ''}{earningsDelta.toFixed(0)}%
              </span>
            )}
          </div>
        </div>
        <div className="rounded-hm border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">{t('crew.earnings.tasksThisMonth')}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{currentMonthTasks}</div>
          <div className="text-xs text-gray-400 mt-1">{t('crew.earnings.tasksCompletedSuffix')}</div>
        </div>
        <div className="rounded-hm border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">{t('crew.earnings.pending')}</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{pendingTasks.length}</div>
          <div className="text-xs text-gray-400 mt-1">{t('crew.earnings.pendingSuffix')}</div>
        </div>
        <div className="rounded-hm border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">{t('crew.earnings.cumulative')}</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {fmtEUR(contractType === 'MONTHLY' ? monthlyRate * monthlyBreakdown.length : completedTasks.length * taskRate)}
          </div>
          <div className="text-xs text-gray-400 mt-1">{completedTasks.length} {t('crew.earnings.totalTasksSuffix')}</div>
        </div>
      </div>

      {/* Monthly breakdown */}
      <div className="rounded-hm border bg-white overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">{t('crew.earnings.byMonthTitle')}</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase text-gray-500 border-b">
            <tr>
              <th className="px-5 py-3">{t('crew.earnings.thMonth')}</th>
              <th className="px-5 py-3 text-center">{t('crew.earnings.thTasks')}</th>
              <th className="px-5 py-3 text-right">{t('crew.earnings.thValue')}</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {monthlyBreakdown.length === 0 && (
              <tr><td colSpan={3} className="px-5 py-8 text-center text-gray-400">{t('crew.earnings.noData')}</td></tr>
            )}
            {monthlyBreakdown.map(m => (
              <tr key={m.month} className="hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900 capitalize">{fmtMonth(m.month)}</td>
                <td className="px-5 py-3 text-center text-gray-600">{m.tasksCompleted}</td>
                <td className="px-5 py-3 text-right font-semibold text-green-700">{fmtEUR(m.earnings)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Recent completed tasks */}
      <div className="rounded-hm border bg-white overflow-hidden">
        <div className="px-5 py-3 border-b bg-gray-50">
          <h2 className="text-sm font-semibold text-gray-700">{t('crew.earnings.recentTitle')}</h2>
        </div>
        <div className="divide-y">
          {completedTasks.slice(0, 10).map(t => (
            <div key={t.id} className="px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-gray-900">{t.title}</div>
                  <div className="text-xs text-gray-400">{t.property.name} · {new Date(t.dueDate).toLocaleDateString('pt-PT')}</div>
                </div>
              </div>
              {contractType === 'FREELANCER' && (
                <span className="text-sm font-semibold text-green-700">{fmtEUR(taskRate)}</span>
              )}
            </div>
          ))}
          {completedTasks.length === 0 && (
            <div className="px-5 py-8 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
              <Clock className="h-4 w-4" /> {t('crew.earnings.noTasksYet')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
