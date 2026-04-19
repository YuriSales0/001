'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Megaphone, Plus, X, Pencil, Trash2, PlusCircle, QrCode, Copy, Check, BarChart3, Users, TrendingUp, CreditCard, Filter, ChevronDown, ChevronUp } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useLocale } from '@/i18n/provider'

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

const SOURCE_LABELS: Record<string, string> = {
  CADASTRO: 'Registration',
  NEWSLETTER: 'Newsletter',
  ONLINE: 'Online',
  PHONE: 'Phone',
  WHATSAPP: 'WhatsApp',
  WEBSITE: 'Website',
  EMAIL: 'Email',
  REFERRAL: 'Referral',
  OTHER: 'Other',
}

const STATUS_LABEL_MAP: Record<string, string> = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUALIFIED: 'Qualified',
  CONVERTED: 'Converted',
  RETAINED: 'Retained',
  LOST: 'Lost',
  REMARKETING: 'Remarketing',
}

const PLAN_LABELS: Record<string, string> = {
  STARTER: 'Starter',
  BASIC: 'Basic',
  MID: 'Mid',
  PREMIUM: 'Premium',
  NONE: 'No Plan',
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
  const [period, setPeriod] = useState<PeriodKey>('30d')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

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
    const params = new URLSearchParams()
    if (dateRange.from) params.set('from', dateRange.from)
    if (dateRange.to) params.set('to', dateRange.to)
    const res = await fetch(`/api/admin/marketing-analytics?${params}`)
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [dateRange])

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
                              background: `linear-gradient(90deg, #1a1a1a ${Math.max(0, barWidth - 15)}%, #d4a853)`,
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
                            {PLAN_LABELS[p.plan] ?? p.plan}
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
                          <span className="text-xs text-gray-600 w-24 shrink-0 truncate">{SOURCE_LABELS[s.source] ?? s.source}</span>
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
            <div className="lg:col-span-2 rounded-hm border border-hm-border bg-white overflow-hidden">
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
                          {SOURCE_LABELS[lead.source] ?? lead.source}
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
                          {STATUS_LABEL_MAP[lead.status] ?? lead.status}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-gray-400 text-xs tabular-nums">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}

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
const STATUS_LABELS: Record<string, string> = { PLANNING: 'Planning', ACTIVE: 'Active', PAUSED: 'Paused', COMPLETED: 'Completed' }
const STATUS_COLORS: Record<string, string> = {
  PLANNING:  'bg-gray-100 text-gray-600',
  ACTIVE:    'bg-green-100 text-green-700',
  PAUSED:    'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
}
const CHANNEL_LABELS: Record<string, string> = {
  GOOGLE_ADS: 'Google Ads', META: 'Meta/Instagram', LINKEDIN: 'LinkedIn',
  EMAIL: 'Email', SEO: 'SEO', CONTENT: 'Content',
  EVENT: 'Event', PRINT: 'Print', PARTNERSHIP: 'Partnership',
  SIGNAGE: 'Signage', REFERRAL: 'Referral', OTHER: 'Other',
}

