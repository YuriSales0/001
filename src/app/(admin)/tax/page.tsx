"use client"

import { useEffect, useState } from "react"
import { FileText, Plus, Filter, CheckCircle2, Clock, AlertTriangle, Edit2, Save, X } from "lucide-react"
import { useLocale } from "@/i18n/provider"

type Obligation = {
  id: string
  userId: string
  propertyId: string | null
  type: string
  status: string
  periodLabel: string
  dueDate: string | null
  completedAt: string | null
  documentUrl: string | null
  notes: string | null
  user: { id: string; name: string | null; email: string }
  property: { id: string; name: string } | null
}

type Client = { id: string; name: string | null; email: string; subscriptionPlan: string | null }
type Property = { id: string; name: string; ownerId: string }

const TYPES = [
  { value: "VUT_LICENSE",          labelKey: "admin.taxType.VUT_LICENSE",          fallback: "VUT — Tourist License" },
  { value: "MODELO_179",           labelKey: "admin.taxType.MODELO_179",           fallback: "Modelo 179" },
  { value: "IRNR_MODELO_210",      labelKey: "admin.taxType.IRNR_MODELO_210",      fallback: "IRNR Modelo 210" },
  { value: "NIE",                  labelKey: "admin.taxType.NIE",                  fallback: "NIE" },
  { value: "ENERGY_CERTIFICATE",   labelKey: "admin.taxType.ENERGY_CERTIFICATE",   fallback: "Energy Certificate" },
  { value: "FISCAL_REPRESENTATIVE", labelKey: "admin.taxType.FISCAL_REPRESENTATIVE", fallback: "Fiscal Representative" },
  { value: "IBI",                  labelKey: "admin.taxType.IBI",                  fallback: "IBI" },
  { value: "OTHER",                labelKey: "admin.taxType.OTHER",                fallback: "Other" },
]

const STATUSES = [
  { value: "NOT_STARTED",     labelKey: "admin.taxStatus.NOT_STARTED",     fallback: "Not started",     color: "bg-gray-100 text-gray-700" },
  { value: "IN_PROGRESS",     labelKey: "admin.taxStatus.IN_PROGRESS",     fallback: "In progress",     color: "bg-blue-100 text-blue-700" },
  { value: "ACTION_REQUIRED", labelKey: "admin.taxStatus.ACTION_REQUIRED", fallback: "Action required", color: "bg-amber-100 text-amber-700" },
  { value: "COMPLETED",       labelKey: "admin.taxStatus.COMPLETED",       fallback: "Completed",       color: "bg-green-100 text-green-700" },
  { value: "EXPIRED",         labelKey: "admin.taxStatus.EXPIRED",         fallback: "Expired",         color: "bg-red-100 text-red-700" },
  { value: "NOT_APPLICABLE",  labelKey: "admin.taxStatus.NOT_APPLICABLE",  fallback: "N/A",             color: "bg-gray-50 text-gray-400" },
]

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—"

