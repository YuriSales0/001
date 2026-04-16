"use client"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  Wrench, Calendar, MapPin, ClipboardCheck, CheckCircle2, PlayCircle,
  AlertTriangle, Clock, ChevronRight, Loader2, Camera, Save, X, ImagePlus,
} from "lucide-react"
import { DashboardGreeting } from "@/components/hm/dashboard-entrance"
import { showToast } from "@/components/hm/toast"
import { useLocale } from "@/i18n/provider"

type ChecklistItem = { text: string; done: boolean }
type Task = {
  id: string
  title: string
  type: string
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED"
  dueDate: string
  description: string | null
  notes: string | null
  checklist: ChecklistItem[] | null
  photos: string[]
  property: { id: string; name: string; address: string; city: string }
}

// Compress a File to a small JPEG data URL before upload
async function compressPhoto(file: File, maxDim = 1280, quality = 0.72): Promise<string> {
  const bitmap = await createImageBitmap(file)
  const ratio = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * ratio)
  const h = Math.round(bitmap.height * ratio)
  const canvas = document.createElement("canvas")
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas not supported")
  ctx.drawImage(bitmap, 0, 0, w, h)
  return canvas.toDataURL("image/jpeg", quality)
}

const TYPE_KEYS = [
  'CLEANING', 'MAINTENANCE_PREVENTIVE', 'MAINTENANCE_CORRECTIVE', 'INSPECTION',
  'CHECK_IN', 'CHECK_OUT', 'TRANSFER', 'SHOPPING', 'LAUNDRY',
] as const

const TYPE_COLOR: Record<string, string> = {
  CLEANING: "bg-blue-100 text-blue-700",
  MAINTENANCE_PREVENTIVE: "bg-emerald-100 text-emerald-700",
  MAINTENANCE_CORRECTIVE: "bg-red-100 text-red-700",
  INSPECTION: "bg-violet-100 text-violet-700",
  CHECK_IN: "bg-amber-100 text-amber-700",
  CHECK_OUT: "bg-orange-100 text-orange-700",
  TRANSFER: "bg-cyan-100 text-cyan-700",
  SHOPPING: "bg-pink-100 text-pink-700",
  LAUNDRY: "bg-indigo-100 text-indigo-700",
}

const fmtDateTime = (s: string) =>
  new Date(s).toLocaleString("en-GB", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  })

const dayKey = (s: string) => {
  const d = new Date(s)
  d.setHours(0, 0, 0, 0)
  return d.toISOString().slice(0, 10)
}

