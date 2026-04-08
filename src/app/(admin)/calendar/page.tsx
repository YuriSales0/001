"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { CalendarDays, LogIn, LogOut, Wrench, Lock, Wallet, Cake, Plus, AlertCircle, CheckCircle2, Info, X } from "lucide-react"

type TaskMeta = {
  taskId: string
  taskType: string
  taskStatus: string
  isOverdue: boolean
  assignee?: { id: string; name: string | null } | null
}

type Event = {
  id: string
  type: 'CHECK_IN' | 'CHECK_OUT' | 'BLOCKED' | 'TASK' | 'PAYOUT' | 'BIRTHDAY'
  title: string
  date: string
  endDate?: string
  property?: { id: string; name: string }
  meta?: Record<string, unknown> & Partial<TaskMeta>
}

type Property = { id: string; name: string }

const MANUAL_TASK_TYPES = [
  'CLEANING',
  'MAINTENANCE_CORRECTIVE',
  'MAINTENANCE_PREVENTIVE',
  'INSPECTION',
] as const

const ICONS: Record<Event['type'], React.ElementType> = {
  CHECK_IN: LogIn,
  CHECK_OUT: LogOut,
  BLOCKED: Lock,
  TASK: Wrench,
  PAYOUT: Wallet,
  BIRTHDAY: Cake,
}

const COLORS: Record<Event['type'], string> = {
  CHECK_IN:  'bg-green-100 text-green-700',
  CHECK_OUT: 'bg-orange-100 text-orange-700',
  BLOCKED:   'bg-gray-200 text-gray-700',
  TASK:      'bg-blue-100 text-blue-700',
  PAYOUT:    'bg-purple-100 text-purple-700',
  BIRTHDAY:  'bg-pink-100 text-pink-700',
}

const TYPES: Event['type'][] = ['CHECK_IN', 'CHECK_OUT', 'BLOCKED', 'TASK', 'PAYOUT', 'BIRTHDAY']

const dayKey = (d: Date) => d.toISOString().slice(0, 10)
const fmtDay = (k: string) => new Date(k + 'T00:00:00').toLocaleDateString('en-GB', {
  weekday: 'short', day: '2-digit', month: 'short',
})

