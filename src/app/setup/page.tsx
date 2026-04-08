"use client"

import { useEffect, useState } from "react"
import { Plus, RefreshCw, AlertTriangle, CheckCircle2, Clock, Circle } from "lucide-react"

type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETE" | "OVERDUE"

interface SetupStep {
  day: number
  title: string
  status: TaskStatus
  assignee?: string
  completedAt?: string
  notes?: string
}

interface PropertySetup {
  propertyId: string
  propertyName: string
  ownerName: string
  startDate: string
  steps: SetupStep[]
}

const STEP_TEMPLATES: Omit<SetupStep, "status">[] = [
  { day: 1,  title: "Welcome email sent to owner" },
  { day: 2,  title: "Onboarding visit scheduled" },
  { day: 5,  title: "Physical visit — inspection, inventory & photos" },
  { day: 6,  title: "Condition report sent to owner" },
  { day: 7,  title: "Nuki smart lock installed & tested" },
  { day: 8,  title: "Airbnb + Booking.com + VRBO profiles created" },
  { day: 9,  title: "PriceLabs activated — minimum prices set" },
  { day: 10, title: "Owner approves listing" },
  { day: 11, title: "Published on all channels" },
  { day: 12, title: "Cleaning team briefed" },
  { day: 13, title: "Property file created in system" },
  { day: 14, title: "Setup complete — owner & manager notified" },
]

const statusConfig: Record<TaskStatus, {
  icon: typeof CheckCircle2; color: string; bg: string; label: string
}> = {
  PENDING:     { icon: Circle,        color: "text-gray-400",    bg: "bg-gray-50",     label: "Pending" },
  IN_PROGRESS: { icon: Clock,         color: "text-blue-600",    bg: "bg-blue-50",     label: "In progress" },
  COMPLETE:    { icon: CheckCircle2,  color: "text-green-600",   bg: "bg-green-50",    label: "Complete" },
  OVERDUE:     { icon: AlertTriangle, color: "text-red-600",     bg: "bg-red-50",      label: "Overdue" },
}

