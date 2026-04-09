'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, AlertTriangle, Info, RefreshCw, ChevronDown, ChevronUp, CalendarDays, Wallet, BarChart3 } from 'lucide-react'
import type { MonitorResult, MonitorSection } from '@/app/api/monitor/checks/route'

type BySection = Record<MonitorSection, MonitorResult[]>

type MonitorData = {
  issues: MonitorResult[]
  bySection: BySection
  checkedAt: string
}

const SEVERITY_CONFIG = {
  HIGH:   { color: 'text-red-600',    bg: 'bg-red-50',    border: 'border-red-200',    icon: AlertTriangle, dot: 'bg-red-500'    },
  MEDIUM: { color: 'text-amber-600',  bg: 'bg-amber-50',  border: 'border-amber-200',  icon: AlertTriangle, dot: 'bg-amber-400'  },
  LOW:    { color: 'text-blue-600',   bg: 'bg-blue-50',   border: 'border-blue-200',   icon: Info,          dot: 'bg-blue-400'   },
  INFO:   { color: 'text-gray-500',   bg: 'bg-gray-50',   border: 'border-gray-200',   icon: Info,          dot: 'bg-gray-400'   },
}

const SECTION_CONFIG: Record<MonitorSection, { label: string; icon: React.ElementType }> = {
  reservations: { label: 'Alugueis',   icon: CalendarDays },
  payouts:      { label: 'Payouts',    icon: Wallet },
  reports:      { label: 'Relatórios', icon: BarChart3 },
}

const SECTION_ORDER: MonitorSection[] = ['reservations', 'payouts', 'reports']

export function SystemMonitor() {
  const [data, setData] = useState<MonitorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const load = async (showSpin = false) => {
    if (showSpin) setRefreshing(true)
    try {
      const res = await fetch('/api/monitor/checks')
      if (res.ok) {
        const json = await res.json()
        setData(json)
        if (json.issues.some((i: MonitorResult) => i.severity === 'HIGH')) {
          setExpanded(true)
        }
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) return null

  const issues = data?.issues ?? []
  const highCount = issues.filter(i => i.severity === 'HIGH').length
  const hasIssues = issues.length > 0

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className={`rounded-xl border ${hasIssues ? (highCount > 0 ? 'border-red-200' : 'border-amber-200') : 'border-gray-200'} bg-white overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50/60 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          {hasIssues ? (
            <AlertTriangle className={`h-4 w-4 shrink-0 ${highCount > 0 ? 'text-red-500' : 'text-amber-500'}`} />
          ) : (
            <ShieldCheck className="h-4 w-4 shrink-0 text-green-500" />
          )}
          <span className={`text-sm font-semibold ${hasIssues ? (highCount > 0 ? 'text-red-700' : 'text-amber-700') : 'text-gray-700'}`}>
            {hasIssues
              ? `${issues.length} anomalia${issues.length > 1 ? 's' : ''} detectada${issues.length > 1 ? 's' : ''}${highCount > 0 ? ` · ${highCount} crítica${highCount > 1 ? 's' : ''}` : ''}`
              : 'Sistema operacional — sem anomalias'}
          </span>
          {hasIssues && (
            <div className="flex items-center gap-1">
              {issues.map((issue, i) => (
                <span key={i} className={`h-1.5 w-1.5 rounded-full ${SEVERITY_CONFIG[issue.severity].dot}`} />
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {data?.checkedAt && (
            <span className="text-[10px] text-gray-400">{fmtTime(data.checkedAt)}</span>
          )}
          <button
            onClick={e => { e.stopPropagation(); load(true) }}
            disabled={refreshing}
            className="rounded p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
            title="Verificar agora"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          {hasIssues && (
            expanded
              ? <ChevronUp className="h-4 w-4 text-gray-400" />
              : <ChevronDown className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Issues grouped by section */}
      {expanded && hasIssues && data?.bySection && (
        <div className="border-t">
          {SECTION_ORDER.map(section => {
            const sectionIssues = data.bySection[section] ?? []
            if (sectionIssues.length === 0) return null
            const { label, icon: SectionIcon } = SECTION_CONFIG[section]
            return (
              <div key={section}>
                <div className="flex items-center gap-1.5 px-4 py-1.5 bg-gray-50 border-b">
                  <SectionIcon className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</span>
                  <span className="ml-auto text-[10px] font-medium text-gray-400">{sectionIssues.length}</span>
                </div>
                <div className="divide-y">
                  {sectionIssues.map((issue, i) => {
                    const cfg = SEVERITY_CONFIG[issue.severity]
                    const Icon = cfg.icon
                    return (
                      <div key={i} className={`flex items-start gap-3 px-4 py-3 ${cfg.bg}`}>
                        <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${cfg.color} font-medium`}>{issue.message}</p>
                        </div>
                        <Link
                          href={issue.action.href}
                          className={`shrink-0 text-[11px] font-semibold rounded-lg px-2.5 py-1 border ${cfg.border} ${cfg.color} hover:opacity-80 transition-opacity`}
                        >
                          {issue.action.label}
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
