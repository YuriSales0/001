'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Megaphone, Plus, X, Pencil, Trash2, PlusCircle, QrCode, Copy, Check, BarChart3, Users, TrendingUp, CreditCard, Filter, ChevronDown, ChevronUp, ListChecks, CheckCircle2, Circle, AlertTriangle, Crown, Target, MapPin, Mic, Sparkles, Lock as LockIcon } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useLocale } from '@/i18n/provider'
import { intlLocale, type Locale } from '@/i18n'

// ─── Analytics Types ─────────────────────────────────────────────────────────
type AnalyticsData = {
  totalLeads: number
  totalClients: number
  activeSubscriptions: number
  conversionRate: number
  funnel: {
    leads: number
    contacted: number
    registered: number
    contractSigned: number
  }
  leadsBySource: { source: string; count: number }[]
  planDistribution: { plan: string; count: number }[]
  recentLeads: {
    id: string
    name: string
    email: string | null
    source: string
    status: string
    createdAt: string
  }[]
  convertedLeads: number
}

type PeriodKey = 'today' | '7d' | '30d' | '90d' | 'custom'

const SOURCE_LABEL_KEYS: Record<string, string> = {
  CADASTRO: 'manager.crm.sourceRegistration',
  NEWSLETTER: 'manager.crm.sourceNewsletter',
  ONLINE: 'manager.crm.sourceOnline',
  PHONE: 'manager.crm.sourcePhone',
  WHATSAPP: 'manager.crm.sourceWhatsApp',
  WEBSITE: 'manager.crm.sourceWebsite',
  EMAIL: 'manager.crm.sourceEmail',
  REFERRAL: 'manager.crm.sourceReferral',
  OTHER: 'manager.crm.sourceOther',
}

const STATUS_LABEL_KEYS: Record<string, string> = {
  NEW: 'manager.crm.stageNew',
  CONTACTED: 'manager.crm.stageContacted',
  QUALIFIED: 'manager.crm.stageQualified',
  CONVERTED: 'manager.crm.stageConverted',
  RETAINED: 'manager.crm.stageRetained',
  LOST: 'manager.crm.stageLost',
  REMARKETING: 'manager.crm.stageRemarketing',
}

const PLAN_LABEL_KEYS: Record<string, string> = {
  STARTER: 'client.plan.starterName',
  BASIC: 'client.plan.basicName',
  MID: 'client.plan.midName',
  PREMIUM: 'client.plan.premiumName',
  NONE: 'admin.marketing.noPlan',
}

const PLAN_COLORS: Record<string, string> = {
  STARTER: 'bg-gray-300',
  BASIC: 'bg-blue-400',
  MID: 'bg-amber-400',
  PREMIUM: 'bg-emerald-500',
  NONE: 'bg-gray-200',
}

