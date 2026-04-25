"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Shield, CheckCircle2, Clock, MapPin, User as UserIcon, X as XIcon,
  Package, Star, AlertTriangle, Users, TrendingUp,
} from "lucide-react"
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

type Review = {
  id: string
  propertyId: string
  propertyName: string
  cleanlinessScore: number | null
  overallScore: number | null
  approved: boolean
  createdAt: string
}

type CrewMember = {
  id: string
  name: string | null
  email: string
  score: number
  level: string
  openTasks: number
}

type StockAlert = {
  categoryId: string
  categoryName: string
  available: number
  minimumLevel: number
}

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

type Tab = 'tasks' | 'reviews' | 'crew' | 'stock'

export default function CaptainHubPage() {
  const { t } = useLocale()
  const [tab, setTab] = useState<Tab>('tasks')
  const [tasks, setTasks] = useState<Task[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [crew, setCrew] = useState<CrewMember[]>([])
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
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
        return Promise.all([
          fetch('/api/tasks?status=SUBMITTED&captainView=true').then(r => r.ok ? r.json() : []),
          fetch('/api/reviews?pendingApproval=true').then(r => r.ok ? r.json() : []).catch(() => []),
          fetch('/api/users?role=CREW').then(r => r.ok ? r.json() : []).catch(() => []),
          fetch('/api/admin/consumables/stock?lowOnly=true').then(r => r.ok ? r.json() : []).catch(() => []),
        ]).then(([tasksData, reviewsData, crewData, stockData]) => {
          setTasks(Array.isArray(tasksData) ? tasksData : [])
          setReviews(Array.isArray(reviewsData) ? reviewsData.slice(0, 20) : [])
          setCrew(Array.isArray(crewData) ? crewData.map((u: { id: string; name: string | null; email: string }) => ({
            id: u.id, name: u.name, email: u.email, score: 0, level: 'BASIC', openTasks: 0,
          })) : [])
          setStockAlerts(Array.isArray(stockData) ? stockData : [])
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
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-amber-700" />
          <h1 className="text-2xl font-serif font-bold text-hm-black">Captain Hub</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Your field supervision centre — task approvals, review moderation, crew oversight, and stock alerts.
        </p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard icon={Clock}         label="Tasks to approve" value={tasks.length}        color="amber" />
        <KpiCard icon={Star}          label="Reviews pending"  value={reviews.length}      color="blue" />
        <KpiCard icon={Users}         label="Crew in pool"     value={crew.length}         color="emerald" />
        <KpiCard icon={AlertTriangle} label="Low stock"        value={stockAlerts.length}  color="red" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <TabBtn active={tab === 'tasks'}   onClick={() => setTab('tasks')}   icon={CheckCircle2} label={`Approvals (${tasks.length})`} />
        <TabBtn active={tab === 'reviews'} onClick={() => setTab('reviews')} icon={Star}         label={`Reviews (${reviews.length})`} />
        <TabBtn active={tab === 'crew'}    onClick={() => setTab('crew')}    icon={Users}        label={`Crew (${crew.length})`} />
        <TabBtn active={tab === 'stock'}   onClick={() => setTab('stock')}   icon={Package}      label={`Stock (${stockAlerts.length})`} />
      </div>

      {/* Tasks */}
      {tab === 'tasks' && (
        tasks.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="Nothing to approve right now" body="Tasks submitted by crew will appear here for review." />
        ) : (
          <div className="rounded-xl border bg-white overflow-hidden">
            <div className="divide-y">
              {tasks.map(task => (
                <div key={task.id} className="flex items-start gap-4 p-4 hover:bg-gray-50">
                  <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <Clock className="h-5 w-5 text-amber-700" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs uppercase tracking-wider font-semibold text-gray-500">{task.type}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[10px] font-semibold">SUBMITTED</span>
                    </div>
                    <Link href={`/crew?taskId=${task.id}`} className="font-semibold text-hm-black truncate block hover:underline">
                      {task.property?.name ?? 'Property removed'}
                    </Link>
                    <div className="flex flex-wrap gap-4 mt-1 text-xs text-gray-500">
                      {task.property?.city && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{task.property.city}</span>}
                      {task.assignee?.name && <span className="inline-flex items-center gap-1"><UserIcon className="h-3 w-3" />{task.assignee.name}</span>}
                      <span>Due {fmtDate(task.dueDate)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 self-center">
                    <button onClick={() => handleAction(task.id, 'APPROVED')} disabled={acting === task.id}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 text-white px-3 py-1.5 text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                    </button>
                    <button onClick={() => handleAction(task.id, 'REJECTED')} disabled={acting === task.id}
                      className="inline-flex items-center gap-1 rounded-lg border border-red-200 text-red-600 px-3 py-1.5 text-xs font-semibold hover:bg-red-50 disabled:opacity-50">
                      <XIcon className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Reviews */}
      {tab === 'reviews' && (
        reviews.length === 0 ? (
          <EmptyState icon={Star} title="No reviews pending moderation" body="Guest reviews submitted in your properties will appear here for approval." />
        ) : (
          <div className="rounded-xl border bg-white overflow-hidden divide-y">
            {reviews.map(r => (
              <div key={r.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{r.propertyName}</p>
                  <p className="text-xs text-gray-500">
                    Cleanliness: {r.cleanlinessScore ?? '—'} / 10 · Overall: {r.overallScore ?? '—'} / 10
                  </p>
                </div>
                <Link href={`/client/feedback?reviewId=${r.id}`} className="text-xs text-blue-600 underline">Review</Link>
              </div>
            ))}
          </div>
        )
      )}

      {/* Crew roster */}
      {tab === 'crew' && (
        crew.length === 0 ? (
          <EmptyState icon={Users} title="No crew members found" body="Once Admin adds Crew members to the platform, they will show here." />
        ) : (
          <div className="rounded-xl border bg-white overflow-hidden divide-y">
            {crew.map(c => (
              <div key={c.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">{c.name ?? c.email}</p>
                  <p className="text-xs text-gray-500">{c.email}</p>
                </div>
                <Link href={`/crew/profile?crewId=${c.id}`} className="text-xs text-blue-600 underline">View profile</Link>
              </div>
            ))}
          </div>
        )
      )}

      {/* Stock alerts */}
      {tab === 'stock' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Items below minimum level that need restocking.
            </p>
            <Link href="/crew/consumables" className="text-xs font-semibold text-blue-600 hover:underline">
              View full inventory →
            </Link>
          </div>
          {stockAlerts.length === 0 ? (
            <EmptyState icon={Package} title="All stock levels OK" body="Inventory is healthy across all categories." />
          ) : (
            <div className="rounded-xl border bg-white divide-y">
              {stockAlerts.map(s => (
                <div key={s.categoryId} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{s.categoryName}</p>
                    <p className="text-xs text-red-600">
                      {s.available} available · minimum {s.minimumLevel}
                    </p>
                  </div>
                  <span className="rounded-full bg-red-50 text-red-700 px-2 py-0.5 text-[10px] font-semibold">LOW</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function KpiCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: 'amber' | 'blue' | 'emerald' | 'red' }) {
  const palette = {
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-700' },
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-700' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    red:     { bg: 'bg-red-50',     text: 'text-red-700' },
  }[color]
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center gap-2 mb-1">
        <div className={`h-7 w-7 rounded-lg ${palette.bg} ${palette.text} flex items-center justify-center`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      </div>
      <p className="text-2xl font-bold text-hm-black">{value}</p>
    </div>
  )
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
        active ? 'border-amber-600 text-amber-700' : 'border-transparent text-gray-500 hover:text-gray-800'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  )
}

function EmptyState({ icon: Icon, title, body }: { icon: React.ElementType; title: string; body: string }) {
  return (
    <div className="rounded-xl border bg-white p-10 text-center">
      <Icon className="h-10 w-10 mx-auto text-gray-300 mb-3" />
      <p className="font-semibold text-hm-black">{title}</p>
      <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">{body}</p>
    </div>
  )
}
