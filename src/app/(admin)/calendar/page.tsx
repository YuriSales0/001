"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, LogIn, LogOut, Wrench, Lock, Wallet, Cake } from "lucide-react"

type Event = {
  id: string
  type: 'CHECK_IN' | 'CHECK_OUT' | 'BLOCKED' | 'TASK' | 'PAYOUT' | 'BIRTHDAY'
  title: string
  date: string
  endDate?: string
  property?: { id: string; name: string }
}

const ICONS: Record<Event['type'], React.ElementType> = {
  CHECK_IN: LogIn,
  CHECK_OUT: LogOut,
  BLOCKED: Lock,
  TASK: Wrench,
  PAYOUT: Wallet,
  BIRTHDAY: Cake,
}

const COLORS: Record<Event['type'], string> = {
  CHECK_IN: 'bg-green-100 text-green-700',
  CHECK_OUT: 'bg-orange-100 text-orange-700',
  BLOCKED: 'bg-gray-200 text-gray-700',
  TASK: 'bg-blue-100 text-blue-700',
  PAYOUT: 'bg-purple-100 text-purple-700',
  BIRTHDAY: 'bg-pink-100 text-pink-700',
}

const TYPES: Event['type'][] = ['CHECK_IN', 'CHECK_OUT', 'BLOCKED', 'TASK', 'PAYOUT', 'BIRTHDAY']

const dayKey = (d: Date) => d.toISOString().slice(0, 10)
const fmtDay = (k: string) => new Date(k + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })

export default function AdminCalendar() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Record<Event['type'], boolean>>({
    CHECK_IN: true, CHECK_OUT: true, BLOCKED: true, TASK: true, PAYOUT: true, BIRTHDAY: true,
  })
  const [monthOffset, setMonthOffset] = useState(0)

  useEffect(() => {
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1)
    const to = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0)
    setLoading(true)
    fetch(`/api/admin/calendar?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setEvents(d); setLoading(false) })
  }, [monthOffset])

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
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy-900">Calendar</h1>
          <p className="text-sm text-gray-600">All check-ins, check-outs, blocks, tasks, payouts and birthdays.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setMonthOffset(o => o - 1)} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">‹</button>
          <span className="text-sm font-medium text-navy-900 min-w-[140px] text-center">{monthLabel}</span>
          <button onClick={() => setMonthOffset(o => o + 1)} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">›</button>
          <button onClick={() => setMonthOffset(0)} className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50">Today</button>
        </div>
      </div>

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
              {t.replace('_', ' ')}
            </button>
          )
        })}
      </div>

      {loading && <p className="text-gray-500 text-sm">Loading…</p>}
      {!loading && grouped.length === 0 && (
        <div className="rounded-xl border bg-white p-12 text-center text-gray-500">
          <CalendarDays className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          No events this month
        </div>
      )}

      <div className="space-y-4">
        {grouped.map(([day, items]) => (
          <div key={day} className="rounded-xl border bg-white overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 text-xs uppercase font-semibold text-gray-600">{fmtDay(day)}</div>
            <div className="divide-y">
              {items.map(e => {
                const Icon = ICONS[e.type]
                return (
                  <div key={e.id} className="px-4 py-3 flex items-center gap-3 text-sm">
                    <span className={`inline-flex items-center justify-center h-7 w-7 rounded-full ${COLORS[e.type]}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="flex-1">
                      <div className="font-medium text-navy-900">{e.title}</div>
                      {e.property && <div className="text-xs text-gray-500">{e.property.name}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
