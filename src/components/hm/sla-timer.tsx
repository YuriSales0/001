"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Clock } from "lucide-react"

interface SLATimerProps {
  startedAt: string | Date
  limitHours: number
  label?: string
  className?: string
}

function getElapsed(startedAt: Date): number {
  return (Date.now() - startedAt.getTime()) / (1000 * 60 * 60) // hours
}

export function SLATimer({ startedAt, limitHours, label, className }: SLATimerProps) {
  const start = typeof startedAt === "string" ? new Date(startedAt) : startedAt
  const [elapsed, setElapsed] = useState(getElapsed(start))

  useEffect(() => {
    const timer = setInterval(() => setElapsed(getElapsed(start)), 60_000)
    return () => clearInterval(timer)
  }, [start])

  const pct = Math.min((elapsed / limitHours) * 100, 100)
  const remaining = limitHours - elapsed

  let status: "green" | "amber" | "red"
  if (pct < 60) status = "green"
  else if (pct < 90) status = "amber"
  else status = "red"

  const statusConfig = {
    green: { bar: "bg-hm-green", text: "text-hm-green", bg: "bg-hm-green/10" },
    amber: { bar: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
    red:   { bar: "bg-hm-red",   text: "text-hm-red",   bg: "bg-hm-red/10"  },
  }

  const cfg = statusConfig[status]

  const formatTime = (h: number) => {
    if (h <= 0) return "Overdue"
    if (h < 1) return `${Math.round(h * 60)}m left`
    return `${Math.floor(h)}h ${Math.round((h % 1) * 60)}m left`
  }

  return (
    <div className={cn("rounded-hm border border-hm-border p-3", cfg.bg, className)}>
      {label && (
        <div className="flex items-center gap-1.5 mb-2">
          <Clock className={cn("h-3.5 w-3.5", cfg.text)} />
          <span className={cn("text-xs font-sans font-medium uppercase tracking-wider", cfg.text)}>
            {label}
          </span>
        </div>
      )}
      <div className="h-2 rounded-full bg-hm-border overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-1000", cfg.bar)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className={cn("mt-1.5 text-xs font-sans font-semibold", cfg.text)}>
        {formatTime(remaining)}
        <span className="text-hm-slate/60 font-normal ml-1">/ {limitHours}h SLA</span>
      </div>
    </div>
  )
}
