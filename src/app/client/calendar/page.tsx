'use client'

import { useEffect, useMemo, useState } from 'react'
import { useLocale } from '@/i18n/provider'
import { ChevronLeft, ChevronRight, Plus, X, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'

type Task = {
  id: string; type: string; title: string; status: string
  dueDate: string; description: string | null; notes: string | null
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
const TYPE_LABEL_KEYS: Record<string, string> = {
  CHECK_IN: 'taskTypes.CHECK_IN', CHECK_OUT: 'taskTypes.CHECK_OUT', CLEANING: 'taskTypes.CLEANING',
  MAINTENANCE_PREVENTIVE: 'taskTypes.MAINTENANCE_PREVENTIVE', MAINTENANCE_CORRECTIVE: 'taskTypes.MAINTENANCE_CORRECTIVE',
  INSPECTION: 'taskTypes.INSPECTION', TRANSFER: 'taskTypes.TRANSFER', SHOPPING: 'taskTypes.SHOPPING', LAUNDRY: 'taskTypes.LAUNDRY',
}
const WEEKDAY_KEYS = ['manager.calendar.mon','manager.calendar.tue','manager.calendar.wed','manager.calendar.thu','manager.calendar.fri','manager.calendar.sat','manager.calendar.sun']

const dayKey = (d: Date) => d.toISOString().slice(0,10)

function getWeekStart(ref: Date): Date {
  const d = new Date(ref)
  const dow = (d.getDay()+6)%7
  d.setDate(d.getDate()-dow)
  d.setHours(0,0,0,0)
  return d
}
function getWeekDays(start: Date): Date[] {
  return Array.from({length:7},(_,i)=>{
    const d = new Date(start); d.setDate(start.getDate()+i); return d
  })
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('pt-PT',{weekday:'long',day:'2-digit',month:'long',year:'numeric'})

// ── Day Panel ─────────────────────────────────────────────────────────────────
function DayPanel({
  day, tasks, onClose, onSelect,
}: {
  day: Date; tasks: Task[]; onClose: ()=>void; onSelect: (t:Task)=>void
}) {
  const { t: tr } = useLocale()
  const today = new Date()
  const label = day.toLocaleDateString(undefined,{weekday:'long',day:'2-digit',month:'long',year:'numeric'})
  return (
    <div className="rounded-hm border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide capitalize">{label}</p>
          <p className="text-sm font-bold text-gray-900">{tasks.length} {tr('common.tasks').toLowerCase()}</p>
        </div>
        <button onClick={onClose} aria-label="Close" className="rounded-md p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700">
          <X className="h-4 w-4"/>
        </button>
      </div>
      {tasks.length===0 ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">{tr('client.calendar.noTasks')}</div>
      ) : (
        <div className="divide-y max-h-80 overflow-y-auto">
          {tasks.map(t=>{
            const isOverdue = t.status!=='COMPLETED'&&new Date(t.dueDate)<today
            const colorClass = TYPE_COLORS[t.type]??'bg-gray-100 text-gray-600 border-gray-200'
            return (
              <button key={t.id} onClick={()=>onSelect(t)}
                className="w-full flex items-center gap-3 px-5 py-3 text-sm text-left hover:bg-gray-50">
                <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${colorClass}`}>
                  {(tr(TYPE_LABEL_KEYS[t.type]??t.type)).slice(0,2).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${t.status==='COMPLETED'?'line-through text-gray-400':''}`}>{t.title}</p>
                  <p className="text-xs text-gray-500">{t.property.name}</p>
                </div>
                {isOverdue&&<AlertCircle className="h-4 w-4 shrink-0 text-red-500"/>}
                {t.status==='COMPLETED'&&<CheckCircle2 className="h-4 w-4 shrink-0 text-green-500"/>}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Task Detail Modal ─────────────────────────────────────────────────────────
function TaskModal({ task, onClose }: { task: Task; onClose: ()=>void }) {
  const { t: tr } = useLocale()
  const today = new Date()
  const isOverdue = task.status!=='COMPLETED'&&new Date(task.dueDate)<today
  const colorClass = TYPE_COLORS[task.type]??'bg-gray-100 text-gray-600 border-gray-200'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={e=>e.stopPropagation()}>
        <div className="flex items-start justify-between p-5 border-b">
          <div>
            <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold mb-1 ${colorClass}`}>
              {tr(TYPE_LABEL_KEYS[task.type]??task.type)}
            </span>
            <h2 className={`text-base font-bold text-gray-900 ${task.status==='COMPLETED'?'line-through text-gray-400':''}`}>
              {task.title}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-2 hover:bg-gray-100"><X className="h-5 w-5"/></button>
        </div>
        <div className="p-5 space-y-3 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4 shrink-0"/>
            <span>{fmtDate(task.dueDate)}</span>
          </div>
          <div className="text-gray-600"><span className="font-medium text-gray-700">{tr('client.calendar.property')}:</span> {task.property.name}</div>
          {task.assignee&&<div className="text-gray-600"><span className="font-medium text-gray-700">Crew:</span> {task.assignee.name??tr('client.calendar.unassigned')}</div>}
          {task.description&&(
            <div className="text-gray-600">
              <span className="font-medium text-gray-700 block mb-0.5">{tr('common.description')}:</span>
              {task.description}
            </div>
          )}
          <div className="pt-1">
            {task.status==='COMPLETED'?(
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-3 py-1 text-xs font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5"/>{tr('client.calendar.completed')}
              </span>
            ):isOverdue?(
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-600 px-3 py-1 text-xs font-semibold">
                <AlertCircle className="h-3.5 w-3.5"/>{tr('client.calendar.overdue')}
              </span>
            ):(
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-600 px-3 py-1 text-xs font-semibold">
                <Clock className="h-3.5 w-3.5"/>{tr('client.calendar.pending')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ClientCalendarPage() {
  const { t: tr } = useLocale()
  const [tasks, setTasks] = useState<Task[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [propertyFilter, setPropertyFilter] = useState('ALL')
  const [selected, setSelected] = useState<Task|null>(null)

  const today = useMemo(()=>new Date(),[])
  const [weekStart, setWeekStart] = useState(()=>getWeekStart(new Date()))
  const weekDays = useMemo(()=>getWeekDays(weekStart),[weekStart])
  const [expandedDay, setExpandedDay] = useState<string|null>(null)

  useEffect(()=>{
    Promise.all([
      fetch('/api/tasks').then(r=>r.ok?r.json():[]),
      fetch('/api/properties').then(r=>r.ok?r.json():[]),
    ]).then(([t,p])=>{setTasks(t);setProperties(p);setLoading(false)})
  },[])

  const prevWeek = () => setWeekStart(s=>{const d=new Date(s);d.setDate(d.getDate()-7);return d})
  const nextWeek = () => setWeekStart(s=>{const d=new Date(s);d.setDate(d.getDate()+7);return d})

  const byDay = useMemo(()=>{
    const map:Record<string,Task[]> = {}
    tasks
      .filter(t=>propertyFilter==='ALL'||t.property.id===propertyFilter)
      .forEach(t=>{
        const k = t.dueDate.slice(0,10)
        if (!map[k]) map[k]=[]
        map[k].push(t)
      })
    return map
  },[tasks,propertyFilter])

  const todayKey = dayKey(today)
  const weekLabel = (() => {
    const end = new Date(weekStart); end.setDate(weekStart.getDate()+6)
    const s = weekStart.toLocaleDateString('pt-PT',{day:'2-digit',month:'short'})
    const f = end.toLocaleDateString('pt-PT',{day:'2-digit',month:'short',year:'numeric'})
    return `${s} – ${f}`
  })()

  const toggleDay = (key:string) => setExpandedDay(d=>d===key?null:key)
  const MAX = 3

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{tr('common.calendar')}</h1>
          <p className="text-sm text-gray-500">{tr('client.calendar.subtitle')}</p>
        </div>
        <select value={propertyFilter} onChange={e=>setPropertyFilter(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold">
          <option value="ALL">{tr('client.calendar.allProperties')}</option>
          {properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Week navigation */}
      <div className="flex items-center gap-2">
        <button onClick={prevWeek} aria-label="Previous" className="rounded-lg border p-2 hover:bg-gray-50"><ChevronLeft className="h-4 w-4"/></button>
        <span className="text-sm font-medium min-w-[200px] text-center">{weekLabel}</span>
        <button onClick={nextWeek} aria-label="Next" className="rounded-lg border p-2 hover:bg-gray-50"><ChevronRight className="h-4 w-4"/></button>
        <button onClick={()=>setWeekStart(getWeekStart(new Date()))}
          className="ml-2 rounded-lg border px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">{tr('manager.calendar.today')}</button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400">{tr('common.loading')}</p>
      ) : (
        <>
          {/* Week grid */}
          <div className="overflow-x-auto -mx-6 px-6">
            <div className="grid grid-cols-7 gap-3 min-w-[700px]">
              {weekDays.map((day,i) => {
                const key = dayKey(day)
                const items = byDay[key]??[]
                const isToday = key===todayKey
                const isExpanded = expandedDay===key

                return (
                  <div key={key} className="flex flex-col">
                    {/* Day header */}
                    <button onClick={()=>toggleDay(key)}
                      className={`flex flex-col items-center rounded-xl border px-2 py-3 transition-all mb-2 ${
                        isExpanded?'bg-gray-900 text-white border-gray-900'
                        :isToday?'bg-blue-50 border-blue-200'
                        :'bg-white border-gray-100 hover:border-gray-300'}`}>
                      <span className={`text-[10px] font-semibold uppercase tracking-wider ${isExpanded?'text-white/60':isToday?'text-blue-500':'text-gray-500'}`}>
                        {tr(WEEKDAY_KEYS[i])}
                      </span>
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

                    {/* Event pills */}
                    <div className="flex-1 space-y-1 rounded-xl border bg-white p-2 min-h-[100px]">
                      {items.slice(0,MAX).map(t=>{
                        const isOverdue = t.status!=='COMPLETED'&&new Date(t.dueDate)<today
                        const colorClass = TYPE_COLORS[t.type]??'bg-gray-100 text-gray-600 border-gray-200'
                        return (
                          <button key={t.id} onClick={()=>{setSelected(t)}}
                            className={`w-full flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium text-left hover:opacity-80 ${colorClass} ${
                              t.status==='COMPLETED'?'opacity-40':''} ${isOverdue?'ring-1 ring-red-400':''}`}>
                            <span className="truncate">{tr(TYPE_LABEL_KEYS[t.type]??t.type)}</span>
                          </button>
                        )
                      })}
                      {items.length>MAX&&(
                        <button onClick={()=>toggleDay(key)}
                          className="w-full rounded-lg px-2 py-1 text-[11px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 text-left">
                          +{items.length-MAX} {tr('manager.calendar.more')}
                        </button>
                      )}
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
              tasks={byDay[expandedDay]??[]}
              onClose={()=>setExpandedDay(null)}
              onSelect={t=>{setSelected(t)}}
            />
          )}
        </>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(TYPE_LABEL_KEYS).map(([type,key])=>(
          <span key={type} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${TYPE_COLORS[type]??'bg-gray-100 text-gray-600 border-gray-200'}`}>
            {tr(key)}
          </span>
        ))}
      </div>

      {selected&&<TaskModal task={selected} onClose={()=>setSelected(null)}/>}
    </div>
  )
}