// ─── Analytics Dashboard ─────────────────────────────────────────────────────
function AnalyticsDashboard() {
  const { t } = useLocale()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [period, setPeriod] = useState<PeriodKey>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [recentUsers, setRecentUsers] = useState<{ id: string; name: string | null; email: string; language: string; createdAt: string }[]>([])
  const [recentRecruits, setRecentRecruits] = useState<{ id: string; name: string; email: string; role: string; status: string; createdAt: string }[]>([])

  const dateRange = useMemo(() => {
    const now = new Date()
    let from: string | null = null
    let to: string | null = null

    if (period === 'today') {
      from = now.toISOString().slice(0, 10)
      to = from
    } else if (period === '7d') {
      const d = new Date(now)
      d.setDate(d.getDate() - 7)
      from = d.toISOString().slice(0, 10)
    } else if (period === '30d') {
      const d = new Date(now)
      d.setDate(d.getDate() - 30)
      from = d.toISOString().slice(0, 10)
    } else if (period === '90d') {
      const d = new Date(now)
      d.setDate(d.getDate() - 90)
      from = d.toISOString().slice(0, 10)
    } else if (period === 'custom' && customFrom) {
      from = customFrom
      to = customTo || null
    }

    return { from, to }
  }, [period, customFrom, customTo])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (dateRange.from) params.set('from', dateRange.from)
      if (dateRange.to) params.set('to', dateRange.to)
      const [res, usersRes, recruitsRes] = await Promise.all([
        fetch(`/api/admin/marketing-analytics?${params}`),
        fetch('/api/users?role=CLIENT&take=10&orderBy=createdAt'),
        fetch('/api/recruit?take=10'),
      ])
      if (res.ok) setData(await res.json())
      else setError(t('common.error'))
      if (usersRes.ok) setRecentUsers(await usersRes.json())
      if (recruitsRes.ok) { const r = await recruitsRes.json(); setRecentRecruits(Array.isArray(r) ? r : r.data ?? []) }
    } catch {
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }, [dateRange, t])

  useEffect(() => { fetchData() }, [fetchData])

  const funnelSteps = useMemo(() => {
    if (!data) return []
    return [
      { key: 'siteVisitors', label: t('admin.marketing.siteVisitors'), value: null as number | null, placeholder: true },
      { key: 'leadsCreated', label: t('admin.marketing.leadsCreated'), value: data.funnel.leads, placeholder: false },
      { key: 'contacted', label: t('admin.marketing.contacted'), value: data.funnel.contacted, placeholder: false },
      { key: 'registered', label: t('admin.marketing.registered'), value: data.funnel.registered, placeholder: false },
      { key: 'contractSigned', label: t('admin.marketing.contractSigned'), value: data.funnel.contractSigned, placeholder: false },
    ]
  }, [data, t])

  const maxFunnel = useMemo(() => {
    if (!data) return 1
    return Math.max(data.funnel.leads, 1)
  }, [data])

  const totalPlanUsers = useMemo(() => {
    if (!data) return 0
    return data.planDistribution.reduce((s, p) => s + p.count, 0)
  }, [data])

  if (collapsed) {
    return (
      <div className="rounded-hm border border-hm-border bg-white p-4">
        <button
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2 text-sm font-semibold text-hm-black hover:text-hm-gold transition-colors w-full"
        >
          <BarChart3 className="h-5 w-5" />
          <span className="font-serif text-lg">{t('admin.marketing.analyticsOverview')}</span>
          <ChevronDown className="h-4 w-4 ml-auto" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-hm-black" />
          <h2 className="text-2xl font-serif font-bold text-hm-black">{t('admin.marketing.analyticsOverview')}</h2>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="rounded-md p-1.5 text-gray-400 hover:text-hm-black hover:bg-gray-100 transition-colors"
          title="Collapse"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      </div>

      {/* Period Filter */}
      <div className="rounded-hm border border-hm-border bg-white p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-4 w-4 text-gray-400" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.marketing.periodFilter')}</span>
          <div className="flex gap-1.5 ml-2">
            {([
              { key: 'today' as PeriodKey, label: t('admin.marketing.today') },
              { key: '7d' as PeriodKey, label: t('admin.marketing.last7Days') },
              { key: '30d' as PeriodKey, label: t('admin.marketing.last30Days') },
              { key: '90d' as PeriodKey, label: t('admin.marketing.last90Days') },
              { key: 'custom' as PeriodKey, label: t('admin.marketing.customRange') },
            ]).map(p => (
              <button
                key={p.key}
                onClick={() => {
                  setPeriod(p.key)
                  if (p.key === 'custom') setShowCustom(true)
                  else setShowCustom(false)
                }}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  period === p.key
                    ? 'bg-hm-black text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {showCustom && period === 'custom' && (
            <div className="flex items-center gap-2 ml-4">
              <label className="text-xs text-gray-500">{t('admin.marketing.from')}</label>
              <input
                type="date"
                value={customFrom}
                onChange={e => setCustomFrom(e.target.value)}
                className="rounded-md border px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-hm-gold"
              />
              <label className="text-xs text-gray-500">{t('admin.marketing.to')}</label>
              <input
                type="date"
                value={customTo}
                onChange={e => setCustomTo(e.target.value)}
                className="rounded-md border px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-hm-gold"
              />
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-hm border border-red-200 bg-red-50 p-4 flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-hm border border-hm-border bg-white p-5 animate-pulse">
              <div className="h-3 rounded bg-hm-sand w-24 mb-3" />
              <div className="h-8 rounded bg-hm-sand w-16" />
            </div>
          ))}
        </div>
      ) : data ? (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-hm border border-hm-border bg-white p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-md bg-blue-50 p-1.5">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs uppercase text-gray-500 font-medium">{t('admin.marketing.totalLeads')}</span>
              </div>
              <div className="text-3xl font-bold text-hm-black tabular-nums">{data.totalLeads}</div>
            </div>
            <div className="rounded-hm border border-hm-border bg-white p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-md bg-green-50 p-1.5">
                  <Users className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-xs uppercase text-gray-500 font-medium">{t('admin.marketing.registrations')}</span>
              </div>
              <div className="text-3xl font-bold text-hm-black tabular-nums">{data.totalClients}</div>
            </div>
            <div className="rounded-hm border border-hm-border bg-white p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-md bg-amber-50 p-1.5">
                  <TrendingUp className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-xs uppercase text-gray-500 font-medium">{t('admin.marketing.conversionRate')}</span>
              </div>
              <div className="text-3xl font-bold text-hm-black tabular-nums">{data.conversionRate.toFixed(1)}%</div>
            </div>
            <div className="rounded-hm border border-hm-border bg-white p-5">
              <div className="flex items-center gap-2 mb-2">
                <div className="rounded-md bg-purple-50 p-1.5">
                  <CreditCard className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-xs uppercase text-gray-500 font-medium">{t('admin.marketing.activeSubscriptions')}</span>
              </div>
              <div className="text-3xl font-bold text-hm-black tabular-nums">{data.activeSubscriptions}</div>
            </div>
          </div>

          {/* Users by Role + Online Now */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { role: 'ADMIN', color: 'bg-violet-500', label: 'Admin' },
              { role: 'MANAGER', color: 'bg-blue-500', label: 'Manager' },
              { role: 'CREW', color: 'bg-emerald-500', label: 'Crew' },
              { role: 'CLIENT', color: 'bg-amber-500', label: 'Client' },
            ].map(r => {
              const logins = (data as any).usersByRole?.find((u: any) => u.role === r.role)?.count ?? 0
              const online = (data as any).onlineByRole?.[r.role] ?? 0
              return (
                <div key={r.role} className="rounded-hm border border-hm-border bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`h-2.5 w-2.5 rounded-full ${r.color}`} />
                    <span className="text-xs uppercase text-gray-500 font-medium">{r.label}</span>
                  </div>
                  <div className="text-2xl font-bold text-hm-black tabular-nums">{logins}</div>
                  <div className="text-[10px] text-gray-400">{t('admin.marketing.loginsInPeriod')}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-gray-400">{online} online</span>
                  </div>
                </div>
              )
            })}
            <div className="rounded-hm border border-hm-border bg-white p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-2.5 w-2.5 rounded-full bg-gray-400 animate-pulse" />
                <span className="text-xs uppercase text-gray-500 font-medium">{t('admin.marketing.totalOnline')}</span>
              </div>
              <div className="text-2xl font-bold text-hm-black tabular-nums">{(data as any).activeSessions ?? 0}</div>
              <div className="text-[10px] text-gray-400 mt-1">{t('admin.marketing.activeSessions')}</div>
            </div>
          </div>

          {/* Funnel + Plan Distribution Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Leads Funnel */}
            <div className="lg:col-span-2 rounded-hm border border-hm-border bg-white p-5">
              <h3 className="text-sm font-semibold text-hm-black uppercase tracking-wider mb-4">{t('admin.marketing.leadsFunnel')}</h3>
              <div className="space-y-3">
                {funnelSteps.map((step, i) => {
                  const barWidth = step.placeholder
                    ? 100
                    : step.value !== null
                      ? Math.max(4, (step.value / maxFunnel) * 100)
                      : 0
                  const prevValue = i > 0 && !funnelSteps[i - 1].placeholder
                    ? funnelSteps[i - 1].value
                    : null
                  const dropOff = prevValue !== null && prevValue > 0 && step.value !== null && !step.placeholder
                    ? ((1 - step.value / prevValue) * 100).toFixed(0)
                    : null

                  return (
                    <div key={step.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">{step.label}</span>
                        <div className="flex items-center gap-2">
                          {dropOff !== null && Number(dropOff) > 0 && (
                            <span className="text-[10px] text-red-400 font-medium">-{dropOff}% {t('admin.marketing.dropOff')}</span>
                          )}
                          <span className="text-sm font-bold text-hm-black tabular-nums">
                            {step.placeholder ? '---' : step.value}
                          </span>
                        </div>
                      </div>
                      <div className="h-7 rounded-md bg-gray-50 overflow-hidden relative">
                        {step.placeholder ? (
                          <div className="h-full bg-gray-100 rounded-md flex items-center px-3">
                            <span className="text-[10px] text-gray-400 italic">{t('admin.marketing.connectGA')}</span>
                          </div>
                        ) : (
                          <div
                            className="h-full rounded-md transition-all duration-500"
                            style={{
                              width: `${barWidth}%`,
                              background: `linear-gradient(90deg, #0B1E3A ${Math.max(0, barWidth - 15)}%, #B08A3E)`,
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Conversion by Plan */}
            <div className="rounded-hm border border-hm-border bg-white p-5">
              <h3 className="text-sm font-semibold text-hm-black uppercase tracking-wider mb-4">{t('admin.marketing.conversionByPlan')}</h3>
              <div className="space-y-3">
                {data.planDistribution
                  .sort((a, b) => {
                    const order = ['PREMIUM', 'MID', 'BASIC', 'STARTER', 'NONE']
                    return order.indexOf(a.plan) - order.indexOf(b.plan)
                  })
                  .map(p => {
                    const pct = totalPlanUsers > 0 ? ((p.count / totalPlanUsers) * 100) : 0
                    return (
                      <div key={p.plan}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-gray-700">
                            {PLAN_LABEL_KEYS[p.plan] ? t(PLAN_LABEL_KEYS[p.plan]) : p.plan}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-400">{pct.toFixed(0)}%</span>
                            <span className="text-sm font-bold text-hm-black tabular-nums">{p.count}</span>
                          </div>
                        </div>
                        <div className="h-5 rounded-md bg-gray-50 overflow-hidden">
                          <div
                            className={`h-full rounded-md transition-all duration-500 ${PLAN_COLORS[p.plan] ?? 'bg-gray-300'}`}
                            style={{ width: `${Math.max(4, pct)}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                {data.planDistribution.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">{t('admin.marketing.noLeadsYet')}</p>
                )}
              </div>
            </div>
          </div>

          {/* Lead Source + Recent Leads Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lead Source Breakdown */}
            <div className="rounded-hm border border-hm-border bg-white p-5">
              <h3 className="text-sm font-semibold text-hm-black uppercase tracking-wider mb-4">{t('admin.marketing.leadSourceBreakdown')}</h3>
              {data.leadsBySource.length > 0 ? (
                <div className="space-y-2">
                  {data.leadsBySource
                    .sort((a, b) => b.count - a.count)
                    .map(s => {
                      const maxSource = data.leadsBySource.reduce((mx, x) => Math.max(mx, x.count), 1)
                      const pct = (s.count / maxSource) * 100
                      return (
                        <div key={s.source} className="flex items-center gap-3">
                          <span className="text-xs text-gray-600 w-24 shrink-0 truncate">{SOURCE_LABEL_KEYS[s.source] ? t(SOURCE_LABEL_KEYS[s.source]) : s.source}</span>
                          <div className="flex-1 h-4 rounded bg-gray-50 overflow-hidden">
                            <div
                              className="h-full rounded bg-hm-black/80 transition-all duration-500"
                              style={{ width: `${Math.max(6, pct)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-hm-black tabular-nums w-8 text-right">{s.count}</span>
                        </div>
                      )
                    })}
                </div>
              ) : (
                <p className="text-xs text-gray-400 text-center py-4">{t('admin.marketing.noLeadsYet')}</p>
              )}
            </div>

            {/* Recent Leads Table */}
            <div className="lg:col-span-2 rounded-hm border border-hm-border bg-white overflow-hidden overflow-x-auto">
              <div className="px-5 pt-5 pb-3">
                <h3 className="text-sm font-semibold text-hm-black uppercase tracking-wider">{t('admin.marketing.recentLeads')}</h3>
              </div>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-5 py-2.5">{t('admin.marketing.name')}</th>
                    <th className="px-5 py-2.5">{t('admin.marketing.email')}</th>
                    <th className="px-5 py-2.5">{t('admin.marketing.source')}</th>
                    <th className="px-5 py-2.5">{t('admin.marketing.status')}</th>
                    <th className="px-5 py-2.5">{t('admin.marketing.created')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentLeads.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-xs text-gray-400">
                        {t('admin.marketing.noLeadsYet')}
                      </td>
                    </tr>
                  )}
                  {data.recentLeads.map(lead => (
                    <tr key={lead.id} className="border-t hover:bg-gray-50">
                      <td className="px-5 py-2.5 font-medium text-hm-black">{lead.name}</td>
                      <td className="px-5 py-2.5 text-gray-500 truncate max-w-[180px]">{lead.email ?? '---'}</td>
                      <td className="px-5 py-2.5">
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                          {SOURCE_LABEL_KEYS[lead.source] ? t(SOURCE_LABEL_KEYS[lead.source]) : lead.source}
                        </span>
                      </td>
                      <td className="px-5 py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          lead.status === 'CONVERTED' ? 'bg-green-100 text-green-700' :
                          lead.status === 'LOST' ? 'bg-red-100 text-red-600' :
                          lead.status === 'CONTACTED' ? 'bg-blue-100 text-blue-700' :
                          lead.status === 'QUALIFIED' ? 'bg-amber-100 text-amber-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {STATUS_LABEL_KEYS[lead.status] ? t(STATUS_LABEL_KEYS[lead.status]) : lead.status}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-gray-400 text-xs tabular-nums">
                        {new Date(lead.createdAt).toLocaleDateString('en-GB')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

      {/* GA4 Real-time & Site Analytics */}
      <div className="rounded-hm border border-hm-border bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-hm-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-serif font-bold text-hm-black">{t('admin.marketing.gaRealtime')}</h3>
          </div>
          <a href="https://analytics.google.com/analytics/web/#/p/G-61YMZ4P4MT/reports" target="_blank" rel="noopener noreferrer"
            className="text-xs font-medium hover:underline" style={{ color: '#B08A3E' }}>
            {t('admin.marketing.openGA')} →
          </a>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-hm-border p-4" style={{ background: 'var(--hm-sand)' }}>
              <div className="text-xs uppercase text-gray-500 mb-1">Register Flow</div>
              <div className="text-lg font-bold text-hm-black">G-61YMZ4P4MT</div>
              <p className="text-xs text-gray-400 mt-1">{t('admin.marketing.gaRegisterDesc')}</p>
            </div>
            <div className="rounded-lg border border-hm-border p-4" style={{ background: 'var(--hm-sand)' }}>
              <div className="text-xs uppercase text-gray-500 mb-1">Careers Flow</div>
              <div className="text-lg font-bold text-hm-black">G-GE38PW30QQ</div>
              <p className="text-xs text-gray-400 mt-1">{t('admin.marketing.gaCareersDesc')}</p>
            </div>
          </div>
          <div className="rounded-lg border overflow-hidden" style={{ background: '#f8f9fa' }}>
            <iframe
              src="https://datastudio.google.com/embed/reporting/3715d9ae-3e58-4e2c-8f7a-326eb81fcb8d/page/X8nvF"
              width="100%"
              height="500"
              frameBorder="0"
              style={{ border: 0, minHeight: '500px' }}
              allowFullScreen
              sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
            />
            <div className="px-4 py-3 bg-white border-t text-xs text-gray-400 text-center">
              {t('admin.marketing.gaNote')}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Registrations & Career Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sign-ups */}
        <div className="rounded-hm border border-hm-border bg-white overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-hm-black uppercase tracking-wider">{t('admin.marketing.recentSignups')}</h3>
            <span className="text-xs font-bold rounded-full px-2 py-0.5 bg-emerald-100 text-emerald-700">{data?.totalClients ?? 0}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-2.5">{t('admin.marketing.name')}</th>
                  <th className="px-5 py-2.5">{t('admin.marketing.email')}</th>
                  <th className="px-5 py-2.5">{t('common.language')}</th>
                  <th className="px-5 py-2.5">{t('admin.marketing.created')}</th>
                </tr>
              </thead>
              <tbody>
                {(!recentUsers || recentUsers.length === 0) && (
                  <tr><td colSpan={4} className="px-5 py-6 text-center text-xs text-gray-400">{t('admin.marketing.noSignups')}</td></tr>
                )}
                {recentUsers?.map(u => (
                  <tr key={u.id} className="border-t hover:bg-gray-50">
                    <td className="px-5 py-2.5 font-medium text-hm-black">{u.name ?? '—'}</td>
                    <td className="px-5 py-2.5 text-gray-500 truncate max-w-[180px]">{u.email}</td>
                    <td className="px-5 py-2.5"><span className="text-xs">{u.language?.toUpperCase()}</span></td>
                    <td className="px-5 py-2.5 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString('en-GB')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Career Applications */}
        <div className="rounded-hm border border-hm-border bg-white overflow-hidden">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-hm-black uppercase tracking-wider">{t('admin.marketing.recentApplications')}</h3>
            <span className="text-xs font-bold rounded-full px-2 py-0.5 bg-blue-100 text-blue-700">{recentRecruits?.length ?? 0}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-2.5">{t('admin.marketing.name')}</th>
                  <th className="px-5 py-2.5">{t('admin.marketing.email')}</th>
                  <th className="px-5 py-2.5">{t('common.status')}</th>
                  <th className="px-5 py-2.5">{t('admin.marketing.created')}</th>
                </tr>
              </thead>
              <tbody>
                {(!recentRecruits || recentRecruits.length === 0) && (
                  <tr><td colSpan={4} className="px-5 py-6 text-center text-xs text-gray-400">{t('admin.marketing.noApplications')}</td></tr>
                )}
                {recentRecruits?.map(r => (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="px-5 py-2.5 font-medium text-hm-black">{r.name}</td>
                    <td className="px-5 py-2.5 text-gray-500 truncate max-w-[180px]">{r.email}</td>
                    <td className="px-5 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        r.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                        'bg-amber-100 text-amber-700'
                      }`}>{r.role} · {r.status}</span>
                    </td>
                    <td className="px-5 py-2.5 text-gray-400 text-xs">{new Date(r.createdAt).toLocaleDateString('en-GB')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-hm-border" />
    </div>
  )
}

type Campaign = {
  id: string
  name: string
  channel: string
  type: string
  status: 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'
  trackingCode: string | null
  budgetAllocated: number
  budgetSpent: number
  startDate: string | null
  endDate: string | null
  targetAudience: string | null
  description: string | null
  _count?: { leadAttributions: number }
}

const CHANNELS = ['GOOGLE_ADS','META','LINKEDIN','EMAIL','SEO','CONTENT','EVENT','PRINT','PARTNERSHIP','SIGNAGE','REFERRAL','OTHER']
const TYPES    = ['DIGITAL','PHYSICAL','EMAIL','EVENT','PRINT']
const STATUSES = ['PLANNING','ACTIVE','PAUSED','COMPLETED'] as const
const CAMPAIGN_STATUS_LABEL_KEYS: Record<string, string> = {
  PLANNING:  'admin.marketing.statusPlanning',
  ACTIVE:    'admin.marketing.statusActive',
  PAUSED:    'admin.marketing.statusPaused',
  COMPLETED: 'admin.marketing.statusCompleted',
}
const STATUS_COLORS: Record<string, string> = {
  PLANNING:  'bg-gray-100 text-gray-600',
  ACTIVE:    'bg-green-100 text-green-700',
  PAUSED:    'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
}
const CHANNEL_LABEL_KEYS: Record<string, string> = {
  GOOGLE_ADS: 'admin.marketing.channelGoogleAds',
  META: 'admin.marketing.channelMeta',
  LINKEDIN: 'admin.marketing.channelLinkedIn',
  EMAIL: 'admin.marketing.channelEmail',
  SEO: 'admin.marketing.channelSeo',
  CONTENT: 'admin.marketing.channelContent',
  EVENT: 'admin.marketing.channelEvent',
  PRINT: 'admin.marketing.channelPrint',
  PARTNERSHIP: 'admin.marketing.channelPartnership',
  SIGNAGE: 'admin.marketing.channelSignage',
  REFERRAL: 'admin.marketing.channelReferral',
  OTHER: 'admin.marketing.channelOther',
}
const CAMPAIGN_TYPE_LABEL_KEYS: Record<string, string> = {
  DIGITAL: 'admin.marketing.typeDigital',
  PHYSICAL: 'admin.marketing.typePhysical',
  EMAIL: 'admin.marketing.typeEmail',
  EVENT: 'admin.marketing.typeEvent',
  PRINT: 'admin.marketing.typePrint',
}

const fmtEUR = (n: number, locale?: Locale) =>
  new Intl.NumberFormat(intlLocale(locale ?? 'en'), { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

// ─── Create / Edit Modal ─────────────────────────────────────────────────────
function CampaignModal({
  campaign,
  onClose,
  onSaved,
}: {
  campaign: Campaign | null
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useLocale()
  const isEdit = !!campaign
  const [name, setName]                   = useState(campaign?.name ?? '')
  const [channel, setChannel]             = useState(campaign?.channel ?? 'META')
  const [type, setType]                   = useState(campaign?.type ?? 'DIGITAL')
  const [status, setStatus]               = useState<string>(campaign?.status ?? 'PLANNING')
  const [budget, setBudget]               = useState(campaign?.budgetAllocated.toString() ?? '')
  const [startDate, setStartDate]         = useState(campaign?.startDate?.slice(0, 10) ?? '')
  const [endDate, setEndDate]             = useState(campaign?.endDate?.slice(0, 10) ?? '')
  const [targetAudience, setTargetAudience] = useState(campaign?.targetAudience ?? '')
  const [description, setDescription]     = useState(campaign?.description ?? '')
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const body = {
        name, channel, type, status,
        budgetAllocated: parseFloat(budget) || 0,
        startDate: startDate || null,
        endDate:   endDate   || null,
        targetAudience: targetAudience || null,
        description:    description    || null,
      }
      let res: Response
      if (isEdit) {
        res = await fetch(`/api/campaigns/${campaign!.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      }
      if (!res.ok) {
        setError(t('common.error'))
        setSaving(false)
        return
      }
      setSaving(false)
      onSaved()
      onClose()
    } catch {
      setError(t('common.error'))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-hm-black">{isEdit ? t('admin.marketing.editCampaign') : t('admin.marketing.newCampaign')}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('common.name')} *</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
              placeholder="e.g. Google Ads Spring 2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t('admin.marketing.channelLabel')}</label>
              <select value={channel} onChange={e => setChannel(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold">
                {CHANNELS.map(c => <option key={c} value={c}>{CHANNEL_LABEL_KEYS[c] ? t(CHANNEL_LABEL_KEYS[c]) : c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t('admin.marketing.typeLabel')}</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold">
                {TYPES.map(tp => <option key={tp} value={tp}>{CAMPAIGN_TYPE_LABEL_KEYS[tp] ? t(CAMPAIGN_TYPE_LABEL_KEYS[tp]) : tp}</option>)}
              </select>
            </div>
          </div>
          {isEdit && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t('common.status')}</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold">
                {STATUSES.map(s => <option key={s} value={s}>{CAMPAIGN_STATUS_LABEL_KEYS[s] ? t(CAMPAIGN_STATUS_LABEL_KEYS[s]) : s}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('admin.marketing.budgetLabel')}</label>
            <input type="number" min="0" step="0.01" value={budget} onChange={e => setBudget(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" placeholder="0" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t('contracts.startDate')}</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t('contracts.endDate')}</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('admin.marketing.targetAudience')}</label>
            <input value={targetAudience} onChange={e => setTargetAudience(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
              placeholder="e.g. Nordic property owners 35-60, Costa Tropical" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('common.description')}</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={2} className="w-full rounded-md border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-hm-gold" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border py-2.5 text-sm font-medium hover:bg-gray-50">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-lg bg-hm-black py-2.5 text-sm font-semibold text-white hover:bg-hm-black/90 disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? t('admin.marketing.saving') : isEdit ? t('admin.marketing.saveChanges') : t('admin.marketing.createCampaign')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Log Spend Modal ─────────────────────────────────────────────────────────
function SpendModal({ campaign, onClose, onSaved }: { campaign: Campaign; onClose: () => void; onSaved: () => void }) {
  const { t } = useLocale()
  const [amount, setAmount]           = useState('')
  const [date, setDate]               = useState(new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/spend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: parseFloat(amount), date, description: description || null }),
      })
      if (!res.ok) {
        setError(t('common.error'))
        setSaving(false)
        return
      }
      setSaving(false)
      onSaved()
      onClose()
    } catch {
      setError(t('common.error'))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-bold text-hm-black">{t('admin.marketing.logSpend')}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{campaign.name}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('admin.marketing.amountSpent')} *</label>
            <input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
              required className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" placeholder="0.00" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('common.date')}</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">{t('admin.marketing.descriptionOptional')}</label>
            <input value={description} onChange={e => setDescription(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
              placeholder="e.g. Google Ads — Apr 1-15" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border py-2.5 text-sm font-medium hover:bg-gray-50">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={saving || !amount}
              className="flex-1 rounded-lg bg-hm-black py-2.5 text-sm font-semibold text-white hover:bg-hm-black/90 disabled:opacity-50">
              {saving ? t('admin.marketing.saving') : t('admin.marketing.logSpend')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── QR Code Modal ───────────────────────────────────────────────────────────
function QrModal({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const { t } = useLocale()
  const [copied, setCopied] = useState(false)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const url = `${baseUrl}/leads/new?ref=${campaign.trackingCode}`

  const copyUrl = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-bold text-hm-black">{t('admin.marketing.qrCode')}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{campaign.name}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          <div className="rounded-hm border p-3 bg-white shadow-sm">
            <QRCodeSVG value={url} size={200} level="M" includeMargin />
          </div>
          <div className="w-full">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">{t('admin.marketing.leadCaptureUrl')}</p>
            <div className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2">
              <span className="flex-1 text-xs text-gray-600 truncate font-mono">{url}</span>
              <button
                onClick={copyUrl}
                className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
                title={t('admin.marketing.copyUrl')}
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 text-center">
            {t('admin.marketing.qrDescription')}
          </p>
          <button
            onClick={() => {
              const svg = document.querySelector('#qr-print-area svg') as SVGElement | null
              if (!svg) return
              const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = `qr-${campaign.trackingCode}.svg`
              a.click()
            }}
            className="w-full rounded-lg border py-2.5 text-sm font-medium hover:bg-gray-50"
          >
            {t('admin.marketing.downloadSvg')}
          </button>
        </div>
        {/* Hidden element for download targeting */}
        <div id="qr-print-area" className="hidden">
          <QRCodeSVG value={url} size={400} level="H" includeMargin />
        </div>
      </div>
    </div>
  )
}

// ─── Marketing Plan Tracker ──────────────────────────────────────────────────

const PHASES = [
  { id: 1, key: 'beta', start: '2026-04', end: '2026-07' },
  { id: 2, key: 'expansion', start: '2026-08', end: '2027-03' },
  { id: 3, key: 'grow', start: '2027-04', end: '2028-03' },
  { id: 4, key: 'scale', start: '2028-04', end: '2030-12' },
]

const EXIT_CRITERIA: Record<number, string[]> = {
  1: ['phase1Exit1','phase1Exit2','phase1Exit3','phase1Exit4','phase1Exit5','phase1Exit6','phase1Exit7'],
  2: ['phase2Exit1','phase2Exit2','phase2Exit3','phase2Exit4','phase2Exit5','phase2Exit6','phase2Exit7','phase2Exit8'],
  3: ['phase3Exit1','phase3Exit2','phase3Exit3','phase3Exit4','phase3Exit5','phase3Exit6','phase3Exit7'],
}

const PHASE_BUDGETS: Record<number, { key: string; target: number }[]> = {
  1: [
    { key: 'eventsActivations', target: 300 },
    { key: 'physicalMaterials', target: 330 },
  ],
  2: [
    { key: 'googleAds', target: 3200 },
    { key: 'metaAds', target: 2000 },
    { key: 'linkedInAds', target: 600 },
    { key: 'contentCreation', target: 500 },
    { key: 'eventsActivations', target: 1500 },
    { key: 'physicalMaterials', target: 600 },
    { key: 'officeShare', target: 2400 },
  ],
  3: [
    { key: 'googleAds', target: 5500 },
    { key: 'metaAds', target: 4000 },
    { key: 'linkedInAds', target: 1500 },
    { key: 'contentCreation', target: 1200 },
    { key: 'eventsActivations', target: 2500 },
    { key: 'physicalMaterials', target: 800 },
    { key: 'officeShare', target: 4800 },
  ],
}

const WEEKLY_TASKS = ['weeklyLinkedInPost','weeklyLinkedInConnections','weeklyFacebookGroups','weeklyAgencyVisits','weeklyPartnerRecruitment','weeklyContentCalendar','weeklyLeadFollowUp']

function getCurrentPhase(): number {
  const now = new Date().toISOString().slice(0, 7)
  for (const p of PHASES) {
    if (now >= p.start && now <= p.end) return p.id
  }
  return now < '2026-04' ? 1 : 4
}

function useLocalStorage<T>(key: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [val, setVal] = useState<T>(() => {
    if (typeof window === 'undefined') return initial
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial } catch { return initial }
  })
  const set = useCallback((v: T | ((prev: T) => T)) => {
    setVal(prev => {
      const next = typeof v === 'function' ? (v as (p: T) => T)(prev) : v
      localStorage.setItem(key, JSON.stringify(next))
      return next
    })
  }, [key])
  return [val, set]
}

function getISOWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
}

function MarketingPlanTracker() {
  const { t } = useLocale()
  const [open, setOpen] = useState(true)
  const [activePhase, setActivePhase] = useLocalStorage<number>('hm_plan_active_phase', 1)
  const [selectedPhase, setSelectedPhase] = useState(0)
  const [checks, setChecks] = useLocalStorage<Record<string, boolean>>('hm_plan_checks', {})
  const [budgetSpent, setBudgetSpent] = useLocalStorage<Record<string, number>>('hm_plan_budget', {})
  const [weeklyChecks, setWeeklyChecks] = useLocalStorage<Record<string, boolean>>('hm_plan_weekly', {})
  const [customTasks, setCustomTasks] = useLocalStorage<string[]>('hm_plan_custom', [])
  const [newTask, setNewTask] = useState('')
  type PhaseMetrics = {
    leadsPerMonth: number; totalLeadsInPhase: number; conversionRate: number
    partnerPct: number; churnRate: number; mrr: number; cac: number | null
    activeClients: number; managers: number; crewValidated: number
  }
  const [metrics, setMetrics] = useState<PhaseMetrics | null>(null)

  useEffect(() => { setSelectedPhase(activePhase) }, [activePhase])

  useEffect(() => {
    const now = new Date()
    const currentWeek = `${now.getFullYear()}-W${getISOWeekNumber(now)}`
    const storedWeek = typeof window !== 'undefined' ? localStorage.getItem('hm_plan_weekly_week') : null
    if (storedWeek !== currentWeek) {
      setWeeklyChecks({})
      if (typeof window !== 'undefined') localStorage.setItem('hm_plan_weekly_week', currentWeek)
    }
  }, [setWeeklyChecks])

  useEffect(() => {
    const phase = PHASES.find(p => p.id === activePhase)
    if (!phase) return
    const params = new URLSearchParams({ from: `${phase.start}-01`, to: `${phase.end}-28` })
    fetch(`/api/admin/phase-metrics?${params}`)
      .then(r => r.ok ? r.json() : null)
      .then(setMetrics)
      .catch(() => {})
  }, [activePhase])

  const phaseLabel = (key: string) => t(`admin.marketing.marketingPlan.${key}`)
  const mp = (k: string) => t(`admin.marketing.marketingPlan.${k}`)

  const exitKeys = EXIT_CRITERIA[selectedPhase] ?? []
  const completedExits = exitKeys.filter(k => checks[k]).length
  const budgetItems = PHASE_BUDGETS[selectedPhase] ?? PHASE_BUDGETS[1]
  const totalTarget = budgetItems.reduce((s, b) => s + b.target, 0)
  const totalSpent = budgetItems.reduce((s, b) => s + (budgetSpent[`${selectedPhase}_${b.key}`] ?? 0), 0)

  const m = metrics
  const KPI_ROWS = [
    { key: 'newLeadsMonth', targets: ['15-20', '30-50', '60-100'], actual: m ? String(m.leadsPerMonth) : '—' },
    { key: 'cac', targets: ['€50-100', '€200-400', '€300-600'], actual: m?.cac != null ? `€${m.cac}` : '—' },
    { key: 'leadClientConversion', targets: ['10-15%', '8-12%', '6-10%'], actual: m ? `${m.conversionRate}%` : '—' },
    { key: 'leadsViaPartners', targets: ['15%', '25-35%', '30-40%'], actual: m ? `${m.partnerPct}%` : '—' },
    { key: 'monthlyChurn', targets: ['<5%', '<3%', '<2%'], actual: m ? `${m.churnRate}%` : '—' },
    { key: 'nps', targets: ['>7', '>8', '>8.5'], actual: '—' },
    { key: 'mrr', targets: ['€2,500+', '€13,000+', '€50,000+'], actual: m ? `€${m.mrr.toLocaleString('en-GB')}` : '—' },
    { key: 'activeClients', targets: ['3-5', '25+', '100+'], actual: m ? String(m.activeClients) : '—' },
    { key: 'operationalManagers', targets: ['2', '4-5', '12+'], actual: m ? String(m.managers) : '—' },
    { key: 'validatedCrew', targets: ['3-5', '8-12', '15+'], actual: m ? String(m.crewValidated) : '—' },
  ]

  return (
    <div className="rounded-hm border border-hm-border overflow-hidden" style={{ background: 'var(--hm-sand)' }}>
      <button onClick={() => setOpen(!open)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-hm-ivory/50 transition-colors">
        <div className="flex items-center gap-3">
          <ListChecks className="h-5 w-5" style={{ color: '#B08A3E' }} />
          <div className="text-left">
            <h2 className="font-serif font-bold text-hm-black text-lg">{mp('title')}</h2>
            <p className="text-xs text-gray-500">{mp('subtitle')}</p>
          </div>
        </div>
        {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-hm-border px-6 py-6 space-y-6">

          {/* Phase Timeline — Admin declares active phase */}
          <div className="flex gap-2">
            {PHASES.map(p => {
              const isActive = p.id === activePhase
              const isCompleted = p.id < activePhase
              const isSelected = p.id === selectedPhase
              return (
                <button key={p.id} onClick={() => setSelectedPhase(p.id)}
                  className={`flex-1 rounded-lg border-2 p-3 text-left transition-all ${
                    isSelected ? 'border-hm-gold shadow-sm' : 'border-transparent hover:border-hm-border'
                  }`}
                  style={{ background: isSelected ? 'white' : 'transparent' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`h-3 w-3 rounded-full ${isCompleted ? 'bg-hm-green' : isActive ? 'bg-hm-gold' : 'bg-gray-300'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{mp('phase')} {p.id}</span>
                  </div>
                  <p className="font-serif font-bold text-hm-black text-sm">{phaseLabel(p.key)}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{mp(`phase${p.id}Dates`)}</p>
                  {isActive && <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ background: 'rgba(176,138,62,0.15)', color: '#B08A3E' }}>{mp('current')}</span>}
                  {isCompleted && <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">{mp('completed')}</span>}
                  {isSelected && !isActive && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setActivePhase(p.id) }}
                      className="mt-1.5 w-full rounded text-[10px] font-bold py-1 transition-colors hover:opacity-90"
                      style={{ background: '#0B1E3A', color: '#B08A3E' }}>
                      {mp('setAsCurrent')}
                    </button>
                  )}
                </button>
              )
            })}
          </div>
          <p className="text-[11px] text-gray-400 -mt-4">
            {mp('metricsFilteredFrom')} <strong className="text-hm-black">{phaseLabel(PHASES.find(p => p.id === activePhase)?.key ?? 'beta')}</strong> ({PHASES.find(p => p.id === activePhase)?.start}-01)
          </p>

          {/* Exit Criteria */}
          {exitKeys.length > 0 && (
            <div className="rounded-lg border border-hm-border bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif font-bold text-hm-black">{mp('exitCriteria')}</h3>
                <span className="text-xs font-bold px-2 py-1 rounded" style={{ background: completedExits === exitKeys.length ? 'rgba(42,122,79,0.1)' : 'rgba(176,138,62,0.1)', color: completedExits === exitKeys.length ? '#2A7A4F' : '#B08A3E' }}>
                  {completedExits}/{exitKeys.length}
                </span>
              </div>
              <p className="text-xs text-gray-500 mb-4">{mp('exitCriteriaDesc')}</p>
              <div className="space-y-2">
                {exitKeys.map(k => (
                  <label key={k} className="flex items-start gap-3 cursor-pointer group">
                    <input type="checkbox" checked={!!checks[k]} onChange={() => setChecks(prev => ({ ...prev, [k]: !prev[k] }))}
                      className="mt-0.5 accent-[#B08A3E]" />
                    <span className={`text-sm ${checks[k] ? 'text-gray-400 line-through' : 'text-hm-black'}`}>{mp(k)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* KPI Targets vs Actuals */}
          <div className="rounded-lg border border-hm-border bg-white p-5">
            <h3 className="font-serif font-bold text-hm-black mb-4">{mp('kpiTargets')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-xs uppercase text-gray-400 border-b">
                  <th className="text-left pb-2">{mp('metric')}</th>
                  <th className="text-center pb-2">{mp('target')}</th>
                  <th className="text-center pb-2">{mp('actual')}</th>
                  <th className="text-center pb-2">{mp('statusCol')}</th>
                </tr></thead>
                <tbody>
                  {KPI_ROWS.map(row => {
                    const target = row.targets[Math.min(selectedPhase - 1, 2)]
                    return (
                      <tr key={row.key} className="border-b border-gray-50">
                        <td className="py-2.5 text-hm-black font-medium">{mp(row.key)}</td>
                        <td className="py-2.5 text-center text-gray-500">{target}</td>
                        <td className="py-2.5 text-center font-semibold text-hm-black">{row.actual}</td>
                        <td className="py-2.5 text-center">
                          {row.actual === '—'
                            ? <Circle className="h-4 w-4 text-gray-300 mx-auto" />
                            : row.actual === '0' || row.actual === '0.0%'
                              ? <AlertTriangle className="h-4 w-4 text-amber-400 mx-auto" />
                              : <CheckCircle2 className="h-4 w-4 text-hm-green mx-auto" />}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Budget Tracker */}
          <div className="rounded-lg border border-hm-border bg-white p-5">
            <h3 className="font-serif font-bold text-hm-black mb-4">{mp('phaseBudgetTracker')}</h3>
            <div className="space-y-3">
              {budgetItems.map(b => {
                const spentKey = `${selectedPhase}_${b.key}`
                const spent = budgetSpent[spentKey] ?? 0
                const pct = b.target > 0 ? Math.min((spent / b.target) * 100, 100) : 0
                return (
                  <div key={b.key} className="flex items-center gap-4">
                    <span className="text-sm text-hm-black w-36 shrink-0">{mp(b.key)}</span>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-gray-100">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 90 ? '#A32D2D' : '#B08A3E' }} />
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 w-16 text-right">€{b.target}</span>
                    <input type="number" value={spent || ''} placeholder="0"
                      onChange={e => setBudgetSpent(prev => ({ ...prev, [spentKey]: Number(e.target.value) || 0 }))}
                      className="w-20 rounded-lg border border-hm-border px-2 py-1 text-sm text-right focus:outline-none focus:ring-2 focus:ring-hm-gold" />
                  </div>
                )
              })}
              <div className="flex items-center gap-4 pt-2 border-t border-gray-100 font-semibold">
                <span className="text-sm text-hm-black w-36">{mp('phaseBudgetTotal')}</span>
                <div className="flex-1" />
                <span className="text-xs text-gray-500 w-16 text-right">€{totalTarget}</span>
                <span className={`w-20 text-sm text-right ${totalSpent > totalTarget ? 'text-red-600' : 'text-hm-black'}`}>€{totalSpent}</span>
              </div>
            </div>
          </div>

          {/* Weekly Actions */}
          <div className="rounded-lg border border-hm-border bg-white p-5">
            <h3 className="font-serif font-bold text-hm-black mb-4">{mp('weeklyActions')}</h3>
            <div className="space-y-2">
              {WEEKLY_TASKS.map(k => (
                <label key={k} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={!!weeklyChecks[k]} onChange={() => setWeeklyChecks(prev => ({ ...prev, [k]: !prev[k] }))}
                    className="accent-[#B08A3E]" />
                  <span className={`text-sm ${weeklyChecks[k] ? 'text-gray-400 line-through' : 'text-hm-black'}`}>{mp(k)}</span>
                </label>
              ))}
              {customTasks.map((task, i) => (
                <label key={`c${i}`} className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={!!weeklyChecks[`custom_${i}`]}
                    onChange={() => setWeeklyChecks(prev => ({ ...prev, [`custom_${i}`]: !prev[`custom_${i}`] }))}
                    className="accent-[#B08A3E]" />
                  <span className={`text-sm flex-1 ${weeklyChecks[`custom_${i}`] ? 'text-gray-400 line-through' : 'text-hm-black'}`}>{task}</span>
                  <button onClick={() => setCustomTasks(prev => prev.filter((_, j) => j !== i))} className="text-gray-300 hover:text-red-400 p-1">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </label>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={newTask} onChange={e => setNewTask(e.target.value)} placeholder={mp('taskPlaceholder')}
                onKeyDown={e => { if (e.key === 'Enter' && newTask.trim()) { setCustomTasks(prev => [...prev, newTask.trim()]); setNewTask('') } }}
                className="flex-1 rounded-lg border border-hm-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" />
              <button onClick={() => { if (newTask.trim()) { setCustomTasks(prev => [...prev, newTask.trim()]); setNewTask('') } }}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-white hover:opacity-90" style={{ background: '#B08A3E' }}>
                {mp('addTask')}
              </button>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

// ─── Long-term strategic plan: lean growth, self-funded, moats from operations ──
// Mental model: "Direct Mode IS moat construction." Each Costa Tropical property
// adds AI Pricing data + VAGF data + playbook learnings + testimonial seed +
// case study material. Without 2-3 years of Direct Mode data, neither SaaS
// Platform Mode nor Franchise are sellable. So Phase 1-3 are not validation
// "before" something — they ARE the moat build.

type ProofPointKey = 'aiPricingProof' | 'systemSansFounder' | 'secondZone' | 'caseStudies' | 'industryPresence'

const STRATEGIC_PHASES: { id: string; year: string; title: string; desc: string; targetProps: string; revenueModel: string }[] = [
  {
    id: 'foundation',
    year: '2026',
    title: 'Costa Tropical Foundation',
    desc: 'Validar economic unit. AI Pricing começa a acumular dados. VAGF activo. Recrutar 1º Manager externo. Yuri delega Captain duties no mês 6.',
    targetProps: '5 → 25 props',
    revenueModel: 'Direct Mode only',
  },
  {
    id: 'scale-ct',
    year: '2027',
    title: 'Costa Tropical Scale + 2ª Zona',
    desc: 'Saturar Costa Tropical (40-50 props). Abrir Costa del Sol ou Algarve com Manager local. Operations Lead contratado. Yuri foca product + moats.',
    targetProps: '25 → 80 props',
    revenueModel: 'Direct Mode (2 zonas)',
  },
  {
    id: 'consolidate',
    year: '2028',
    title: 'Multi-Zona Mature + Strategic Partner',
    desc: 'Caminho B tech ready. 1º partner externo (BR ou Algarve, alguém da rede pessoal — excepção, não template). Case studies publicados. Industry presence começa.',
    targetProps: '80 → 150 props',
    revenueModel: 'Direct Mode + 1 strategic partner (excepção)',
  },
  {
    id: 'platform-mode',
    year: '2029',
    title: 'Platform Mode SaaS Launch',
    desc: 'Moats provados (AI uplift documentado, multi-zona, case studies). Lançar Platform Mode SaaS per-property pricing competitivo. Target: PMs mid-tier.',
    targetProps: '150 → 250 props (Direct) + 5-10 SaaS clients',
    revenueModel: 'Direct Mode + SaaS Platform Mode',
  },
  {
    id: 'franchise-launch',
    year: '2030',
    title: 'Franchise Launch (com moats)',
    desc: 'Brand recognition em zonas premium. Estrutura legal franchise pronta. 1ªs vendas a estranhos a €40-75k. Series A possível (€2-5M, valuation €15-30M).',
    targetProps: '250 → 450 props (mix)',
    revenueModel: 'Direct + SaaS + Franchise',
  },
  {
    id: 'replication',
    year: '2031',
    title: 'Replication Engine',
    desc: '10-15 franquias activas. Internacional fora ES. Self-serve franchise qualification. Series B (€10-20M, valuation €100-200M).',
    targetProps: '450 → 800 props (todos modelos)',
    revenueModel: 'Hybrid escalado',
  },
  {
    id: 'unicorn',
    year: '2032+',
    title: 'Unicorn Trajectory',
    desc: 'Hybrid: franchise (premium markets) + SaaS (commodity markets) + Direct (proof zones). 30-50 franquias maduras + 100+ SaaS. Valuation €500M-1B.',
    targetProps: '1500-3000+ props',
    revenueModel: 'Hybrid maduro',
  },
]

const CASH_MILESTONES: { props: number; revenue: string; cogs: string; freeForMoats: string; unlocks: string }[] = [
  { props: 5,   revenue: '€27k/yr',   cogs: '€60k',  freeForMoats: 'Negativo',     unlocks: 'Sustenta operação inicial (queima reservas)' },
  { props: 25,  revenue: '€135k/yr',  cogs: '€100k', freeForMoats: '€35k/yr',      unlocks: 'Marketing modesto + content seed' },
  { props: 60,  revenue: '€324k/yr',  cogs: '€180k', freeForMoats: '€144k/yr',     unlocks: 'Captain externo + Operations Lead + paid ads' },
  { props: 100, revenue: '€540k/yr',  cogs: '€240k', freeForMoats: '€300k/yr',     unlocks: '2ª zona + lead gen + multi-país compliance research' },
  { props: 150, revenue: '€810k/yr',  cogs: '€310k', freeForMoats: '€500k/yr',     unlocks: 'Franchise legal infra + brand campaigns' },
  { props: 250, revenue: '€1.35M/yr', cogs: '€450k', freeForMoats: '€900k/yr',     unlocks: 'Franchise launch + 3ª zona + Platform Mode SaaS' },
]

const MONETIZATION_GATE: { stage: string; available: string[]; locked: string[]; reason: string }[] = [
  {
    stage: '2026 (M0-12)',
    available: ['Direct Mode na Costa Tropical'],
    locked: ['SaaS Platform Mode', 'Franchise', 'BR partner'],
    reason: 'Zero moats. AI Pricing sem proof empírico. Sem brand. Vender qualquer coisa externa = vender ar.',
  },
  {
    stage: '2027 (M12-24)',
    available: ['Direct Mode (2 zonas)'],
    locked: ['SaaS Platform Mode', 'Franchise'],
    reason: 'AI Pricing começa a ter dados. Sem multi-zona provada nem case studies, ainda sem produto vendável externamente.',
  },
  {
    stage: '2028 (M24-36)',
    available: ['Direct Mode (multi-zona)', 'Strategic partner exception (BR ou similar)'],
    locked: ['SaaS Platform Mode aberto', 'Franchise aberta'],
    reason: 'Partner BR é excepção (relação pessoal, upside compartilhado). Não é template para vender a estranhos.',
  },
  {
    stage: '2029 (M36-48)',
    available: ['Direct Mode', 'Platform Mode SaaS (com moats)'],
    locked: ['Franchise'],
    reason: 'Moats provados → Platform Mode vendável. Mas brand ainda não tem equity para suportar fee €40k+ de franchise.',
  },
  {
    stage: '2030+ (M48+)',
    available: ['Direct Mode', 'Platform Mode SaaS', 'Franchise (com moats + brand)'],
    locked: [],
    reason: 'Todos os 3 modelos viáveis. Hybrid começa.',
  },
]

const LEAN_RULES: { rule: string; detail: string }[] = [
  {
    rule: 'Saturar zona antes de abrir nova',
    detail: 'Costa Tropical até 50+ props estabilizadas (NPS>60, churn<5%) ANTES de abrir Costa del Sol. Espalhar foco mata bootstrap.',
  },
  {
    rule: 'Marketing budget ≤ 15% da receita',
    detail: 'Mês 0-6: €500-1k. Mês 7-12: €2-4k. Mês 13-18: €5-10k. Nunca queimar mais que 15% de revenue em ads.',
  },
  {
    rule: '3 meses de cash buffer sempre',
    detail: 'Reserva mínima = 3× operating costs mensais. Nunca abaixo. Bootstrap não tem rede de segurança externa.',
  },
  {
    rule: 'Hire when revenue allows, not when need bites',
    detail: 'Captain externo quando receita > €100k/yr. Ops Lead quando > €250k/yr. CS quando > €400k/yr. Não antes.',
  },
  {
    rule: 'Yuri delegado da operação até mês 12',
    detail: 'Founder não pode ser Captain + Manager + dev + admin + CS forever. Mês 6-12 = transição. Sem isso, escala morre no Yuri.',
  },
  {
    rule: 'Direct Mode é o produto, não validação',
    detail: 'Cada propriedade Direct constrói os moats (AI data, VAGF data, testimonials, playbook). Não é "fase antes do produto" — é o produto.',
  },
]

const PROOF_POINTS: Array<{
  id: ProofPointKey
  title: string
  why: string
  icon: typeof Target
  targetMonth: string
  subitems: string[]
}> = [
  {
    id: 'aiPricingProof',
    title: 'AI Pricing entrega receita medida',
    why: 'Sem dados empíricos (não estimados), nenhum comprador de franquia paga. Mínimo: 20 propriedades × 12+ meses.',
    icon: TrendingUp,
    targetMonth: 'Q4 2026',
    subitems: [
      'AI Pricing activo em ≥20 propriedades',
      '12+ meses de histórico contínuo por propriedade',
      'Benchmark vs preço fixo / vs zona documentado',
      'Uplift médio publicável (X% revenue lift) com p-value',
    ],
  },
  {
    id: 'systemSansFounder',
    title: 'O sistema funciona sem o Yuri',
    why: 'Se Costa Tropical depende de ti como Captain, não há franquia. O sistema (VAGF + Score + checklists) tem de substituir a presença.',
    icon: Users,
    targetMonth: 'Q2 2027',
    subitems: [
      '1 Captain externo treinado e activo',
      '2-3 Managers externos com clientes próprios',
      'Captain auto-aprova tarefas Elite sem Yuri',
      'Yuri < 20% do tempo em operações (focus em product)',
    ],
  },
  {
    id: 'secondZone',
    title: 'Funciona numa 2ª zona',
    why: 'Compradores de franquia exigem ver "isto não é só Costa Tropical". Tem de operar em zona análoga (Algarve / Costa del Sol / Mallorca).',
    icon: MapPin,
    targetMonth: 'Q4 2027',
    subitems: [
      '2ª zona escolhida (Algarve / Costa del Sol / Mallorca)',
      'Manager local recrutado e operacional',
      '5+ propriedades activas na 2ª zona',
      'Métricas (NPS / churn / uplift) comparáveis a Costa Tropical',
    ],
  },
  {
    id: 'caseStudies',
    title: 'Case studies publicáveis',
    why: 'Owners reais a falar em vídeo. Press coverage. Sem isto, vendes promessas. Com isto, vendes evidência.',
    icon: Sparkles,
    targetMonth: 'Q2 2028',
    subitems: [
      '3-5 owner testimonials em vídeo (publicáveis)',
      '1+ press feature (El País, Expresso, Sur in English, AirDNA)',
      'Revenue uplift documentado por propriedade no website',
      'NPS publicado (>60) com sample size relevante',
    ],
  },
  {
    id: 'industryPresence',
    title: 'Recognized industry presence',
    why: '"Yuri Sales é o gajo da AI no STR Mediterranean." Sem este reconhecimento, brand HostMasters tem zero equity.',
    icon: Mic,
    targetMonth: 'Q4 2028',
    subitems: [
      '1+ talk em STR conference (VRMA, Skift, ShortStay Mediterranean)',
      'Founder LinkedIn 1k+ industry followers',
      '1+ podcast / interview em outlet STR relevante',
      'Brand recognition em search/social nos territórios alvo',
    ],
  },
]

function StrategicLongTermPlan() {
  const [open, setOpen] = useState(false)
  const [proofChecks, setProofChecks] = useLocalStorage<Record<string, boolean>>('hm_strategic_proof_checks', {})
  const [phaseStatus, setPhaseStatus] = useLocalStorage<Record<string, 'pending' | 'active' | 'done'>>('hm_strategic_phase_status', {
    foundation: 'active',
  })
  const [selectedPP, setSelectedPP] = useState<ProofPointKey | null>(null)

  const totalSub = PROOF_POINTS.reduce((s, pp) => s + pp.subitems.length, 0)
  const checkedSub = PROOF_POINTS.reduce(
    (s, pp) => s + pp.subitems.filter((_, i) => proofChecks[`${pp.id}_${i}`]).length,
    0,
  )
  const overallPct = totalSub > 0 ? Math.round((checkedSub / totalSub) * 100) : 0

  const ppPct = (id: ProofPointKey) => {
    const pp = PROOF_POINTS.find(p => p.id === id)
    if (!pp) return 0
    const checked = pp.subitems.filter((_, i) => proofChecks[`${id}_${i}`]).length
    return Math.round((checked / pp.subitems.length) * 100)
  }

  const ppValidated = (id: ProofPointKey) => ppPct(id) === 100
  const validatedCount = PROOF_POINTS.filter(p => ppValidated(p.id)).length

  const cyclePhaseStatus = (id: string) => {
    setPhaseStatus(prev => {
      const cur = prev[id] ?? 'pending'
      const next = cur === 'pending' ? 'active' : cur === 'active' ? 'done' : 'pending'
      return { ...prev, [id]: next }
    })
  }

  const phaseColor = (status: string) =>
    status === 'done' ? '#2A7A4F'
    : status === 'active' ? '#B08A3E'
    : '#cbd5e1'

  const selected = selectedPP ? PROOF_POINTS.find(p => p.id === selectedPP) : null

  return (
    <div className="rounded-hm border border-hm-border overflow-hidden" style={{ background: 'var(--hm-sand)' }}>
      <button onClick={() => setOpen(!open)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-hm-ivory/50 transition-colors">
        <div className="flex items-center gap-3">
          <Crown className="h-5 w-5" style={{ color: '#B08A3E' }} />
          <div className="text-left">
            <h2 className="font-serif font-bold text-hm-black text-lg">
              Estratégia de Longo Prazo — Caminho à Franquia
            </h2>
            <p className="text-xs text-gray-500">
              7 fases · 5 proof points · franchise readiness {overallPct}%
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-hm-border px-6 py-6 space-y-8">

          {/* Mental Model banner — the reframe */}
          <div className="rounded-lg p-5 border-l-4"
               style={{ borderLeftColor: '#B08A3E', background: 'rgba(176,138,62,0.06)' }}>
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 shrink-0 mt-0.5" style={{ color: '#B08A3E' }} />
              <div>
                <h3 className="font-serif font-bold text-hm-black text-sm mb-1">
                  Mental model: Direct Mode <em>é</em> a construção dos moats
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Nem SaaS Platform Mode nem franchise vendem hoje porque os <strong>moats não existem ainda</strong>.
                  Cada propriedade gerida directamente na Costa Tropical adiciona dados ao AI Pricing,
                  captura VAGF, ensina o playbook e gera material de case study. <strong>Direct Mode não é "validação antes do produto" — é o produto.</strong> Os outros modelos de receita só se tornam vendáveis quando os moats existem como side-effect deste trabalho.
                </p>
              </div>
            </div>
          </div>

          {/* Phase Timeline 2026-2032 */}
          <div>
            <h3 className="font-serif font-bold text-hm-black mb-3">Roadmap 2026 → 2032+</h3>
            <p className="text-xs text-gray-500 mb-4">
              Calendário realista. Cada fase desbloqueia a próxima — não saltar etapas é o caminho mais rápido para franquia.
            </p>
            <div className="overflow-x-auto">
              <div className="flex gap-2 min-w-max pb-2">
                {STRATEGIC_PHASES.map((p, idx) => {
                  const status = phaseStatus[p.id] ?? 'pending'
                  return (
                    <button
                      key={p.id}
                      onClick={() => cyclePhaseStatus(p.id)}
                      className="rounded-lg border-2 p-3 text-left transition-all hover:shadow-sm w-[210px] shrink-0"
                      style={{
                        borderColor: status === 'active' ? '#B08A3E' : status === 'done' ? '#2A7A4F' : '#E8E3D8',
                        background: 'white',
                      }}
                      title="Click to cycle status"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="h-2 w-2 rounded-full shrink-0" style={{ background: phaseColor(status) }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Phase {idx + 1} · {p.year}
                        </span>
                      </div>
                      <p className="font-serif font-bold text-hm-black text-sm leading-tight">{p.title}</p>
                      <p className="text-[10px] text-gray-500 mt-1 leading-relaxed line-clamp-3">{p.desc}</p>
                      <p className="text-[10px] mt-2 font-semibold" style={{ color: '#B08A3E' }}>
                        Target: {p.targetProps}
                      </p>
                      <p className="text-[9px] mt-1 text-gray-500 italic line-clamp-1">
                        {p.revenueModel}
                      </p>
                      <span
                        className="inline-block mt-1.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
                        style={{
                          background: status === 'active' ? 'rgba(176,138,62,0.15)'
                                    : status === 'done' ? 'rgba(42,122,79,0.1)'
                                    : 'rgba(203,213,225,0.4)',
                          color: phaseColor(status),
                        }}
                      >
                        {status}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
            <p className="text-[11px] text-gray-400 mt-2">Click em cada fase para ciclar status: pending → active → done.</p>
          </div>

          {/* 5 Proof Points */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-serif font-bold text-hm-black">5 Proof Points para Franchise</h3>
              <span className="text-xs font-bold px-2 py-1 rounded"
                    style={{ background: validatedCount === 5 ? 'rgba(42,122,79,0.1)' : 'rgba(176,138,62,0.1)',
                             color: validatedCount === 5 ? '#2A7A4F' : '#B08A3E' }}>
                {validatedCount} / 5 validados
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Cada proof point tem subitens checkáveis. Só com todos os 5 a 100% é que a franquia é vendável a estranhos.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PROOF_POINTS.map(pp => {
                const Icon = pp.icon
                const pct = ppPct(pp.id)
                const validated = pct === 100
                const isSelected = selectedPP === pp.id
                return (
                  <div key={pp.id}
                       className="rounded-lg border-2 bg-white overflow-hidden transition-all"
                       style={{ borderColor: isSelected ? '#B08A3E' : validated ? '#2A7A4F' : '#E8E3D8' }}>
                    <button
                      onClick={() => setSelectedPP(isSelected ? null : pp.id)}
                      className="w-full text-left p-4 hover:bg-hm-ivory/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                             style={{ background: validated ? 'rgba(42,122,79,0.1)' : 'rgba(176,138,62,0.12)' }}>
                          <Icon className="h-5 w-5" style={{ color: validated ? '#2A7A4F' : '#B08A3E' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-serif font-bold text-hm-black text-sm">{pp.title}</h4>
                            <span className="text-[10px] font-bold whitespace-nowrap"
                                  style={{ color: validated ? '#2A7A4F' : '#B08A3E' }}>
                              {pct}%
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 leading-snug">{pp.why}</p>
                          <p className="text-[10px] text-gray-400 mt-1.5 font-semibold uppercase tracking-wider">
                            Target: {pp.targetMonth}
                          </p>
                          {/* Progress bar */}
                          <div className="h-1.5 rounded-full bg-gray-100 mt-2 overflow-hidden">
                            <div className="h-full transition-all rounded-full"
                                 style={{ width: `${pct}%`, background: validated ? '#2A7A4F' : '#B08A3E' }} />
                          </div>
                        </div>
                      </div>
                    </button>
                    {isSelected && (
                      <div className="border-t bg-hm-ivory/30 px-4 py-3 space-y-1.5">
                        {pp.subitems.map((sub, i) => {
                          const key = `${pp.id}_${i}`
                          const checked = !!proofChecks[key]
                          return (
                            <label key={i} className="flex items-start gap-2 text-xs cursor-pointer hover:bg-white/60 rounded px-1 py-0.5">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => setProofChecks(prev => ({ ...prev, [key]: !prev[key] }))}
                                className="mt-0.5 accent-hm-gold"
                              />
                              <span className={checked ? 'text-hm-black line-through' : 'text-gray-700'}>{sub}</span>
                            </label>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Franchise Readiness Gate */}
          <div className="rounded-lg p-5 border-2"
               style={{
                 borderColor: validatedCount === 5 ? '#2A7A4F' : '#E8E3D8',
                 background: validatedCount === 5 ? 'rgba(42,122,79,0.05)' : 'white',
               }}>
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-lg flex items-center justify-center shrink-0"
                   style={{ background: validatedCount === 5 ? '#2A7A4F' : 'rgba(203,213,225,0.4)' }}>
                {validatedCount === 5
                  ? <Crown className="h-6 w-6 text-white" />
                  : <LockIcon className="h-6 w-6 text-gray-500" />}
              </div>
              <div className="flex-1">
                <h3 className="font-serif font-bold text-hm-black">
                  {validatedCount === 5 ? '🎯 Franchise pronta para venda' : '🔒 Franchise gate locked'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {validatedCount === 5
                    ? 'Todos os 5 proof points validados. Estrutura legal de franchise pode ser activada. Primeira venda a estranho viável.'
                    : `Faltam ${5 - validatedCount} proof points. Não vendas franchise ainda — brand não tem equity para o suportar. Foca-te em validar.`}
                </p>
                <div className="mt-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <span>Readiness</span>
                    <strong className="text-hm-black">{overallPct}%</strong>
                    <span className="text-gray-400">({checkedSub} / {totalSub} subitens)</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                         style={{ width: `${overallPct}%`, background: validatedCount === 5 ? '#2A7A4F' : '#B08A3E' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Flow Milestones */}
          <div>
            <h3 className="font-serif font-bold text-hm-black mb-3">Marcos de cash flow — quando cada coisa desbloqueia</h3>
            <p className="text-xs text-gray-500 mb-4">
              Plano B autofinanciado significa que cada marco de propriedades desbloqueia o próximo investimento. Sem chegar ao marco, o investimento não pode acontecer.
            </p>
            <div className="rounded-lg border border-hm-border bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-hm-ivory/40 text-gray-500 uppercase tracking-wider text-[10px]">
                      <th className="px-4 py-2.5 text-left font-semibold">Props</th>
                      <th className="px-4 py-2.5 text-left font-semibold">Receita HM/ano</th>
                      <th className="px-4 py-2.5 text-left font-semibold">COGS</th>
                      <th className="px-4 py-2.5 text-left font-semibold">Cash livre p/ moats</th>
                      <th className="px-4 py-2.5 text-left font-semibold">Desbloqueia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hm-border">
                    {CASH_MILESTONES.map((m, i) => (
                      <tr key={i} className={i === 0 ? 'bg-amber-50/40' : ''}>
                        <td className="px-4 py-3 font-bold text-hm-black">{m.props}</td>
                        <td className="px-4 py-3 text-emerald-700 font-semibold">{m.revenue}</td>
                        <td className="px-4 py-3 text-gray-600">−{m.cogs}</td>
                        <td className="px-4 py-3 font-bold"
                            style={{ color: m.freeForMoats === 'Negativo' ? '#dc2626' : '#B08A3E' }}>
                          {m.freeForMoats}
                        </td>
                        <td className="px-4 py-3 text-gray-700">{m.unlocks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="px-4 py-2 text-[10px] text-gray-400 border-t bg-gray-50">
                Mix de planos assumido: 60% Mid (€414/prop/mês) · 30% Basic (€345/prop/mês) · 10% Premium (€594/prop/mês). Média ~€450/prop/mês = €5.400/prop/ano.
              </p>
            </div>
          </div>

          {/* Monetization Gate */}
          <div>
            <h3 className="font-serif font-bold text-hm-black mb-3">O que é monetizável quando</h3>
            <p className="text-xs text-gray-500 mb-4">
              Cada modelo de receita só está disponível depois de moats suficientes existirem. Tentar abrir antes do tempo queima brand e tempo.
            </p>
            <div className="space-y-2">
              {MONETIZATION_GATE.map((g, i) => (
                <div key={i} className="rounded-lg border border-hm-border bg-white p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <span className="font-bold text-hm-black text-sm">{g.stage}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-emerald-600 font-bold mb-1">Disponível</p>
                      <ul className="space-y-0.5">
                        {g.available.map((a, j) => (
                          <li key={j} className="text-xs text-gray-700 flex items-start gap-1.5">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-1">Bloqueado</p>
                      {g.locked.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">Nada bloqueado.</p>
                      ) : (
                        <ul className="space-y-0.5">
                          {g.locked.map((l, j) => (
                            <li key={j} className="text-xs text-gray-500 flex items-start gap-1.5">
                              <LockIcon className="h-3 w-3 text-gray-300 shrink-0 mt-0.5" />
                              <span>{l}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 italic border-t pt-2 mt-1">{g.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Lean Growth Rules */}
          <div>
            <h3 className="font-serif font-bold text-hm-black mb-3">Disciplinas do crescimento enxuto</h3>
            <p className="text-xs text-gray-500 mb-4">
              Plano B autofinanciado tem regras rígidas. Quebrar qualquer uma destas afunda o plano em 6 meses.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {LEAN_RULES.map((r, i) => (
                <div key={i} className="rounded-lg border border-hm-border bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                         style={{ background: 'rgba(176,138,62,0.12)', color: '#B08A3E' }}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-hm-black leading-snug">{r.rule}</p>
                      <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{r.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic notes */}
          <div className="rounded-lg border border-hm-border bg-white p-5">
            <h3 className="font-serif font-bold text-hm-black text-sm mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" style={{ color: '#B08A3E' }} />
              Notas estratégicas
            </h3>
            <ul className="space-y-2 text-xs text-gray-600 leading-relaxed">
              <li>• <strong className="text-hm-black">Brand HostMasters tem zero equity hoje</strong>. Compradores de franquia pagam por evidência (proof points), não por marca.</li>
              <li>• <strong className="text-hm-black">O partner BR é excepção, não template</strong>. Compra porque te conhece pessoalmente. Estranhos exigem proof completo.</li>
              <li>• <strong className="text-hm-black">Caminho B (deployments isolados) é tech infrastructure</strong>. Constrói só quando tiveres 1 cliente real assinado, não em vazio.</li>
              <li>• <strong className="text-hm-black">Sem sócio operacional</strong> que conduza Costa Tropical → multi-zona enquanto Yuri foca em produto/tech, o cronograma escala 2x. A tech está pronta; falta operação.</li>
              <li>• <strong className="text-hm-black">Franchise law EU é complexa</strong>. Antes da 1ª venda: advogado especializado (FDD-equivalent), €5-15k em legal. Antes da 2028, não é prioritário.</li>
            </ul>
          </div>

        </div>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function MarketingPage() {
  const { t, locale } = useLocale()
  const [campaigns, setCampaigns]   = useState<Campaign[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing]       = useState<Campaign | null>(null)
  const [spending, setSpending]     = useState<Campaign | null>(null)
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [qrCampaign, setQrCampaign] = useState<Campaign | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/campaigns')
      if (res.ok) setCampaigns(await res.json())
      else setError(t('common.error'))
    } catch {
      setError(t('common.error'))
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const deleteCampaign = async (id: string) => {
    if (!confirm(t('admin.marketing.deleteConfirm'))) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
      if (res.ok) load()
    } catch {
      // silently fail
    } finally {
      setDeleting(null)
    }
  }

  const totals = campaigns.reduce(
    (acc, c) => {
      acc.budget += c.budgetAllocated
      acc.spent  += c.budgetSpent
      acc.leads  += c._count?.leadAttributions ?? 0
      return acc
    },
    { budget: 0, spent: 0, leads: 0 },
  )
  const cpl = totals.leads > 0 ? totals.spent / totals.leads : null

  return (
    <div className="p-6 space-y-8">
      {/* Analytics Dashboard */}
      <AnalyticsDashboard />

      {/* Marketing Plan Tracker */}
      <MarketingPlanTracker />

      {/* Long-term strategic plan: validate → multi-zone → franchise → unicorn */}
      <StrategicLongTermPlan />

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-serif font-bold text-hm-black flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-hm-black" />
            {t('common.marketing')}
          </h1>
          <p className="text-sm text-gray-600 mt-1">{t('admin.marketing.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-hm-black text-white px-4 py-2 text-sm hover:bg-hm-black/90"
        >
          <Plus className="h-4 w-4" />
          {t('admin.marketing.newCampaign')}
        </button>
      </div>

      {error && (
        <div className="rounded-hm border border-red-200 bg-red-50 p-4 flex items-center gap-2 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-hm border bg-white p-4">
          <div className="text-xs uppercase text-gray-500 mb-1">{t('admin.marketing.totalBudget')}</div>
          <div className="text-2xl font-bold text-hm-black">{fmtEUR(totals.budget, locale)}</div>
        </div>
        <div className="rounded-hm border bg-white p-4">
          <div className="text-xs uppercase text-gray-500 mb-1">{t('admin.marketing.spent')}</div>
          <div className="text-2xl font-bold text-hm-black">{fmtEUR(totals.spent, locale)}</div>
          {totals.budget > 0 && (
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-navy-600 rounded-full"
                style={{ width: `${Math.min(100, (totals.spent / totals.budget) * 100)}%` }}
              />
            </div>
          )}
        </div>
        <div className="rounded-hm border bg-white p-4">
          <div className="text-xs uppercase text-gray-500 mb-1">{t('admin.marketing.attributedLeads')}</div>
          <div className="text-2xl font-bold text-hm-black">{totals.leads}</div>
        </div>
        <div className="rounded-hm border bg-white p-4">
          <div className="text-xs uppercase text-gray-500 mb-1">{t('admin.marketing.costPerLead')}</div>
          <div className="text-2xl font-bold text-hm-black">{cpl !== null ? fmtEUR(cpl, locale) : '—'}</div>
        </div>
      </div>

      {/* Campaigns table */}
      <div className="rounded-hm border bg-white overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">{t('admin.marketing.thCampaign')}</th>
              <th className="px-4 py-3">{t('admin.marketing.channelLabel')}</th>
              <th className="px-4 py-3">{t('common.status')}</th>
              <th className="px-4 py-3 text-right">{t('admin.marketing.thBudget')}</th>
              <th className="px-4 py-3 text-right">{t('admin.marketing.spent')}</th>
              <th className="px-4 py-3 text-right">{t('admin.marketing.thLeads')}</th>
              <th className="px-4 py-3 text-right">{t('admin.marketing.thCpl')}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="py-8"><div className="space-y-3 animate-pulse"><div className="h-4 rounded bg-hm-sand w-3/4 mx-auto" /><div className="h-4 rounded bg-hm-sand w-1/2 mx-auto" /></div></td></tr>}
            {!loading && campaigns.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <Megaphone className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">{t('admin.marketing.noCampaignsYet')}</p>
                </td>
              </tr>
            )}
            {campaigns.map(c => {
              const leads = c._count?.leadAttributions ?? 0
              const cplC  = leads > 0 && c.budgetSpent > 0 ? c.budgetSpent / leads : null
              const pctSpent = c.budgetAllocated > 0 ? Math.min(100, (c.budgetSpent / c.budgetAllocated) * 100) : 0
              return (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-hm-black">{c.name}</div>
                    {c.targetAudience && <div className="text-xs text-gray-400 truncate max-w-[200px]">{c.targetAudience}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs whitespace-nowrap">
                      {CHANNEL_LABEL_KEYS[c.channel] ? t(CHANNEL_LABEL_KEYS[c.channel]) : c.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                      {CAMPAIGN_STATUS_LABEL_KEYS[c.status] ? t(CAMPAIGN_STATUS_LABEL_KEYS[c.status]) : c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtEUR(c.budgetAllocated, locale)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="tabular-nums">{fmtEUR(c.budgetSpent, locale)}</div>
                    {c.budgetAllocated > 0 && (
                      <div className="mt-1 h-1 w-16 ml-auto bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-navy-400 rounded-full" style={{ width: `${pctSpent}%` }} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{leads}</td>
                  <td className="px-4 py-3 text-right text-gray-500 tabular-nums">
                    {cplC !== null ? fmtEUR(cplC, locale) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {c.trackingCode && (
                        <button
                          onClick={() => setQrCampaign(c)}
                          title={t('admin.marketing.qrCode')}
                          className="rounded p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setSpending(c)}
                        title={t('admin.marketing.logSpend')}
                        className="rounded p-1.5 text-gray-400 hover:text-navy-700 hover:bg-gray-100 transition-colors"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditing(c)}
                        title={t('common.edit')}
                        className="rounded p-1.5 text-gray-400 hover:text-navy-700 hover:bg-gray-100 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteCampaign(c.id)}
                        disabled={deleting === c.id}
                        title={t('common.delete')}
                        className="rounded p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showCreate  && <CampaignModal campaign={null} onClose={() => setShowCreate(false)} onSaved={load} />}
      {editing     && <CampaignModal campaign={editing} onClose={() => setEditing(null)} onSaved={load} />}
      {spending    && <SpendModal campaign={spending} onClose={() => setSpending(null)} onSaved={load} />}
      {qrCampaign  && <QrModal campaign={qrCampaign} onClose={() => setQrCampaign(null)} />}
    </div>
  )
}
