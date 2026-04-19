'use client'

import { useEffect, useState } from 'react'
import { Plus, X, Wrench, ShoppingCart, Car, CheckCircle2, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { useLocale } from '@/i18n/provider'
import { useEscapeKey } from '@/lib/use-escape-key'
import { showToast } from "@/components/hm/toast"

type Property = { id: string; name: string }
type Task = {
  id: string
  type: string
  title: string
  status: string
  dueDate: string
  description: string | null
  property: { id: string; name: string }
  assignee: { id: string; name: string | null } | null
}

type ManualType = { value: string; label: string; icon: typeof Wrench; desc: string }

const TYPE_COLORS: Record<string, string> = {
  CHECK_IN:               'bg-green-100 text-green-700',
  CHECK_OUT:              'bg-orange-100 text-orange-700',
  CLEANING:               'bg-blue-100 text-blue-700',
  MAINTENANCE_PREVENTIVE: 'bg-yellow-100 text-yellow-700',
  MAINTENANCE_CORRECTIVE: 'bg-red-100 text-red-700',
  INSPECTION:             'bg-purple-100 text-purple-700',
  TRANSFER:               'bg-sky-100 text-sky-700',
  SHOPPING:               'bg-emerald-100 text-emerald-700',
  LAUNDRY:                'bg-pink-100 text-pink-700',
}

const fmtDate = (s: string, locale: string) => new Date(s).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })

