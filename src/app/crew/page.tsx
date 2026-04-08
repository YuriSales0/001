'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, X, CheckCircle2, AlertCircle, Clock, ClipboardCheck } from 'lucide-react'

type Task = {
  id: string
  type: string
  title: string
  status: string
  dueDate: string
  description: string | null
  notes: string | null
  property: { id: string; name: string }
  assignee: { id: string; name: string | null } | null
}

type Property = { id: string; name: string }

/* ─── Constants ─────────────────────────────────────────────────────────── */
const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const TYPE_COLORS: Record<string, string> = {
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

const TYPE_LABELS: Record<string, string> = {
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

const dayKey = (d: Date) => d.toISOString().slice(0, 10)

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

/* ─── Checkout Modal ─────────────────────────────────────────────────────── */
function CheckoutModal({ task, onClose, onDone }: { task: Task; onClose: () => void; onDone: () => void }) {
  const [condition, setCondition] = useState('GOOD')
  const [issues, setIssues] = useState('')
  const [damages, setDamages] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ checkoutCondition: condition, checkoutIssues: issues, checkoutDamages: damages, checkoutNotes: notes }),
    })
    setLoading(false)
    onDone()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-base font-bold text-navy-900">Relatório de Check-out</h2>
            <p className="text-xs text-gray-500 mt-0.5">{task.property.name}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Estado geral</label>
            <div className="flex gap-2">
              {[['GOOD', 'Bom'], ['FAIR', 'Razoável'], ['BAD', 'Mau']].map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setCondition(val)}
                  className={`flex-1 rounded-lg border py-2 text-sm font-semibold transition-colors
                    ${condition === val
                      ? val === 'GOOD' ? 'bg-green-600 border-green-600 text-white'
                        : val === 'FAIR' ? 'bg-yellow-500 border-yellow-500 text-white'
                        : 'bg-red-600 border-red-600 text-white'
                      : 'hover:bg-gray-50 text-gray-700'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Problemas encontrados</label>
            <textarea
              value={issues} onChange={e => setIssues(e.target.value)}
              rows={2} placeholder="Descreve problemas…"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Danos</label>
            <textarea
              value={damages} onChange={e => setDamages(e.target.value)}
              rows={2} placeholder="Descreve danos…"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Notas adicionais</label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              rows={2} placeholder="Notas…"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancelar</button>
            <button
              onClick={submit} disabled={loading}
              className="rounded-lg bg-green-600 text-white px-4 py-2 text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="h-4 w-4" />
              {loading ? 'A submeter…' : 'Concluir Check-out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Task Detail Modal ──────────────────────────────────────────────────── */
function TaskDetailModal({ task, today, onClose, onMarkDone, onCheckout }: {
  task: Task
  today: Date
  onClose: () => void
  onMarkDone: (id: string) => void
  onCheckout: (task: Task) => void
}) {
  const [loading, setLoading] = useState(false)
  const isCompleted = task.status === 'COMPLETED'
  const isOverdue = !isCompleted && new Date(task.dueDate) < today
  const isCheckout = task.type === 'CHECK_OUT'

  const markDone = async () => {
    setLoading(true)
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED' }),
    })
    setLoading(false)
    onMarkDone(task.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b">
          <div>
            <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold mb-1 ${TYPE_COLORS[task.type] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
              {TYPE_LABELS[task.type] ?? task.type}
            </span>
            <h2 className={`text-base font-bold text-navy-900 ${isCompleted ? 'line-through text-gray-400' : ''}`}>
              {task.title}
            </h2>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4 shrink-0" />
            <span>{fmtDate(task.dueDate)}</span>
          </div>
          <div className="text-gray-600">
            <span className="font-medium text-gray-700">Propriedade:</span> {task.property.name}
          </div>
          {task.description && (
            <div className="text-gray-600">
              <span className="font-medium text-gray-700 block mb-0.5">Descrição:</span>
              {task.description}
            </div>
          )}
          {task.notes && !task.notes.startsWith('{') && (
            <div className="text-gray-600">
              <span className="font-medium text-gray-700 block mb-0.5">Notas:</span>
              {task.notes}
            </div>
          )}

          <div className="pt-1">
            {isCompleted ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" /> Concluída
              </span>
            ) : isOverdue ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-600 px-3 py-1 text-xs font-semibold">
                <AlertCircle className="h-3.5 w-3.5" /> Em atraso
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-600 px-3 py-1 text-xs font-semibold">
                <Clock className="h-3.5 w-3.5" /> Pendente
              </span>
            )}
          </div>

          {!isCompleted && (
            <div className="pt-2">
              {isCheckout ? (
                <button
                  onClick={() => { onClose(); onCheckout(task) }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-orange-600 text-white px-4 py-3 text-sm font-bold hover:bg-orange-700"
                >
                  <ClipboardCheck className="h-5 w-5" />
                  Preencher Relatório de Check-out
                </button>
              ) : (
                <button
                  onClick={markDone}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 text-white px-4 py-3 text-sm font-bold hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  {loading ? 'A marcar…' : 'Marcar como Concluída'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function CrewCalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [propertyFilter, setPropertyFilter] = useState('ALL')
  const [selected, setSelected] = useState<Task | null>(null)
  const [checkoutTask, setCheckoutTask] = useState<Task | null>(null)
  const [completing, setCompleting] = useState<string | null>(null)

  const today = useMemo(() => new Date(), [])
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const loadTasks = () =>
    fetch('/api/tasks').then(r => r.ok ? r.json() : []).then((d: Task[]) => setTasks(d))

  useEffect(() => {
    Promise.all([
      fetch('/api/tasks').then(r => r.ok ? r.json() : []),
      fetch('/api/properties').then(r => r.ok ? r.json() : []),
    ]).then(([t, p]) => {
      setTasks(t)
      setProperties(p)
      setLoading(false)
    })
  }, [])

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  const allDays = useMemo(() => {
    const days: Date[] = []
    const d = new Date(year, month, 1)
    while (d.getMonth() === month) { days.push(new Date(d)); d.setDate(d.getDate() + 1) }
    return days
  }, [year, month])

  const firstDow = useMemo(() => (new Date(year, month, 1).getDay() + 6) % 7, [year, month])

  const byDay = useMemo(() => {
    const map: Record<string, Task[]> = {}
    tasks
      .filter(t => propertyFilter === 'ALL' || t.property.id === propertyFilter)
      .forEach(t => {
        const k = t.dueDate.slice(0, 10)
        if (!map[k]) map[k] = []
        map[k].push(t)
      })
    return map
  }, [tasks, propertyFilter])

  const monthLabel = new Date(year, month, 1).toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })

  const quickDone = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation()
    if (task.type === 'CHECK_OUT') { setCheckoutTask(task); return }
    setCompleting(task.id)
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED' }),
    })
    await loadTasks()
    setCompleting(null)
  }

  const handleMarkDone = async (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'COMPLETED' } : t))
  }

  const todayKey = dayKey(today)

  // Count of pending tasks this month
  const pendingThisMonth = tasks.filter(t =>
    t.status !== 'COMPLETED' &&
    t.dueDate.slice(0, 7) === `${year}-${String(month + 1).padStart(2, '0')}`
  ).length

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">As Minhas Tarefas</h1>
          <p className="text-sm text-gray-500">
            {pendingThisMonth > 0
              ? `${pendingThisMonth} tarefa${pendingThisMonth !== 1 ? 's' : ''} pendente${pendingThisMonth !== 1 ? 's' : ''} este mês`
              : 'Sem tarefas pendentes este mês'}
          </p>
        </div>
        <select
          value={propertyFilter}
          onChange={e => setPropertyFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
        >
          <option value="ALL">Todas as propriedades</option>
          {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Month navigation */}
      <div className="flex items-center gap-3">
        <button onClick={prevMonth} className="rounded-lg border p-2 hover:bg-gray-50">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-base font-semibold text-navy-900 capitalize min-w-[180px] text-center">{monthLabel}</h2>
        <button onClick={nextMonth} className="rounded-lg border p-2 hover:bg-gray-50">
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          onClick={() => { setMonth(today.getMonth()); setYear(today.getFullYear()) }}
          className="ml-2 rounded-lg border px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"
        >
          Hoje
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">A carregar…</p>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b">
            {WEEKDAYS.map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7">
            {/* Leading padding */}
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[100px] border-b border-r bg-gray-50/50" />
            ))}

            {allDays.map(day => {
              const key = dayKey(day)
              const dayTasks = byDay[key] ?? []
              const isToday = key === todayKey
              const isPast = day < today && !isToday

              return (
                <div
                  key={key}
                  className={`min-h-[100px] border-b border-r p-1.5 ${isPast && dayTasks.length === 0 ? 'bg-gray-50/40' : ''}`}
                >
                  <div className={`mb-1 flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold
                    ${isToday ? 'bg-navy-900 text-white' : isPast ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map(t => {
                      const isOverdue = t.status !== 'COMPLETED' && new Date(t.dueDate) < today
                      const isDone = t.status === 'COMPLETED'
                      const isLoading = completing === t.id
                      const colorClass = TYPE_COLORS[t.type] ?? 'bg-gray-100 text-gray-600 border-gray-200'
                      return (
                        <div
                          key={t.id}
                          onClick={() => setSelected(t)}
                          className={`w-full rounded border text-[10px] font-medium cursor-pointer
                            ${isDone ? 'opacity-40' : ''}
                            ${isOverdue ? 'ring-1 ring-red-400' : ''}
                            ${colorClass}`}
                        >
                          <div className="flex items-center gap-0.5 px-1 py-0.5">
                            <span className={`flex-1 truncate ${isDone ? 'line-through' : ''}`}>
                              {TYPE_LABELS[t.type] ?? t.type}
                            </span>
                            {/* Quick done button — always visible for crew */}
                            {!isDone && (
                              <button
                                onClick={e => quickDone(t, e)}
                                disabled={isLoading}
                                title="Marcar como concluída"
                                className="ml-0.5 shrink-0 flex items-center justify-center h-4 w-4 rounded bg-white/60 hover:bg-white/90 text-current disabled:opacity-50"
                              >
                                {isLoading ? (
                                  <span className="text-[8px] animate-pulse">…</span>
                                ) : (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {dayTasks.length > 3 && (
                      <span className="block text-[10px] text-gray-400 pl-1">+{dayTasks.length - 3} mais</span>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Trailing padding */}
            {(() => {
              const totalCells = firstDow + allDays.length
              const remainder = totalCells % 7
              if (remainder === 0) return null
              return Array.from({ length: 7 - remainder }).map((_, i) => (
                <div key={`trail-${i}`} className="min-h-[100px] border-b border-r bg-gray-50/50" />
              ))
            })()}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(TYPE_LABELS).map(([type, label]) => (
          <span key={type} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {label}
          </span>
        ))}
      </div>

      {/* Task detail modal */}
      {selected && (
        <TaskDetailModal
          task={selected}
          today={today}
          onClose={() => setSelected(null)}
          onMarkDone={handleMarkDone}
          onCheckout={task => { setSelected(null); setCheckoutTask(task) }}
        />
      )}

      {/* Checkout report modal */}
      {checkoutTask && (
        <CheckoutModal
          task={checkoutTask}
          onClose={() => setCheckoutTask(null)}
          onDone={() => { loadTasks(); setCheckoutTask(null) }}
        />
      )}
    </div>
  )
}
