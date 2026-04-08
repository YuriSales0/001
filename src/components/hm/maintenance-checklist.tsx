"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { CheckSquare, Square, AlertTriangle, Camera } from "lucide-react"

export interface ChecklistItem {
  id: string
  label: string
  section: string
  checked: boolean
  hasAnomaly?: boolean
  notes?: string
}

interface MaintenanceChecklistProps {
  propertyName: string
  type: "PREVENTIVE" | "CORRECTIVE" | "COLLECTIVE"
  items: ChecklistItem[]
  onItemChange?: (id: string, checked: boolean, notes?: string) => void
  readOnly?: boolean
  className?: string
}

const DEFAULT_ITEMS: Omit<ChecklistItem, "checked">[] = [
  { id: "facade",     section: "Exterior", label: "Facade and entrance gate" },
  { id: "pool",       section: "Exterior", label: "Pool (pH, water level, cleanliness)" },
  { id: "garden",     section: "Exterior", label: "Garden / terrace / balcony" },
  { id: "mailbox",    section: "Exterior", label: "Mailbox and entrance area" },
  { id: "humidity",   section: "Interior", label: "Humidity and mould — bedrooms and bathrooms" },
  { id: "aircon",     section: "Interior", label: "Air conditioning — function and filters" },
  { id: "plumbing",   section: "Interior", label: "Plumbing — hot/cold water, WC flush" },
  { id: "appliances", section: "Interior", label: "Appliances — fridge, oven, washing machine" },
  { id: "nuki",       section: "Interior", label: "Nuki lock — battery and remote access" },
  { id: "wifi",       section: "Interior", label: "WiFi and router — active connection" },
  { id: "windows",    section: "Interior", label: "Windows, blinds and shutters" },
  { id: "alarm",      section: "Interior", label: "Security alarm (if present)" },
]

export { DEFAULT_ITEMS as DEFAULT_CHECKLIST_ITEMS }

export function MaintenanceChecklist({
  propertyName, type, items, onItemChange, readOnly, className,
}: MaintenanceChecklistProps) {
  const [localItems, setLocalItems] = useState<ChecklistItem[]>(items)
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null)

  const sections = Array.from(new Set(localItems.map(i => i.section)))
  const checkedCount = localItems.filter(i => i.checked).length
  const anomalyCount = localItems.filter(i => i.hasAnomaly).length

  const toggle = (id: string) => {
    if (readOnly) return
    setLocalItems(prev => prev.map(item =>
      item.id === id ? { ...item, checked: !item.checked } : item
    ))
    const item = localItems.find(i => i.id === id)
    if (item) onItemChange?.(id, !item.checked, item.notes)
  }

  return (
    <div className={cn("hm-card p-5", className)}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-bold text-hm-black">{propertyName}</h3>
          <p className="text-sm font-sans text-hm-slate/70">
            {type === "PREVENTIVE" ? "Preventive maintenance" :
             type === "CORRECTIVE" ? "Corrective maintenance" :
             "Collective maintenance"}
          </p>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold text-hm-black">{checkedCount}/{localItems.length}</div>
          {anomalyCount > 0 && (
            <div className="flex items-center gap-1 text-hm-red text-xs font-sans">
              <AlertTriangle className="h-3 w-3" />
              {anomalyCount} anomaly
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="h-1.5 rounded-full bg-hm-border mb-5 overflow-hidden">
        <div
          className="h-full rounded-full bg-hm-green transition-all"
          style={{ width: `${(checkedCount / localItems.length) * 100}%` }}
        />
      </div>

      {/* Sections */}
      {sections.map(section => (
        <div key={section} className="mb-4">
          <h4 className="text-xs font-sans uppercase tracking-widest text-hm-slate/60 mb-2 px-1">
            {section}
          </h4>
          <div className="space-y-1">
            {localItems.filter(i => i.section === section).map(item => (
              <div key={item.id}>
                <div
                  className={cn(
                    "flex items-start gap-3 rounded-lg p-3 transition-colors",
                    !readOnly && "cursor-pointer hover:bg-hm-sand/60",
                    item.checked ? "bg-hm-green/5" : "bg-transparent",
                    item.hasAnomaly && "bg-hm-red/5"
                  )}
                  onClick={() => toggle(item.id)}
                >
                  {item.checked ? (
                    <CheckSquare className="h-5 w-5 text-hm-green mt-0.5 shrink-0" />
                  ) : (
                    <Square className="h-5 w-5 text-hm-border mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1">
                    <span className={cn(
                      "text-sm font-sans",
                      item.checked ? "text-hm-green line-through opacity-70" : "text-hm-black"
                    )}>
                      {item.label}
                    </span>
                    {item.hasAnomaly && (
                      <div className="flex items-center gap-1 mt-1 text-hm-red text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        Anomaly noted
                      </div>
                    )}
                  </div>
                  {!readOnly && (
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        setExpandedNotes(expandedNotes === item.id ? null : item.id)
                      }}
                      className="shrink-0 text-hm-slate/40 hover:text-hm-slate"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {expandedNotes === item.id && (
                  <div className="ml-11 mb-2">
                    <textarea
                      placeholder="Add notes or anomaly description…"
                      rows={2}
                      className="w-full rounded-lg border border-hm-border bg-hm-ivory px-3 py-2 text-sm font-sans text-hm-slate placeholder:text-hm-slate/40 focus:outline-none focus:ring-1 focus:ring-hm-gold"
                      defaultValue={item.notes ?? ""}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
