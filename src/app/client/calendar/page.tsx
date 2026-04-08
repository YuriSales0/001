'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'

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

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('pt-PT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })

const dayKey = (d: Date) => d.toISOString().slice(0, 10)

export default function ClientCalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [propertyFilter, setPropertyFilter] = useState('ALL')
  const [selected, setSelected] = useState<Task | null>(null)

  const today = useMemo(() => new Date(), [])
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // 0-indexed

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

  // All days in current month
  const allDays = useMemo(() => {
    const days: Date[] = []
    const d = new Date(year, month, 1)
    while (d.getMonth() === month) {
      days.push(new Date(d))
      d.setDate(d.getDate() + 1)
    }
    return days
  }, [year, month])

  // Padding before first day (Mon=0)
  const firstDow = useMemo(() => {
    const d = (new Date(year, month, 1).getDay() + 6) % 7 // Mon-based
    return d
  }, [year, month])

  // Tasks grouped by day key, filtered by property
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

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Calendário</h1>
          <p className="text-sm text-gray-500">Todas as tarefas agendadas para as tuas propriedades</p>
        </div>
        {/* Property filter */}
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
            {/* Leading empty cells */}
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`pad-${i}`} className="min-h-[90px] border-b border-r bg-gray-50/50" />
            ))}

            {allDays.map(day => {
              const key = dayKey(day)
              const dayTasks = byDay[key] ?? []
              const isToday = key === dayKey(today)
              const isPast = day < today && !isToday

              return (
                <div
                  key={key}
                  className={`min-h-[90px] border-b border-r p-1.5 ${isPast && dayTasks.length === 0 ? 'bg-gray-50/40' : ''}`}
                >
                  <div className={`mb-1 flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold
                    ${isToday ? 'bg-navy-900 text-white' : isPast ? 'text-gray-300' : 'text-gray-700'}`}
                  >
                    {day.getDate()}
                  </div>
                  <div className="space-y-0.5">
                    {dayTasks.slice(0, 3).map(t => {
                      const isOverdue = t.status !== 'COMPLETED' && new Date(t.dueDate) < today
                      const colorClass = TYPE_COLORS[t.type] ?? 'bg-gray-100 text-gray-600 border-gray-200'
                      return (
                        <button
                          key={t.id}
                          onClick={() => setSelected(t)}
                          className={`w-full text-left rounded px-1.5 py-0.5 text-[10px] font-medium border truncate
                            ${t.status === 'COMPLETED' ? 'opacity-50 line-through' : ''}
                            ${isOverdue ? 'ring-1 ring-red-400' : ''}
                            ${colorClass}`}
                        >
                          {TYPE_LABELS[t.type] ?? t.type}
                        </button>
                      )
                    })}
                    {dayTasks.length > 3 && (
                      <span className="block text-[10px] text-gray-400 pl-1">+{dayTasks.length - 3} mais</span>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Trailing empty cells to complete last row */}
            {(() => {
              const totalCells = firstDow + allDays.length
              const remainder = totalCells % 7
              if (remainder === 0) return null
              return Array.from({ length: 7 - remainder }).map((_, i) => (
                <div key={`trail-${i}`} className="min-h-[90px] border-b border-r bg-gray-50/50" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b">
              <div>
                <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold mb-1 ${TYPE_COLORS[selected.type] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {TYPE_LABELS[selected.type] ?? selected.type}
                </span>
                <h2 className={`text-base font-bold text-navy-900 ${selected.status === 'COMPLETED' ? 'line-through text-gray-400' : ''}`}>
                  {selected.title}
                </h2>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-md p-1 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="h-4 w-4 shrink-0" />
                <span>{fmtDate(selected.dueDate)}</span>
              </div>
              <div className="text-gray-600">
                <span className="font-medium text-gray-700">Propriedade:</span> {selected.property.name}
              </div>
              {selected.assignee && (
                <div className="text-gray-600">
                  <span className="font-medium text-gray-700">Crew:</span> {selected.assignee.name ?? 'Não atribuído'}
                </div>
              )}
              {selected.description && (
                <div className="text-gray-600">
                  <span className="font-medium text-gray-700 block mb-0.5">Descrição:</span>
                  {selected.description}
                </div>
              )}
              {selected.notes && (
                <div className="text-gray-600">
                  <span className="font-medium text-gray-700 block mb-0.5">Notas:</span>
                  {selected.notes}
                </div>
              )}
              <div className="pt-1">
                {selected.status === 'COMPLETED' ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Concluída
                  </span>
                ) : new Date(selected.dueDate) < today ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-600 px-3 py-1 text-xs font-semibold">
                    <AlertCircle className="h-3.5 w-3.5" /> Em atraso
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-600 px-3 py-1 text-xs font-semibold">
                    <Clock className="h-3.5 w-3.5" /> Pendente
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
