"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Wrench, ShieldCheck, Sparkles, Camera, Clock, CheckCircle2,
  AlertTriangle, Plus, X, Calendar, FileText, MessageCircle, Loader2,
} from "lucide-react"
import { useEscapeKey } from "@/lib/use-escape-key"
import { showToast } from "@/components/hm/toast"
import { useLocale } from "@/i18n/provider"
import { intlLocale, type Locale } from "@/i18n"

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

function useFmtDate() {
  const { locale } = useLocale()
  const loc = intlLocale(locale as Locale)
  return (s: string) => new Date(s).toLocaleDateString(loc, { day: "2-digit", month: "long", year: "numeric" })
}

function useFmtRelative() {
  const { locale } = useLocale()
  const loc = intlLocale(locale as Locale)
  return (s: string) => {
    const diff = Date.now() - new Date(s).getTime()
    const days = Math.floor(diff / 86_400_000)
    try {
      const rtf = new Intl.RelativeTimeFormat(loc, { numeric: 'auto' })
      if (days <= 0) return rtf.format(0, 'day')
      if (days < 30) return rtf.format(-days, 'day')
      if (days < 365) return rtf.format(-Math.floor(days / 30), 'month')
      return rtf.format(-Math.floor(days / 365), 'year')
    } catch {
      return `${days}d`
    }
  }
}

