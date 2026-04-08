"use client"

import { useEffect, useState } from "react"
import {
  Plus, CheckCircle2, Clock, AlertCircle, ArrowRight, X, MapPin, User, FileDown,
} from "lucide-react"

type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED"
type TaskType =
  | "CLEANING" | "MAINTENANCE_PREVENTIVE" | "MAINTENANCE_CORRECTIVE"
  | "INSPECTION" | "CHECK_IN" | "CHECK_OUT" | "TRANSFER" | "SHOPPING" | "LAUNDRY"

interface Task {
  id: string
  title: string
  description: string | null
  type: TaskType
  status: TaskStatus
  dueDate: string
  notes: string | null
  property: { id: string; name: string; address: string; city: string }
  assignee: { id: string; name: string | null; email: string } | null
}

interface Property {
  id: string
  name: string
  city: string
}

interface CrewMember {
  id: string
  name: string | null
  email: string
}

const TYPE_COLOR: Record<TaskType, string> = {
  CLEANING: "bg-sky-100 text-sky-800",
  MAINTENANCE_PREVENTIVE: "bg-emerald-100 text-emerald-800",
  MAINTENANCE_CORRECTIVE: "bg-red-100 text-red-800",
  INSPECTION: "bg-violet-100 text-violet-800",
  CHECK_IN: "bg-amber-100 text-amber-800",
  CHECK_OUT: "bg-orange-100 text-orange-800",
  TRANSFER: "bg-cyan-100 text-cyan-800",
  SHOPPING: "bg-pink-100 text-pink-800",
  LAUNDRY: "bg-indigo-100 text-indigo-800",
}

const TYPE_LABEL: Record<TaskType, string> = {
  CLEANING: "Cleaning",
  MAINTENANCE_PREVENTIVE: "Preventive",
  MAINTENANCE_CORRECTIVE: "Corrective",
  INSPECTION: "Inspection",
  CHECK_IN: "Check-in",
  CHECK_OUT: "Check-out",
  TRANSFER: "Transfer",
  SHOPPING: "Shopping",
  LAUNDRY: "Laundry",
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; icon: typeof Clock; color: string }> = {
  PENDING:     { label: "Pending",     icon: Clock,        color: "text-yellow-600" },
  IN_PROGRESS: { label: "In progress", icon: AlertCircle,  color: "text-blue-600" },
  COMPLETED:   { label: "Completed",   icon: CheckCircle2, color: "text-green-600" },
}

const fmtDateTime = (s: string) =>
  new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })

