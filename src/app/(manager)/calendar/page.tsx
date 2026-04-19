"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { useLocale } from "@/i18n/provider"
import {
  LogIn, LogOut, Wrench, Lock, Wallet,
  Plus, AlertCircle, CheckCircle2, X,
  ChevronLeft, ChevronRight,
} from "lucide-react"

// ── Types ────────────────────────────────────────────────────────────────────
type TaskMeta = {
  taskId: string; taskType: string; taskStatus: string
  isOverdue: boolean; assignee?: { id: string; name: string | null } | null
}
type CalEvent = {
  id: string
  type: 'CHECK_IN' | 'CHECK_OUT' | 'BLOCKED' | 'TASK' | 'PAYOUT' | 'BIRTHDAY'
  title: string; date: string; endDate?: string
  property?: { id: string; name: string }
  meta?: Record<string, unknown> & Partial<TaskMeta>
}
type Property = { id: string; name: string; owner?: { id: string; name: string | null; email: string } }

// ── Constants ─────────────────────────────────────────────────────────────────
const MANUAL_TASK_TYPES = [
  'MAINTENANCE_CORRECTIVE','MAINTENANCE_PREVENTIVE','CLEANING',
  'INSPECTION','TRANSFER','SHOPPING','LAUNDRY',
] as const

const TYPE_LABEL_KEYS: Record<string, string> = {
  MAINTENANCE_CORRECTIVE: 'taskTypes.MAINTENANCE_CORRECTIVE', MAINTENANCE_PREVENTIVE: 'taskTypes.MAINTENANCE_PREVENTIVE',
  CLEANING: 'taskTypes.CLEANING', INSPECTION: 'taskTypes.INSPECTION', TRANSFER: 'taskTypes.TRANSFER',
  SHOPPING: 'taskTypes.SHOPPING', LAUNDRY: 'taskTypes.LAUNDRY',
  CHECK_IN: 'taskTypes.CHECK_IN', CHECK_OUT: 'taskTypes.CHECK_OUT',
}
const ICONS: Record<CalEvent['type'], React.ElementType> = {
  CHECK_IN: LogIn, CHECK_OUT: LogOut, BLOCKED: Lock,
  TASK: Wrench, PAYOUT: Wallet, BIRTHDAY: () => <span>🎂</span>,
}
const COLORS: Record<CalEvent['type'], string> = {
  CHECK_IN:  'bg-green-100 text-green-700 border-green-200',
  CHECK_OUT: 'bg-orange-100 text-orange-700 border-orange-200',
  BLOCKED:   'bg-gray-100 text-gray-600 border-gray-200',
  TASK:      'bg-blue-100 text-blue-700 border-blue-200',
  PAYOUT:    'bg-purple-100 text-purple-700 border-purple-200',
  BIRTHDAY:  'bg-pink-100 text-pink-700 border-pink-200',
}
const TASK_COLORS: Record<string, string> = {
  MAINTENANCE_CORRECTIVE: 'border-red-200 bg-red-50 text-red-700',
  MAINTENANCE_PREVENTIVE: 'border-yellow-200 bg-yellow-50 text-yellow-700',
  CLEANING: 'border-blue-200 bg-blue-50 text-blue-700',
  INSPECTION: 'border-purple-200 bg-purple-50 text-purple-700',
  TRANSFER: 'border-sky-200 bg-sky-50 text-sky-700',
  SHOPPING: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  LAUNDRY: 'border-pink-200 bg-pink-50 text-pink-700',
}
const TYPES: CalEvent['type'][] = ['CHECK_IN','CHECK_OUT','BLOCKED','TASK','PAYOUT']
const WEEKDAY_KEYS = ['manager.calendar.mon','manager.calendar.tue','manager.calendar.wed','manager.calendar.thu','manager.calendar.fri','manager.calendar.sat','manager.calendar.sun']

// ── Helpers ───────────────────────────────────────────────────────────────────
const dayKey = (d: Date) => d.toISOString().slice(0,10)

function getWeekStart(ref: Date): Date {
  const d = new Date(ref)
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  d.setHours(0,0,0,0)
  return d
}
function getWeekDays(start: Date): Date[] {
  return Array.from({length:7}, (_,i) => {
    const d = new Date(start); d.setDate(start.getDate()+i); return d
  })
}

