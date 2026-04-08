"use client"

import { cn } from "@/lib/utils"
import { CheckCircle2, Clock, AlertTriangle, Circle, Upload } from "lucide-react"

export type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETE" | "OVERDUE"

export interface SetupStep {
  day: number
  title: string
  status: TaskStatus
  assignee?: string
  notes?: string
  completedAt?: string
}

interface SetupTimelineProps {
  propertyName: string
  startDate: string
  steps: SetupStep[]
  className?: string
}

const SETUP_STEPS: Omit<SetupStep, "status">[] = [
  { day: 1,  title: "Welcome email sent to owner" },
  { day: 2,  title: "Onboarding visit scheduled" },
  { day: 5,  title: "Physical visit — inspection, inventory & photos" },
  { day: 6,  title: "Condition report sent to owner" },
  { day: 7,  title: "Nuki smart lock installed & tested" },
  { day: 8,  title: "Airbnb + Booking + VRBO profiles created" },
  { day: 9,  title: "PriceLabs activated — minimum prices set" },
  { day: 10, title: "Owner approves listing" },
  { day: 11, title: "Published on all channels" },
  { day: 12, title: "Cleaning team briefed" },
  { day: 13, title: "Property file created in system" },
  { day: 14, title: "Setup complete — owner & Manoela notified" },
]

const statusConfig = {
  PENDING:     { icon: Circle,        color: "text-hm-border",  bg: "bg-hm-sand",        label: "Pending" },
  IN_PROGRESS: { icon: Clock,         color: "text-hm-blue",    bg: "bg-hm-blue/10",     label: "In progress" },
  COMPLETE:    { icon: CheckCircle2,  color: "text-hm-green",   bg: "bg-hm-green/10",    label: "Complete" },
  OVERDUE:     { icon: AlertTriangle, color: "text-hm-red",     bg: "bg-hm-red/10",      label: "Overdue" },
}

export function SetupTimeline({ propertyName, startDate, steps, className }: SetupTimelineProps) {
  const start = new Date(startDate)
  const completedCount = steps.filter(s => s.status === "COMPLETE").length
  const overdueCount   = steps.filter(s => s.status === "OVERDUE").length
  const progress = Math.round((completedCount / steps.length) * 100)

  return (
    <div className={cn("hm-card p-6", className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-hm-black">{propertyName}</h3>
          <p className="text-sm font-sans text-hm-slate/70 mt-0.5">
            Setup started {start.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-hm-black">{progress}%</div>
          <div className="text-xs font-sans text-hm-slate/70">complete</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 rounded-full bg-hm-border mb-1 overflow-hidden">
        <div
          className="h-full rounded-full bg-hm-gold transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs font-sans text-hm-slate/60 mb-6">
        <span>{completedCount}/{steps.length} steps</span>
        {overdueCount > 0 && (
          <span className="text-hm-red font-semibold">{overdueCount} overdue</span>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {steps.map((step, i) => {
          const cfg = statusConfig[step.status]
          const Icon = cfg.icon
          const dueDate = new Date(start)
          dueDate.setDate(dueDate.getDate() + step.day - 1)
          return (
            <div
              key={step.day}
              className={cn(
                "flex items-start gap-3 rounded-lg p-3 transition-colors",
                cfg.bg
              )}
            >
              <div className="mt-0.5 relative">
                <Icon className={cn("h-5 w-5", cfg.color)} />
                {i < steps.length - 1 && (
                  <div className="absolute left-2.5 top-5 w-px h-4 bg-hm-border" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-sans text-hm-slate/60 mr-2">D+{step.day}</span>
                    <span className="text-sm font-sans font-medium text-hm-black">{step.title}</span>
                  </div>
                  <span className={cn("text-xs font-sans shrink-0", cfg.color)}>{cfg.label}</span>
                </div>
                {step.assignee && (
                  <p className="text-xs font-sans text-hm-slate/60 mt-0.5">→ {step.assignee}</p>
                )}
                {step.notes && (
                  <p className="text-xs font-sans text-hm-slate/70 mt-1 italic">{step.notes}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export { SETUP_STEPS }
