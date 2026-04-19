"use client"

import { cn } from "@/lib/utils"
import { CheckCircle2, Clock, AlertTriangle, Circle, Upload } from "lucide-react"
import { useLocale } from "@/i18n/provider"

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

const SETUP_STEP_KEYS: Omit<SetupStep, "status" | "title"> & { titleKey: string }[] = [
  { day: 1,  titleKey: "admin.setup.steps.welcomeEmail" },
  { day: 2,  titleKey: "admin.setup.steps.onboardingVisit" },
  { day: 5,  titleKey: "admin.setup.steps.physicalVisit" },
  { day: 6,  titleKey: "admin.setup.steps.conditionReport" },
  { day: 7,  titleKey: "admin.setup.steps.smartLock" },
  { day: 8,  titleKey: "admin.setup.steps.profilesCreated" },
  { day: 9,  titleKey: "admin.setup.steps.priceLabsActivated" },
  { day: 10, titleKey: "admin.setup.steps.ownerApproves" },
  { day: 11, titleKey: "admin.setup.steps.publishedChannels" },
  { day: 12, titleKey: "admin.setup.steps.cleaningTeamBriefed" },
  { day: 13, titleKey: "admin.setup.steps.propertyFileCreated" },
  { day: 14, titleKey: "admin.setup.steps.setupComplete" },
]

const statusConfig = {
  PENDING:     { icon: Circle,        color: "text-hm-border",  bg: "bg-hm-sand",        labelKey: "admin.setup.status.pending" },
  IN_PROGRESS: { icon: Clock,         color: "text-hm-blue",    bg: "bg-hm-blue/10",     labelKey: "admin.setup.status.inProgress" },
  COMPLETE:    { icon: CheckCircle2,  color: "text-hm-green",   bg: "bg-hm-green/10",    labelKey: "admin.setup.status.complete" },
  OVERDUE:     { icon: AlertTriangle, color: "text-hm-red",     bg: "bg-hm-red/10",      labelKey: "admin.setup.status.overdue" },
}

export function SetupTimeline({ propertyName, startDate, steps, className }: SetupTimelineProps) {
  const { t } = useLocale()
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
            {t('admin.setup.setupStarted')} {start.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-hm-black">{progress}%</div>
          <div className="text-xs font-sans text-hm-slate/70">{t('admin.setup.complete')}</div>
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
        <span>{completedCount}/{steps.length} {t('admin.setup.steps.label')}</span>
        {overdueCount > 0 && (
          <span className="text-hm-red font-semibold">{overdueCount} {t('admin.setup.status.overdue').toLowerCase()}</span>
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
                  <span className={cn("text-xs font-sans shrink-0", cfg.color)}>{t(cfg.labelKey)}</span>
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

export { SETUP_STEP_KEYS }
