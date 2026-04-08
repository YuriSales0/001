"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Plus, X, CheckCircle2, AlertCircle, Clock } from "lucide-react"

/* ─── Types ─────────────────────────────────────────────────────────────── */
type TaskMeta = {
  taskId: string
  taskType: string
  taskStatus: string
  isOverdue: boolean
  assignee?: { id: string; name: string | null } | null
}

type CalEvent = {
  id: string
  type: 'CHECK_IN' | 'CHECK_OUT' | 'BLOCKED' | 'TASK' | 'PAYOUT' | 'BIRTHDAY'
  title: string
  date: string
  property?: { id: string; name: string }
  meta?: Record<string, unknown> & Partial<TaskMeta>
}

type Property = { id: string; name: string; owner: { id: string; name: string | null; email: string } }

/* ─── Constants ─────────────────────────────────────────────────────────── */
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const EVENT_COLORS: Record<string, string> = {
  CHECK_IN:  'bg-green-100 text-green-700 border-green-200',
  CHECK_OUT: 'bg-orange-100 text-orange-700 border-orange-200',
  BLOCKED:   'bg-gray-100 text-gray-600 border-gray-200',
  PAYOUT:    'bg-purple-100 text-purple-700 border-purple-200',
  BIRTHDAY:  'bg-pink-100 text-pink-700 border-pink-200',
}

const TASK_TYPE_COLORS: Record<string, string> = {
  CHECK_IN:               'bg-green-100 text-green-700 border-green-200',
  CHECK_OUT:              'bg-orange-100 text-orange-700 border-orange-200',
  CLEANING:               'bg-blue-100 text-blue-700 border-blue-200',
  MAINTENANCE_PREVENTIVE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  MAINTENANCE_CORRECTIVE: 'bg-red-100 text-red-700 border-red-200',
  INSPECTION:             'bg-purple-100 text-purple-700 border-purple-200',
  TRANSFER:               'bg-sky-100 text-sky-700 border-sky-200',
  SHOPPING:               'bg-emerald-100 text-emerald-700 border-emerald-200',
  LAUNDRY:                'bg-pink-100 text-pink-700 border-pink-200',
}

const TASK_TYPE_LABELS: Record<string, string> = {
  CHECK_IN:               'Check-in',
  CHECK_OUT:              'Check-out',
  CLEANING:               'Limpeza',
  MAINTENANCE_PREVENTIVE: 'Manutenção Prev.',
  MAINTENANCE_CORRECTIVE: 'Manutenção Cor.',
  INSPECTION:             'Inspecção',
  TRANSFER:               'Transfer',
  SHOPPING:               'Compras',
  LAUNDRY:                'Lavandaria',
}

const MANUAL_TASK_TYPES = [
  'MAINTENANCE_CORRECTIVE', 'MAINTENANCE_PREVENTIVE', 'CLEANING',
  'INSPECTION', 'TRANSFER', 'SHOPPING', 'LAUNDRY',
] as const

const TASK_CREATE_COLORS: Record<string, string> = {
  MAINTENANCE_CORRECTIVE: 'border-red-200 bg-red-50 text-red-700',
  MAINTENANCE_PREVENTIVE: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  CLEANING:               'border-blue-200 bg-blue-50 text-blue-700',
  INSPECTION:             'border-purple-200 bg-purple-50 text-purple-700',
  TRANSFER:               'border-sky-200 bg-sky-50 text-sky-700',
  SHOPPING:               'border-emerald-200 bg-emerald-50 text-emerald-700',
  LAUNDRY:                'border-pink-200 bg-pink-50 text-pink-700',
}

const EVENT_TYPE_LABELS: Record<string, string> = {
  CHECK_IN: 'Check-in', CHECK_OUT: 'Check-out', BLOCKED: 'Bloqueio',
  TASK: 'Tarefas', PAYOUT: 'Pagamentos', BIRTHDAY: 'Aniversários',
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10)

function pillColor(e: CalEvent): string {
  if (e.type === 'TASK') {
    const meta = e.meta as TaskMeta | undefined
    return TASK_TYPE_COLORS[meta?.taskType ?? ''] ?? 'bg-blue-100 text-blue-700 border-blue-200'
  }
  return EVENT_COLORS[e.type] ?? 'bg-gray-100 text-gray-600 border-gray-200'
}

