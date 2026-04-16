"use client"

import { useEffect, useState } from "react"
import { Briefcase, Wrench, Mail, Phone, MapPin, Filter, CheckCircle2, XCircle, Clock, MessageSquare, Loader2 } from "lucide-react"
import { showToast } from "@/components/hm/toast"

type Application = {
  id: string
  role: "MANAGER" | "CREW"
  name: string
  email: string
  phone: string | null
  zone: string | null
  languages: string[]
  experience: string | null
  skills: string[]
  availability: string | null
  message: string | null
  source: string | null
  locale: string | null
  status: "NEW" | "CONTACTED" | "INTERVIEWING" | "ACCEPTED" | "REJECTED"
  reviewedAt: string | null
  adminNotes: string | null
  createdAt: string
}

const STATUS_META: Record<Application["status"], { label: string; color: string; icon: React.ElementType }> = {
  NEW:           { label: "New",          color: "bg-blue-100 text-blue-700",       icon: Clock },
  CONTACTED:     { label: "Contacted",    color: "bg-amber-100 text-amber-700",     icon: MessageSquare },
  INTERVIEWING:  { label: "Interviewing", color: "bg-purple-100 text-purple-700",   icon: MessageSquare },
  ACCEPTED:      { label: "Accepted",     color: "bg-green-100 text-green-700",     icon: CheckCircle2 },
  REJECTED:      { label: "Rejected",     color: "bg-gray-100 text-gray-500",       icon: XCircle },
}

const fmtDate = (s: string) => new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
const fmtDateTime = (s: string) => new Date(s).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })

