'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, X, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useLocale } from '@/i18n/provider'

type CalEvent = {
  id: string; type: string; title: string; date: string
  property?: { id: string; name: string }
  meta?: {
    taskId?: string; taskType?: string; taskStatus?: string
    isOverdue?: boolean; assignee?: { id: string; name: string | null } | null
  }
}

const COLORS: Record<string, string> = {
  CHECK_IN:               'bg-green-100 text-green-700 border-green-200',
  CHECK_OUT:              'bg-orange-100 text-orange-700 border-orange-200',
  CLEANING:               'bg-blue-100 text-blue-700 border-blue-200',
  MAINTENANCE_PREVENTIVE: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  MAINTENANCE_CORRECTIVE: 'bg-red-100 text-red-700 border-red-200',
  INSPECTION:             'bg-purple-100 text-purple-700 border-purple-200',
  TRANSFER:               'bg-sky-100 text-sky-700 border-sky-200',
  SHOPPING:               'bg-emerald-100 text-emerald-700 border-emerald-200',
  LAUNDRY:                'bg-pink-100 text-pink-700 border-pink-200',
  TASK:                   'bg-blue-100 text-blue-700 border-blue-200',
  BLOCKED:                'bg-gray-100 text-gray-600 border-gray-200',
  PAYOUT:                 'bg-purple-100 text-purple-700 border-purple-200',
  BIRTHDAY:               'bg-pink-100 text-pink-700 border-pink-200',
}
function getWeekdayShort(loc: string): string[] {
  const base = new Date(2024, 0, 1) // Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base)
    d.setDate(d.getDate() + i)
    return d.toLocaleDateString(loc, { weekday: 'short' })
  })
}

const LOCALE_MAP: Record<string, string> = {
  en: 'en-GB', pt: 'pt-PT', es: 'es-ES', de: 'de-DE',
  nl: 'nl-NL', fr: 'fr-FR', sv: 'sv-SE', da: 'da-DK',
}

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