function computeStepStatuses(startDate: string): SetupStep[] {
  const start = new Date(startDate)
  const today = new Date()
  return STEP_TEMPLATES.map(step => {
    const dueDate = new Date(start)
    dueDate.setDate(dueDate.getDate() + step.day - 1)
    let status: TaskStatus = "PENDING"
    if (dueDate < today) {
      status = "OVERDUE"
    } else if (Math.abs(dueDate.getTime() - today.getTime()) < 86_400_000 * 2) {
      status = "IN_PROGRESS"
    }
    return { ...step, status }
  })
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

export default function SetupPage() {
  const [setups, setSetups] = useState<PropertySetup[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSetup, setSelectedSetup] = useState<PropertySetup | null>(null)

  useEffect(() => {
    // Load properties in ONBOARDING/PENDING status
    Promise.all([
      fetch("/api/properties").then(r => r.ok ? r.json() : []),
    ]).then(([props]) => {
      const onboarding: PropertySetup[] = props
        .filter((p: any) => p.status === "PENDING_APPROVAL" || p.status === "PENDING_CLIENT" || p.status === "ONBOARDING")
        .map((p: any) => ({
          propertyId: p.id,
          propertyName: p.name,
          ownerName: p.owner?.name ?? "Owner",
          startDate: p.createdAt,
          steps: computeStepStatuses(p.createdAt),
        }))

      // Demo: if no onboarding properties, show a sample
      if (onboarding.length === 0) {
        const sampleStart = new Date()
        sampleStart.setDate(sampleStart.getDate() - 3)
        onboarding.push({
          propertyId: "demo",
          propertyName: "Villa Andalucía",
          ownerName: "Erik Andersson",
          startDate: sampleStart.toISOString(),
          steps: computeStepStatuses(sampleStart.toISOString()),
        })
      }

      setSetups(onboarding)
      setSelectedSetup(onboarding[0] ?? null)
      setLoading(false)
    })
  }, [])

  const toggleStatus = (stepDay: number, setupId: string) => {
    setSetups(prev => prev.map(s => {
      if (s.propertyId !== setupId) return s
      return {
        ...s,
        steps: s.steps.map(step => {
          if (step.day !== stepDay) return step
          const cycle: TaskStatus[] = ["PENDING", "IN_PROGRESS", "COMPLETE", "OVERDUE"]
          const next = cycle[(cycle.indexOf(step.status) + 1) % cycle.length]
          return { ...step, status: next }
        }),
      }
    }))
    // Also update selectedSetup if it matches
    if (selectedSetup?.propertyId === setupId) {
      setSelectedSetup(prev => prev ? {
        ...prev,
        steps: prev.steps.map(step => {
          if (step.day !== stepDay) return step
          const cycle: TaskStatus[] = ["PENDING", "IN_PROGRESS", "COMPLETE", "OVERDUE"]
          const next = cycle[(cycle.indexOf(step.status) + 1) % cycle.length]
          return { ...step, status: next }
        }),
      } : prev)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-4 animate-pulse" style={{ fontFamily: 'system-ui, sans-serif' }}>
        <div className="h-8 w-48 rounded bg-gray-100" />
        <div className="h-64 rounded-xl bg-gray-100" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-64px)]" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar — property list */}
      <div className="w-72 border-r bg-white flex flex-col shrink-0">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-bold text-navy-900 text-sm">Properties in Setup</h2>
          <p className="text-xs text-gray-400 mt-0.5">{setups.length} active onboarding</p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y">
          {setups.map(setup => {
            const completed = setup.steps.filter(s => s.status === "COMPLETE").length
            const overdue = setup.steps.filter(s => s.status === "OVERDUE").length
            const pct = Math.round((completed / setup.steps.length) * 100)
            const isSelected = selectedSetup?.propertyId === setup.propertyId
            return (
              <button
                key={setup.propertyId}
                onClick={() => setSelectedSetup(setup)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                  isSelected ? "bg-navy-50 border-l-2 border-l-navy-600" : ""
                }`}
              >
                <div className="font-semibold text-sm text-gray-900">{setup.propertyName}</div>
                <div className="text-xs text-gray-400">{setup.ownerName}</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-gold-500"
                      style={{ width: `${pct}%`, background: '#C9A84C' }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{pct}%</span>
                  {overdue > 0 && (
                    <span className="text-xs text-red-600 font-semibold">{overdue} late</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main — selected property setup */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedSetup ? (
          <div className="max-w-2xl">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-navy-900">{selectedSetup.propertyName}</h1>
                <p className="text-sm text-gray-500">
                  Owner: {selectedSetup.ownerName} · Started {fmtDate(selectedSetup.startDate)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-navy-900">
                  {Math.round((selectedSetup.steps.filter(s => s.status === "COMPLETE").length / selectedSetup.steps.length) * 100)}%
                </div>
                <div className="text-xs text-gray-400">complete</div>
              </div>
            </div>

            {/* Progress */}
            <div className="h-2 rounded-full bg-gray-200 mb-6">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.round((selectedSetup.steps.filter(s => s.status === "COMPLETE").length / selectedSetup.steps.length) * 100)}%`,
                  background: '#C9A84C',
                }}
              />
            </div>

            {/* Steps */}
            <div className="space-y-2">
              {selectedSetup.steps.map(step => {
                const cfg = statusConfig[step.status]
                const Icon = cfg.icon
                const start = new Date(selectedSetup.startDate)
                const dueDate = new Date(start)
                dueDate.setDate(dueDate.getDate() + step.day - 1)

                return (
                  <div
                    key={step.day}
                    className={`rounded-xl border p-4 transition-colors ${cfg.bg} ${
                      step.status === "OVERDUE" ? "border-red-200" :
                      step.status === "COMPLETE" ? "border-green-200" :
                      step.status === "IN_PROGRESS" ? "border-blue-200" :
                      "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleStatus(step.day, selectedSetup.propertyId)}
                        className="mt-0.5"
                      >
                        <Icon className={`h-5 w-5 ${cfg.color}`} />
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="text-xs text-gray-400 mr-2">D+{step.day}</span>
                            <span className="text-sm font-semibold text-gray-900">{step.title}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</div>
                            <div className="text-[11px] text-gray-400">
                              {dueDate.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                            </div>
                          </div>
                        </div>
                        {step.notes && (
                          <p className="text-xs text-gray-500 mt-1 italic">{step.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select a property to see its setup progress
          </div>
        )}
      </div>
    </div>
  )
}