const fmtEUR = (n: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

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

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const body = {
      name, channel, type, status,
      budgetAllocated: parseFloat(budget) || 0,
      startDate: startDate || null,
      endDate:   endDate   || null,
      targetAudience: targetAudience || null,
      description:    description    || null,
    }
    if (isEdit) {
      await fetch(`/api/campaigns/${campaign!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } else {
      await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-hm-black">{isEdit ? 'Edit campaign' : 'New campaign'}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
              placeholder="e.g. Google Ads Spring 2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Channel</label>
              <select value={channel} onChange={e => setChannel(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold">
                {CHANNELS.map(c => <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold">
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
          </div>
          {isEdit && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold">
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Budget (€)</label>
            <input type="number" min="0" step="0.01" value={budget} onChange={e => setBudget(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" placeholder="0" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Target audience</label>
            <input value={targetAudience} onChange={e => setTargetAudience(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
              placeholder="e.g. Nordic property owners 35–60, Costa Tropical" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={2} className="w-full rounded-md border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-hm-gold" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border py-2.5 text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-lg bg-hm-black py-2.5 text-sm font-semibold text-white hover:bg-hm-black/90 disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Log Spend Modal ─────────────────────────────────────────────────────────
function SpendModal({ campaign, onClose, onSaved }: { campaign: Campaign; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount]           = useState('')
  const [date, setDate]               = useState(new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')
  const [saving, setSaving]           = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/campaigns/${campaign.id}/spend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(amount), date, description: description || null }),
    })
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-bold text-hm-black">Log spend</h2>
            <p className="text-xs text-gray-500 mt-0.5">{campaign.name}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Amount spent (€) *</label>
            <input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
              required className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" placeholder="0.00" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
              placeholder="e.g. Google Ads — Apr 1–15" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border py-2.5 text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving || !amount}
              className="flex-1 rounded-lg bg-hm-black py-2.5 text-sm font-semibold text-white hover:bg-hm-black/90 disabled:opacity-50">
              {saving ? 'Saving…' : 'Log spend'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── QR Code Modal ───────────────────────────────────────────────────────────
function QrModal({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
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
            <h2 className="text-lg font-bold text-hm-black">QR Code</h2>
            <p className="text-xs text-gray-500 mt-0.5">{campaign.name}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          <div className="rounded-hm border p-3 bg-white shadow-sm">
            <QRCodeSVG value={url} size={200} level="M" includeMargin />
          </div>
          <div className="w-full">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Lead capture URL</p>
            <div className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2">
              <span className="flex-1 text-xs text-gray-600 truncate font-mono">{url}</span>
              <button
                onClick={copyUrl}
                className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
                title="Copy URL"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 text-center">
            Scan to open lead form · Leads são atribuídos a esta campanha automaticamente
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
            Download SVG
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

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function MarketingPage() {
  const [campaigns, setCampaigns]   = useState<Campaign[]>([])
  const [loading, setLoading]       = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing]       = useState<Campaign | null>(null)
  const [spending, setSpending]     = useState<Campaign | null>(null)
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [qrCampaign, setQrCampaign] = useState<Campaign | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/campaigns')
    if (res.ok) setCampaigns(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const deleteCampaign = async (id: string) => {
    if (!confirm('Delete this campaign? This cannot be undone.')) return
    setDeleting(id)
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
    setDeleting(null)
    load()
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

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-serif font-bold text-hm-black flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-hm-black" />
            Marketing
          </h1>
          <p className="text-sm text-gray-600 mt-1">Digital & physical campaigns · CPL per channel</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-hm-black text-white px-4 py-2 text-sm hover:bg-hm-black/90"
        >
          <Plus className="h-4 w-4" />
          New campaign
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-hm border bg-white p-4">
          <div className="text-xs uppercase text-gray-500 mb-1">Total budget</div>
          <div className="text-2xl font-bold text-hm-black">{fmtEUR(totals.budget)}</div>
        </div>
        <div className="rounded-hm border bg-white p-4">
          <div className="text-xs uppercase text-gray-500 mb-1">Spent</div>
          <div className="text-2xl font-bold text-hm-black">{fmtEUR(totals.spent)}</div>
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
          <div className="text-xs uppercase text-gray-500 mb-1">Attributed leads</div>
          <div className="text-2xl font-bold text-hm-black">{totals.leads}</div>
        </div>
        <div className="rounded-hm border bg-white p-4">
          <div className="text-xs uppercase text-gray-500 mb-1">Cost per lead</div>
          <div className="text-2xl font-bold text-hm-black">{cpl !== null ? fmtEUR(cpl) : '—'}</div>
        </div>
      </div>

      {/* Campaigns table */}
      <div className="rounded-hm border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Budget</th>
              <th className="px-4 py-3 text-right">Spent</th>
              <th className="px-4 py-3 text-right">Leads</th>
              <th className="px-4 py-3 text-right">CPL</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="py-8"><div className="space-y-3 animate-pulse"><div className="h-4 rounded bg-hm-sand w-3/4 mx-auto" /><div className="h-4 rounded bg-hm-sand w-1/2 mx-auto" /></div></td></tr>}
            {!loading && campaigns.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <Megaphone className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No campaigns yet. Create the first one.</p>
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
                      {CHANNEL_LABELS[c.channel] ?? c.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtEUR(c.budgetAllocated)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="tabular-nums">{fmtEUR(c.budgetSpent)}</div>
                    {c.budgetAllocated > 0 && (
                      <div className="mt-1 h-1 w-16 ml-auto bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-navy-400 rounded-full" style={{ width: `${pctSpent}%` }} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{leads}</td>
                  <td className="px-4 py-3 text-right text-gray-500 tabular-nums">
                    {cplC !== null ? fmtEUR(cplC) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {c.trackingCode && (
                        <button
                          onClick={() => setQrCampaign(c)}
                          title="QR Code"
                          className="rounded p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setSpending(c)}
                        title="Log spend"
                        className="rounded p-1.5 text-gray-400 hover:text-navy-700 hover:bg-gray-100 transition-colors"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditing(c)}
                        title="Edit"
                        className="rounded p-1.5 text-gray-400 hover:text-navy-700 hover:bg-gray-100 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteCampaign(c.id)}
                        disabled={deleting === c.id}
                        title="Delete"
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
