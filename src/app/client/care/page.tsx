"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Wrench, ShieldCheck, Sparkles, Camera, Clock, CheckCircle2,
  AlertTriangle, Plus, X, Calendar, FileText, MessageCircle,
} from "lucide-react"
import { useEscapeKey } from "@/lib/use-escape-key"

type Property = { id: string; name: string }

type Task = {
  id: string
  type: string
  title: string
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED"
  dueDate: string
  description: string | null
  notes: string | null
  property: { id: string; name: string }
  assignee: { id: string; name: string | null; email: string } | null
  updatedAt?: string
}

type Reservation = {
  id: string
  guestName: string
  checkIn: string
  checkOut: string
  status: string
  property: { id: string; name: string }
}

type CheckoutReport = {
  condition?: string
  issues?: string
  damages?: string
  notes?: string
  submittedAt?: string
}

type PreventiveReport = {
  type: 'preventive'
  sections: { name: string; items: { id: string; label: string; checked: boolean; anomaly: boolean; note: string }[] }[]
  checkedCount: number
  totalCount: number
  anomalyCount: number
  photoUrls?: string[]
  submittedAt?: string
}

type CorrectiveReport = {
  type: 'corrective'
  problem: string
  rootCause?: string | null
  actionTaken: string
  specialistName?: string | null
  cost?: number
  resolved: boolean
  photoUrls?: string[]
  submittedAt?: string
}

const TYPE_LABEL: Record<string, string> = {
  CLEANING: "Cleaning",
  MAINTENANCE_PREVENTIVE: "Preventive maintenance",
  MAINTENANCE_CORRECTIVE: "Corrective maintenance",
  INSPECTION: "Inspection",
  CHECK_IN: "Check-in",
  CHECK_OUT: "Check-out",
  TRANSFER: "Airport transfer",
  SHOPPING: "Shopping",
  LAUNDRY: "Laundry",
}

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  CLEANING: Sparkles,
  MAINTENANCE_PREVENTIVE: ShieldCheck,
  MAINTENANCE_CORRECTIVE: Wrench,
  INSPECTION: ShieldCheck,
  CHECK_IN: Calendar,
  CHECK_OUT: Camera,
}

const REQUEST_TYPES = [
  { value: "MAINTENANCE_CORRECTIVE", label: "Repair / fix",       hint: "Something is broken or not working" },
  { value: "CLEANING",               label: "Extra cleaning",     hint: "An additional cleaning visit" },
  { value: "INSPECTION",             label: "Property check",     hint: "Walk through and inspect the property" },
]

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })

const fmtRelative = (s: string) => {
  const diff = Date.now() - new Date(s).getTime()
  const days = Math.floor(diff / 86_400_000)
  if (days <= 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 30) return `${days} days ago`
  if (days < 60) return "1 month ago"
  return `${Math.floor(days / 30)} months ago`
}

const CORRECTIVE_ACTION_LABELS: Record<string, string> = {
  repaired:       'Reparado pelo técnico',
  specialist:     'Especialista contactado',
  temporary_fix:  'Solução temporária',
  pending_parts:  'Aguarda peças',
  no_action:      'Sem acção necessária',
}

function parseReport(notes: string | null): CheckoutReport | PreventiveReport | CorrectiveReport | null {
  if (!notes) return null
  try {
    const parsed = JSON.parse(notes)
    if (!parsed || typeof parsed !== "object") return null
    if (parsed.type === 'preventive') return parsed as PreventiveReport
    if (parsed.type === 'corrective') return parsed as CorrectiveReport
    if ('condition' in parsed) return parsed as CheckoutReport
  } catch { /* not JSON */ }
  return null
}

