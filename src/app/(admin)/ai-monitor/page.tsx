'use client'

import { useEffect, useState } from 'react'
import { useLocale } from '@/i18n/provider'
import { SystemMonitor } from '@/components/hm/system-monitor'
import { ShieldCheck, AlertTriangle, Info, Clock, CalendarDays, Wallet, BarChart3 } from 'lucide-react'

type SystemAlert = {
  id: string
  message: string
  severity: string
  createdAt: string
  resolvedAt: string | null
}

const CHECK_TYPES_BY_SECTION = [
  {
    sectionKey: 'sections.reservations',
    icon: CalendarDays,
    checks: [
      { type: 'RESERVATION_PAST_CHECKIN', severity: 'HIGH' },
      { type: 'CHECKIN_NO_TASK', severity: 'MEDIUM' },
      { type: 'CHECKOUT_NO_TASK', severity: 'MEDIUM' },
      { type: 'CHECKOUT_NO_CREW_REPORT', severity: 'LOW' },
      { type: 'RESERVATION_ZERO_AMOUNT', severity: 'MEDIUM' },
    ],
  },
  {
    sectionKey: 'sections.payouts',
    icon: Wallet,
    checks: [
      { type: 'PAYOUT_NO_INVOICE', severity: 'HIGH' },
      { type: 'PAYOUT_OVERDUE', severity: 'HIGH' },
      { type: 'COMMISSION_MISMATCH', severity: 'MEDIUM' },
      { type: 'INVOICE_PAID_NO_PAIDAT', severity: 'HIGH' },
    ],
  },
  {
    sectionKey: 'sections.reports',
    icon: BarChart3,
    checks: [
      { type: 'REPORT_MISSING', severity: 'MEDIUM' },
      { type: 'REPORT_NOT_SENT', severity: 'LOW' },
      { type: 'PROPERTY_STALE', severity: 'LOW' },
    ],
  },
]

const SEVERITY_ICON_MAP = {
  HIGH: { className: 'h-3.5 w-3.5 text-red-500', Icon: AlertTriangle },
  MEDIUM: { className: 'h-3.5 w-3.5 text-amber-500', Icon: AlertTriangle },
  LOW: { className: 'h-3.5 w-3.5 text-blue-400', Icon: Info },
}

const SEVERITY_BADGE: Record<string, string> = {
  HIGH:   'bg-red-100 text-red-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW:    'bg-blue-100 text-blue-700',
}

export default function AiMonitorPage() {
  const { t } = useLocale()
  const [history, setHistory] = useState<SystemAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/ai-monitor/history')
      .then(r => r.ok ? r.json() : [])
      .then(data => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]))
      .finally(() => setLoading(false))
  }, [])

  const fmt = (d: string) => new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const renderSeverityIcon = (severity: string) => {
    const entry = SEVERITY_ICON_MAP[severity as keyof typeof SEVERITY_ICON_MAP]
    if (!entry) return <Info className="h-3.5 w-3.5 text-gray-400" />
    const { Icon: SevIcon, className } = entry
    return <SevIcon className={className} />
  }

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-5 w-5 text-navy-700" />
          <h1 className="text-2xl font-serif font-bold text-hm-black">{t('admin.aiMonitor.title')}</h1>
        </div>
        <p className="text-sm text-gray-500">
          {t('admin.aiMonitor.subtitle')}
        </p>
      </div>

      {/* Live checks */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{t('admin.aiMonitor.currentState')}</p>
        <SystemMonitor />
      </div>

      {/* Check catalogue — grouped by section */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">{t('admin.aiMonitor.whatIsChecked')}</p>
        <div className="space-y-4">
          {CHECK_TYPES_BY_SECTION.map(group => {
            const SectionIcon = group.icon
            const sectionName = t(`admin.aiMonitor.${group.sectionKey}`)
            return (
              <div key={group.sectionKey} className="rounded-hm border bg-white overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b">
                  <SectionIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{sectionName}</span>
                  <span className="ml-auto text-[10px] text-gray-400">{group.checks.length} {t('admin.aiMonitor.checks')}</span>
                </div>
                <div className="divide-y">
                  {group.checks.map(c => {
                    const checkKey = `admin.aiMonitor.checks_${c.type}`
                    return (
                      <div key={c.type} className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 shrink-0">{renderSeverityIcon(c.severity)}</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-semibold text-gray-900">{t(`${checkKey}.label`)}</span>
                              <span className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${SEVERITY_BADGE[c.severity]}`}>
                                {c.severity}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">{t(`${checkKey}.desc`)}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              <span className="font-medium text-gray-500">{t('admin.aiMonitor.resolution')}:</span> {t(`${checkKey}.fix`)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Alert history */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          {t('admin.aiMonitor.alertHistory')}
        </p>
        {loading ? (
          <div className="rounded-hm border bg-white py-10 text-center text-sm text-gray-400 animate-pulse">
            <div className="h-6 w-6 mx-auto mb-2 bg-gray-200 rounded" />
            <div className="h-4 w-48 mx-auto bg-gray-200 rounded" />
          </div>
        ) : history.length === 0 ? (
          <div className="rounded-hm border bg-white py-10 text-center text-sm text-gray-400">
            <ShieldCheck className="h-6 w-6 mx-auto mb-2 text-gray-200" />
            {t('admin.aiMonitor.noAlerts')}
          </div>
        ) : (
          <div className="rounded-hm border bg-white overflow-hidden divide-y">
            {history.map(a => (
              <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5 shrink-0">
                  {renderSeverityIcon(a.severity)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{a.message}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{fmt(a.createdAt)}
                    </span>
                    {a.resolvedAt && (
                      <span className="text-[10px] text-green-600">{t('admin.aiMonitor.resolved')} {fmt(a.resolvedAt)}</span>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 shrink-0 ${SEVERITY_BADGE[a.severity] ?? 'bg-gray-100 text-gray-500'}`}>
                  {a.severity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