export default function AdminRecruitPage() {
  const [apps, setApps] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState<"ALL" | "MANAGER" | "CREW">("ALL")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [selected, setSelected] = useState<Application | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (roleFilter !== "ALL") params.set("role", roleFilter)
      if (statusFilter !== "ALL") params.set("status", statusFilter)
      const res = await fetch(`/api/recruit?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setApps(data)
    } catch {
      showToast("Failed to load applications", "error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter, statusFilter])

  const stats = {
    total:        apps.length,
    new:          apps.filter(a => a.status === "NEW").length,
    contacted:    apps.filter(a => a.status === "CONTACTED").length,
    interviewing: apps.filter(a => a.status === "INTERVIEWING").length,
    accepted:     apps.filter(a => a.status === "ACCEPTED").length,
  }

  const updateStatus = async (id: string, status: Application["status"], notes?: string) => {
    const res = await fetch(`/api/recruit/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNotes: notes }),
    })
    if (res.ok) {
      showToast("Application updated", "success")
      load()
      if (selected?.id === id) {
        const fresh = await fetch(`/api/recruit?`).then(r => r.json())
        const updated = fresh.find((a: Application) => a.id === id)
        if (updated) setSelected(updated)
      }
    } else {
      showToast("Failed to update", "error")
    }
  }

  return (
    <div className="p-6 space-y-6" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Recruiting</h1>
        <p className="text-sm text-gray-500 mt-0.5">Applications from Managers and Crew.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label="Total"        value={stats.total}         color="text-navy-700" />
        <StatCard label="New"          value={stats.new}           color="text-blue-600" />
        <StatCard label="Contacted"    value={stats.contacted}     color="text-amber-600" />
        <StatCard label="Interviewing" value={stats.interviewing}  color="text-purple-600" />
        <StatCard label="Accepted"     value={stats.accepted}      color="text-green-600" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border p-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as typeof roleFilter)} className="rounded-lg border px-3 py-1.5 text-sm">
          <option value="ALL">All roles</option>
          <option value="MANAGER">Managers</option>
          <option value="CREW">Crew</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border px-3 py-1.5 text-sm">
          <option value="ALL">All statuses</option>
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{apps.length} application{apps.length !== 1 ? "s" : ""}</span>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-10 text-sm text-gray-400"><Loader2 className="h-4 w-4 inline animate-spin mr-2" />Loading…</div>
      ) : apps.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center text-sm text-gray-400">
          No applications match the current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List column */}
          <div className="lg:col-span-1 space-y-2">
            {apps.map(app => {
              const Icon = app.role === "MANAGER" ? Briefcase : Wrench
              const statusMeta = STATUS_META[app.status]
              const StatusIcon = statusMeta.icon
              const isSelected = selected?.id === app.id
              return (
                <button
                  key={app.id}
                  onClick={() => setSelected(app)}
                  className={`w-full text-left rounded-xl border bg-white p-4 hover:shadow-md transition-all ${isSelected ? "ring-2 ring-navy-700" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(201,168,76,0.15)" }}>
                        <Icon className="h-4 w-4" style={{ color: "#C9A84C" }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-navy-900">{app.name}</p>
                        <p className="text-xs text-gray-500">{app.role} · {app.zone ?? "—"}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusMeta.color} shrink-0`}>
                      <StatusIcon className="h-3 w-3 inline mr-0.5" />
                      {statusMeta.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{fmtDate(app.createdAt)}</p>
                </button>
              )
            })}
          </div>

          {/* Detail column */}
          <div className="lg:col-span-2">
            {selected ? (
              <ApplicationDetail app={selected} onStatusChange={updateStatus} />
            ) : (
              <div className="bg-white rounded-xl border p-10 text-center text-sm text-gray-400">
                Select an application to view details.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function ApplicationDetail({
  app, onStatusChange,
}: {
  app: Application
  onStatusChange: (id: string, status: Application["status"], notes?: string) => void
}) {
  const [notes, setNotes] = useState(app.adminNotes ?? "")
  const [saving, setSaving] = useState(false)
  const Icon = app.role === "MANAGER" ? Briefcase : Wrench

  const saveNotes = async () => {
    setSaving(true)
    await onStatusChange(app.id, app.status, notes)
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(201,168,76,0.15)" }}>
            <Icon className="h-5 w-5" style={{ color: "#C9A84C" }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-navy-900">{app.name}</h3>
            <p className="text-xs text-gray-500">{app.role} · Applied {fmtDateTime(app.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="px-6 py-4 border-b space-y-2">
        <a href={`mailto:${app.email}`} className="flex items-center gap-2 text-sm text-navy-700 hover:underline">
          <Mail className="h-4 w-4" /> {app.email}
        </a>
        {app.phone && (
          <a href={`tel:${app.phone}`} className="flex items-center gap-2 text-sm text-navy-700 hover:underline">
            <Phone className="h-4 w-4" /> {app.phone}
          </a>
        )}
        {app.zone && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="h-4 w-4 text-gray-400" /> {app.zone}
          </div>
        )}
      </div>

      {/* Role-specific details */}
      <div className="px-6 py-4 border-b space-y-3">
        {app.role === "MANAGER" && (
          <>
            {app.languages.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Languages</p>
                <div className="flex flex-wrap gap-1.5">
                  {app.languages.map(l => (
                    <span key={l} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">{l.toUpperCase()}</span>
                  ))}
                </div>
              </div>
            )}
            {app.experience && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Experience</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.experience}</p>
              </div>
            )}
          </>
        )}

        {app.role === "CREW" && (
          <>
            {app.skills.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {app.skills.map(s => (
                    <span key={s} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">{s.replace(/_/g, " ")}</span>
                  ))}
                </div>
              </div>
            )}
            {app.availability && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Availability</p>
                <p className="text-sm text-gray-700">{app.availability}</p>
              </div>
            )}
          </>
        )}

        {app.message && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Message</p>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{app.message}</p>
          </div>
        )}
      </div>

      {/* Status actions */}
      <div className="px-6 py-4 border-b">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Update status</p>
        <div className="flex flex-wrap gap-2">
          {(Object.entries(STATUS_META) as [Application["status"], typeof STATUS_META[Application["status"]]][]).map(([status, meta]) => {
            const StatusIcon = meta.icon
            const active = app.status === status
            return (
              <button
                key={status}
                onClick={() => onStatusChange(app.id, status, notes)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${active ? meta.color + " border-current" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                <StatusIcon className="h-3 w-3" />
                {meta.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Admin notes */}
      <div className="px-6 py-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Internal notes</p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          maxLength={2000}
          placeholder="Private notes (not shown to applicant)…"
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={saveNotes}
            disabled={saving || notes === (app.adminNotes ?? "")}
            className="rounded-lg bg-navy-900 text-white px-4 py-1.5 text-xs font-semibold hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save notes"}
          </button>
        </div>
      </div>
    </div>
  )
}
