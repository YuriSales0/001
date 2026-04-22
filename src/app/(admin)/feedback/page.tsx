"use client"

import { useEffect, useState } from "react"
import { useLocale } from "@/i18n/provider"
import {
  Home, Users, Sparkles, TrendingUp, TrendingDown, Minus, AlertTriangle,
  CheckCircle, Circle, Phone, Star, Clock,
} from "lucide-react"

type Dim = 'property' | 'crew' | 'platform'

interface Summary {
  windowDays: number
  totalScheduled: number
  completed: number
  responseRate: number
  nps: number | null
  npsBreakdown: { promoters: number; passives: number; detractors: number; total: number }
  dimensions: {
    property:  { structure: number | null; amenities: number | null; location: number | null; valueForMoney: number | null; overall: number | null }
    crew:      { state: number | null; cleanliness: number | null; presentation: number | null; overall: number | null }
    platform:  { communication: number | null; checkIn: number | null; checkOut: number | null; platformOverall: number | null; overall: number | null }
  }
  escalations: { total: number; critical: number; high: number; medium: number; low: number }
  sentiment: { positive: number; neutral: number; negative: number; severeNegative: number }
  topTags: Array<{ tag: string; count: number }>
}

interface FeedbackItem {
  id: string
  callStatus: string
  language: string
  scorePropertyStructure: number | null
  scorePropertyAmenities: number | null
  scoreLocation: number | null
  scoreValueForMoney: number | null
  scorePropertyState: number | null
  scoreCleanliness: number | null
  scoreCrewPresentation: number | null
  scoreCommunication: number | null
  scoreCheckInExperience: number | null
  scoreCheckOutExperience: number | null
  scorePlatformOverall: number | null
  scoreNps: number | null
  npsCategory: string | null
  sentimentOverall: string
  escalationLevel: string | null
  feedbackProperty: string | null
  feedbackCrew: string | null
  feedbackPlatform: string | null
  createdAt: string
  property: { id: string; name: string; city: string }
  client: { id: string; name: string | null; email: string }
  crewMember: { id: string; name: string | null; email: string } | null
  reservation: { guestName: string; checkOut: string; platform: string | null }
}