// ── Create Task Modal ─────────────────────────────────────────────────────────
function CreateTaskModal({
  date, properties, onClose, onCreated,
}: {
  date: string; properties: Property[]; onClose: ()=>void; onCreated: ()=>void
}) {
  const { t } = useLocale()
  const [type, setType] = useState<string>(MANUAL_TASK_TYPES[0])
  const [propertyId, setPropertyId] = useState(properties[0]?.id??'')
  const [propSearch, setPropSearch] = useState('')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const filteredProps = propSearch.trim()
    ? properties.filter(p => p.name.toLowerCase().includes(propSearch.toLowerCase()))
    : properties

  const submit = async () => {
    if (!title||!propertyId) return
    setSubmitting(true)
    await fetch('/api/tasks',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({propertyId,type,title,description:notes,dueDate:date})})
    setSubmitting(false)
    onCreated()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-base font-bold">{t('manager.calendar.newTask')}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{date}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-2 hover:bg-gray-100"><X className="h-4 w-4"/></button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('manager.calendar.property')}</label>
            <input
              value={propSearch}
              onChange={e=>setPropSearch(e.target.value)}
              placeholder={t('manager.calendar.searchProperty')}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold mb-2"
            />
            <select value={propertyId} onChange={e=>setPropertyId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold">
              {filteredProps.length===0
                ? <option value="">{t('manager.calendar.noResults')}</option>
                : filteredProps.map(p=>(
                    <option key={p.id} value={p.id}>
                      {p.name}{p.owner?.name ? ` · ${p.owner.name}` : p.owner?.email ? ` · ${p.owner.email}` : ''}
                    </option>
                  ))
              }
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('manager.calendar.taskType')}</label>
              <div className="space-y-1.5">
                {MANUAL_TASK_TYPES.map(tt=>{
                  const isActive = type===tt
                  const color = TASK_COLORS[tt]??'border-gray-200 bg-gray-50 text-gray-700'
                  return (
                    <button key={tt} onClick={()=>setType(tt)}
                      className={`w-full text-left rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                        isActive?color+' ring-1':'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'}`}>
                      {t(TYPE_LABEL_KEYS[tt])}
                    </button>
                  )
                })}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('manager.calendar.taskTitle')}</label>
                <input value={title} onChange={e=>setTitle(e.target.value)}
                  placeholder="Ex: Limpeza pré-chegada"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"/>
              </div>
              <div className="flex-1 flex flex-col">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{t('manager.calendar.crewNotes')}</label>
                <textarea value={notes} onChange={e=>setNotes(e.target.value)}
                  placeholder="Instruções, códigos de acesso…"
                  className="flex-1 min-h-[120px] w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-hm-gold"/>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="flex-1 rounded-lg border py-2.5 text-sm hover:bg-gray-50">{t('common.cancel')}</button>
          <button onClick={submit} disabled={submitting||!title||!propertyId}
            className="flex-1 rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting?t('manager.calendar.creating'):t('manager.calendar.createTask')}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Day Detail Panel ──────────────────────────────────────────────────────────