const TYPE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  CLEANING: Sparkles,
  MAINTENANCE_PREVENTIVE: ShieldCheck,
  MAINTENANCE_CORRECTIVE: Wrench,
  INSPECTION: ShieldCheck,
  CHECK_IN: Calendar,
  CHECK_OUT: Camera,
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
  const { t } = useLocale()
  const fmtDate = useFmtDate()
  const fmtRelative = useFmtRelative()
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

  const TYPE_LABEL: Record<string, string> = {
    CLEANING: t('taskTypes.CLEANING'),
    MAINTENANCE_PREVENTIVE: t('taskTypes.MAINTENANCE_PREVENTIVE'),
    MAINTENANCE_CORRECTIVE: t('taskTypes.MAINTENANCE_CORRECTIVE'),
    INSPECTION: t('taskTypes.INSPECTION'),
    CHECK_IN: t('taskTypes.CHECK_IN'),
    CHECK_OUT: t('taskTypes.CHECK_OUT'),
    TRANSFER: t('taskTypes.TRANSFER'),
    SHOPPING: t('taskTypes.SHOPPING'),
    LAUNDRY: t('taskTypes.LAUNDRY'),
  }

  const REQUEST_TYPES = [
    { value: "MAINTENANCE_CORRECTIVE", label: t('client.care.repair'),       hint: t('client.care.repairDesc') },
    { value: "CLEANING",               label: t('client.care.extraCleaning'),     hint: t('client.care.extraCleaningDesc') },
    { value: "INSPECTION",             label: t('client.care.propertyCheck'),     hint: t('client.care.propertyCheckDesc') },
  ]

  const CORRECTIVE_ACTION_LABELS: Record<string, string> = {
    repaired:       t('client.care.correctiveRepaired'),
    specialist:     t('client.care.correctiveSpecialist'),
    temporary_fix:  t('client.care.correctiveTempFix'),
    pending_parts:  t('client.care.correctivePendingParts'),
    no_action:      t('client.care.correctiveNoAction'),
  }

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
      setReqError(t('client.care.fillRequired'))
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
        setReqError(err.error ?? t('client.care.couldNotSend'))
      } else {
        setShowRequest(false)
        setReqForm(f => ({ ...f, title: "", description: "", dueDate: "" }))
        showToast(t('client.care.requestSent'), 'success')
        await load()
      }
    } catch {
      setReqError(t('client.care.networkError'))
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
      <div className="p-4 text-sm text-red-500">{t('client.care.loadFailed')}</div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-hm-black">{t('client.care.title')}</h1>
          <p className="mt-1 font-sans text-lg text-hm-slate/70">
            {t('client.care.subtitle')}
          </p>
        </div>
        <button
          onClick={() => setShowRequest(true)}
          className="inline-flex items-center gap-2 rounded-lg px-5 py-3 font-sans font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--hm-gold-dk)", minHeight: "44px" }}
        >
          <Plus className="h-4 w-4" />
          {t('client.care.requestVisit')}
        </button>
      </div>

      {/* Issues needing attention */}
      {issuesNeedingAttention.length > 0 && (
        <div className="rounded-hm border border-hm-red/30 p-5"
             style={{ background: "rgba(163,45,45,0.05)" }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-hm-red" />
            <h2 className="font-serif font-bold text-hm-black">{t('client.care.issuesFlagged')}</h2>
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
                          {preventive.anomalyCount} {preventive.anomalyCount !== 1 ? t('client.care.anomaliesDetected') : t('client.care.anomalyDetected')}
                        </p>
                      )}
                      {checkout?.issues && (
                        <p className="font-sans text-sm text-hm-slate mt-1 whitespace-pre-wrap">{checkout.issues}</p>
                      )}
                    </div>
                    <span className={`text-xs font-sans font-semibold rounded-full px-2 py-0.5 shrink-0 ${
                      isMajorCheckout || isCorrectiveUnresolved ? "bg-hm-red/10 text-hm-red" : "bg-hm-gold/15 text-hm-gold-dk"
                    }`}>
                      {isCorrectiveUnresolved ? t('client.care.pendingStatus') : isPreventiveAnomaly ? t('client.care.anomalyStatus') : isMajorCheckout ? t('client.care.majorIssues') : t('client.care.minorIssues')}
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
          <h2 className="font-serif text-xl font-bold text-hm-black">{t('client.care.upcoming')}</h2>
          <span className="font-sans text-sm text-hm-slate/60">{upcoming.length} {t('client.care.scheduled')}</span>
        </div>

        {upcoming.length === 0 ? (
          <div className="rounded-hm border border-hm-border p-10 text-center"
               style={{ background: "var(--hm-sand)" }}>
            <div className="h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4"
                 style={{ background: "rgba(var(--hm-green-rgb, 76,140,74), 0.15)" }}>
              <ShieldCheck className="h-6 w-6" style={{ color: "var(--hm-green)" }} />
            </div>
            <h3 className="font-serif text-lg font-bold text-hm-black mb-1">{t('client.care.goodShape')}</h3>
            <p className="font-sans text-sm text-hm-slate/60 mb-4 max-w-sm mx-auto">
              {t('client.care.noScheduledDesc')}
            </p>
            <button
              onClick={() => setShowRequest(true)}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 font-sans font-semibold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: "var(--hm-gold-dk)" }}
            >
              <Plus className="h-4 w-4" />
              {t('client.care.requestMaintenance')}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.slice(0, 6).map(tk => {
              const Icon = TYPE_ICON[tk.type] ?? Wrench
              const overdue = new Date(tk.dueDate) < new Date()
              return (
                <div key={tk.id} className="rounded-hm border border-hm-border p-4 flex items-start gap-4"
                     style={{ background: "var(--hm-sand)" }}>
                  <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                       style={{ background: "var(--hm-gold)" }}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-serif font-semibold text-hm-black">{tk.title}</p>
                    <p className="font-sans text-sm text-hm-slate/70">
                      {TYPE_LABEL[tk.type] ?? tk.type} · {tk.property.name}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-sans text-sm font-semibold ${overdue ? "text-hm-red" : "text-hm-black"}`}>
                      {fmtDate(tk.dueDate)}
                    </p>
                    <p className="font-sans text-xs text-hm-slate/60 capitalize">
                      {tk.status.replace("_", " ").toLowerCase()}
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
        <h2 className="font-serif text-xl font-bold text-hm-black mb-4">{t('client.care.recentHistory')}</h2>
        {completed.length === 0 ? (
          <div className="rounded-hm border border-hm-border p-10 text-center"
               style={{ background: "var(--hm-sand)" }}>
            <div className="h-12 w-12 rounded-full flex items-center justify-center mx-auto mb-4"
                 style={{ background: "var(--hm-border)" }}>
              <FileText className="h-6 w-6 text-hm-slate/40" />
            </div>
            <h3 className="font-serif text-lg font-bold text-hm-black mb-1">{t('client.care.noCompletedTitle')}</h3>
            <p className="font-sans text-sm text-hm-slate/60 max-w-sm mx-auto">
              {t('client.care.noCompletedDesc')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {completed.map(tk => {
              const Icon = TYPE_ICON[tk.type] ?? CheckCircle2
              const report = parseReport(tk.notes)
              const preventive = (report && 'type' in report && report.type === 'preventive') ? report as PreventiveReport : null
              const corrective = (report && 'type' in report && report.type === 'corrective') ? report as CorrectiveReport : null
              const checkout   = (report && 'condition' in report) ? report as CheckoutReport : null
              return (
                <div key={tk.id} className="rounded-hm border border-hm-border p-4"
                     style={{ background: "var(--hm-sand)" }}>
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full flex items-center justify-center shrink-0"
                         style={{ background: corrective && !corrective.resolved ? "var(--hm-red)" : "var(--hm-green)" }}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-serif font-semibold text-hm-black">{tk.title}</p>
                        <span className="font-sans text-xs text-hm-slate/60">{fmtRelative(tk.dueDate)}</span>
                      </div>
                      <p className="font-sans text-sm text-hm-slate/70">
                        {TYPE_LABEL[tk.type] ?? tk.type} · {tk.property.name}
                        {tk.assignee && ` · ${t('client.care.by')} ${tk.assignee.name ?? tk.assignee.email}`}
                      </p>

                      {preventive && (
                        <div className="mt-3 rounded-lg border border-hm-border p-3 bg-white space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-sans text-xs font-semibold text-hm-green">
                              ✓ {preventive.checkedCount}/{preventive.totalCount} {t('client.care.itemsVerified')}
                            </span>
                            {preventive.anomalyCount > 0 && (
                              <span className="font-sans text-xs font-semibold text-hm-gold-dk">
                                ⚠ {preventive.anomalyCount} {preventive.anomalyCount !== 1 ? t('client.care.anomaliesDetected') : t('client.care.anomalyDetected')}
                              </span>
                            )}
                          </div>
                          {preventive.sections?.flatMap(sec => sec.items.filter(i => i.anomaly)).length > 0 && (
                            <div>
                              <p className="font-sans text-xs text-hm-slate/60 mb-1">{t('client.care.anomaliesLabel')}</p>
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

                      {corrective && (
                        <div className="mt-3 rounded-lg border border-hm-border p-3 bg-white space-y-2">
                          <p className="font-sans text-sm text-hm-slate">{corrective.problem}</p>
                          <div className="flex flex-wrap gap-3">
                            <span className={`font-sans text-xs font-semibold rounded-full px-2 py-0.5 ${corrective.resolved ? 'bg-hm-green/10 text-hm-green' : 'bg-hm-red/10 text-hm-red'}`}>
                              {corrective.resolved ? t('client.care.resolved') : t('client.care.pendingStatus')}
                            </span>
                            <span className="font-sans text-xs text-hm-slate/60">
                              {CORRECTIVE_ACTION_LABELS[corrective.actionTaken] ?? corrective.actionTaken}
                            </span>
                            {corrective.cost != null && corrective.cost > 0 && (
                              <span className="font-sans text-xs text-hm-slate/60">€{corrective.cost}</span>
                            )}
                          </div>
                          {corrective.rootCause && (
                            <p className="font-sans text-xs text-hm-slate/70">{t('client.care.cause')} {corrective.rootCause}</p>
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

                      {checkout && (
                        <div className="mt-3 rounded-lg border border-hm-border p-3 bg-white">
                          <span className={`inline-flex items-center text-xs font-sans font-semibold rounded-full px-2 py-0.5 ${
                            checkout.condition === "good" ? "bg-hm-green/10 text-hm-green"
                              : checkout.condition === "minor" ? "bg-hm-gold/15 text-hm-gold-dk"
                              : "bg-hm-red/10 text-hm-red"
                          }`}>
                            {checkout.condition === "good" ? t('client.care.goodCondition') : checkout.condition === "minor" ? t('client.care.minorIssues') : t('client.care.majorIssues')}
                          </span>
                          {checkout.issues && <p className="font-sans text-sm text-hm-slate mt-1 whitespace-pre-wrap">{checkout.issues}</p>}
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
                <h2 className="font-serif text-lg font-bold text-hm-black">{t('client.care.requestVisit')}</h2>
                <p className="font-sans text-sm text-hm-slate/70 mt-0.5">{t('client.care.requestSubtitle')}</p>
              </div>
              <button onClick={() => setShowRequest(false)} aria-label="Close" className="text-hm-slate/40 hover:text-hm-slate">
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
                    {t('client.care.property')}
                  </label>
                  <select
                    required
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
                  {t('client.care.whatDoYouNeed')}
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {REQUEST_TYPES.map(rt => (
                    <button
                      key={rt.value}
                      type="button"
                      onClick={() => setReqForm(f => ({ ...f, type: rt.value }))}
                      className={`text-left rounded-lg border px-4 py-3 transition-colors ${
                        reqForm.type === rt.value
                          ? "border-hm-gold bg-hm-gold/5"
                          : "border-hm-border bg-white hover:bg-hm-sand"
                      }`}
                    >
                      <div className="font-serif font-semibold text-hm-black">{rt.label}</div>
                      <div className="font-sans text-xs text-hm-slate/60 mt-0.5">{rt.hint}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-sans text-xs font-semibold uppercase tracking-widest text-hm-slate/60 mb-1.5">
                  {t('client.care.titleField')} *
                </label>
                <input
                  type="text"
                  required
                  value={reqForm.title}
                  onChange={e => setReqForm(f => ({ ...f, title: e.target.value }))}
                  placeholder={t('client.care.titlePlaceholder')}
                  className="w-full rounded-lg border border-hm-border bg-white px-3 py-2.5 font-sans text-sm text-hm-black focus:outline-none focus:ring-2 focus:ring-hm-gold"
                />
              </div>
              <div>
                <label className="block font-sans text-xs font-semibold uppercase tracking-widest text-hm-slate/60 mb-1.5">
                  {t('client.care.notesForTeam')}
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={reqForm.description}
                  onChange={e => setReqForm(f => ({ ...f, description: e.target.value }))}
                  placeholder={t('client.care.notesPlaceholder')}
                  className="w-full rounded-lg border border-hm-border bg-white px-3 py-2.5 font-sans text-sm text-hm-black focus:outline-none focus:ring-2 focus:ring-hm-gold"
                />
                <div className="text-right text-xs text-gray-400 mt-1">
                  {reqForm.description.length}/500
                </div>
              </div>
              <div>
                <label className="block font-sans text-xs font-semibold uppercase tracking-widest text-hm-slate/60 mb-1.5">
                  {t('client.care.preferredDate')} *
                </label>
                <input
                  type="date"
                  required
                  value={reqForm.dueDate}
                  onChange={e => setReqForm(f => ({ ...f, dueDate: e.target.value }))}
                  className="w-full rounded-lg border border-hm-border bg-white px-3 py-2.5 font-sans text-sm text-hm-black focus:outline-none focus:ring-2 focus:ring-hm-gold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowRequest(false)}
                        className="rounded-lg border border-hm-border px-4 py-2.5 font-sans text-sm hover:bg-hm-sand">
                  {t('common.cancel')}
                </button>
                <button type="submit" disabled={requesting}
                        className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-sans font-semibold text-sm text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ background: "var(--hm-black)" }}>
                  {requesting ? (<><Loader2 className="h-4 w-4 animate-spin" /> {t('client.care.sending')}</>) : t('client.care.sendRequest')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