const DIMENSION_COLORS: Record<Dim, { bg: string; text: string; border: string; icon: any }> = {
  property: { bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   icon: Home },
  crew:     { bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  icon: Users },
  platform: { bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-200',icon: Sparkles },
}

function scoreColor(n: number | null): string {
  if (n === null) return 'text-gray-300'
  if (n >= 8) return 'text-emerald-600'
  if (n >= 6) return 'text-amber-600'
  return 'text-red-600'
}

function ScoreCard({ label, value, helperText }: { label: string; value: number | null; helperText?: string }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${scoreColor(value)}`}>
        {value !== null ? value.toFixed(1) : '—'}
        {value !== null && <span className="text-xs text-gray-400 font-normal">/10</span>}
      </p>
      {helperText && <p className="text-[10px] text-gray-400 mt-0.5">{helperText}</p>}
    </div>
  )
}

function DimensionSection({ dim, title, scores, description }: {
  dim: Dim
  title: string
  scores: Array<{ label: string; value: number | null; helperText?: string }>
  description: string
}) {
  const cfg = DIMENSION_COLORS[dim]
  const Icon = cfg.icon
  const overall = scores.find(s => s.label.toLowerCase().includes('overall'))?.value
    ?? scores[scores.length - 1]?.value

  return (
    <div className={`rounded-2xl border-2 ${cfg.border} ${cfg.bg} p-5 space-y-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center bg-white ${cfg.text}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className={`font-bold text-lg ${cfg.text}`}>{title}</h3>
            <p className="text-xs text-gray-600">{description}</p>
          </div>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold ${scoreColor(overall)}`}>
            {overall !== null && overall !== undefined ? overall.toFixed(1) : '—'}
          </p>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider">Overall</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {scores.map(s => (
          <ScoreCard key={s.label} {...s} />
        ))}
      </div>
    </div>
  )
}

export default function FeedbackDashboardPage() {
  const { t } = useLocale()
  const [summary, setSummary] = useState<Summary | null>(null)
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(90)
  const [filter, setFilter] = useState<'all' | 'escalated'>('all')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      fetch(`/api/admin/feedback/summary?days=${days}`).then(r => r.json()),
      fetch(`/api/admin/feedback?${filter === 'escalated' ? 'escalation=true&' : ''}limit=30`).then(r => r.json()),
    ]).then(([s, i]) => {
      setSummary(s)
      setItems(Array.isArray(i) ? i : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [days, filter])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 rounded-lg bg-gray-100 animate-pulse" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <div key={i} className="h-40 rounded-2xl bg-gray-100 animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (!summary) return <div className="p-6 text-gray-500">No data.</div>

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-hm-black">
            {t('admin.feedback.title') || 'Guest Feedback'}
          </h1>
          <p className="text-sm text-gray-500">
            {t('admin.feedback.subtitle') || 'Voice-captured insights from guests — grouped by accountability.'}
          </p>
        </div>
        <div className="flex gap-2">
          <select value={days} onChange={e => setDays(Number(e.target.value))}
            className="rounded-lg border bg-white px-3 py-2 text-sm">
            <option value={30}>30 days</option>
            <option value={60}>60 days</option>
            <option value={90}>90 days</option>
            <option value={180}>180 days</option>
            <option value={365}>1 year</option>
          </select>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Response rate</p>
          <p className="text-2xl font-bold text-hm-black mt-1">{summary.responseRate}%</p>
          <p className="text-[10px] text-gray-400 mt-0.5">{summary.completed} of {summary.totalScheduled} calls</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Net Promoter Score</p>
          <p className={`text-2xl font-bold mt-1 ${summary.nps === null ? 'text-gray-300' : summary.nps > 50 ? 'text-emerald-600' : summary.nps > 0 ? 'text-amber-600' : 'text-red-600'}`}>
            {summary.nps !== null ? summary.nps : '—'}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">{summary.npsBreakdown.total} ratings</p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Escalations</p>
          <p className={`text-2xl font-bold mt-1 ${summary.escalations.total > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {summary.escalations.total}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {summary.escalations.critical} critical · {summary.escalations.high} high
          </p>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Sentiment</p>
          <div className="flex gap-1 mt-1">
            <span className="text-sm font-bold text-emerald-600">{summary.sentiment.positive}</span>
            <span className="text-sm text-gray-300">·</span>
            <span className="text-sm font-bold text-gray-500">{summary.sentiment.neutral}</span>
            <span className="text-sm text-gray-300">·</span>
            <span className="text-sm font-bold text-amber-600">{summary.sentiment.negative}</span>
            <span className="text-sm text-gray-300">·</span>
            <span className="text-sm font-bold text-red-600">{summary.sentiment.severeNegative}</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">pos · neutral · neg · severe</p>
        </div>
      </div>

      {/* 3 Dimensions */}
      <div className="grid gap-4 md:grid-cols-3">
        <DimensionSection
          dim="property"
          title="Property"
          description="Owner accountability — structure, amenities, location, value"
          scores={[
            { label: 'Structure',  value: summary.dimensions.property.structure },
            { label: 'Amenities',  value: summary.dimensions.property.amenities, helperText: 'WiFi, AC, kitchen' },
            { label: 'Location',   value: summary.dimensions.property.location },
            { label: 'Value',      value: summary.dimensions.property.valueForMoney, helperText: 'vs. price paid' },
          ]}
        />
        <DimensionSection
          dim="crew"
          title="Crew"
          description="Team delivery — how guest received it, cleanliness, welcome"
          scores={[
            { label: 'State on arrival', value: summary.dimensions.crew.state },
            { label: 'Cleanliness',      value: summary.dimensions.crew.cleanliness, helperText: 'bath, kitchen, bed' },
            { label: 'Presentation',     value: summary.dimensions.crew.presentation, helperText: 'welcome, handoff' },
            { label: 'Overall',          value: summary.dimensions.crew.overall },
          ]}
        />
        <DimensionSection
          dim="platform"
          title="HostMasters"
          description="Platform — communication, check-in, check-out, support"
          scores={[
            { label: 'Communication', value: summary.dimensions.platform.communication },
            { label: 'Check-in',      value: summary.dimensions.platform.checkIn },
            { label: 'Check-out',     value: summary.dimensions.platform.checkOut },
            { label: 'Platform',      value: summary.dimensions.platform.platformOverall },
          ]}
        />
      </div>

      {/* Top tags */}
      {summary.topTags.length > 0 && (
        <div className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold text-hm-black mb-3">Most mentioned topics</h3>
          <div className="flex flex-wrap gap-2">
            {summary.topTags.map(({ tag, count }) => (
              <span key={tag} className={`rounded-full px-3 py-1 text-xs font-medium border ${
                tag.includes('positive') || tag.includes('excellent') || tag.includes('smooth') || tag.includes('responsive') || tag.includes('praised')
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : tag.includes('negative') || tag.includes('poor') || tag.includes('issue') || tag.includes('problem') || tag.includes('complaint') || tag.includes('broken') || tag.includes('missing')
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-gray-50 text-gray-700 border-gray-200'
              }`}>
                {tag.replace(/_/g, ' ')} · {count}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent feedback list */}
      <div className="rounded-xl border bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="font-semibold text-hm-black">Recent feedback</h3>
          <div className="flex gap-2">
            <button onClick={() => setFilter('all')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${filter === 'all' ? 'bg-hm-black text-white' : 'bg-gray-100 text-gray-600'}`}>
              All
            </button>
            <button onClick={() => setFilter('escalated')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 ${filter === 'escalated' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
              <AlertTriangle className="h-3 w-3" /> Escalated
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400">
            No feedback yet. Voice calls start after guest checkouts.
          </div>
        ) : (
          <div className="divide-y">
            {items.map(f => (
              <FeedbackRow key={f.id} feedback={f} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function FeedbackRow({ feedback: f }: { feedback: FeedbackItem }) {
  const statusBadge = (() => {
    const map: Record<string, { bg: string; text: string; icon: any }> = {
      COMPLETED_SUCCESS:     { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: CheckCircle },
      COMPLETED_PARTIAL:     { bg: 'bg-amber-50',   text: 'text-amber-700',   icon: Circle },
      FALLBACK_WEB_COMPLETED:{ bg: 'bg-blue-50',    text: 'text-blue-700',    icon: CheckCircle },
      SCHEDULED:             { bg: 'bg-gray-50',    text: 'text-gray-600',    icon: Clock },
      IN_PROGRESS:           { bg: 'bg-blue-50',    text: 'text-blue-700',    icon: Phone },
      NOT_ANSWERED:          { bg: 'bg-gray-50',    text: 'text-gray-500',    icon: Circle },
      UNREACHABLE:           { bg: 'bg-red-50',     text: 'text-red-600',     icon: Circle },
      DECLINED:              { bg: 'bg-gray-50',    text: 'text-gray-500',    icon: Circle },
    }
    return map[f.callStatus] ?? map.SCHEDULED
  })()
  const StatusIcon = statusBadge.icon

  const avgProperty = avg([f.scorePropertyStructure, f.scorePropertyAmenities, f.scoreLocation, f.scoreValueForMoney])
  const avgCrew = avg([f.scorePropertyState, f.scoreCleanliness, f.scoreCrewPresentation])
  const avgPlatform = avg([f.scoreCommunication, f.scoreCheckInExperience, f.scoreCheckOutExperience, f.scorePlatformOverall])

  return (
    <div className="p-4 hover:bg-gray-50/50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-hm-black">{f.reservation.guestName}</span>
            <span className="text-xs text-gray-500">· {f.property.name}, {f.property.city}</span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadge.bg} ${statusBadge.text}`}>
              <StatusIcon className="h-3 w-3" /> {f.callStatus.replace(/_/g, ' ')}
            </span>
            {f.escalationLevel && f.escalationLevel !== 'NONE' && (
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                f.escalationLevel === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                f.escalationLevel === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                'bg-amber-100 text-amber-700'
              }`}>
                <AlertTriangle className="h-3 w-3" /> {f.escalationLevel}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-0.5">
            Checked out {new Date(f.reservation.checkOut).toLocaleDateString()}
            {f.crewMember && ` · Crew: ${f.crewMember.name || f.crewMember.email}`}
            {f.scoreNps !== null && ` · NPS ${f.scoreNps}/10`}
          </p>

          {/* Dimension scores inline */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <MiniDimScore label="Property" value={avgProperty} dim="property" />
            <MiniDimScore label="Crew"     value={avgCrew}     dim="crew" />
            <MiniDimScore label="Platform" value={avgPlatform} dim="platform" />
          </div>

          {/* Qualitative snippets */}
          {(f.feedbackProperty || f.feedbackCrew || f.feedbackPlatform) && (
            <div className="mt-3 space-y-1 text-xs text-gray-600">
              {f.feedbackProperty && <p>🏠 {f.feedbackProperty}</p>}
              {f.feedbackCrew && <p>👥 {f.feedbackCrew}</p>}
              {f.feedbackPlatform && <p>✨ {f.feedbackPlatform}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MiniDimScore({ label, value, dim }: { label: string; value: number | null; dim: Dim }) {
  const cfg = DIMENSION_COLORS[dim]
  return (
    <div className={`rounded-lg border ${cfg.border} ${cfg.bg} px-2 py-1.5`}>
      <p className={`text-[9px] font-bold uppercase tracking-wider ${cfg.text}`}>{label}</p>
      <p className={`text-base font-bold ${scoreColor(value)}`}>
        {value !== null ? value.toFixed(1) : '—'}
      </p>
    </div>
  )
}

function avg(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v !== null)
  return nums.length ? +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : null
}