const downloadDoc = async () => {
  const { generateAutoTasksPDF } = await import("@/lib/docs/auto-tasks-pdf")
  generateAutoTasksPDF()
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [crew, setCrew] = useState<CrewMember[]>([])
  const [loading, setLoading] = useState(true)
  const [filterProperty, setFilterProperty] = useState("all")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [form, setForm] = useState({
    propertyId: "",
    type: "CLEANING" as TaskType,
    title: "",
    description: "",
    dueDate: "",
    assigneeId: "",
  })

  const load = async () => {
    setLoading(true)
    const [tRes, pRes, cRes] = await Promise.all([
      fetch("/api/tasks"),
      fetch("/api/properties"),
      fetch("/api/users?role=CREW"),
    ])
    if (tRes.ok) setTasks(await tRes.json())
    if (pRes.ok) setProperties(await pRes.json())
    if (cRes.ok) setCrew(await cRes.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = tasks.filter(t => {
    if (filterProperty !== "all" && t.property.id !== filterProperty) return false
    if (filterType !== "all" && t.type !== filterType) return false
    if (filterStatus !== "all" && t.status !== filterStatus) return false
    return true
  })

  const advance = async (task: Task) => {
    const next: TaskStatus = task.status === "PENDING" ? "IN_PROGRESS" : "COMPLETED"
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    })
    if (res.ok) {
      const updated: Task = await res.json()
      setTasks(prev => prev.map(t => (t.id === updated.id ? updated : t)))
    }
  }

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError("")
    if (!form.propertyId || !form.title || !form.dueDate) {
      setCreateError("Fill in property, title and due date.")
      return
    }
    setCreating(true)
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: form.propertyId,
        type: form.type,
        title: form.title,
        description: form.description || undefined,
        dueDate: new Date(form.dueDate).toISOString(),
        assigneeId: form.assigneeId || undefined,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setCreateError(err.error ?? "Failed to create task")
    } else {
      setShowCreate(false)
      setForm({ propertyId: "", type: "CLEANING", title: "", description: "", dueDate: "", assigneeId: "" })
      await load()
    }
    setCreating(false)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Tasks</h1>
          <p className="text-sm text-gray-500">
            Dispatch and track cleaning, maintenance and inspection visits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={downloadDoc}
            title="Download Auto-Task documentation (PDF)"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white text-gray-700 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
          >
            <FileDown className="h-4 w-4" /> Auto-task docs
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-navy-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-navy-800"
          >
            <Plus className="h-4 w-4" /> New task
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          value={filterProperty}
          onChange={e => setFilterProperty(e.target.value)}
          className="rounded-lg border bg-white px-3 py-2 text-sm"
        >
          <option value="all">All properties</option>
          {properties.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="rounded-lg border bg-white px-3 py-2 text-sm"
        >
          <option value="all">All types</option>
          {Object.entries(TYPE_LABEL).map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="rounded-lg border bg-white px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In progress</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <div className="space-y-3">
        {loading && <div className="py-8 text-center text-sm text-gray-400">Loading…</div>}
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400 rounded-xl border bg-white">
            No tasks match your filters.
          </div>
        )}
        {filtered.map(task => {
          const cfg = STATUS_CONFIG[task.status]
          const StatusIcon = cfg.icon
          const overdue = task.status !== "COMPLETED" && new Date(task.dueDate) < new Date()
          return (
            <div key={task.id} className="rounded-xl border bg-white p-4 hover:shadow-sm transition-shadow">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <StatusIcon className={`mt-0.5 h-5 w-5 shrink-0 ${cfg.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-navy-900">{task.title}</span>
                      <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${TYPE_COLOR[task.type]}`}>
                        {TYPE_LABEL[task.type]}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {task.property.name}
                      </span>
                      <span className={overdue ? "text-red-600 font-semibold" : ""}>
                        Due: {fmtDateTime(task.dueDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {task.assignee?.name ?? task.assignee?.email ?? "Unassigned"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs rounded-full border px-2 py-0.5 font-medium ${cfg.color} bg-white`}>
                    {cfg.label}
                  </span>
                  {task.status !== "COMPLETED" && (
                    <button
                      onClick={() => advance(task)}
                      className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
                    >
                      {task.status === "PENDING" ? "Start" : "Complete"}
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-base font-bold text-navy-900">New task</h2>
                <p className="text-xs text-gray-500 mt-0.5">Dispatch a visit to the field crew.</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="rounded-md p-1 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitCreate} className="p-5 space-y-4">
              {createError && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{createError}</div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Property *</label>
                <select
                  value={form.propertyId}
                  onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                >
                  <option value="">Select a property…</option>
                  {properties.map(p => (
                    <option key={p.id} value={p.id}>{p.name} · {p.city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Task type *</label>
                <select
                  value={form.type}
                  onChange={e => setForm(f => ({ ...f, type: e.target.value as TaskType }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                >
                  {Object.entries(TYPE_LABEL).map(([k, l]) => (
                    <option key={k} value={k}>{l}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                  placeholder="e.g. Pre-arrival inspection"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                  placeholder="Optional context for the crew"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Due date *</label>
                  <input
                    type="datetime-local"
                    value={form.dueDate}
                    onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Assign to</label>
                  <select
                    value={form.assigneeId}
                    onChange={e => setForm(f => ({ ...f, assigneeId: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                  >
                    <option value="">Auto-assign (least busy)</option>
                    {crew.map(c => (
                      <option key={c.id} value={c.id}>{c.name ?? c.email}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-navy-900 text-white px-4 py-2 text-sm font-semibold hover:bg-navy-800 disabled:opacity-50"
                >
                  {creating ? "Creating…" : "Dispatch task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
