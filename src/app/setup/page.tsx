"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle, CheckCircle2, Clock, Circle, Settings, Plus, Trash2, X, Sparkles,
} from "lucide-react"
import { AiContextConfig } from "@/components/hm/ai-context-config"

type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETE" | "OVERDUE"

interface SetupStep {
  day: number
  title: string
  status: TaskStatus
}

interface PropertySetup {
  propertyId: string
  propertyName: string
  ownerName: string
  startDate: string
  steps: SetupStep[]
}

interface ChecklistItem {
  id: string
  category: string
  label: string
  isActive: boolean
  sortOrder: number
}

const STEP_TEMPLATES: Omit<SetupStep, "status">[] = [
  { day: 1,  title: "Welcome email sent to owner — Manager" },
  { day: 2,  title: "Onboarding call scheduled — Manager" },
  { day: 5,  title: "Field inspection (photos, inventory, breaker, water, quirks) — Captain" },
  { day: 6,  title: "Condition report sent to owner — Captain" },
  { day: 7,  title: "Nuki smart lock installed & tested — Captain" },
  { day: 8,  title: "Airbnb + Booking.com + VRBO profiles created — Admin" },
  { day: 9,  title: "PriceLabs activated — minimum prices set — Admin" },
  { day: 10, title: "Owner approves listing — Manager ↔ Owner" },
  { day: 11, title: "AI Assistant context populated (coverage ≥ 80%) — Manager" },
  { day: 12, title: "Published on all channels — Admin" },
  { day: 13, title: "Cleaning team briefed — Captain" },
  { day: 14, title: "Setup complete — owner & manager notified" },
]

const CATEGORY_LABELS: Record<string, string> = {
  exterior: 'Exterior',
  interior: 'Interior',
}

const statusConfig: Record<TaskStatus, { icon: typeof CheckCircle2; color: string; bg: string; label: string }> = {
  PENDING:     { icon: Circle,        color: "text-gray-400",  bg: "bg-gray-50",   label: "Pending" },
  IN_PROGRESS: { icon: Clock,         color: "text-blue-600",  bg: "bg-blue-50",   label: "In progress" },
  COMPLETE:    { icon: CheckCircle2,  color: "text-green-600", bg: "bg-green-50",  label: "Complete" },
  OVERDUE:     { icon: AlertTriangle, color: "text-red-600",   bg: "bg-red-50",    label: "Overdue" },
}

