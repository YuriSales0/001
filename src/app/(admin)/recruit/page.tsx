"use client"

import { useEffect, useState } from "react"
import { Briefcase, Wrench, Mail, Phone, MapPin, Filter, CheckCircle2, XCircle, Clock, MessageSquare, Loader2, UserPlus, X } from "lucide-react"
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
  convertedToUserId: string | null
  convertedAt: string | null
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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-hm-black">Recruiting</h1>
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
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-hm border p-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value as typeof roleFilter)} className="rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold">
          <option value="ALL">All roles</option>
          <option value="MANAGER">Managers</option>
          <option value="CREW">Crew</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold">
          <option value="ALL">All statuses</option>
          {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{apps.length} application{apps.length !== 1 ? "s" : ""}</span>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-10 text-sm text-gray-400"><Loader2 className="h-4 w-4 inline animate-spin mr-2" />Loading…</div>
      ) : apps.length === 0 ? (
        <div className="bg-white rounded-hm border p-10 text-center text-sm text-gray-400">
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
                  className={`w-full text-left rounded-hm border bg-white p-4 hover:shadow-md transition-all ${isSelected ? "ring-2 ring-navy-700" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(176,138,62,0.15)" }}>
                        <Icon className="h-4 w-4" style={{ color: "#B08A3E" }} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-hm-black">{app.name}</p>
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
              <ApplicationDetail app={selected} onStatusChange={updateStatus} onConverted={load} />
            ) : (
              <div className="bg-white rounded-hm border p-10 text-center text-sm text-gray-400">
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
    <div className="rounded-hm border bg-white p-4">
      <p className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}

function ApplicationDetail({
  app, onStatusChange, onConverted,
}: {
  app: Application
  onStatusChange: (id: string, status: Application["status"], notes?: string) => void
  onConverted: () => void
}) {
  const [notes, setNotes] = useState(app.adminNotes ?? "")
  const [saving, setSaving] = useState(false)
  const [showConvertModal, setShowConvertModal] = useState(false)
  const Icon = app.role === "MANAGER" ? Briefcase : Wrench
  const isConverted = !!app.convertedToUserId

  const saveNotes = async () => {
    setSaving(true)
    await onStatusChange(app.id, app.status, notes)
    setSaving(false)
  }

  return (
    <div className="bg-white rounded-hm border overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(176,138,62,0.15)" }}>
            <Icon className="h-5 w-5" style={{ color: "#B08A3E" }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-hm-black">{app.name}</h3>
            <p className="text-xs text-gray-500">{app.role} · Applied {fmtDateTime(app.createdAt)}</p>
          </div>
        </div>
        {isConverted ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1.5 rounded-full">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Converted to user
          </span>
        ) : (
          <button
            onClick={() => setShowConvertModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#B08A3E] text-[#0B1E3A] px-4 py-2 text-sm font-bold hover:opacity-90 transition-opacity"
          >
            <UserPlus className="h-4 w-4" />
            Convert to {app.role === "MANAGER" ? "Manager" : "Crew"}
          </button>
        )}
      </div>

      {showConvertModal && (
        <ConvertModal
          app={app}
          onClose={() => setShowConvertModal(false)}
          onSuccess={() => {
            setShowConvertModal(false)
            onConverted()
          }}
        />
      )}

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
          className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
        />
        <div className="flex justify-end mt-2">
          <button
            onClick={saveNotes}
            disabled={saving || notes === (app.adminNotes ?? "")}
            className="rounded-lg bg-hm-black text-white px-4 py-1.5 text-xs font-semibold hover:bg-hm-black/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save notes"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Convert application → real User (invite)
// ─────────────────────────────────────────────────────────────────

function ConvertModal({
  app, onClose, onSuccess,
}: {
  app: Application
  onClose: () => void
  onSuccess: () => void
}) {
  const isManager = app.role === "MANAGER"
  const [subShare, setSubShare] = useState("15")   // percentage
  const [commShare, setCommShare] = useState("3")  // percentage
  const [crewContractType, setCrewContractType] = useState<"MONTHLY" | "FREELANCER">("FREELANCER")
  const [crewMonthlyRate, setCrewMonthlyRate] = useState("")
  const [crewTaskRate, setCrewTaskRate] = useState("")
  const [contractTitle, setContractTitle] = useState(
    isManager ? `Manager Agreement — ${app.name}` : `Crew Agreement — ${app.name}`
  )
  const [contractTerms, setContractTerms] = useState(
    isManager
      ? DEFAULT_MANAGER_CONTRACT
      : DEFAULT_CREW_CONTRACT
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = { contractTitle, contractTerms }
    if (isManager) {
      const sub = parseFloat(subShare) / 100
      const comm = parseFloat(commShare) / 100
      if (isNaN(sub) || sub < 0 || sub > 1) { setError("Subscription share must be 0-100%"); setSubmitting(false); return }
      if (isNaN(comm) || comm < 0 || comm > 1) { setError("Commission share must be 0-100%"); setSubmitting(false); return }
      body.managerSubscriptionShare = sub
      body.managerCommissionShare = comm
    } else {
      body.crewContractType = crewContractType
      if (crewContractType === "MONTHLY" && crewMonthlyRate) body.crewMonthlyRate = parseFloat(crewMonthlyRate)
      if (crewContractType === "FREELANCER" && crewTaskRate) body.crewTaskRate = parseFloat(crewTaskRate)
    }

    const res = await fetch(`/api/recruit/${app.id}/convert`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    setSubmitting(false)

    if (res.ok) {
      showToast(`User created and invite sent to ${app.email}`, "success")
      onSuccess()
    } else {
      setError(data.error ?? "Failed to convert")
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-hm-black">Convert to {isManager ? "Manager" : "Crew"}</h3>
            <p className="text-xs text-gray-500">Creates a user account, generates a contract, and sends an invite email.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Summary */}
          <div className="rounded-lg border bg-gray-50 p-4">
            <p className="text-sm font-semibold text-hm-black">{app.name}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {app.email}{app.zone ? ` · ${app.zone}` : ""}{app.phone ? ` · ${app.phone}` : ""}
            </p>
          </div>

          {/* Compensation */}
          {isManager ? (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Compensation</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">% of client subscription</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={subShare}
                      onChange={e => setSubShare(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm pr-8"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Default: 15%</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">% of gross rental</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={commShare}
                      onChange={e => setCommShare(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm pr-8"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">Default: 3%</p>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Contract type</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setCrewContractType("MONTHLY")}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${crewContractType === "MONTHLY" ? "border-navy-700 bg-navy-50 text-hm-black" : "border-gray-200 hover:bg-gray-50 text-gray-600"}`}
                >
                  Monthly salary
                </button>
                <button
                  type="button"
                  onClick={() => setCrewContractType("FREELANCER")}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${crewContractType === "FREELANCER" ? "border-navy-700 bg-navy-50 text-hm-black" : "border-gray-200 hover:bg-gray-50 text-gray-600"}`}
                >
                  Per task
                </button>
              </div>
              {crewContractType === "MONTHLY" ? (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Monthly rate (€)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={crewMonthlyRate}
                    onChange={e => setCrewMonthlyRate(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="e.g. 1200"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Per-task rate (€)</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={crewTaskRate}
                    onChange={e => setCrewTaskRate(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    placeholder="e.g. 40"
                  />
                </div>
              )}
            </div>
          )}

          {/* Contract */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Contract</p>
            <input
              value={contractTitle}
              onChange={e => setContractTitle(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm mb-2"
              placeholder="Contract title"
            />
            <textarea
              value={contractTerms}
              onChange={e => setContractTerms(e.target.value)}
              rows={8}
              className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
              placeholder="Contract terms…"
            />
            <p className="text-[10px] text-gray-400 mt-1">Applicant will review and sign after creating their account.</p>
          </div>

          {error && (
            <p className="text-sm text-red-600 rounded-lg px-3 py-2 bg-red-50">{error}</p>
          )}
        </form>

        <div className="px-6 py-4 border-t flex items-center justify-end gap-2 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#B08A3E] text-[#0B1E3A] px-5 py-2 text-sm font-bold hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating…</> : <><UserPlus className="h-4 w-4" /> Create user & send invite</>}
          </button>
        </div>
      </div>
    </div>
  )
}

const DEFAULT_MANAGER_CONTRACT = `# HostMasters Manager Agreement

## 1. Role
The Manager acts as a sales and customer success representative for HostMasters in an assigned geographic territory on the Costa Tropical, Spain.

## 2. Compensation
- 15% of monthly subscription fees from active clients in your portfolio
- 3% of gross rental revenue collected for your clients
- Portfolio bonuses: +€150 at 10 properties, +€400 at 20, +€750 at 30
- Acquisition bonus per newly signed client (one-time, paid after month 2)

## 3. Term
Minimum 6-month commitment. Exclusive geographic territory.
Revenue is paid only on amounts effectively collected from clients.

## 4. Responsibilities
- Attract and close new property owners in the assigned territory
- Provide first-line customer success to portfolio clients
- Operate under HostMasters branding and standards

## 5. Restrictions
- No direct contact with HostMasters Crew for external work
- No offers outside defined plan structure
- 12-month non-compete clause post-contract

By signing, you agree to these terms.`

const DEFAULT_CREW_CONTRACT = `# HostMasters Crew Agreement

## 1. Role
The Crew member executes field operations (cleaning, check-in/out, maintenance, inspections) assigned via the HostMasters platform.

## 2. Compensation
As specified in the platform profile. Payment within 24 hours of task completion (subject to photo and checklist submission).

## 3. Standards
- Follow all checklists in the platform
- Submit required photos for each task
- Report any property issues via checkout report

## 4. Term
Open-ended. Either party may terminate with 14 days notice.

By signing, you agree to these terms.`
