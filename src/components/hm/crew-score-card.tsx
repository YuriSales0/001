"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Star, Shield, Zap, AlertTriangle } from "lucide-react"
import { useLocale } from "@/i18n/provider"

type ScoreData = {
  currentScore: number
  level: string
  totalTasks: number
  totalApproved: number
  totalRejected: number
  history: { delta: number; reason: string; createdAt: string }[]
}

const LEVEL_CONFIG: Record<string, { labelKey: string; bonusKey: string; icon: typeof Star; color: string; bg: string; min: number; next: number | null }> = {
  SUSPENDED: { labelKey: 'crew.score.suspended', bonusKey: 'crew.score.suspendedDesc', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', min: 0, next: 50 },
  BASIC:     { labelKey: 'crew.score.basic',     bonusKey: 'crew.score.basicDesc',     icon: Shield,        color: 'text-blue-600', bg: 'bg-blue-50', min: 50, next: 150 },
  VERIFIED:  { labelKey: 'crew.score.verified',  bonusKey: 'crew.score.verifiedDesc',  icon: Zap,           color: 'text-amber-600', bg: 'bg-amber-50', min: 150, next: 300 },
  EXPERT:    { labelKey: 'crew.score.expert',    bonusKey: 'crew.score.expertDesc',    icon: TrendingUp,    color: 'text-green-600', bg: 'bg-green-50', min: 300, next: 500 },
  ELITE:     { labelKey: 'crew.score.elite',     bonusKey: 'crew.score.eliteDesc',     icon: Star,          color: 'text-yellow-500', bg: 'bg-yellow-50', min: 500, next: null },
}

export function CrewScoreCard() {
  const { t } = useLocale()
  const [data, setData] = useState<ScoreData | null>(null)

  useEffect(() => {
    fetch('/api/crew-score')
      .then(r => r.ok ? r.json() : null)
      .then(setData)
      .catch(() => {})
  }, [])

  if (!data) return null

  const config = LEVEL_CONFIG[data.level] ?? LEVEL_CONFIG.BASIC
  const Icon = config.icon
  const progress = config.next
    ? Math.min(100, ((data.currentScore - config.min) / (config.next - config.min)) * 100)
    : 100
  const approvalRate = data.totalTasks > 0
    ? Math.round((data.totalApproved / data.totalTasks) * 100)
    : 100

  return (
    <div className="px-4 py-3 border-b space-y-2">
      {/* Level + Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${config.bg}`}>
            <Icon className={`h-3.5 w-3.5 ${config.color}`} />
          </div>
          <div>
            <p className={`text-xs font-bold ${config.color}`}>{t(config.labelKey)}</p>
            <p className="text-[10px] text-gray-400">{t(config.bonusKey)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-navy-900">{data.currentScore}</p>
          <p className="text-[10px] text-gray-400">{t('crew.score.pts')}</p>
        </div>
      </div>

      {/* Progress bar */}
      {config.next && (
        <div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: '#B08A3E' }}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {config.next - data.currentScore} {t('crew.score.ptsTo')} {t(LEVEL_CONFIG[
              data.level === 'SUSPENDED' ? 'BASIC' :
              data.level === 'BASIC' ? 'VERIFIED' :
              data.level === 'VERIFIED' ? 'EXPERT' : 'ELITE'
            ]?.labelKey ?? 'crew.score.nextLevel')}
          </p>
        </div>
      )}

      {/* Stats row */}
      <div className="flex gap-3 text-[10px]">
        <span className="text-gray-500">{data.totalTasks} {t('crew.score.tasks')}</span>
        <span className="text-green-600">{approvalRate}% {t('crew.score.approved')}</span>
      </div>

      {/* Incentive message */}
      <div className="rounded-lg p-2 text-[10px] leading-snug" style={{ background: 'rgba(176,138,62,0.08)' }}>
        <p className="font-semibold text-gray-700">{t('crew.score.incentiveTitle')}</p>
        <p className="text-gray-500 mt-0.5">
          {t('crew.score.incentiveDesc')}
        </p>
      </div>
    </div>
  )
}