function pillLabel(e: CalEvent): string {
  if (e.type === 'TASK') {
    const meta = e.meta as TaskMeta | undefined
    return TASK_TYPE_LABELS[meta?.taskType ?? ''] ?? 'Tarefa'
  }
  return EVENT_TYPE_LABELS[e.type] ?? e.type
}

/* ─── Create Task Modal ──────────────────────────────────────────────────── */
function CreateTaskModal({ date, properties, onClose, onCreated }: {
  date: string; properties: Property[]
  onClose: () => void; onCreated: () => void
}) {
  const owners = Array.from(new Map(properties.map(p => [p.owner.id, p.owner])).values())
  const [ownerId, setOwnerId]         = useState(owners[0]?.id ?? '')
  const [type, setType]               = useState<string>(MANUAL_TASK_TYPES[0])
  const [propertyId, setPropertyId]   = useState('')
  const [title, setTitle]             = useState('')
  const [notes, setNotes]             = useState('')
  const [submitting, setSubmitting]   = useState(false)

  const ownerProps = properties.filter(p => p.owner.id === ownerId)

  const handleOwnerChange = (id: string) => {
    setOwnerId(id)
    setPropertyId(properties.find(p => p.owner.id === id)?.id ?? '')
  }

  // init property
  if (!propertyId && ownerProps.length > 0) setPropertyId(ownerProps[0].id)

  const submit = async () => {
    const pid = propertyId || ownerProps[0]?.id
    if (!title || !pid) return
    setSubmitting(true)
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId: pid, type, title, description: notes, dueDate: date }),
    })
    setSubmitting(false)
    onCreated()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-base font-bold text-navy-900">Nova tarefa</h2>
            <p className="text-xs text-gray-500 mt-0.5">{new Date(date + 'T12:00:00').toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Proprietário</label>
              <select value={ownerId} onChange={e => handleOwnerChange(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900">
                {owners.map(o => <option key={o.id} value={o.id}>{o.name ?? o.email}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Propriedade</label>
              <select value={propertyId || ownerProps[0]?.id} onChange={e => setPropertyId(e.target.value)}
                disabled={ownerProps.length === 0}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900">
                {ownerProps.length === 0
                  ? <option>— sem propriedades —</option>
                  : ownerProps.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tipo de tarefa</label>
              <div className="space-y-1.5">
                {MANUAL_TASK_TYPES.map(t => {
                  const active = type === t
                  const color = TASK_CREATE_COLORS[t] ?? 'border-gray-200 bg-gray-50 text-gray-700'
                  return (
                    <button key={t} onClick={() => setType(t)}
                      className={`w-full text-left rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                        active ? color + ' ring-1' : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}>
                      {TASK_TYPE_LABELS[t]}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Título</label>
                <input value={title} onChange={e => setTitle(e.target.value)}
                  placeholder={type === 'MAINTENANCE_CORRECTIVE' ? 'Ex: Torneira a pingar' : type === 'CLEANING' ? 'Ex: Limpeza pós-checkout' : 'Descrição da tarefa'}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" />
              </div>
              <div className="flex-1 flex flex-col">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Notas para a crew</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Instruções, códigos de acesso, localização de chaves…"
                  className="flex-1 min-h-[120px] w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy-900" />
              </div>
              {type && (
                <div className={`rounded-lg border px-3 py-2 text-xs ${TASK_CREATE_COLORS[type] ?? 'border-gray-200 bg-gray-50 text-gray-700'}`}>
                  <span className="font-semibold">{TASK_TYPE_LABELS[type]}</span>
                  {type === 'MAINTENANCE_CORRECTIVE' && <span className="ml-1 opacity-75">— aprovação {'>'} €50</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="flex-1 rounded-lg border py-2.5 text-sm hover:bg-gray-50">Cancelar</button>
          <button onClick={submit} disabled={submitting || !title || ownerProps.length === 0}
            className="flex-1 rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50">
            {submitting ? 'A criar…' : 'Criar tarefa'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Checkout Report Modal ──────────────────────────────────────────────── */
function CheckoutModal({ taskId, taskTitle, onClose, onSubmit }: {
  taskId: string; taskTitle: string
  onClose: () => void
  onSubmit: (d: { condition: number; issues: string; damages: string; notes: string }) => void
}) {
  const [condition, setCondition] = useState(5)
  const [issues, setIssues]       = useState('')
  const [damages, setDamages]     = useState('')
  const [notes, setNotes]         = useState('')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-bold text-navy-900">Relatório de Check-out</h2>
            <p className="text-sm text-gray-500">{taskTitle}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Condição do imóvel</label>
            <div className="flex gap-2">
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => setCondition(n)}
                  className={`flex-1 rounded-lg py-2 text-sm font-semibold ${condition === n ? 'bg-navy-900 text-white' : 'border hover:bg-gray-50 text-gray-600'}`}>
                  {'★'.repeat(n)}
                </button>
              ))}
            </div>
          </div>
          {[['Problemas', issues, setIssues, 'Eventuais problemas…'], ['Danos', damages, setDamages, 'Danos ou itens danificados…'], ['Notas', notes, setNotes, 'Outras observações…']].map(([label, val, setter, ph]) => (
            <div key={label as string}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label as string}</label>
              <textarea rows={2} value={val as string} onChange={e => (setter as (v: string) => void)(e.target.value)}
                placeholder={ph as string} className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" />
            </div>
          ))}
        </div>
        <div className="flex gap-3 p-5 border-t">
          <button onClick={onClose} className="flex-1 rounded-lg border py-2 text-sm hover:bg-gray-50">Cancelar</button>
          <button onClick={() => onSubmit({ condition, issues, damages, notes })}
            className="flex-1 rounded-lg bg-navy-900 py-2 text-sm font-semibold text-white hover:bg-navy-800">
            Concluir check-out
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Event Detail Modal ─────────────────────────────────────────────────── */
function EventDetailModal({ event, onClose, onComplete, onCheckout }: {
  event: CalEvent; onClose: () => void
  onComplete: () => void
  onCheckout: () => void
}) {
  const meta = event.meta as TaskMeta | undefined
  const isTask = event.type === 'TASK'
  const isCompleted = meta?.taskStatus === 'COMPLETED'
  const isCheckout = meta?.taskType === 'CHECK_OUT'
  const color = pillColor(event)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b">
          <div>
            <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold mb-1 ${color}`}>
              {pillLabel(event)}
            </span>
            <h2 className={`text-base font-bold text-navy-900 ${isCompleted ? 'line-through text-gray-400' : ''}`}>{event.title}</h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4 shrink-0" />
            {new Date(event.date).toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
          {event.property && <div className="text-gray-600"><span className="font-medium">Propriedade:</span> {event.property.name}</div>}
          {meta?.assignee && <div className="text-gray-600"><span className="font-medium">Crew:</span> {meta.assignee.name ?? '—'}</div>}
          {meta?.isOverdue && !isCompleted && (
            <div className="flex items-center gap-1 text-red-600 text-xs font-semibold">
              <AlertCircle className="h-4 w-4" /> Tarefa em atraso
            </div>
          )}
          {isCompleted && (
            <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4" /> Concluída
            </div>
          )}
        </div>
        {isTask && !isCompleted && (
          <div className="p-5 border-t">
            <button
              onClick={isCheckout ? onCheckout : onComplete}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 text-white py-2.5 text-sm font-semibold hover:bg-green-700"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isCheckout ? 'Preencher relatório de check-out' : 'Marcar como Concluída'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Main Calendar ──────────────────────────────────────────────────────── */
export default function AdminCalendar() {
  const [events, setEvents]         = useState<CalEvent[]>([])
  const [loading, setLoading]       = useState(true)
  const [properties, setProperties] = useState<Property[]>([])
  const [propFilter, setPropFilter] = useState('ALL')
  const [typeFilters, setTypeFilters] = useState<Record<string, boolean>>({
    CHECK_IN: true, CHECK_OUT: true, BLOCKED: true, TASK: true, PAYOUT: true, BIRTHDAY: true,
  })
  const today = useMemo(() => new Date(), [])
  const [year, setYear]             = useState(today.getFullYear())
  const [month, setMonth]           = useState(today.getMonth())
  const [createTaskDate, setCreateTaskDate] = useState<string | null>(null)
  const [selectedEvent, setSelectedEvent]   = useState<CalEvent | null>(null)
  const [checkoutTask, setCheckoutTask]     = useState<{ id: string; title: string } | null>(null)
  const draggedId = useRef<string | null>(null)

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const load = () => {
    const from = new Date(year, month, 1)
    const to   = new Date(year, month + 1, 0)
    setLoading(true)
    fetch(`/api/admin/calendar?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setEvents(d); setLoading(false) })
  }

  useEffect(() => { load() }, [year, month])
  useEffect(() => {
    fetch('/api/properties').then(r => r.ok ? r.json() : []).then(setProperties)
  }, [])

  const allDays = useMemo(() => {
    const days: Date[] = []
    const d = new Date(year, month, 1)
    while (d.getMonth() === month) { days.push(new Date(d)); d.setDate(d.getDate() + 1) }
    return days
  }, [year, month])

  const firstDow = useMemo(() => (new Date(year, month, 1).getDay() + 6) % 7, [year, month])

  const byDay = useMemo(() => {
    const map: Record<string, CalEvent[]> = {}
    events
      .filter(e => typeFilters[e.type])
      .filter(e => propFilter === 'ALL' || e.property?.id === propFilter)
      .forEach(e => {
        const k = e.date.slice(0, 10)
        ;(map[k] ||= []).push(e)
      })
    return map
  }, [events, typeFilters, propFilter])

  const completeTask = async (e: CalEvent) => {
    const meta = e.meta as TaskMeta
    if (meta.taskType === 'CHECK_OUT') {
      setSelectedEvent(null)
      setCheckoutTask({ id: meta.taskId, title: e.title })
    } else {
      await fetch(`/api/tasks/${meta.taskId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })
      setSelectedEvent(null)
      load()
    }
  }

  const submitCheckout = async (data: { condition: number; issues: string; damages: string; notes: string }) => {
    if (!checkoutTask) return
    await fetch(`/api/tasks/${checkoutTask.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkoutCondition: data.condition, checkoutIssues: data.issues, checkoutDamages: data.damages, checkoutNotes: data.notes }),
    })
    setCheckoutTask(null)
    load()
  }

  const handleDrop = async (targetDay: string, ev: React.DragEvent) => {
    ev.preventDefault()
    const id = draggedId.current
    if (!id) return
    const event = events.find(e => e.id === id)
    if (!event || event.type !== 'TASK') return
    const meta = event.meta as TaskMeta
    if (meta.taskStatus === 'COMPLETED') return
    await fetch(`/api/tasks/${meta.taskId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dueDate: targetDay + 'T12:00:00.000Z' }),
    })
    load()
  }

  const monthLabel = new Date(year, month, 1).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Calendário</h1>
          <p className="text-sm text-gray-500">Check-ins, check-outs, tarefas e pagamentos.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={propFilter} onChange={e => setPropFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900">
            <option value="ALL">Todas as propriedades</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-2">
        <button onClick={prevMonth} className="rounded-lg border p-2 hover:bg-gray-50"><ChevronLeft className="h-4 w-4" /></button>
        <h2 className="text-base font-semibold text-navy-900 capitalize min-w-[180px] text-center">{monthLabel}</h2>
        <button onClick={nextMonth} className="rounded-lg border p-2 hover:bg-gray-50"><ChevronRight className="h-4 w-4" /></button>
        <button onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()) }}
          className="ml-1 rounded-lg border px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">Hoje</button>
      </div>

      {/* Event type filters */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(typeFilters).map(t => (
          <button key={t} onClick={() => setTypeFilters(f => ({ ...f, [t]: !f[t] }))}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              typeFilters[t]
                ? (EVENT_COLORS[t] ?? TASK_TYPE_COLORS[t] ?? 'bg-blue-100 text-blue-700 border-blue-200')
                : 'bg-gray-50 text-gray-400 border-gray-200 line-through'
            }`}>
            {EVENT_TYPE_LABELS[t] ?? t}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">A carregar…</p>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b">
            {WEEKDAYS.map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[100px] border-b border-r bg-gray-50/50" />
            ))}

            {allDays.map(day => {
              const key = dayKey(day)
              const items = byDay[key] ?? []
              const isToday = key === dayKey(today)
              const isPast  = day < today && !isToday

              return (
                <div key={key}
                  className={`min-h-[100px] border-b border-r p-1 ${isPast && items.length === 0 ? 'bg-gray-50/40' : ''}`}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => handleDrop(key, e)}
                >
                  {/* Day number + "+" button */}
                  <div className="flex items-center justify-between mb-1">
                    <div className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold ${
                      isToday ? 'bg-navy-900 text-white' : isPast ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {day.getDate()}
                    </div>
                    <button onClick={() => setCreateTaskDate(key)}
                      className={`rounded p-0.5 transition-colors ${isToday ? 'text-navy-400 hover:bg-navy-800 hover:text-white' : 'text-gray-300 hover:text-gray-600 hover:bg-gray-100'}`}
                      title="Criar tarefa">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Event pills */}
                  <div className="space-y-0.5">
                    {items.slice(0, 3).map(e => {
                      const meta = e.meta as TaskMeta | undefined
                      const isTask      = e.type === 'TASK'
                      const isCompleted = meta?.taskStatus === 'COMPLETED'
                      const isOverdue   = meta?.isOverdue && !isCompleted
                      const color = pillColor(e)

                      return (
                        <div
                          key={e.id}
                          draggable={isTask && !isCompleted}
                          onDragStart={() => { draggedId.current = e.id }}
                          onDragEnd={() => { draggedId.current = null }}
                          className={`flex items-center gap-0.5 rounded border text-[10px] font-medium overflow-hidden ${color} ${
                            isTask && !isCompleted ? 'cursor-grab' : ''
                          } ${isOverdue ? 'ring-1 ring-red-400' : ''} ${isCompleted ? 'opacity-40' : ''}`}
                        >
                          <button
                            onClick={() => setSelectedEvent(e)}
                            className="flex-1 text-left px-1.5 py-0.5 truncate"
                          >
                            {isCompleted && <span className="mr-0.5 line-through">{pillLabel(e)}</span>}
                            {!isCompleted && pillLabel(e)}
                          </button>
                          {/* Inline ✓ done button */}
                          {isTask && !isCompleted && (
                            <button
                              onClick={async ev => {
                                ev.stopPropagation()
                                if (meta?.taskType === 'CHECK_OUT') {
                                  setCheckoutTask({ id: meta.taskId, title: e.title })
                                } else {
                                  await fetch(`/api/tasks/${meta!.taskId}`, {
                                    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'COMPLETED' }),
                                  })
                                  load()
                                }
                              }}
                              className="shrink-0 px-1.5 py-0.5 hover:bg-black/10 border-l border-current/20"
                              title="Marcar como concluída"
                            >
                              ✓
                            </button>
                          )}
                        </div>
                      )
                    })}
                    {items.length > 3 && (
                      <span className="block text-[10px] text-gray-400 pl-1">+{items.length - 3} mais</span>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Trailing padding */}
            {(() => {
              const total = firstDow + allDays.length
              const rem = total % 7
              if (rem === 0) return null
              return Array.from({ length: 7 - rem }).map((_, i) => (
                <div key={`trail-${i}`} className="min-h-[100px] border-b border-r bg-gray-50/50" />
              ))
            })()}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(TASK_TYPE_COLORS).map(([type, cls]) => (
          <span key={type} className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${cls}`}>
            {TASK_TYPE_LABELS[type] ?? type}
          </span>
        ))}
      </div>

      {/* Modals */}
      {createTaskDate && (
        <CreateTaskModal date={createTaskDate} properties={properties}
          onClose={() => setCreateTaskDate(null)}
          onCreated={() => { setCreateTaskDate(null); load() }} />
      )}
      {selectedEvent && !checkoutTask && (
        <EventDetailModal event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onComplete={() => completeTask(selectedEvent)}
          onCheckout={() => completeTask(selectedEvent)} />
      )}
      {checkoutTask && (
        <CheckoutModal taskId={checkoutTask.id} taskTitle={checkoutTask.title}
          onClose={() => setCheckoutTask(null)}
          onSubmit={submitCheckout} />
      )}
    </div>
  )
}