function DayPanel({
  day, events, onClose, onComplete, dateLoc, t,
}: {
  day: Date; events: CalEvent[]
  onClose: ()=>void; onComplete: (e:CalEvent)=>void
  dateLoc: string; t: (k: string) => string
}) {
  const label = day.toLocaleDateString(dateLoc,{weekday:'long',day:'2-digit',month:'long',year:'numeric'})
  return (
    <div className="rounded-hm border bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50">
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide capitalize">{label}</p>
          <p className="text-sm font-bold text-gray-900">{events.length} {t('common.tasks').toLowerCase()}</p>
        </div>
        <button onClick={onClose} aria-label="Close" className="rounded-md p-2 text-gray-400 hover:bg-gray-200 hover:text-gray-700">
          <X className="h-4 w-4"/>
        </button>
      </div>
      {events.length===0 ? (
        <div className="px-5 py-8 text-center text-sm text-gray-400">{t('crew.calendar.noTasksThisDay')}</div>
      ) : (
        <div className="divide-y max-h-80 overflow-y-auto">
          {events.map(e=>{
            const meta = e.meta
            const isCompleted = meta?.taskStatus==='COMPLETED'
            const isOverdue = meta?.isOverdue
            const taskType = meta?.taskType??e.type
            const colorClass = COLORS[taskType]??COLORS[e.type]??'bg-gray-100 text-gray-600 border-gray-200'
            return (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${colorClass}`}>
                  {(t(`crew.taskTypes.${taskType}`) || taskType).slice(0,2).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${isCompleted?'line-through text-gray-400':''}`}>{e.title}</p>
                  {e.property&&<p className="text-xs text-gray-500">{e.property.name}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isOverdue&&<AlertCircle className="h-4 w-4 text-red-500"/>}
                  {isCompleted?(
                    <CheckCircle2 className="h-4 w-4 text-green-500"/>
                  ):meta?.taskId&&(
                    <button onClick={()=>onComplete(e)}
                      className="rounded-md border px-2 py-1 text-xs text-gray-600 hover:bg-gray-50">
                      ✓ {t('crew.calendar.complete')}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function CrewCalendarPage() {
  const { t, locale } = useLocale()
  const dateLoc = LOCALE_MAP[locale] ?? 'en-GB'
  const [events, setEvents] = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [weekStart, setWeekStart] = useState(()=>getWeekStart(new Date()))
  const weekDays = useMemo(()=>getWeekDays(weekStart),[weekStart])
  const [expandedDay, setExpandedDay] = useState<string|null>(null)
  const todayKey = useMemo(()=>dayKey(new Date()),[])

  const load = () => {
    const from = weekStart.toISOString()
    const to = new Date(weekStart.getTime()+7*24*60*60*1000).toISOString()
    setLoading(true)
    fetch(`/api/admin/calendar?from=${from}&to=${to}`)
      .then(r=>r.ok?r.json():[])
      .then(d=>{setEvents(d);setLoading(false)})
  }

  useEffect(()=>{load()},[weekStart])

  const completeTask = async (e:CalEvent) => {
    const meta = e.meta
    if (!meta?.taskId) return
    await fetch(`/api/tasks/${meta.taskId}`,{method:'PATCH',
      headers:{'Content-Type':'application/json'},body:JSON.stringify({status:'COMPLETED'})})
    load()
  }

  const eventsByDay = useMemo(()=>{
    const map:Record<string,CalEvent[]> = {}
    for (const e of events) {
      const k = dayKey(new Date(e.date))
      ;(map[k]||=[]).push(e)
    }
    return map
  },[events])

  const weekLabel = (() => {
    const end = new Date(weekStart); end.setDate(weekStart.getDate()+6)
    const s = weekStart.toLocaleDateString(dateLoc,{day:'2-digit',month:'short'})
    const f = end.toLocaleDateString(dateLoc,{day:'2-digit',month:'short',year:'numeric'})
    return `${s} – ${f}`
  })()

  const toggleDay = (key:string) => setExpandedDay(d=>d===key?null:key)
  const MAX = 3

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">{t('crew.calendar.title')}</h1>
          <p className="text-sm text-gray-500">{t('crew.calendar.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>setWeekStart(s=>{const d=new Date(s);d.setDate(d.getDate()-7);return d})}
            className="rounded-lg border p-2 hover:bg-gray-50"><ChevronLeft className="h-4 w-4"/></button>
          <span className="text-sm font-medium min-w-[200px] text-center">{weekLabel}</span>
          <button onClick={()=>setWeekStart(s=>{const d=new Date(s);d.setDate(d.getDate()+7);return d})}
            className="rounded-lg border p-2 hover:bg-gray-50"><ChevronRight className="h-4 w-4"/></button>
          <button onClick={()=>setWeekStart(getWeekStart(new Date()))}
            className="rounded-lg border px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50">{t('crew.calendar.today')}</button>
        </div>
      </div>

      {loading && <div className="space-y-3 animate-pulse"><div className="h-6 rounded bg-hm-sand w-40" /><div className="h-32 rounded-hm bg-hm-sand" /></div>}

      <div className="overflow-x-auto -mx-6 px-6">
        <div className="grid grid-cols-7 gap-3 min-w-[700px]">
          {weekDays.map((day,i) => {
            const key = dayKey(day)
            const items = eventsByDay[key]??[]
            const isToday = key===todayKey
            const isExpanded = expandedDay===key

            return (
              <div key={key} className="flex flex-col">
                <button onClick={()=>toggleDay(key)}
                  className={`flex flex-col items-center rounded-xl border px-2 py-3 transition-all mb-2 ${
                    isExpanded?'bg-gray-900 text-white border-gray-900'
                    :isToday?'bg-blue-50 border-blue-200'
                    :'bg-white border-gray-100 hover:border-gray-300'}`}>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider ${isExpanded?'text-white/60':isToday?'text-blue-500':'text-gray-500'}`}>
                    {getWeekdayShort(dateLoc)[i]}
                  </span>
                  <span className={`text-xl font-bold mt-0.5 ${isExpanded?'text-white':isToday?'text-blue-700':'text-gray-900'}`}>
                    {day.getDate()}
                  </span>
                  <span className={`text-[10px] mt-0.5 ${isExpanded?'text-white/60':isToday?'text-blue-500':'text-gray-400'}`}>
                    {day.toLocaleDateString(dateLoc,{month:'short'})}
                  </span>
                  {items.length>0&&(
                    <span className={`mt-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      isExpanded?'bg-white/20 text-white':isToday?'bg-blue-200 text-blue-700':'bg-gray-100 text-gray-500'}`}>
                      {items.length}
                    </span>
                  )}
                </button>

                <div className="flex-1 space-y-1 rounded-xl border bg-white p-2 min-h-[100px]">
                  {items.slice(0,MAX).map(e=>{
                    const meta = e.meta
                    const isCompleted = meta?.taskStatus==='COMPLETED'
                    const isOverdue = meta?.isOverdue
                    const taskType = meta?.taskType??e.type
                    const colorClass = COLORS[taskType]??COLORS[e.type]??'bg-gray-100 text-gray-600 border-gray-200'
                    return (
                      <button key={e.id} onClick={()=>toggleDay(key)}
                        className={`w-full flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-medium text-left hover:opacity-80 ${colorClass} ${
                          isCompleted?'opacity-40':''} ${isOverdue?'ring-1 ring-red-400':''}`}>
                        <span className={`truncate ${isCompleted?'line-through':''}`}>
                          {t(`crew.taskTypes.${taskType}`) || e.title}
                        </span>
                      </button>
                    )
                  })}
                  {items.length>MAX&&(
                    <button onClick={()=>toggleDay(key)}
                      className="w-full rounded-lg px-2 py-1 text-[11px] text-gray-400 hover:text-gray-600 hover:bg-gray-50 text-left">
                      +{items.length-MAX} {t('crew.calendar.more')}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {expandedDay&&(
        <DayPanel
          day={weekDays.find(d=>dayKey(d)===expandedDay)??new Date(expandedDay+'T00:00:00')}
          events={eventsByDay[expandedDay]??[]}
          onClose={()=>setExpandedDay(null)}
          onComplete={completeTask}
          dateLoc={dateLoc}
          t={t}
        />
      )}
    </div>
  )
}
