"use client"

import { useEffect, useState } from "react"
import { TrendingUp, Star, Shield, Zap, AlertTriangle } from "lucide-react"

type ScoreData = {
  currentScore: number
  level: string
  totalTasks: number
  totalApproved: number
  totalRejected: number
  history: { delta: number; reason: string; createdAt: string }[]
}

const LEVEL_CONFIG: Record<string, { label: string; icon: typeof Star; color: string; bg: string; min: number; next: number | null; bonus: string }> = {
  SUSPENDED: { label: 'Suspended', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', min: 0, next: 50, bonus: 'No tasks' },
  BASIC:     { label: 'Basic',     icon: Shield,        color: 'text-blue-600', bg: 'bg-blue-50', min: 50, next: 150, bonus: 'Standard tasks' },
  VERIFIED:  { label: 'Verified',  icon: Zap,           color: 'text-amber-600', bg: 'bg-amber-50', min: 150, next: 300, bonus: '+5% rate' },
  EXPERT:    { label: 'Expert',    icon: TrendingUp,    color: 'text-green-600', bg: 'bg-green-50', min: 300, next: 500, bonus: '+10% rate' },
  ELITE:     { label: 'Elite',     icon: Star,          color: 'text-yellow-500', bg: 'bg-yellow-50', min: 500, next: null, bonus: '+15% rate + independent inspections' },
}

export function CrewScoreCard() {
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
            <p className={`text-xs font-bold ${config.color}`}>{config.label}</p>
            <p className="text-[10px] text-gray-400">{config.bonus}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-navy-900">{data.currentScore}</p>
          <p className="text-[10px] text-gray-400">pts</p>
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
            {config.next - data.currentScore} pts to {LEVEL_CONFIG[
              data.level === 'SUSPENDED' ? 'BASIC' :
              data.level === 'BASIC' ? 'VERIFIED' :
              data.level === 'VERIFIED' ? 'EXPERT' : 'ELITE'
            ]?.label ?? 'next level'}
          </p>
        </div>
      )}

      {/* Stats row */}
      <div className="flex gap-3 text-[10px]">
        <span className="text-gray-500">{data.totalTasks} tasks</span>
        <span className="text-green-600">{approvalRate}% approved</span>
      </div>

      {/* Incentive message */}
      <div className="rounded-lg p-2 text-[10px] leading-snug" style={{ background: 'rgba(176,138,62,0.08)' }}>
        <p className="font-semibold text-gray-700">Higher score = more tasks for you</p>
        <p className="text-gray-500 mt-0.5">
          Good work on a property builds trust. The platform prioritises you for future tasks at properties where you performed well.
        </p>
      </div>
    </div>
  )
}
