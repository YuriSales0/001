"use client"
import { useEffect, useState } from "react"
import { Wrench, Calendar } from "lucide-react"

type Task = {
  id: string
  title: string
  type: string
  status: string
  dueDate: string
  description: string | null
  property: { id: string; name: string; address: string; city: string }
}
const fmt = (s: string) => new Date(s).toLocaleString('en-GB')

export default function CrewHome() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tasks').then(r => r.ok ? r.json() : []).then(d => { setTasks(d); setLoading(false) })
  }, [])

  const upcoming = tasks.filter(t => t.status !== 'COMPLETED')

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-navy-900">Operations</h1>
        <p className="text-sm text-gray-600">Check-ins, check-outs, preventive and corrective maintenance.</p>
      </div>
      {loading && <p className="text-gray-500">Loading…</p>}
      {!loading && upcoming.length === 0 && (
        <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
          <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" /> No open tasks.
        </div>
      )}
      <div className="space-y-3">
        {upcoming.map(t => (
          <div key={t.id} className="rounded-xl border bg-white p-4 flex items-start gap-3">
            <Wrench className="h-5 w-5 text-navy-900 mt-1" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-navy-900">{t.title}</h3>
                <span className="text-xs rounded-full bg-blue-100 text-blue-700 px-2 py-0.5">{t.type}</span>
              </div>
              <p className="text-xs text-gray-500">{t.property.name} · {t.property.address}, {t.property.city}</p>
              <p className="text-xs text-gray-500 mt-1">Due: {fmt(t.dueDate)}</p>
              {t.description && <p className="text-sm text-gray-700 mt-2">{t.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
