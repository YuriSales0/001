"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Shield, CheckCircle2, Clock, MapPin, User as UserIcon, X as XIcon } from "lucide-react"
import { showToast } from "@/components/hm/toast"
import { useLocale } from "@/i18n/provider"

type Task = {
  id: string
  type: string
  status: string
  dueDate: string | null
  property: { id: string; name: string; city: string; address: string } | null
  assignee: { id: string; name: string | null; email: string } | null
  createdAt: string
}

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export default function CaptainApprovalsPage() {
  const { t } = useLocale()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [denied, setDenied] = useState(false)
  const [acting, setActing] = useState<string | null>(null)

  const handleAction = async (taskId: string, action: 'APPROVED' | 'REJECTED') => {
    setActing(taskId)
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      })
      if (res.ok) {
        setTasks(prev => prev.filter(t => t.id !== taskId))
        showToast(action === 'APPROVED' ? 'Task approved' : 'Task rejected', 'success')
      } else {
        const d = await res.json().catch(() => ({}))
        showToast(d.error || 'Action failed', 'error')
      }
    } catch {
      showToast('Network error', 'error')
    }
    setActing(null)
  }

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? r.json() : null)
      .then(me => {
        if (!me || me.role !== 'CREW' || !me.isCaptain) {
          setDenied(true)
          setLoading(false)
          return
        }
        return fetch('/api/tasks?status=SUBMITTED&captainView=true')
          .then(r => r.ok ? r.json() : [])
          .then(data => {
            setTasks(Array.isArray(data) ? data : [])
            setLoading(false)
          })
      })
      .catch(() => setLoading(false))
  }, [])

  if (!mounted || loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 rounded bg-gray-100 animate-pulse" />
        <div className="h-24 rounded-xl bg-gray-100 animate-pulse" />
      </div>
    )
  }

  if (denied) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-amber-50 border-amber-200 p-6 max-w-xl">
          <div className="font-semibold text-amber-900 mb-1">Captain-only area</div>
          <p className="text-sm text-amber-800">
            This page is visible only to Crew Captains. Ask an Admin to promote you if you believe this is a mistake.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-amber-700" />
          <h1 className="text-2xl font-serif font-bold text-hm-black">
            {t('crew.approvals') || 'Approvals'}
          </h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Tasks submitted by your crew that need Captain review before payout is released.
        </p>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center">
          <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-400 mb-3" />
          <p className="font-semibold text-hm-black">Nothing to approve right now</p>
          <p className="text-sm text-gray-500 mt-1">
            When a Crew member submits photos and completes a task, it will appear here for your review.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="divide-y">
            {tasks.map(task => (
              <div key={task.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-amber-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs uppercase tracking-wider font-semibold text-gray-500">
                      {task.type}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-semibold">
                      SUBMITTED
                    </span>
                  </div>
                  <Link href={`/crew?taskId=${task.id}`} className="font-semibold text-hm-black truncate block hover:underline">
                    {task.property?.name ?? 'Property removed'}
                  </Link>
                  <div className="flex flex-wrap gap-4 mt-1 text-xs text-gray-500">
                    {task.property?.city && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />{task.property.city}
                      </span>
                    )}
                    {task.assignee?.name && (
                      <span className="inline-flex items-center gap-1">
                        <UserIcon className="h-3 w-3" />{task.assignee.name}
                      </span>
                    )}
                    <span>Due {fmtDate(task.dueDate)}</span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0 self-center">
                  <button
                    onClick={() => handleAction(task.id, 'APPROVED')}
                    disabled={acting === task.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50"
                    aria-label="Approve task"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => handleAction(task.id, 'REJECTED')}
                    disabled={acting === task.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-red-200 text-red-600 px-3 py-1.5 text-xs font-semibold hover:bg-red-50 disabled:opacity-50"
                    aria-label="Reject task"
                  >
                    <XIcon className="h-3.5 w-3.5" /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