export default function ClientCarePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const [showRequest, setShowRequest] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [reqForm, setReqForm] = useState({
    propertyId: "",
    type: "MAINTENANCE_CORRECTIVE",
    title: "",
    description: "",
    dueDate: "",
  })
  const [reqError, setReqError] = useState("")

  useEscapeKey(showRequest, () => setShowRequest(false))

  const load = async () => {
    setLoading(true)
    setLoadError(false)
    try {
      const [tRes, rRes, pRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/reservations"),
        fetch("/api/properties"),
      ])
      if (!tRes.ok || !rRes.ok || !pRes.ok) throw new Error()
      setTasks(await tRes.json())
      setReservations(await rRes.json())
      const props = await pRes.json()
      setProperties(props)
      if (props.length > 0) setReqForm(f => ({ ...f, propertyId: f.propertyId || props[0].id }))
    } catch {
      setLoadError(true)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => { load() }, [])

  const upcoming = useMemo(
    () => tasks
      .filter(t => t.status !== "COMPLETED")
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [tasks],
  )

  const completed = useMemo(
    () => tasks
      .filter(t => t.status === "COMPLETED")
      .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())
      .slice(0, 12),
    [tasks],
  )

  const issuesNeedingAttention = useMemo(
    () => completed
      .map(t => ({ task: t, report: parseReport(t.notes) }))
      .filter(x => {
        if (!x.report) return false
        if ('condition' in x.report) return x.report.condition === "minor" || x.report.condition === "major"
        if ('type' in x.report && x.report.type === 'corrective') return !(x.report as CorrectiveReport).resolved
        if ('type' in x.report && x.report.type === 'preventive') return (x.report as PreventiveReport).anomalyCount > 0
        return false
      })
      .slice(0, 5),
    [completed],
  )

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setReqError("")
    if (!reqForm.propertyId || !reqForm.title || !reqForm.dueDate) {
      setReqError("Please fill in all required fields.")
      return
    }
    setRequesting(true)
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: reqForm.propertyId,
          type: reqForm.type,
          title: reqForm.title,
          description: reqForm.description || undefined,
          dueDate: new Date(reqForm.dueDate).toISOString(),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setReqError(err.error ?? "Could not send request.")
      } else {
        setShowRequest(false)
        setReqForm(f => ({ ...f, title: "", description: "", dueDate: "" }))
        await load()
      }
    } catch {
      setReqError("Network error. Please try again.")
    } finally {
      setRequesting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 rounded-hm bg-hm-sand" />
        <div className="h-64 rounded-hm bg-hm-sand" />
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="p-4 text-sm text-red-500">Failed to load data. Try refreshing.</div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-hm-black">Care & maintenance</h1>
          <p className="mt-1 font-sans text-lg text-hm-slate/70">
            Every visit, every report, every fix — all in one place.
          </p>
        </div>
        <button
          onClick={() => setShowRequest(true)}
          className="inline-flex items-center gap-2 rounded-lg px-5 py-3 font-sans font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--hm-gold-dk)", minHeight: "44px" }}
        >
          <Plus className="h-4 w-4" />
          Request a visit
        </button>
      </div>

      {/* Issues needing attention */}
      {issuesNeedingAttention.length > 0 && (
        <div className="rounded-hm border border-hm-red/30 p-5"
             style={{ background: "rgba(163,45,45,0.05)" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-hm-red" />
            <h2 className="font-serif font-bold text-hm-black">Recent issues flagged by our team</h2>
          </div>
          <div className="space-y-2">
            {issuesNeedingAttention.map(({ task, report }) => {
              const corrective = (report && 'type' in report && report.type === 'corrective') ? report as CorrectiveReport : null
              const preventive = (report && 'type' in report && report.type === 'preventive') ? report as PreventiveReport : null
              const checkout   = (report && 'condition' in report) ? report as CheckoutReport : null
              const isCorrectiveUnresolved = !!(corrective && !corrective.resolved)
              const isPreventiveAnomaly   = !!(preventive && preventive.anomalyCount > 0)
              const isMajorCheckout       = checkout?.condition === "major"
              return (
                <div key={task.id} className="rounded-lg border border-hm-border p-3 bg-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-serif font-semibold text-hm-black">
                        {task.property.name} · {TYPE_LABEL[task.type] ?? task.type}
                      </p>
                      {corrective && (
                        <p className="font-sans text-sm text-hm-slate mt-1">{corrective.problem}</p>
                      )}
                      {preventive && (
                        <p className="font-sans text-sm text-hm-slate mt-1">
                          {preventive.anomalyCount} anomalia{preventive.anomalyCount !== 1 ? 's' : ''} detectada{preventive.anomalyCount !== 1 ? 's' : ''}
                        </p>
                      )}
                      {checkout?.issues && (
                        <p className="font-sans text-sm text-hm-slate mt-1 whitespace-pre-wrap">{checkout.issues}</p>
                      )}
                    </div>
                    <span className={`text-xs font-sans font-semibold rounded-full px-2 py-0.5 shrink-0 ${
                      isMajorCheckout || isCorrectiveUnresolved ? "bg-hm-red/10 text-hm-red" : "bg-hm-gold/15 text-hm-gold-dk"
                    }`}>
                      {isCorrectiveUnresolved ? "Pendente" : isPreventiveAnomaly ? "Anomalia" : isMajorCheckout ? "Major" : "Minor"}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Upcoming visits */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold text-hm-black">Upcoming visits</h2>
          <span className="font-sans text-sm text-hm-slate/60">{upcoming.length} scheduled</span>
        </div>

        {upcoming.length === 0 ? (
          <div className="rounded-hm border border-hm-border p-8 text-center"
               style={{ background: "var(--hm-sand)" }}>
            <Calendar className="h-10 w-10 mx-auto mb-2 text-hm-slate/30" />
            <p className="font-serif text-lg text-hm-black">No visits scheduled</p>
            <p className="font-sans text-sm text-hm-slate/60 mt-1">
              Your property is in good hands — we will schedule the next visit automatically.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.slice(0, 6).map(t => {
              const Icon = TYPE_ICON[t.type] ?? Wrench
              const overdue = new Date(t.dueDate) < new Date()
              return (
                <div key={t.id} className="rounded-hm border border-hm-border p-4 flex items-start gap-4"
                     style={{ background: "var(--hm-sand)" }}>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                       style={{ background: "var(--hm-gold)" }}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif font-semibold text-hm-black">{t.title}</p>
                    <p className="font-sans text-sm text-hm-slate/70">
                      {TYPE_LABEL[t.type] ?? t.type} · {t.property.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-sans text-sm font-semibold ${overdue ? "text-hm-red" : "text-hm-black"}`}>
                      {fmtDate(t.dueDate)}
                    </p>
                    <p className="font-sans text-xs text-hm-slate/60 capitalize">
                      {t.status.replace("_", " ").toLowerCase()}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent visit history */}
      <div>
        <h2 className="font-serif text-xl font-bold text-hm-black mb-4">Recent visit history</h2>
        {completed.length === 0 ? (
          <div className="rounded-hm border border-hm-border p-8 text-center"
               style={{ background: "var(--hm-sand)" }}>
            <FileText className="h-10 w-10 mx-auto mb-2 text-hm-slate/30" />
            <p className="font-sans text-hm-slate/60">No visits completed yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {completed.map(t => {
              const Icon = TYPE_ICON[t.type] ?? CheckCircle2
              const report = parseReport(t.notes)
              const preventive = (report && 'type' in report && report.type === 'preventive') ? report as PreventiveReport : null
              const corrective = (report && 'type' in report && report.type === 'corrective') ? report as CorrectiveReport : null
              const checkout   = (report && 'condition' in report) ? report as CheckoutReport : null
              return (
                <div key={t.id} className="rounded-hm border border-hm-border p-4"
                     style={{ background: "var(--hm-sand)" }}>
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                         style={{ background: corrective && !corrective.resolved ? "var(--hm-red)" : "var(--hm-green)" }}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-serif font-semibold text-hm-black">{t.title}</p>
                        <span className="font-sans text-xs text-hm-slate/60">{fmtRelative(t.dueDate)}</span>
                      </div>
                      <p className="font-sans text-sm text-hm-slate/70">
                        {TYPE_LABEL[t.type] ?? t.type} · {t.property.name}
                        {t.assignee && ` · by ${t.assignee.name ?? t.assignee.email}`}
                      </p>

                      {/* Preventive report */}
                      {preventive && (
                        <div className="mt-3 rounded-lg border border-hm-border p-3 bg-white space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-sans text-xs font-semibold text-hm-green">
                              ✓ {preventive.checkedCount}/{preventive.totalCount} itens verificados
                            </span>
                            {preventive.anomalyCount > 0 && (
                              <span className="font-sans text-xs font-semibold text-hm-gold-dk">
                                ⚠ {preventive.anomalyCount} anomalia{preventive.anomalyCount !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          {preventive.sections?.flatMap(sec => sec.items.filter(i => i.anomaly)).length > 0 && (
                            <div>
                              <p className="font-sans text-xs text-hm-slate/60 mb-1">Anomalias detectadas:</p>
                              {preventive.sections.flatMap(sec => sec.items.filter(i => i.anomaly)).map((item, i) => (
                                <p key={i} className="font-sans text-xs text-hm-slate">⚠ {item.label}{item.note ? ` — ${item.note}` : ''}</p>
                              ))}
                            </div>
                          )}
                          {preventive.photoUrls && preventive.photoUrls.length > 0 && (
                            <div className="grid grid-cols-3 gap-1.5 pt-1">
                              {preventive.photoUrls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                   className="block rounded overflow-hidden border aspect-video bg-gray-100">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Corrective report */}
                      {corrective && (
                        <div className="mt-3 rounded-lg border border-hm-border p-3 bg-white space-y-2">
                          <p className="font-sans text-sm text-hm-slate">{corrective.problem}</p>
                          <div className="flex flex-wrap gap-3">
                            <span className={`font-sans text-xs font-semibold rounded-full px-2 py-0.5 ${corrective.resolved ? 'bg-hm-green/10 text-hm-green' : 'bg-hm-red/10 text-hm-red'}`}>
                              {corrective.resolved ? 'Resolvido' : 'Pendente'}
                            </span>
                            <span className="font-sans text-xs text-hm-slate/60">
                              {CORRECTIVE_ACTION_LABELS[corrective.actionTaken] ?? corrective.actionTaken}
                            </span>
                            {corrective.cost != null && corrective.cost > 0 && (
                              <span className="font-sans text-xs text-hm-slate/60">€{corrective.cost}</span>
                            )}
                          </div>
                          {corrective.rootCause && (
                            <p className="font-sans text-xs text-hm-slate/70">Causa: {corrective.rootCause}</p>
                          )}
                          {corrective.photoUrls && corrective.photoUrls.length > 0 && (
                            <div className="grid grid-cols-3 gap-1.5 pt-1">
                              {corrective.photoUrls.map((url, i) => (
                                <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                                   className="block rounded overflow-hidden border aspect-video bg-gray-100">
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={url} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Checkout / legacy report */}
                      {checkout && (
                        <div className="mt-3 rounded-lg border border-hm-border p-3 bg-white">
                          <span className={`inline-flex items-center text-xs font-sans font-semibold rounded-full px-2 py-0.5 ${
                            checkout.condition === "good" ? "bg-hm-green/10 text-hm-green"
                              : checkout.condition === "minor" ? "bg-hm-gold/15 text-hm-gold-dk"
                              : "bg-hm-red/10 text-hm-red"
                          }`}>
                            {checkout.condition === "good" ? "Good condition" : checkout.condition === "minor" ? "Minor issues" : "Major issues"}
                          </span>
                          {checkout.issues && <p className="font-sans text-sm text-hm-slate mt-1 whitespace-pre-wrap">{checkout.issues}</p>}
                          {checkout.damages && <p className="font-sans text-xs text-hm-slate/70 mt-1"><strong>Damages:</strong> {checkout.damages}</p>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Request modal */}
      {showRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowRequest(false)}>
          <div className="w-full max-w-lg rounded-hm shadow-xl" style={{ background: "var(--hm-ivory)" }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-hm-border">
              <div>
                <h2 className="font-serif text-lg font-bold text-hm-black">Request a visit</h2>
                <p className="font-sans text-sm text-hm-slate/70 mt-0.5">We will get back to you within hours.</p>
              </div>
              <button onClick={() => setShowRequest(false)} className="text-hm-slate/40 hover:text-hm-slate">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitRequest} className="p-5 space-y-4">
              {reqError && (
                <div className="rounded-lg bg-hm-red/10 border border-hm-red/30 text-hm-red text-sm px-3 py-2">{reqError}</div>
              )}
              {properties.length > 1 && (
                <div>
                  <label className="block font-sans text-xs font-semibold uppercase tracking-widest text-hm-slate/60 mb-1.5">
                    Property
                  </label>
                  <select
                    value={reqForm.propertyId}
                    onChange={e => setReqForm(f => ({ ...f, propertyId: e.target.value }))}
                    className="w-full rounded-lg border border-hm-border bg-white px-3 py-2.5 font-sans text-sm text-hm-black focus:outline-none focus:ring-2 focus:ring-hm-gold"
                  >
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block font-sans text-xs font-semibold uppercase tracking-widest text-hm-slate/60 mb-1.5">
                  What do you need?
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {REQUEST_TYPES.map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setReqForm(f => ({ ...f, type: t.value }))}
                      className={`text-left rounded-lg border px-4 py-3 transition-colors ${
                        reqForm.type === t.value
                          ? "border-hm-gold bg-hm-gold/5"
                          : "border-hm-border bg-white hover:bg-hm-sand"
                      }`}
                    >
                      <div className="font-serif font-semibold text-hm-black">{t.label}</div>
                      <div className="font-sans text-xs text-hm-slate/60 mt-0.5">{t.hint}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-sans text-xs font-semibold uppercase tracking-widest text-hm-slate/60 mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  value={reqForm.title}
                  onChange={e => setReqForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Kitchen tap is dripping"
                  className="w-full rounded-lg border border-hm-border bg-white px-3 py-2.5 font-sans text-sm text-hm-black focus:outline-none focus:ring-2 focus:ring-hm-gold"
                />
              </div>
              <div>
                <label className="block font-sans text-xs font-semibold uppercase tracking-widest text-hm-slate/60 mb-1.5">
                  Notes for our team
                </label>
                <textarea
                  rows={3}
                  value={reqForm.description}
                  onChange={e => setReqForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Photos? Specific location? Any context that helps."
                  className="w-full rounded-lg border border-hm-border bg-white px-3 py-2.5 font-sans text-sm text-hm-black focus:outline-none focus:ring-2 focus:ring-hm-gold"
                />
              </div>
              <div>
                <label className="block font-sans text-xs font-semibold uppercase tracking-widest text-hm-slate/60 mb-1.5">
                  Preferred date *
                </label>
                <input
                  type="date"
                  value={reqForm.dueDate}
                  onChange={e => setReqForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full rounded-lg border border-hm-border bg-white px-3 py-2.5 font-sans text-sm text-hm-black focus:outline-none focus:ring-2 focus:ring-hm-gold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowRequest(false)}
                        className="rounded-lg border border-hm-border px-4 py-2.5 font-sans text-sm hover:bg-hm-sand">
                  Cancel
                </button>
                <button type="submit" disabled={requesting}
                        className="rounded-lg px-5 py-2.5 font-sans font-semibold text-sm text-white disabled:opacity-50"
                        style={{ background: "var(--hm-black)" }}>
                  {requesting ? "Sending…" : "Send request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