function DayPanel({
  day, events, onClose, onCreateTask, onCompleteTask, draggedId,
}: {
  day: Date; events: CalEvent[]; onClose: ()=>void
  onCreateTask: (date:string)=>void
  onCompleteTask: (e:CalEvent)=>void
  draggedId: React.MutableRefObject<string|null>
}) {
  const { t } = useLocale()
  const key = dayKey(day)
  const label = day.toLocaleDateString(undefined,{weekday:'long',day:'2-digit',month:'long',year:'numeric'})

  return (
    <div className="rounded-hm border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide capitalize">{label}</p>
          <p className="text-sm font-bold text-gray-900">{events.length} {t('manager.calendar.events')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>onCreateTask(key)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-800">
            <Plus className="h-3.5 w-3.5"/> {t('manager.calendar.createTask')}
          </button>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700">
            <X className="h-4 w-4"/>
          </button>
        </div>
      </div>
      {events.length===0 ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">{t('manager.calendar.noEvents')}</div>
      ) : (
        <div className="divide-y max-h-96 overflow-y-auto">
          {events.map(e=>{
            const Icon = ICONS[e.type]
            const meta = e.meta as TaskMeta|undefined
            const isTask = e.type==='TASK'
            const isCompleted = meta?.taskStatus==='COMPLETED'
            const isOverdue = meta?.isOverdue
            return (
              <div key={e.id}
                draggable={isTask&&!isCompleted}
                onDragStart={()=>{draggedId.current=e.id}}
                onDragEnd={()=>{draggedId.current=null}}
                className={`flex items-center gap-3 px-5 py-3 text-sm ${isTask&&!isCompleted?'cursor-grab active:cursor-grabbing':''}`}>
                <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${COLORS[e.type]} ${isOverdue?'ring-2 ring-red-500':''}`}>
                  <Icon className="h-4 w-4"/>
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-medium truncate ${isCompleted?'line-through text-gray-400':''}`}>{e.title}</span>
                    {isOverdue&&<span className="inline-flex items-center gap-0.5 rounded-full bg-red-100 text-red-600 px-2 py-0.5 text-xs font-semibold shrink-0"><AlertCircle className="h-3 w-3"/>{t('manager.calendar.overdue')}</span>}
                    {isCompleted&&<span className="inline-flex items-center gap-0.5 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs shrink-0"><CheckCircle2 className="h-3 w-3"/>{t('manager.calendar.done')}</span>}
                  </div>
                  {e.property&&<div className="text-xs text-gray-500">{e.property.name}</div>}
                  {meta?.assignee&&<div className="text-xs text-gray-400">{meta.assignee.name}</div>}
                </div>
                {isTask&&!isCompleted&&(
                  <button onClick={()=>onCompleteTask(e)}
                    className="shrink-0 rounded-md border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">✓</button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ManagerCalendar() {
  const { t } = useLocale()
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState(()=>getWeekStart(new Date()))
  const weekDays = useMemo(()=>getWeekDays(weekStart),[weekStart])

  const [filters, setFilters] = useState<Record<CalEvent['type'],boolean>>({
    CHECK_IN:true,CHECK_OUT:true,BLOCKED:true,TASK:true,PAYOUT:true,BIRTHDAY:false,
  })
  const [expandedDay, setExpandedDay] = useState<string|null>(null)
  const [createTaskDate, setCreateTaskDate] = useState<string|null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const draggedId = useRef<string|null>(null)

  const load = () => {
    const from = weekStart.toISOString()
    const to = new Date(weekStart.getTime()+7*24*60*60*1000).toISOString()
    setLoading(true)
    fetch(`/api/admin/calendar?from=${from}&to=${to}`)
      .then(r=>r.ok?r.json():[])
      .then(d=>{setEvents(d);setLoading(false)})
  }

  useEffect(()=>{load()},[weekStart])

  useEffect(()=>{
    fetch('/api/properties').then(r=>r.ok?r.json():[]).then(setProperties)
  },[])

  const completeTask = async (e:CalEvent) => {
    const meta = e.meta as TaskMeta
    await fetch(`/api/tasks/${meta.taskId}`,{method:'PATCH',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'COMPLETED'})})
    load()
  }

  const handleDrop = async (targetDay:string, e:React.DragEvent) => {
    e.preventDefault()
    const id = draggedId.current
    if (!id) return
    const ev = events.find(x=>x.id===id)
    if (!ev||ev.type!=='TASK') return
    const meta = ev.meta as TaskMeta
    if (meta.taskStatus==='COMPLETED') return
    await fetch(`/api/tasks/${meta.taskId}`,{method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({dueDate:targetDay+'T12:00:00.000Z'})})
    load()
  }

  const eventsByDay = useMemo(()=>{
    const filtered = events.filter(e=>filters[e.type])
    const map:Record<string,CalEvent[]> = {}
    for (const e of filtered) {
      const k = dayKey(new Date(e.date))
      ;(map[k]||=[]).push(e)
    }
    return map
  },[events,filters])

  const today = useMemo(()=>dayKey(new Date()),[])

  const weekLabel = (() => {
    const end = new Date(weekStart); end.setDate(weekStart.getDate()+6)
    const s = weekStart.toLocaleDateString('pt-PT',{day:'2-digit',month:'short'})
    const f = end.toLocaleDateString('pt-PT',{day:'2-digit',month:'short',year:'numeric'})
    return `${s} – ${f}`
  })()

  const toggleDay = (key:string) => setExpandedDay(d=>d===key?null:key)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('common.calendar')}</h1>
          <p className="text-sm text-gray-500">{t('manager.calendar.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setWeekStart(s=>{const d=new Date(s);d.setDate(d.getDate()-7);return d})}
            className="rounded-lg border p-2 hover:bg-gray-50"><ChevronLeft className="h-4 w-4"/></button>
          <span className="text-sm font-medium min-w-[200px] text-center">{weekLabel}</span>
          <button onClick={()=>setWeekStart(s=>{const d=new Date(s);d.setDate(d.getDate()+7);return d})}
            className="rounded-lg border p-2 hover:bg-gray-50"><ChevronRight className="h-4 w-4"/></button>
          <button onClick={()=>setWeekStart(getWeekStart(new Date()))}
            className="rounded-lg border px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">{t('manager.calendar.today')}</button>
        </div>
      </div>

      {/* Event type filters */}
      <div className="flex flex-wrap gap-2">
        {TYPES.map(t=>{
          const Icon = ICONS[t]
          return (
            <button key={t} onClick={()=>setFilters(f=>({...f,[t]:!f[t]}))}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                filters[t]?COLORS[t]:'bg-gray-50 text-gray-400 border-gray-200 line-through'}`}>
              <Icon className="h-3 w-3"/>{t.replace(/_/g,' ')}
            </button>
          )
        })}
      </div>

      {loading && <p className="text-sm text-gray-400">{t('common.loading')}</p>}

      {/* Week grid */}
      <div className="overflow-x-auto -mx-6 px-6">
        <div className="grid grid-cols-7 gap-3 min-w-[700px]">
          {weekDays.map((day,i) => {
            const key = dayKey(day)
            const items = eventsByDay[key]??[]
            const isToday = key===today
            const isExpanded = expandedDay===key
            const MAX = 3

            return (
              <div key={key} className="flex flex-col min-h-0">
                <button
                  onClick={()=>toggleDay(key)}
                  onDragOver={e=>e.preventDefault()}
                  onDrop={e=>handleDrop(key,e)}
                  className={`flex flex-col items-center rounded-xl border px-2 py-3 transition-all mb-2 ${
                    isExpanded?'bg-gray-900 text-white border-gray-900'
                    :isToday?'bg-blue-50 border-blue-200 text-blue-700'
                    :'bg-white border-gray-100 hover:border-gray-300 text-gray-700'}`}>
                  <span className="text-[10px] font-semibold uppercase tracking-wider">{t(WEEKDAY_KEYS[i])}</span>
                  <span className={`text-xl font-bold mt-0.5 ${isExpanded?'text-white':isToday?'text-blue-700':'text-gray-900'}`}>
                    {day.getDate()}
                  </span>
                  <span className={`text-[10px] mt-0.5 ${isExpanded?'text-white/60':isToday?'text-blue-500':'text-gray-400'}`}>
                    {day.toLocaleDateString('pt-PT',{month:'short'})}
                  </span>
                  {items.length>0&&(
                    <span className={`mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isExpanded?'bg-white/20 text-white':isToday?'bg-blue-200 text-blue-700':'bg-gray-100 text-gray-500'}`}>
                      {items.length}
                    </span>
                  )}
                </button>

                <div
                  className="flex-1 space-y-1 rounded-xl border bg-white p-2 min-h-[120px]"
                  onDragOver={e=>e.preventDefault()}
                  onDrop={e=>handleDrop(key,e)}>
                  {items.slice(0,MAX).map(e=>{
                    const Icon = ICONS[e.type]
                    const meta = e.meta as TaskMeta|undefined
                    const isCompleted = meta?.taskStatus==='COMPLETED'
                    const isOverdue = meta?.isOverdue
                    return (
                      <button key={e.id} onClick={()=>toggleDay(key)}
                        draggable={e.type==='TASK'&&!isCompleted}
                        onDragStart={ev=>{ev.stopPropagation();draggedId.current=e.id}}
                        onDragEnd={()=>{draggedId.current=null}}
                        className={`w-full flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium text-left transition-colors hover:opacity-80 ${
                          COLORS[e.type]} ${isCompleted?'opacity-40':''} ${isOverdue?'ring-1 ring-red-400':''}`}>
                        <Icon className="h-3 w-3 shrink-0"/>
                        <span className={`truncate ${isCompleted?'line-through':''}`}>{e.title}</span>
                      </button>
                    )
                  })}
                  {items.length>MAX&&(
                    <button onClick={()=>toggleDay(key)}
                      className="w-full rounded-lg px-2 py-1 text-[11px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 text-left">
                      +{items.length-MAX} {t('manager.calendar.more')}
                    </button>
                  )}
                  <button onClick={()=>setCreateTaskDate(key)}
                    className="w-full flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-gray-300 hover:text-gray-500 hover:bg-gray-50">
                    <Plus className="h-3 w-3"/><span>{t('manager.calendar.task')}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Expanded day panel */}
      {expandedDay&&(
        <DayPanel
          day={weekDays.find(d=>dayKey(d)===expandedDay)??new Date(expandedDay+'T00:00:00')}
          events={eventsByDay[expandedDay]??[]}
          onClose={()=>setExpandedDay(null)}
          onCreateTask={d=>{setCreateTaskDate(d)}}
          onCompleteTask={completeTask}
          draggedId={draggedId}
        />
      )}

      {createTaskDate&&(
        <CreateTaskModal
          date={createTaskDate}
          properties={properties}
          onClose={()=>setCreateTaskDate(null)}
          onCreated={()=>{setCreateTaskDate(null);load()}}
        />
      )}
    </div>
  )
}