// ── Checkout Report Modal ────────────────────────────────────────────────────
function CheckoutReportModal({
  taskId,
  taskTitle,
  onClose,
  onSubmit,
}: {
  taskId: string
  taskTitle: string
  onClose: () => void
  onSubmit: (data: { condition: number; issues: string; damages: string; notes: string }) => void
}) {
  const [condition, setCondition] = useState(5)
  const [issues, setIssues] = useState('')
  const [damages, setDamages] = useState('')
  const [notes, setNotes] = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-bold text-navy-900">Relatório de Check-out</h2>
            <p className="text-sm text-gray-500">{taskTitle}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Condição do imóvel
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  onClick={() => setCondition(n)}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-colors ${
                    condition === n
                      ? 'bg-navy-900 text-white'
                      : 'border hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  {['★', '★★', '★★★', '★★★★', '★★★★★'][n - 1]}
                </button>
              ))}
            </div>
          </div>

          {/* Issues */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Problemas encontrados
            </label>
            <textarea
              rows={2}
              value={issues}
              onChange={e => setIssues(e.target.value)}
              placeholder="Descreve eventuais problemas…"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </div>

          {/* Damages */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Danos
            </label>
            <textarea
              rows={2}
              value={damages}
              onChange={e => setDamages(e.target.value)}
              placeholder="Danos ou itens danificados…"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notas gerais
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Outras observações…"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border py-2 text-sm font-medium hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSubmit({ condition, issues, damages, notes })}
            className="flex-1 rounded-lg bg-navy-900 py-2 text-sm font-semibold text-white hover:bg-navy-800"
          >
            Concluir check-out
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Create Task Modal ────────────────────────────────────────────────────────
function CreateTaskModal({
  date,
  properties,
  onClose,
  onCreated,
}: {
  date: string
  properties: Property[]
  onClose: () => void
  onCreated: () => void
}) {
  const [type, setType] = useState<string>(MANUAL_TASK_TYPES[0])
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!title || !propertyId) return
    setSubmitting(true)
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId, type, title, dueDate: date }),
    })
    setSubmitting(false)
    onCreated()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-base font-bold text-navy-900">Nova tarefa — {date}</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
            >
              {MANUAL_TASK_TYPES.map(t => (
                <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Propriedade</label>
            <select
              value={propertyId}
              onChange={e => setPropertyId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
            >
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Título</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Descrição da tarefa…"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 border-t">
          <button onClick={onClose} className="flex-1 rounded-lg border py-2 text-sm hover:bg-gray-50">
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={submitting || !title || !propertyId}
            className="flex-1 rounded-lg bg-navy-900 py-2 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
          >
            {submitting ? 'A criar…' : 'Criar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Calendar ────────────────────────────────────────────────────────────
export default function AdminCalendar() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Record<Event['type'], boolean>>({
    CHECK_IN: true, CHECK_OUT: true, BLOCKED: true, TASK: true, PAYOUT: true, BIRTHDAY: true,
  })
  const [monthOffset, setMonthOffset] = useState(0)
  const [properties, setProperties] = useState<Property[]>([])
  const [createTaskDate, setCreateTaskDate] = useState<string | null>(null)
  const [checkoutTask, setCheckoutTask] = useState<{ id: string; title: string } | null>(null)
  const draggedId = useRef<string | null>(null)

  const load = () => {
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
    const to = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0)
    setLoading(true)
    fetch(`/api/admin/calendar?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setEvents(d); setLoading(false) })
  }

  useEffect(() => { load() }, [monthOffset])

  useEffect(() => {
    fetch('/api/properties').then(r => r.ok ? r.json() : []).then(setProperties)
  }, [])

  const completeTask = async (event: Event) => {
    const meta = event.meta as TaskMeta
    if (meta.taskType === 'CHECK_OUT') {
      setCheckoutTask({ id: meta.taskId, title: event.title })
    } else {
      await fetch(`/api/tasks/${meta.taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })
      load()
    }
  }

  const submitCheckoutReport = async (data: {
    condition: number; issues: string; damages: string; notes: string
  }) => {
    if (!checkoutTask) return
    await fetch(`/api/tasks/${checkoutTask.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        checkoutCondition: data.condition,
        checkoutIssues: data.issues,
        checkoutDamages: data.damages,
        checkoutNotes: data.notes,
      }),
    })
    setCheckoutTask(null)
    load()
  }

  // Drag & drop — only changes dueDate, not status
  const handleDrop = async (targetDay: string, e: React.DragEvent) => {
    e.preventDefault()
    const id = draggedId.current
    if (!id) return
    const event = events.find(ev => ev.id === id)
    if (!event || event.type !== 'TASK') return
    const meta = event.meta as TaskMeta
    if (meta.taskStatus === 'COMPLETED') return
    await fetch(`/api/tasks/${meta.taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dueDate: targetDay + 'T12:00:00.000Z' }),
    })
    load()
  }

  const grouped = useMemo(() => {
    const filtered = events.filter(e => filters[e.type])
    const map: Record<string, Event[]> = {}
    for (const e of filtered) {
      const k = dayKey(new Date(e.date))
      ;(map[k] ||= []).push(e)
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
  }, [events, filters])

  const monthLabel = new Date(new Date().getFullYear(), new Date().getMonth() + monthOffset, 1)
    .toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy-900">Calendário</h1>
          <p className="text-sm text-gray-600">Check-ins, check-outs, bloqueios, tarefas e pagamentos.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonthOffset(o => o - 1)} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">‹</button>
          <span className="text-sm font-medium text-navy-900 min-w-[140px] text-center">{monthLabel}</span>
          <button onClick={() => setMonthOffset(o => o + 1)} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">›</button>
          <button onClick={() => setMonthOffset(0)} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">Hoje</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {TYPES.map(t => {
          const Icon = ICONS[t]
          return (
            <button
              key={t}
              onClick={() => setFilters(f => ({ ...f, [t]: !f[t] }))}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${
                filters[t] ? COLORS[t] : 'bg-gray-50 text-gray-400 line-through'
              }`}
            >
              <Icon className="h-3 w-3" />
              {t.replace(/_/g, ' ')}
            </button>
          )
        })}
      </div>

      {loading && <p className="text-gray-500 text-sm">A carregar…</p>}
      {!loading && grouped.length === 0 && (
        <div className="rounded-xl border bg-white p-12 text-center text-gray-500">
          <CalendarDays className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          Sem eventos este mês
        </div>
      )}

      <div className="space-y-4">
        {grouped.map(([day, items]) => (
          <div
            key={day}
            className="rounded-xl border bg-white overflow-hidden"
            onDragOver={e => e.preventDefault()}
            onDrop={e => handleDrop(day, e)}
          >
            {/* Day header with + button */}
            <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
              <span className="text-xs uppercase font-semibold text-gray-600">{fmtDay(day)}</span>
              <button
                onClick={() => setCreateTaskDate(day)}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                title="Criar tarefa neste dia"
              >
                <Plus className="h-3.5 w-3.5" />
                Tarefa
              </button>
            </div>

            <div className="divide-y">
              {items.map(e => {
                const Icon = ICONS[e.type]
                const meta = e.meta as TaskMeta | undefined
                const isOverdue = meta?.isOverdue
                const isTask = e.type === 'TASK'
                const isCompleted = meta?.taskStatus === 'COMPLETED'

                return (
                  <div
                    key={e.id}
                    draggable={isTask && !isCompleted}
                    onDragStart={() => { draggedId.current = e.id }}
                    onDragEnd={() => { draggedId.current = null }}
                    className={`px-4 py-3 flex items-center gap-3 text-sm ${
                      isTask && !isCompleted ? 'cursor-grab active:cursor-grabbing' : ''
                    }`}
                  >
                    {/* Icon with overdue ring */}
                    <span
                      className={`inline-flex items-center justify-center h-7 w-7 rounded-full shrink-0 ${
                        isOverdue
                          ? 'ring-2 ring-red-500 ' + COLORS[e.type]
                          : COLORS[e.type]
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`font-medium text-navy-900 truncate ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                          {e.title}
                        </span>
                        {isOverdue && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 text-red-600 px-2 py-0.5 text-xs font-semibold shrink-0">
                            <AlertCircle className="h-3 w-3" />
                            Atrasada
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs shrink-0">
                            <CheckCircle2 className="h-3 w-3" />
                            Concluída
                          </span>
                        )}
                      </div>
                      {e.property && (
                        <div className="text-xs text-gray-500 truncate">{e.property.name}</div>
                      )}
                      {meta?.assignee && (
                        <div className="text-xs text-gray-400">{meta.assignee.name}</div>
                      )}
                    </div>

                    {/* Complete button for tasks */}
                    {isTask && !isCompleted && (
                      <button
                        onClick={() => completeTask(e)}
                        className="shrink-0 rounded-md border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Days with no events yet — show "+" button for all days in month */}
        {!loading && (
          <div className="text-center">
            <button
              onClick={() => {
                const now = new Date()
                const today = new Date(now.getFullYear(), now.getMonth() + monthOffset, now.getDate())
                setCreateTaskDate(dayKey(today))
              }}
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              <Plus className="h-4 w-4" />
              Criar tarefa neste mês
            </button>
          </div>
        )}
      </div>

      {/* Create Task Modal */}
      {createTaskDate && (
        <CreateTaskModal
          date={createTaskDate}
          properties={properties}
          onClose={() => setCreateTaskDate(null)}
          onCreated={() => { setCreateTaskDate(null); load() }}
        />
      )}

      {/* Checkout Report Modal */}
      {checkoutTask && (
        <CheckoutReportModal
          taskId={checkoutTask.id}
          taskTitle={checkoutTask.title}
          onClose={() => setCheckoutTask(null)}
          onSubmit={submitCheckoutReport}
        />
      )}
    </div>
  )
}