function computeStepStatuses(startDate: string): SetupStep[] {
  const start = new Date(startDate)
  const today = new Date()
  return STEP_TEMPLATES.map(step => {
    const dueDate = new Date(start)
    dueDate.setDate(dueDate.getDate() + step.day - 1)
    let status: TaskStatus = "PENDING"
    if (dueDate < today) status = "OVERDUE"
    else if (Math.abs(dueDate.getTime() - today.getTime()) < 86_400_000 * 2) status = "IN_PROGRESS"
    return { ...step, status }
  })
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

// ── Checklist Config Panel ────────────────────────────────────────────────────
function ChecklistConfig({ propertyId }: { propertyId: string }) {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [newLabel, setNewLabel] = useState('')
  const [newCategory, setNewCategory] = useState('exterior')
  const [adding, setAdding] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch(`/api/properties/${propertyId}/checklist`)
    if (res.ok) setItems(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [propertyId])

  const addItem = async () => {
    if (!newLabel.trim()) return
    setAdding(true)
    await fetch(`/api/properties/${propertyId}/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label: newLabel.trim(), category: newCategory }),
    })
    setNewLabel('')
    setAdding(false)
    load()
  }

  const deleteItem = async (itemId: string) => {
    await fetch(`/api/properties/${propertyId}/checklist/${itemId}`, { method: 'DELETE' })
    load()
  }

  const toggleActive = async (item: ChecklistItem) => {
    await fetch(`/api/properties/${propertyId}/checklist/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !item.isActive }),
    })
    load()
  }

  const seedDefaults = async () => {
    if (!confirm('Reset to default items? Current items will be deleted.')) return
    setSeeding(true)
    await fetch(`/api/properties/${propertyId}/checklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seed: true }),
    })
    setSeeding(false)
    load()
  }

  const grouped: Record<string, ChecklistItem[]> = {}
  for (const item of items) {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push(item)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Define o que é verificado em cada visita preventiva. Esta lista será usada para gerar o relatório.
        </p>
        <button
          onClick={seedDefaults}
          disabled={seeding}
          className="shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          {seeding ? 'A repor…' : 'Usar padrões'}
        </button>
      </div>

      {loading ? (
        <div className="text-sm text-gray-400 py-4 text-center">A carregar…</div>
      ) : items.length === 0 ? (
        <div className="rounded-hm border-2 border-dashed border-gray-200 py-8 text-center">
          <p className="text-sm text-gray-400 mb-3">Nenhum item configurado.</p>
          <button
            onClick={seedDefaults}
            className="rounded-lg bg-hm-black px-4 py-2 text-sm font-semibold text-white hover:bg-hm-black/90"
          >
            Usar itens padrão
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {(['exterior', 'interior'] as const).map(cat => {
            const catItems = grouped[cat] ?? []
            if (catItems.length === 0) return null
            return (
              <div key={cat}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                  {CATEGORY_LABELS[cat]}
                </p>
                <div className="rounded-hm border bg-white divide-y">
                  {catItems.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                      <button
                        onClick={() => toggleActive(item)}
                        className={`shrink-0 h-4 w-4 rounded border-2 transition-colors ${
                          item.isActive
                            ? 'bg-hm-black border-navy-900'
                            : 'border-gray-300 bg-white'
                        }`}
                        title={item.isActive ? 'Desactivar' : 'Activar'}
                      />
                      <span className={`flex-1 text-sm ${item.isActive ? 'text-gray-800' : 'text-gray-400 line-through'}`}>
                        {item.label}
                      </span>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="shrink-0 p-2 text-gray-300 hover:text-red-500 transition-colors rounded"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
          {/* Other categories */}
          {Object.keys(grouped)
            .filter(k => k !== 'exterior' && k !== 'interior')
            .map(cat => (
              <div key={cat}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">{cat}</p>
                <div className="rounded-hm border bg-white divide-y">
                  {grouped[cat].map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="flex-1 text-sm text-gray-800">{item.label}</span>
                      <button onClick={() => deleteItem(item.id)} className="p-2 text-gray-300 hover:text-red-500 rounded">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Add item form */}
      <div className="rounded-hm border bg-gray-50 p-3">
        <p className="text-xs font-semibold text-gray-500 mb-2">Adicionar item</p>
        <div className="flex gap-2">
          <select
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            className="rounded-lg border px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold bg-white"
          >
            <option value="exterior">Exterior</option>
            <option value="interior">Interior</option>
          </select>
          <input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            placeholder="Ex: Porta da garagem"
            className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold bg-white"
          />
          <button
            onClick={addItem}
            disabled={adding || !newLabel.trim()}
            className="rounded-lg bg-hm-black px-3 py-2 text-white hover:bg-hm-black/90 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SetupPage() {
  const [setups, setSetups] = useState<PropertySetup[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSetup, setSelectedSetup] = useState<PropertySetup | null>(null)
  const [activeTab, setActiveTab] = useState<'timeline' | 'config' | 'ai'>('timeline')

  useEffect(() => {
    fetch("/api/properties")
      .then(r => r.ok ? r.json() : [])
      .then(props => {
        const onboarding: PropertySetup[] = props
          .filter((p: any) => ['PENDING_APPROVAL', 'PENDING_CLIENT', 'ONBOARDING', 'ACTIVE'].includes(p.status))
          .map((p: any) => ({
            propertyId: p.id,
            propertyName: p.name,
            ownerName: p.owner?.name ?? "Owner",
            startDate: p.createdAt,
            steps: computeStepStatuses(p.createdAt),
          }))

        if (onboarding.length === 0) {
          const sampleStart = new Date()
          sampleStart.setDate(sampleStart.getDate() - 3)
          onboarding.push({
            propertyId: "demo",
            propertyName: "Villa Andalucía (demo)",
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
    const cycle: TaskStatus[] = ["PENDING", "IN_PROGRESS", "COMPLETE", "OVERDUE"]
    const updater = (s: PropertySetup) => {
      if (s.propertyId !== setupId) return s
      return {
        ...s,
        steps: s.steps.map(step => {
          if (step.day !== stepDay) return step
          const next = cycle[(cycle.indexOf(step.status) + 1) % cycle.length]
          return { ...step, status: next }
        }),
      }
    }
    setSetups(prev => prev.map(updater))
    setSelectedSetup(prev => prev ? updater(prev) : prev)
  }

  if (loading) return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-8 w-48 rounded bg-gray-100" />
      <div className="h-64 rounded-hm bg-gray-100" />
    </div>
  )

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <div className="w-72 border-r bg-white flex flex-col shrink-0">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="font-bold text-hm-black text-sm">Properties</h2>
          <p className="text-xs text-gray-400 mt-0.5">{setups.length} configuradas</p>
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
                onClick={() => { setSelectedSetup(setup); setActiveTab('timeline') }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${isSelected ? "bg-navy-50 border-l-2 border-l-navy-600" : ""}`}
              >
                <div className="font-semibold text-sm text-gray-900">{setup.propertyName}</div>
                <div className="text-xs text-gray-400">{setup.ownerName}</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-200">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#B08A3E' }} />
                  </div>
                  <span className="text-xs text-gray-500">{pct}%</span>
                  {overdue > 0 && <span className="text-xs text-red-600 font-semibold">{overdue} late</span>}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto p-6">
        {selectedSetup ? (
          <div className="max-w-2xl">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h1 className="text-xl font-bold text-hm-black">{selectedSetup.propertyName}</h1>
                <p className="text-sm text-gray-500">
                  Owner: {selectedSetup.ownerName} · Since {fmtDate(selectedSetup.startDate)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-hm-black">
                  {Math.round((selectedSetup.steps.filter(s => s.status === "COMPLETE").length / selectedSetup.steps.length) * 100)}%
                </div>
                <div className="text-xs text-gray-400">setup completo</div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 border-b">
              <button
                onClick={() => setActiveTab('timeline')}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === 'timeline'
                    ? 'border-navy-900 text-hm-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setActiveTab('config')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === 'config'
                    ? 'border-navy-900 text-hm-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Settings className="h-3.5 w-3.5" />
                Checklist da casa
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === 'ai'
                    ? 'border-navy-900 text-hm-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI Assistant context
              </button>
            </div>

            {activeTab === 'timeline' ? (
              <>
                <div className="h-2 rounded-full bg-gray-200 mb-5">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.round((selectedSetup.steps.filter(s => s.status === "COMPLETE").length / selectedSetup.steps.length) * 100)}%`,
                      background: '#B08A3E',
                    }}
                  />
                </div>
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
                        className={`rounded-hm border p-4 transition-colors ${cfg.bg} ${
                          step.status === "OVERDUE" ? "border-red-200" :
                          step.status === "COMPLETE" ? "border-green-200" :
                          step.status === "IN_PROGRESS" ? "border-blue-200" : "border-gray-200"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button onClick={() => toggleStatus(step.day, selectedSetup.propertyId)} className="mt-0.5">
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
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : activeTab === 'config' ? (
              <ChecklistConfig
                propertyId={selectedSetup.propertyId}
              />
            ) : (
              <AiContextConfig propertyId={selectedSetup.propertyId} />
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            Selecciona uma propriedade
          </div>
        )}
      </div>
    </div>
  )
}