export default function ClientTasksPage() {
  const { t, locale } = useLocale()
  const TYPE_LABELS: Record<string, string> = {
    CHECK_IN:               t('clientTasks.labels.CHECK_IN'),
    CHECK_OUT:              t('clientTasks.labels.CHECK_OUT'),
    CLEANING:               t('clientTasks.labels.CLEANING'),
    MAINTENANCE_PREVENTIVE: t('clientTasks.labels.MAINTENANCE_PREVENTIVE'),
    MAINTENANCE_CORRECTIVE: t('clientTasks.labels.MAINTENANCE_CORRECTIVE'),
    INSPECTION:             t('clientTasks.labels.INSPECTION'),
    TRANSFER:               t('clientTasks.labels.TRANSFER'),
    SHOPPING:               t('clientTasks.labels.SHOPPING'),
    LAUNDRY:                t('clientTasks.labels.LAUNDRY'),
  }
  const MANUAL_TYPES: ManualType[] = [
    { value: 'MAINTENANCE_CORRECTIVE', label: t('clientTasks.labels.MAINTENANCE_CORRECTIVE'), icon: Wrench,       desc: t('clientTasks.descs.correctiveMaintenance') },
    { value: 'CLEANING',               label: t('clientTasks.extraCleaning'),                 icon: Wrench,       desc: t('clientTasks.descs.extraCleaning') },
    { value: 'SHOPPING',               label: t('clientTasks.preArrivalShopping'),            icon: ShoppingCart, desc: t('clientTasks.descs.shopping') },
    { value: 'TRANSFER',               label: t('clientTasks.airportTransfer'),               icon: Car,          desc: t('clientTasks.descs.transfer') },
    { value: 'MAINTENANCE_PREVENTIVE', label: t('clientTasks.labels.MAINTENANCE_PREVENTIVE'), icon: Wrench,       desc: t('clientTasks.descs.preventiveMaintenance') },
    { value: 'INSPECTION',             label: t('clientTasks.labels.INSPECTION'),             icon: Wrench,       desc: t('clientTasks.descs.inspection') },
  ]
  const [tasks, setTasks] = useState<Task[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Form state
  const [form, setForm] = useState({ propertyId: '', type: 'MAINTENANCE_CORRECTIVE', title: '', description: '', dueDate: '' })
  const [submitting, setSubmitting] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEscapeKey(showModal, () => setShowModal(false))

  const load = () => {
    setLoading(true)
    setLoadError(false)
    Promise.all([
      fetch('/api/tasks').then(r => r.ok ? r.json() : []),
      fetch('/api/properties').then(r => r.ok ? r.json() : []),
    ]).then(([ts, p]) => {
      setTasks(ts)
      setProperties(p)
      if (p.length > 0 && !form.propertyId) setForm(f => ({ ...f, propertyId: p[0].id }))
    }).catch(() => {
      setLoadError(true)
    }).finally(() => {
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  const [submitError, setSubmitError] = useState('')

  const submit = async () => {
    if (!form.propertyId || !form.title || !form.dueDate) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setSubmitError(err.error ?? 'Could not create task.')
        return
      }
      setShowModal(false)
      setForm(f => ({ ...f, title: '', description: '', dueDate: '' }))
      showToast('Request sent successfully', 'success')
      load()
    } catch {
      setSubmitError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const now = new Date()
  const filtered = tasks.filter(task => {
    if (statusFilter === 'PENDING')  return task.status !== 'COMPLETED'
    if (statusFilter === 'COMPLETED') return task.status === 'COMPLETED'
    if (statusFilter === 'OVERDUE')  return task.status !== 'COMPLETED' && new Date(task.dueDate) < now
    return true
  })

  const overdueCount = tasks.filter(task => task.status !== 'COMPLETED' && new Date(task.dueDate) < now).length

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-hm-black">{t('clientTasks.title')}</h1>
          <p className="text-sm text-gray-500">{t('clientTasks.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-hm-black text-white px-4 py-2.5 text-sm font-semibold hover:bg-hm-black/90"
        >
          <Plus className="h-4 w-4" />
          {t('clientTasks.requestTask')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'ALL',       label: `${t('clientTasks.filterAll')} (${tasks.length})` },
          { value: 'PENDING',   label: `${t('clientTasks.filterOpen')} (${tasks.filter(task => task.status !== 'COMPLETED').length})` },
          { value: 'OVERDUE',   label: `${t('clientTasks.filterOverdue')} (${overdueCount})`, danger: true },
          { value: 'COMPLETED', label: `${t('clientTasks.filterCompleted')} (${tasks.filter(task => task.status === 'COMPLETED').length})` },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? f.danger ? 'bg-red-600 text-white' : 'bg-hm-black text-white'
                : f.danger && overdueCount > 0 ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tasks list */}
      {loadError ? (
        <div className="p-4 text-sm text-red-500">Failed to load tasks. Try refreshing.</div>
      ) : loading ? (
        <p className="text-gray-400 text-sm">{t('common.loading')}</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-hm border bg-white p-10 text-center">
          <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Wrench className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-1">{t('clientTasks.noTasks')}</h3>
          <p className="text-sm text-gray-500 mb-4">When you request a visit or maintenance, it will appear here.</p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-hm-black text-white px-4 py-2 text-sm font-semibold hover:bg-hm-black/90"
          >
            <Plus className="h-4 w-4" />
            Request a visit
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(task => {
            const isOverdue   = task.status !== 'COMPLETED' && new Date(task.dueDate) < now
            const isCompleted = task.status === 'COMPLETED'
            return (
              <div key={task.id} className={`rounded-hm border bg-white p-4 flex items-start gap-4 ${isOverdue ? 'border-red-200 bg-red-50/30' : ''}`}>
                <span className={`inline-flex items-center justify-center h-9 w-9 rounded-full shrink-0 text-xs font-bold ${TYPE_COLORS[task.type] ?? 'bg-gray-100 text-gray-600'}`}>
                  {(TYPE_LABELS[task.type] ?? task.type).slice(0, 2).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold text-hm-black ${isCompleted ? 'line-through text-gray-400' : ''}`}>{task.title}</span>
                    <span className={`text-xs rounded-full px-2 py-0.5 ${TYPE_COLORS[task.type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABELS[task.type] ?? task.type}
                    </span>
                    {isOverdue && (
                      <span className="inline-flex items-center gap-1 text-xs rounded-full bg-red-100 text-red-600 px-2 py-0.5 font-semibold">
                        <AlertCircle className="h-3 w-3" /> {t('clientTasks.overdue')}
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 text-xs rounded-full bg-green-100 text-green-700 px-2 py-0.5">
                        <CheckCircle2 className="h-3 w-3" /> {t('clientTasks.completedTag')}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>{task.property.name}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {fmtDate(task.dueDate, locale)}
                    </span>
                    {task.assignee && <span>· {task.assignee.name ?? t('clientTasks.crew')}</span>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Create task modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-lg font-bold text-hm-black">{t('clientTasks.requestNew')}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{t('clientTasks.modalNote')}</p>
              </div>
              <button onClick={() => setShowModal(false)} aria-label="Close" className="rounded-md p-2 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {submitError && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm px-3 py-2">{submitError}</div>
              )}
              {/* Property */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  {t('clientTasks.property')}
                </label>
                <select
                  required
                  value={form.propertyId}
                  onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
                >
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Type (left) + Notes (right) — two columns */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left: task type selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    {t('clientTasks.taskType')}
                  </label>
                  <div className="space-y-1.5">
                    {MANUAL_TYPES.map(mt => (
                      <button
                        key={mt.value}
                        onClick={() => setForm(f => ({ ...f, type: mt.value }))}
                        className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                          form.type === mt.value
                            ? 'border-navy-900 bg-navy-50 text-hm-black'
                            : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-sm font-medium">{mt.label}</div>
                        <div className="text-xs opacity-60 mt-0.5">{mt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: title + notes + date */}
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      {t('clientTasks.titleLabel')}
                    </label>
                    <input
                      required
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder={
                        form.type === 'MAINTENANCE_CORRECTIVE' ? t('clientTasks.placeholders.maintenance') :
                        form.type === 'CLEANING'               ? t('clientTasks.placeholders.cleaning') :
                        form.type === 'SHOPPING'               ? t('clientTasks.placeholders.shopping') :
                        form.type === 'TRANSFER'               ? t('clientTasks.placeholders.transfer') :
                        t('clientTasks.placeholders.default')
                      }
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
                    />
                  </div>

                  <div className="flex-1 flex flex-col">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      {t('clientTasks.notesForCrew')}
                    </label>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder={t('clientTasks.notesPlaceholder')}
                      className="flex-1 w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-hm-gold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      {t('clientTasks.desiredDate')}
                    </label>
                    <input
                      type="date"
                      required
                      value={form.dueDate}
                      onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
                    />
                  </div>

                  {/* Warning for corrective/premium types */}
                  {form.type === 'MAINTENANCE_CORRECTIVE' && (
                    <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-700">
                      {t('clientTasks.warningCorrective')}
                    </div>
                  )}
                  {(form.type === 'SHOPPING' || form.type === 'TRANSFER') && (
                    <div className="rounded-lg bg-sky-50 border border-sky-100 px-3 py-2 text-xs text-sky-700">
                      {t('clientTasks.warningPremium')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t">
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border py-2.5 text-sm hover:bg-gray-50">
                {t('common.cancel')}
              </button>
              <button
                onClick={submit}
                disabled={submitting || !form.title || !form.dueDate || !form.propertyId}
                className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-hm-black py-2.5 text-sm font-semibold text-white hover:bg-hm-black/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> {t('clientTasks.submitting')}</>
                ) : (
                  t('clientTasks.requestTask')
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