export default function CrewHome() {
  const { t } = useLocale()
  const typeLabel = (type: string) =>
    (TYPE_KEYS as readonly string[]).includes(type) ? t(`crew.taskTypes.${type}`) : type
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Task | null>(null)
  const [filter, setFilter] = useState<"open" | "today" | "done">("open")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [checkout, setCheckout] = useState({
    condition: "good",
    issues: "",
    damages: "",
    notes: "",
  })
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadPhoto = async (file: File) => {
    if (!selected) return
    setUploadingPhoto(true)
    try {
      const dataUrl = await compressPhoto(file)
      const res = await fetch(`/api/tasks/${selected.id}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photo: dataUrl }),
      })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) {
        showToast(result.error ?? t('crew.home.photoUploadFailed'), "error")
        return
      }
      setTasks(prev => prev.map(t => t.id === selected.id ? { ...t, photos: result.photos } : t))
      setSelected(s => s ? { ...s, photos: result.photos } : s)
    } catch (err) {
      console.error(err)
      showToast(t('crew.home.photoProcessFailed'), "error")
    } finally {
      setUploadingPhoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const removePhoto = async (index: number) => {
    if (!selected) return
    const res = await fetch(`/api/tasks/${selected.id}/photos?index=${index}`, {
      method: "DELETE",
    })
    const result = await res.json().catch(() => ({}))
    if (!res.ok) {
      showToast(result.error ?? t('crew.home.photoRemoveFailed'), "error")
      return
    }
    setTasks(prev => prev.map(t => t.id === selected.id ? { ...t, photos: result.photos } : t))
    setSelected(s => s ? { ...s, photos: result.photos } : s)
  }

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/tasks")
      if (!res.ok) throw new Error("Failed to load tasks")
      const data: Task[] = await res.json()
      setTasks(data)
      if (selected) {
        const fresh = data.find(t => t.id === selected.id)
        if (fresh) setSelected(fresh)
      }
    } catch {
      setError(t('crew.home.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const todayKey = useMemo(() => dayKey(new Date().toISOString()), [])

  const visible = useMemo(() => {
    let list = tasks
    if (filter === "open") list = tasks.filter(t => t.status !== "COMPLETED")
    else if (filter === "today") list = tasks.filter(t => dayKey(t.dueDate) === todayKey && t.status !== "COMPLETED")
    else list = tasks.filter(t => t.status === "COMPLETED")
    return list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [tasks, filter, todayKey])

  const counts = useMemo(() => ({
    open: tasks.filter(t => t.status !== "COMPLETED").length,
    today: tasks.filter(t => dayKey(t.dueDate) === todayKey && t.status !== "COMPLETED").length,
    done: tasks.filter(t => t.status === "COMPLETED").length,
  }), [tasks, todayKey])

  const patchTask = async (body: Record<string, unknown>) => {
    if (!selected) return
    setSaving(true)
    const res = await fetch(`/api/tasks/${selected.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const fresh: Task = await res.json()
      setTasks(prev => prev.map(t => (t.id === fresh.id ? fresh : t)))
      setSelected(fresh)
    }
    setSaving(false)
  }

  const startTask = () => patchTask({ status: "IN_PROGRESS" })

  const toggleChecklistItem = (idx: number) => {
    if (!selected) return
    const list = (selected.checklist ?? []).map((it, i) => (i === idx ? { ...it, done: !it.done } : it))
    patchTask({ checklist: list })
  }

  const submitCheckout = () => {
    if (!selected) return
    patchTask({
      checkoutCondition: checkout.condition,
      checkoutIssues: checkout.issues,
      checkoutDamages: checkout.damages,
      checkoutNotes: checkout.notes,
    })
  }

  const completeRegular = () => patchTask({ status: "COMPLETED" })

  const isCheckout = selected?.type === "CHECK_OUT"
  const requiresPhotos = selected?.type === "CHECK_OUT" || selected?.type === "CLEANING"
  const photoCount = selected?.photos?.length ?? 0
  const hasMinPhotos = !requiresPhotos || photoCount >= 2
  const checklistDone = selected?.checklist?.filter(c => c.done).length ?? 0
  const checklistTotal = selected?.checklist?.length ?? 0
  const allChecklistDone = checklistTotal > 0 && checklistDone === checklistTotal

  return (
    <div className="flex h-[calc(100vh-3.25rem)]" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* List */}
      <aside className={`w-full lg:w-80 border-r bg-white flex flex-col shrink-0 ${selected ? 'hidden lg:flex' : 'flex'}`}>
        <div className="px-4 py-3 border-b hm-animate-in hm-stagger-1">
          <DashboardGreeting
            headingClass="text-lg font-bold text-navy-900"
            dateClass="text-xs text-gray-500 mt-0.5"
          />
        </div>

        <div className="flex border-b hm-animate-in hm-stagger-2">
          {[
            { k: "today", l: `${t('crew.today')} (${counts.today})` },
            { k: "open",  l: `${t('crew.open')} (${counts.open})` },
            { k: "done",  l: `${t('crew.done')} (${counts.done})` },
          ].map(f => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k as typeof filter)}
              className={`flex-1 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                filter === f.k
                  ? "border-navy-900 text-navy-900"
                  : "border-transparent text-gray-500 hover:text-navy-900"
              }`}
            >
              {f.l}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto divide-y hm-animate-in hm-stagger-3">
          {loading && (
            <div className="p-6 flex items-center gap-2 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" /> {t('crew.home.loading')}
            </div>
          )}
          {!loading && error && (
            <div className="p-6 text-center text-sm text-red-500">
              <AlertTriangle className="h-8 w-8 mx-auto text-red-300 mb-1" />
              {error}
            </div>
          )}
          {!loading && !error && visible.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-400">
              {filter === "done" ? (
                <>
                  <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  </div>
                  <p className="font-semibold text-gray-700 mb-0.5">{t('crew.home.allCaughtUp')}</p>
                  <p className="text-xs text-gray-400">{t('crew.home.allCaughtUpBody')}</p>
                </>
              ) : filter === "today" ? (
                <>
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="font-semibold text-gray-700 mb-0.5">{t('crew.home.nothingToday')}</p>
                  <p className="text-xs text-gray-400">{t('crew.home.nothingTodayBody')}</p>
                </>
              ) : (
                <>
                  <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <p className="font-semibold text-gray-700 mb-0.5">{t('crew.home.noOpen')}</p>
                  <p className="text-xs text-gray-400">{t('crew.home.noOpenBody')}</p>
                </>
              )}
            </div>
          )}
          {visible.map(t => {
            const active = selected?.id === t.id
            const overdue = t.status !== "COMPLETED" && new Date(t.dueDate) < new Date()
            return (
              <button
                key={t.id}
                onClick={() => { setSelected(t); setCheckout({ condition: "good", issues: "", damages: "", notes: "" }) }}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                  active ? "bg-navy-50 border-l-2 border-l-navy-700" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold text-navy-900 truncate">{t.title}</span>
                  <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 shrink-0 ${TYPE_COLOR[t.type] ?? "bg-gray-100 text-gray-700"}`}>
                    {typeLabel(t.type).split(" ")[0]}
                  </span>
                </div>
                <div className="text-xs text-gray-500 truncate flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {t.property.name}
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className={`text-[11px] ${overdue ? "text-red-600 font-semibold" : "text-gray-500"}`}>
                    <Clock className="h-3 w-3 inline mr-0.5" />
                    {fmtDateTime(t.dueDate)}
                  </span>
                  <span className={`text-[10px] rounded-full px-1.5 py-0.5 font-medium ${
                    t.status === "COMPLETED" ? "bg-green-100 text-green-700"
                      : t.status === "IN_PROGRESS" ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {t.status.replace("_", " ").toLowerCase()}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </aside>

      {/* Detail */}
      <main className={`flex-1 overflow-y-auto bg-gray-50 ${!selected ? 'hidden lg:block' : 'block'}`}>
        {!selected ? (
          <div className="h-full flex items-center justify-center text-gray-400 text-sm">
            <div className="text-center">
              <ClipboardCheck className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              Select a task to view its checklist and submit a report.
            </div>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto p-6 space-y-5">
            {/* Back button (mobile) */}
            <button
              onClick={() => setSelected(null)}
              className="lg:hidden inline-flex items-center gap-1 text-sm text-gray-600 hover:text-navy-900 mb-2"
            >
              <span aria-hidden="true">&larr;</span> Back to tasks
            </button>
            {/* Header */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${TYPE_COLOR[selected.type] ?? "bg-gray-100 text-gray-700"}`}>
                  {typeLabel(selected.type)}
                </span>
                <span className={`text-xs font-semibold rounded-full px-2.5 py-0.5 ${
                  selected.status === "COMPLETED" ? "bg-green-100 text-green-700"
                    : selected.status === "IN_PROGRESS" ? "bg-amber-100 text-amber-700"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {selected.status.replace("_", " ").toLowerCase()}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-navy-900">{selected.title}</h2>
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {selected.property.name} · {selected.property.address}, {selected.property.city}
              </p>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> Due {fmtDateTime(selected.dueDate)}
              </p>
            </div>

            {selected.description && (
              <div className="rounded-xl border bg-white p-4 text-sm text-gray-700">
                {selected.description}
              </div>
            )}

            {/* Start button */}
            {selected.status === "PENDING" && (
              <button
                onClick={startTask}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 text-white py-3 font-semibold hover:bg-amber-600 disabled:opacity-50"
              >
                <PlayCircle className="h-5 w-5" /> Start task
              </button>
            )}

            {/* Checklist */}
            {selected.checklist && selected.checklist.length > 0 && (
              <div className="rounded-xl border bg-white overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardCheck className="h-4 w-4 text-navy-700" />
                    <span className="font-semibold text-navy-900 text-sm">Checklist</span>
                  </div>
                  <span className="text-xs text-gray-500">{checklistDone}/{checklistTotal}</span>
                </div>
                <div className="divide-y">
                  {selected.checklist.map((item, i) => (
                    <button
                      key={i}
                      disabled={selected.status === "COMPLETED" || saving}
                      onClick={() => toggleChecklistItem(i)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 disabled:opacity-60 flex items-start gap-3"
                    >
                      <span className={`mt-0.5 h-5 w-5 rounded border flex items-center justify-center shrink-0 ${
                        item.done ? "bg-green-500 border-green-500 text-white" : "border-gray-300 bg-white"
                      }`}>
                        {item.done && <CheckCircle2 className="h-4 w-4" />}
                      </span>
                      <span className={`text-sm ${item.done ? "text-gray-400 line-through" : "text-gray-800"}`}>
                        {item.text}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Photo evidence — CHECK_OUT and CLEANING */}
            {requiresPhotos && (
              <div className="rounded-xl border bg-white p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-navy-900 flex items-center gap-2">
                      <Camera className="h-4 w-4" /> {t('crew.home.photoEvidence')}
                      <span className={`text-xs font-bold ${hasMinPhotos ? "text-green-600" : "text-amber-600"}`}>
                        {photoCount}/2+
                      </span>
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {t('crew.home.photoSubtitle')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {(selected.photos ?? []).map((p, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100 group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                      {selected.status !== "COMPLETED" && (
                        <button
                          onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove photo"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {selected.status !== "COMPLETED" && photoCount < 12 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-navy-700 hover:bg-navy-50 flex flex-col items-center justify-center text-gray-500 transition-colors disabled:opacity-50"
                    >
                      {uploadingPhoto ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <ImagePlus className="h-5 w-5 mb-1" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider">{t('crew.home.addPhoto')}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) uploadPhoto(file)
                  }}
                />
              </div>
            )}

            {/* Checkout report — only for CHECK_OUT */}
            {isCheckout && selected.status !== "COMPLETED" && (
              <div className="rounded-xl border bg-white p-5 space-y-4">
                <div>
                  <h3 className="font-semibold text-navy-900 flex items-center gap-2">
                    <Camera className="h-4 w-4" /> Check-out report
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    The owner is notified automatically when you submit.
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Property condition</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { v: "good",  l: "Good",  c: "border-green-300 hover:bg-green-50" },
                      { v: "minor", l: "Minor issues", c: "border-amber-300 hover:bg-amber-50" },
                      { v: "major", l: "Major issues", c: "border-red-300 hover:bg-red-50" },
                    ].map(o => (
                      <button
                        key={o.v}
                        onClick={() => setCheckout(c => ({ ...c, condition: o.v }))}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${o.c} ${
                          checkout.condition === o.v ? "ring-2 ring-navy-700 bg-navy-50" : ""
                        }`}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Observed issues</label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={checkout.issues}
                    onChange={e => setCheckout(c => ({ ...c, issues: e.target.value }))}
                    placeholder="e.g. broken lamp in living room, slow drain in bathroom…"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
                  />
                  <div className="text-right text-xs text-gray-400 mt-1">
                    {checkout.issues.length}/500
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Damages requiring follow-up</label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={checkout.damages}
                    onChange={e => setCheckout(c => ({ ...c, damages: e.target.value }))}
                    placeholder="Describe any damage, cost estimate if known…"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
                  />
                  <div className="text-right text-xs text-gray-400 mt-1">
                    {checkout.damages.length}/500
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Internal notes for the office</label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={checkout.notes}
                    onChange={e => setCheckout(c => ({ ...c, notes: e.target.value }))}
                    placeholder="Anything the office should know…"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
                  />
                  <div className="text-right text-xs text-gray-400 mt-1">
                    {checkout.notes.length}/500
                  </div>
                </div>
                <button
                  onClick={submitCheckout}
                  disabled={saving || (checklistTotal > 0 && !allChecklistDone) || !hasMinPhotos}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 text-white py-3 font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  <Save className="h-5 w-5" /> Submit check-out report
                </button>
                {checklistTotal > 0 && !allChecklistDone && (
                  <p className="text-xs text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> {t('crew.home.completeChecklistFirst')}
                  </p>
                )}
                {!hasMinPhotos && (
                  <p className="text-xs text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> {t('crew.home.min2BeforeSubmit')}
                  </p>
                )}
              </div>
            )}

            {/* Mark complete (non-checkout) */}
            {!isCheckout && selected.status !== "COMPLETED" && (
              <>
                <button
                  onClick={completeRegular}
                  disabled={saving || (checklistTotal > 0 && !allChecklistDone) || !hasMinPhotos}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 text-white py-3 font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle2 className="h-5 w-5" /> Mark task complete
                </button>
                {!hasMinPhotos && (
                  <p className="text-xs text-amber-700 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> {t('crew.home.min2BeforeComplete')}
                  </p>
                )}
              </>
            )}

            {selected.status === "COMPLETED" && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                <div className="flex items-center gap-2 font-semibold mb-1">
                  <CheckCircle2 className="h-4 w-4" /> Task completed
                </div>
                {selected.notes && <p className="text-xs whitespace-pre-wrap">{selected.notes}</p>}
              </div>
            )}

            {saving && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="h-3 w-3 animate-spin" /> {t('crew.home.savingStatus')}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