export default function AdminTaxPage() {
  const { t } = useLocale()
  const [obligations, setObligations] = useState<Obligation[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const [clientFilter, setClientFilter] = useState<string>("")
  const [showNewModal, setShowNewModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = async () => {
    const [obls, cs, props] = await Promise.all([
      fetch("/api/tax-obligations").then(r => r.ok ? r.json() : []),
      fetch("/api/users?role=CLIENT").then(r => r.ok ? r.json() : []),
      fetch("/api/properties").then(r => r.ok ? r.json() : []),
    ])
    setObligations(obls)
    setClients(cs)
    setProperties(props)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const visible = obligations.filter(o => {
    if (filter !== "all" && o.status !== filter) return false
    if (clientFilter && o.userId !== clientFilter) return false
    return true
  })

  const stats = {
    total: obligations.length,
    actionRequired: obligations.filter(o => o.status === "ACTION_REQUIRED" || o.status === "EXPIRED").length,
    upcoming: obligations.filter(o => {
      if (!o.dueDate || o.status === "COMPLETED") return false
      const days = Math.ceil((new Date(o.dueDate).getTime() - Date.now()) / (1000*60*60*24))
      return days >= 0 && days <= 30
    }).length,
    completed: obligations.filter(o => o.status === "COMPLETED").length,
  }

  return (
    <div className="p-6 space-y-6" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{t('admin.tax')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('admin.taxSubtitle')}</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-navy-900 text-white px-4 py-2 text-sm font-semibold hover:bg-navy-800 transition-colors"
        >
          <Plus className="h-4 w-4" /> {t('admin.newObligation')}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={FileText} label={t('admin.totalTracked')} value={stats.total} color="text-navy-700" />
        <StatCard icon={AlertTriangle} label={t('admin.actionRequired')} value={stats.actionRequired} color="text-red-600" />
        <StatCard icon={Clock} label={t('admin.dueIn30d')} value={stats.upcoming} color="text-amber-600" />
        <StatCard icon={CheckCircle2} label={t('manager.completed')} value={stats.completed} color="text-green-600" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border p-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <select value={filter} onChange={e => setFilter(e.target.value)} className="rounded-lg border px-3 py-1.5 text-sm">
          <option value="all">{t('admin.allStatuses')}</option>
          {STATUSES.map(s => <option key={s.value} value={s.value}>{t(s.labelKey)}</option>)}
        </select>
        <select value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="rounded-lg border px-3 py-1.5 text-sm">
          <option value="">{t('admin.allClients')}</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name ?? c.email}</option>)}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{visible.length} item{visible.length !== 1 ? "s" : ""}</span>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-10 text-sm text-gray-400">{t('common.loading')}</div>
      ) : visible.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center text-sm text-gray-400">
          {t('admin.noObligationsMatch')}
        </div>
      ) : (
        <div className="bg-white rounded-xl border divide-y">
          {visible.map(o => (
            <ObligationRow
              key={o.id}
              obligation={o}
              properties={properties}
              editing={editingId === o.id}
              onEdit={() => setEditingId(o.id)}
              onCancel={() => setEditingId(null)}
              onSave={async (data) => {
                const res = await fetch(`/api/tax-obligations/${o.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(data),
                })
                if (!res.ok) {
                  alert(t('admin.failedToSave'))
                  return
                }
                setEditingId(null)
                load()
              }}
            />
          ))}
        </div>
      )}

      {/* New modal */}
      {showNewModal && (
        <NewObligationModal
          clients={clients}
          properties={properties}
          onClose={() => setShowNewModal(false)}
          onCreated={() => { setShowNewModal(false); load() }}
        />
      )}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">{label}</span>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div className="text-2xl font-bold text-navy-900">{value}</div>
    </div>
  )
}

function ObligationRow({
  obligation: o, properties, editing, onEdit, onCancel, onSave,
}: {
  obligation: Obligation
  properties: Property[]
  editing: boolean
  onEdit: () => void
  onCancel: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave: (data: any) => Promise<void>
}) {
  const { t } = useLocale()
  const [status, setStatus] = useState(o.status)
  const [dueDate, setDueDate] = useState(o.dueDate?.slice(0, 10) ?? "")
  const [notes, setNotes] = useState(o.notes ?? "")
  const [documentUrl, setDocumentUrl] = useState(o.documentUrl ?? "")

  const statusMeta = STATUSES.find(s => s.value === o.status)
  const typeMeta = TYPES.find(ty => ty.value === o.type)

  if (editing) {
    return (
      <div className="p-4 bg-gray-50 space-y-3">
        <div className="font-semibold text-navy-900 text-sm">
          {typeMeta ? t(typeMeta.labelKey) : o.type} · {o.user.name ?? o.user.email} · {o.periodLabel}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t('common.status')}</label>
            <select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
              {STATUSES.map(s => <option key={s.value} value={s.value}>{t(s.labelKey)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t('crew.dueDate')}</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">{t('admin.documentUrl')}</label>
          <input value={documentUrl} onChange={e => setDocumentUrl(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="https://..." />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">{t('common.notes')}</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full rounded-lg border px-3 py-2 text-sm" />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="rounded-lg border px-4 py-1.5 text-sm hover:bg-gray-100"><X className="h-3.5 w-3.5 inline mr-1" />{t('common.cancel')}</button>
          <button onClick={() => onSave({ status, dueDate: dueDate || null, notes, documentUrl })}
            className="rounded-lg bg-navy-900 text-white px-4 py-1.5 text-sm font-semibold hover:bg-navy-800">
            <Save className="h-3.5 w-3.5 inline mr-1" /> {t('common.save')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-semibold text-navy-900 text-sm">{typeMeta ? t(typeMeta.labelKey) : o.type}</span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${statusMeta?.color}`}>
              {statusMeta ? t(statusMeta.labelKey) : o.status}
            </span>
            <span className="text-xs text-gray-500">· {o.periodLabel}</span>
          </div>
          <p className="text-xs text-gray-500">
            {o.user.name ?? o.user.email}
            {o.property ? ` · ${o.property.name}` : ""}
          </p>
          {o.notes && <p className="text-xs text-gray-500 italic mt-1 border-l-2 border-gray-200 pl-2">{o.notes}</p>}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-gray-500">{fmtDate(o.dueDate)}</p>
          {o.documentUrl && <a href={o.documentUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">📎 {t('admin.document')}</a>}
          <button onClick={onEdit} className="block ml-auto mt-1 text-xs text-navy-700 hover:text-navy-900">
            <Edit2 className="h-3 w-3 inline mr-0.5" /> {t('common.edit')}
          </button>
        </div>
      </div>
    </div>
  )
}

function NewObligationModal({
  clients, properties, onClose, onCreated,
}: {
  clients: Client[]
  properties: Property[]
  onClose: () => void
  onCreated: () => void
}) {
  const { t } = useLocale()
  const [userId, setUserId] = useState("")
  const [propertyId, setPropertyId] = useState("")
  const [type, setType] = useState("VUT_LICENSE")
  const [periodLabel, setPeriodLabel] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)

  const clientProperties = properties.filter(p => p.ownerId === userId)

  const submit = async () => {
    if (!userId || !periodLabel) return
    setSaving(true)
    const res = await fetch("/api/tax-obligations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        propertyId: propertyId || null,
        type,
        periodLabel,
        dueDate: dueDate || null,
        notes,
      }),
    })
    setSaving(false)
    if (res.ok) {
      onCreated()
    } else {
      const err = await res.json().catch(() => ({}))
      alert(t('admin.failedToCreate') + ': ' + (err.error || 'unknown error'))
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-navy-900">{t('admin.newTaxObligation')}</h3>
          <button onClick={onClose}><X className="h-4 w-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t('admin.client')}</label>
            <select value={userId} onChange={e => { setUserId(e.target.value); setPropertyId("") }} className="w-full rounded-lg border px-3 py-2 text-sm">
              <option value="">{t('admin.selectClient')}</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name ?? c.email} ({c.subscriptionPlan ?? "—"})</option>)}
            </select>
          </div>
          {userId && clientProperties.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{t('admin.propertyOptional')}</label>
              <select value={propertyId} onChange={e => setPropertyId(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
                <option value="">{t('admin.noProperty')}</option>
                {clientProperties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t('admin.typeLabel')}</label>
            <select value={type} onChange={e => setType(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm">
              {TYPES.map(ty => <option key={ty.value} value={ty.value}>{t(ty.labelKey)}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{t('admin.period')}</label>
              <input value={periodLabel} onChange={e => setPeriodLabel(e.target.value)} placeholder="e.g. Q1 2026, 2026, Once" className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{t('crew.dueDate')}</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">{t('admin.notesVisibleToClient')}</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full rounded-lg border px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="px-6 py-4 border-t flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">{t('common.cancel')}</button>
          <button onClick={submit} disabled={!userId || !periodLabel || saving}
            className="rounded-lg bg-navy-900 text-white px-5 py-2 text-sm font-semibold hover:bg-navy-800 disabled:opacity-50">
            {saving ? t('admin.creating') : t('admin.create')}
          </button>
        </div>
      </div>
    </div>
  )
}
