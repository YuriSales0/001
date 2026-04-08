"use client"

import { useEffect, useState } from "react"
import { CheckSquare, Square, AlertTriangle, Camera, CalendarDays, Plus } from "lucide-react"

type VisitType = "PREVENTIVE" | "CORRECTIVE" | "COLLECTIVE"

interface ChecklistItem {
  id: string
  section: string
  label: string
  checked: boolean
  hasAnomaly: boolean
  notes: string
}

interface MaintenanceVisit {
  id: string
  propertyName: string
  ownerId: string
  type: VisitType
  scheduledDate: string
  technician: string
  status: "PENDING" | "IN_PROGRESS" | "COMPLETE"
  checklist: ChecklistItem[]
}

const CHECKLIST_ITEMS: Omit<ChecklistItem, "checked" | "hasAnomaly" | "notes">[] = [
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

function createDefaultChecklist(): ChecklistItem[] {
  return CHECKLIST_ITEMS.map(i => ({ ...i, checked: false, hasAnomaly: false, notes: "" }))
}

const TYPE_COLOR: Record<VisitType, string> = {
  PREVENTIVE: "bg-blue-100 text-blue-700",
  CORRECTIVE: "bg-red-100 text-red-700",
  COLLECTIVE: "bg-purple-100 text-purple-700",
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: "bg-gray-100 text-gray-600",
  IN_PROGRESS: "bg-amber-100 text-amber-700",
  COMPLETE: "bg-green-100 text-green-700",
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

export default function MaintenancePage() {
  const [visits, setVisits] = useState<MaintenanceVisit[]>([])
  const [selected, setSelected] = useState<MaintenanceVisit | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null)

  useEffect(() => {
    // Load sample data — in production this comes from /api/maintenance
    const demo: MaintenanceVisit[] = [
      {
        id: "1",
        propertyName: "Villa Andalucía",
        ownerId: "client1",
        type: "PREVENTIVE",
        scheduledDate: new Date().toISOString(),
        technician: "Carlos Martínez",
        status: "IN_PROGRESS",
        checklist: createDefaultChecklist(),
      },
      {
        id: "2",
        propertyName: "Apartamento Nerja",
        ownerId: "client2",
        type: "PREVENTIVE",
        scheduledDate: new Date(Date.now() + 86_400_000 * 3).toISOString(),
        technician: "Pedro García",
        status: "PENDING",
        checklist: createDefaultChecklist(),
      },
      {
        id: "3",
        propertyName: "Casa Motril",
        ownerId: "client3",
        type: "CORRECTIVE",
        scheduledDate: new Date(Date.now() - 86_400_000 * 1).toISOString(),
        technician: "Carlos Martínez",
        status: "COMPLETE",
        checklist: createDefaultChecklist().map(i => ({ ...i, checked: true })),
      },
    ]
    setVisits(demo)
    setSelected(demo[0])
    setLoading(false)
  }, [])

  const toggleItem = (itemId: string) => {
    if (!selected) return
    const updated = {
      ...selected,
      checklist: selected.checklist.map(i =>
        i.id === itemId ? { ...i, checked: !i.checked } : i
      ),
    }
    setSelected(updated)
    setVisits(prev => prev.map(v => v.id === updated.id ? updated : v))
  }

  const toggleAnomaly = (itemId: string) => {
    if (!selected) return
    const updated = {
      ...selected,
      checklist: selected.checklist.map(i =>
        i.id === itemId ? { ...i, hasAnomaly: !i.hasAnomaly } : i
      ),
    }
    setSelected(updated)
    setVisits(prev => prev.map(v => v.id === updated.id ? updated : v))
  }

  const sections = Array.from(new Set(CHECKLIST_ITEMS.map(i => i.section)))

  return (
    <div className="flex h-[calc(100vh-64px)]" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Sidebar */}
      <div className="w-72 border-r bg-white flex flex-col shrink-0">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-navy-900 text-sm">Maintenance</h2>
            <p className="text-xs text-gray-400 mt-0.5">{visits.length} visits</p>
          </div>
          <button className="rounded-lg bg-navy-900 text-white p-1.5 hover:bg-navy-800">
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y">
          {visits.map(visit => {
            const checked = visit.checklist.filter(i => i.checked).length
            const anomalies = visit.checklist.filter(i => i.hasAnomaly).length
            const isSelected = selected?.id === visit.id
            return (
              <button
                key={visit.id}
                onClick={() => setSelected(visit)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                  isSelected ? "bg-navy-50 border-l-2 border-l-navy-600" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900 truncate">
                    {visit.propertyName}
                  </span>
                  <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 shrink-0 ml-1 ${TYPE_COLOR[visit.type]}`}>
                    {visit.type.charAt(0)}
                  </span>
                </div>
                <div className="text-xs text-gray-400 mb-1.5">{fmtDate(visit.scheduledDate)}</div>
                <div className="flex items-center justify-between text-xs">
                  <span className={`rounded px-1.5 py-0.5 font-medium ${STATUS_COLOR[visit.status]}`}>
                    {visit.status.toLowerCase()}
                  </span>
                  <span className="text-gray-400">
                    {checked}/{visit.checklist.length}
                    {anomalies > 0 && (
                      <span className="ml-1 text-red-500">· {anomalies} ⚠</span>
                    )}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Checklist panel */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {selected ? (
          <div className="max-w-xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-navy-900">{selected.propertyName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${TYPE_COLOR[selected.type]}`}>
                    {selected.type}
                  </span>
                  <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${STATUS_COLOR[selected.status]}`}>
                    {selected.status}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-navy-900">
                  {selected.checklist.filter(i => i.checked).length}/{selected.checklist.length}
                </div>
                <div className="text-xs text-gray-400">items checked</div>
              </div>
            </div>

            {/* Info */}
            <div className="rounded-xl border bg-white p-4 mb-4 text-sm grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-400">Technician</div>
                <div className="font-semibold text-gray-900">{selected.technician}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400">Scheduled</div>
                <div className="font-semibold text-gray-900">{fmtDate(selected.scheduledDate)}</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-gray-200 mb-5">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{
                  width: `${(selected.checklist.filter(i => i.checked).length / selected.checklist.length) * 100}%`,
                }}
              />
            </div>

            {/* Sections */}
            {sections.map(section => {
              const items = selected.checklist.filter(i => i.section === section)
              return (
                <div key={section} className="mb-4">
                  <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-2 px-1">
                    {section}
                  </h3>
                  <div className="rounded-xl border bg-white overflow-hidden">
                    {items.map((item, idx) => (
                      <div key={item.id}>
                        <div
                          className={`flex items-start gap-3 px-4 py-3 ${
                            idx > 0 ? "border-t border-gray-100" : ""
                          } ${item.checked ? "bg-green-50/40" : ""} ${
                            item.hasAnomaly ? "bg-red-50/40" : ""
                          }`}
                        >
                          <button
                            onClick={() => toggleItem(item.id)}
                            className="mt-0.5 shrink-0"
                          >
                            {item.checked ? (
                              <CheckSquare className="h-5 w-5 text-green-600" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-300" />
                            )}
                          </button>
                          <div className="flex-1">
                            <span className={`text-sm ${
                              item.checked
                                ? "text-gray-400 line-through"
                                : "text-gray-800"
                            }`}>
                              {item.label}
                            </span>
                            {item.hasAnomaly && (
                              <div className="flex items-center gap-1 text-red-600 text-xs mt-0.5">
                                <AlertTriangle className="h-3 w-3" />
                                Anomaly flagged
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => toggleAnomaly(item.id)}
                              className={`p-1 rounded hover:bg-gray-100 transition-colors ${
                                item.hasAnomaly ? "text-red-500" : "text-gray-300 hover:text-red-400"
                              }`}
                              title="Flag anomaly"
                            >
                              <AlertTriangle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setExpandedNotes(expandedNotes === item.id ? null : item.id)}
                              className="p-1 rounded hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors"
                              title="Add note"
                            >
                              <Camera className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        {expandedNotes === item.id && (
                          <div className="px-4 pb-3 border-t border-gray-100 bg-gray-50">
                            <textarea
                              rows={2}
                              placeholder="Describe anomaly or add notes…"
                              className="w-full mt-2 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-navy-400"
                              defaultValue={item.notes}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button className="flex-1 rounded-xl border border-gray-300 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                Save progress
              </button>
              <button className="flex-1 rounded-xl bg-navy-900 text-white py-3 text-sm font-semibold hover:bg-navy-800 disabled:opacity-50">
                Submit report
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Select a visit to view its checklist
          </div>
        )}
      </div>
    </div>
  )
}
