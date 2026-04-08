'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Plus, X, Phone, Mail, MessageCircle, Globe, UserPlus, Newspaper, Share2,
  ChevronRight, ArrowRight, AlertCircle, Clock, Euro, Building2, Trash2,
  RefreshCcw, Tag, StickyNote, CalendarDays, User,
} from 'lucide-react'

/* ─── Types ───────────────────────────────────────────────────── */
type Manager = { id: string; name: string | null; email: string }

type Lead = {
  id: string
  name: string
  email: string | null
  phone: string | null
  source: string
  status: string
  message: string | null
  notes: string | null
  budget: number | null
  propertyType: string | null
  followUpDate: string | null
  assignedManagerId: string | null
  assignedManager: Manager | null
  createdAt: string
}

/* ─── Constants ───────────────────────────────────────────────── */
const SOURCE_META: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  CADASTRO:   { label: 'Cadastro',   icon: <UserPlus className="h-3 w-3" />,     cls: 'bg-violet-100 text-violet-700' },
  NEWSLETTER: { label: 'Newsletter', icon: <Newspaper className="h-3 w-3" />,    cls: 'bg-pink-100 text-pink-700' },
  ONLINE:     { label: 'Online',     icon: <Globe className="h-3 w-3" />,         cls: 'bg-sky-100 text-sky-700' },
  PHONE:      { label: 'Telefone',   icon: <Phone className="h-3 w-3" />,         cls: 'bg-green-100 text-green-700' },
  WHATSAPP:   { label: 'WhatsApp',   icon: <MessageCircle className="h-3 w-3" />, cls: 'bg-emerald-100 text-emerald-700' },
  WEBSITE:    { label: 'Website',    icon: <Globe className="h-3 w-3" />,          cls: 'bg-blue-100 text-blue-700' },
  EMAIL:      { label: 'E-mail',     icon: <Mail className="h-3 w-3" />,           cls: 'bg-orange-100 text-orange-700' },
  REFERRAL:   { label: 'Indicação',  icon: <Share2 className="h-3 w-3" />,         cls: 'bg-yellow-100 text-yellow-700' },
  OTHER:      { label: 'Outro',      icon: <Tag className="h-3 w-3" />,            cls: 'bg-gray-100 text-gray-600' },
}

const FUNNEL: {
  id: string
  label: string
  sub: string
  statuses: string[]
  color: string
  headerCls: string
  dotCls: string
}[] = [
  {
    id: 'acquisition',
    label: 'Aquisição',
    sub: 'Novos leads',
    statuses: ['NEW'],
    color: 'blue',
    headerCls: 'bg-blue-600',
    dotCls: 'bg-blue-500',
  },
  {
    id: 'conversion',
    label: 'Conversão',
    sub: 'Em qualificação',
    statuses: ['CONTACTED', 'QUALIFIED'],
    color: 'orange',
    headerCls: 'bg-orange-500',
    dotCls: 'bg-orange-500',
  },
  {
    id: 'monetization',
    label: 'Monetização',
    sub: 'Clientes pagantes',
    statuses: ['CONVERTED'],
    color: 'green',
    headerCls: 'bg-green-600',
    dotCls: 'bg-green-500',
  },
  {
    id: 'retention',
    label: 'Retenção',
    sub: 'Longo prazo',
    statuses: ['RETAINED'],
    color: 'purple',
    headerCls: 'bg-purple-600',
    dotCls: 'bg-purple-500',
  },
]

const STATUS_NEXT: Record<string, string | null> = {
  NEW:       'CONTACTED',
  CONTACTED: 'QUALIFIED',
  QUALIFIED: 'CONVERTED',
  CONVERTED: 'RETAINED',
  RETAINED:  null,
}

const STATUS_LABEL: Record<string, string> = {
  NEW:        'Novo',
  CONTACTED:  'Contactado',
  QUALIFIED:  'Qualificado',
  CONVERTED:  'Convertido',
  RETAINED:   'Retido',
  LOST:       'Perdido',
  REMARKETING:'Remarketing',
}

const fmt = (n: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n)
const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-PT')

function SourceBadge({ source }: { source: string }) {
  const m = SOURCE_META[source] ?? SOURCE_META.OTHER
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${m.cls}`}>
      {m.icon} {m.label}
    </span>
  )
}

/* ─── Main Component ──────────────────────────────────────────── */
export default function CrmPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [managers, setManagers] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Lead | null>(null)
  const [showNew, setShowNew] = useState(false)

  const load = async () => {
    const [leadsRes, mgrsRes] = await Promise.all([
      fetch('/api/leads').then(r => r.ok ? r.json() : []),
      fetch('/api/users?role=MANAGER').then(r => r.ok ? r.json() : []),
    ])
    setLeads(leadsRes)
    setManagers(mgrsRes)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  // Sync selected lead with fresh data
  useEffect(() => {
    if (selected) {
      const fresh = leads.find(l => l.id === selected.id)
      if (fresh) setSelected(fresh)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leads])

  const funnelLeads = useMemo(() => {
    const map: Record<string, Lead[]> = {}
    FUNNEL.forEach(col => {
      map[col.id] = leads.filter(l => col.statuses.includes(l.status))
    })
    return map
  }, [leads])

  const remarketing = useMemo(
    () => leads.filter(l => l.status === 'LOST' || l.status === 'REMARKETING'),
    [leads]
  )

  // KPIs
  const totalLeads = leads.filter(l => l.status !== 'LOST' && l.status !== 'REMARKETING').length
  const inConversion = leads.filter(l => ['CONTACTED', 'QUALIFIED'].includes(l.status)).length
  const converted = leads.filter(l => l.status === 'CONVERTED' || l.status === 'RETAINED').length
  const remarketingCount = remarketing.length
  const conversionRate = totalLeads > 0 ? Math.round((converted / (totalLeads + converted)) * 100) : 0

  const patch = async (id: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const updated = await res.json()
      setLeads(ls => ls.map(l => l.id === id ? updated : l))
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">A carregar CRM…</div>

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">CRM — Pipeline de Leads</h1>
          <p className="text-sm text-gray-500">Gestão do funil de aquisição, conversão, monetização e retenção.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-navy-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-navy-800"
        >
          <Plus className="h-4 w-4" /> Novo Lead
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total no Funil</div>
          <div className="text-2xl font-bold text-navy-900">{totalLeads}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Em Conversão</div>
          <div className="text-2xl font-bold text-orange-500">{inConversion}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Convertidos</div>
          <div className="text-2xl font-bold text-green-600">{converted}</div>
          <div className="text-xs text-gray-400 mt-0.5">taxa {conversionRate}%</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Remarketing</div>
          <div className="text-2xl font-bold text-red-500">{remarketingCount}</div>
          <div className="text-xs text-gray-400 mt-0.5">leads perdidos</div>
        </div>
      </div>

      {/* ── Funnel arrow ── */}
      <div className="hidden md:flex items-center gap-0 text-xs font-semibold text-gray-500">
        {FUNNEL.map((col, i) => (
          <div key={col.id} className="flex items-center gap-0">
            <span className={`rounded-full px-3 py-1 text-white text-[11px] ${col.headerCls}`}>{col.label}</span>
            {i < FUNNEL.length - 1 && <ArrowRight className="h-4 w-4 mx-1 text-gray-300" />}
          </div>
        ))}
        <ArrowRight className="h-4 w-4 mx-1 text-gray-300" />
        <span className="rounded-full px-3 py-1 bg-red-500 text-white text-[11px]">Remarketing</span>
      </div>

      {/* ── Kanban ── */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {FUNNEL.map(col => {
          const colLeads = funnelLeads[col.id] ?? []
          return (
            <div key={col.id} className="flex-none w-72">
              {/* Column header */}
              <div className={`rounded-t-xl px-4 py-3 text-white ${col.headerCls}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{col.label}</span>
                  <span className="bg-white/20 rounded-full px-2 py-0.5 text-xs font-bold">{colLeads.length}</span>
                </div>
                <div className="text-[11px] text-white/70 mt-0.5">{col.sub}</div>
              </div>

              {/* Cards */}
              <div className="rounded-b-xl border border-t-0 bg-gray-50 min-h-[200px] p-2 space-y-2">
                {colLeads.length === 0 && (
                  <div className="text-center text-xs text-gray-400 py-6">Sem leads aqui</div>
                )}
                {colLeads.map(lead => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onClick={() => setSelected(lead)}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Remarketing pool ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <RefreshCcw className="h-4 w-4 text-red-500" />
          <h2 className="text-base font-semibold text-navy-900">Remarketing</h2>
          <span className="rounded-full bg-red-100 text-red-600 px-2 py-0.5 text-xs font-semibold">{remarketingCount}</span>
          <span className="text-xs text-gray-400">leads não convertidos — banco de re-engajamento</span>
        </div>

        {remarketing.length === 0 ? (
          <div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-400">
            Nenhum lead em remarketing.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {remarketing.map(lead => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onClick={() => setSelected(lead)}
                compact
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Detail Modal ── */}
      {selected && (
        <LeadDetailModal
          lead={selected}
          managers={managers}
          onClose={() => setSelected(null)}
          onPatch={async (data) => { await patch(selected.id, data) }}
          onDelete={async () => {
            await fetch(`/api/leads/${selected.id}`, { method: 'DELETE' })
            setLeads(ls => ls.filter(l => l.id !== selected.id))
            setSelected(null)
          }}
        />
      )}

      {/* ── New Lead Modal ── */}
      {showNew && (
        <NewLeadModal
          managers={managers}
          onClose={() => setShowNew(false)}
          onCreate={async (data) => {
            const res = await fetch('/api/leads', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data),
            })
            if (res.ok) {
              const lead = await res.json()
              setLeads(ls => [lead, ...ls])
              setShowNew(false)
            }
          }}
        />
      )}
    </div>
  )
}

/* ─── Lead Card ──────────────────────────────────────────────── */
function LeadCard({ lead, onClick, compact }: { lead: Lead; onClick: () => void; compact?: boolean }) {
  const today = new Date()
  const followUp = lead.followUpDate ? new Date(lead.followUpDate) : null
  const isOverdue = followUp && followUp < today
  const noManager = !lead.assignedManagerId

  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-lg bg-white border shadow-sm hover:shadow-md transition-shadow p-3 space-y-2 ${isOverdue ? 'border-red-200' : ''} ${noManager ? 'border-amber-200' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-semibold text-sm text-navy-900 leading-tight truncate">{lead.name}</span>
        <SourceBadge source={lead.source} />
      </div>

      {lead.email && (
        <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
          <Mail className="h-3 w-3 shrink-0" /> {lead.email}
        </div>
      )}
      {lead.phone && (
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Phone className="h-3 w-3 shrink-0" /> {lead.phone}
        </div>
      )}

      {!compact && (
        <div className="flex items-center justify-between pt-1">
          <span className={`text-[10px] ${noManager ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>
            {noManager ? '⚠ Sem gestor' : lead.assignedManager?.name ?? lead.assignedManager?.email}
          </span>
          {followUp && (
            <span className={`inline-flex items-center gap-0.5 text-[10px] ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
              <Clock className="h-3 w-3" /> {fmtDate(lead.followUpDate!)}
            </span>
          )}
        </div>
      )}

      {lead.budget && (
        <div className="text-[10px] text-gray-500 flex items-center gap-0.5">
          <Euro className="h-3 w-3" /> Orç. {fmt(lead.budget)}
        </div>
      )}
    </button>
  )
}

/* ─── Lead Detail Modal ──────────────────────────────────────── */
function LeadDetailModal({
  lead, managers, onClose, onPatch, onDelete,
}: {
  lead: Lead
  managers: Manager[]
  onClose: () => void
  onPatch: (data: Record<string, unknown>) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [notes, setNotes] = useState(lead.notes ?? '')
  const [followUpDate, setFollowUpDate] = useState(lead.followUpDate?.slice(0, 10) ?? '')
  const [assignedManagerId, setAssignedManagerId] = useState(lead.assignedManagerId ?? '')
  const [budget, setBudget] = useState(lead.budget?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const save = async (extra?: Record<string, unknown>) => {
    setSaving(true)
    await onPatch({
      notes,
      followUpDate: followUpDate || null,
      assignedManagerId: assignedManagerId || null,
      budget: budget ? Number(budget) : null,
      ...extra,
    })
    setSaving(false)
  }

  const advance = () => {
    const next = STATUS_NEXT[lead.status]
    if (next) save({ status: next })
  }

  const markLost = () => save({ status: 'LOST' })
  const sendToRemarketing = () => save({ status: 'REMARKETING' })

  const nextStatus = STATUS_NEXT[lead.status]
  const isActive = !['LOST', 'REMARKETING', 'RETAINED'].includes(lead.status)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b shrink-0">
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <SourceBadge source={lead.source} />
              <span className="rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-xs font-semibold">
                {STATUS_LABEL[lead.status] ?? lead.status}
              </span>
            </div>
            <h2 className="text-lg font-bold text-navy-900">{lead.name}</h2>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
              {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{lead.email}</span>}
              {lead.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{lead.phone}</span>}
              <span className="text-gray-400">Entrou {fmtDate(lead.createdAt)}</span>
            </div>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left column */}
          <div className="space-y-4">
            {/* Assigned manager */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <User className="h-3.5 w-3.5" /> Gestor atribuído
              </label>
              <select
                value={assignedManagerId}
                onChange={e => setAssignedManagerId(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
              >
                <option value="">Sem gestor</option>
                {managers.map(m => (
                  <option key={m.id} value={m.id}>{m.name ?? m.email}</option>
                ))}
              </select>
            </div>

            {/* Follow-up date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5" /> Data de follow-up
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={e => setFollowUpDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
              />
            </div>

            {/* Budget */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <Euro className="h-3.5 w-3.5" /> Orçamento (€)
              </label>
              <input
                type="number"
                value={budget}
                onChange={e => setBudget(e.target.value)}
                placeholder="Ex: 5000"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
              />
            </div>

            {/* Property interest */}
            {lead.propertyType && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" /> Interesse
                </label>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">{lead.propertyType}</p>
              </div>
            )}

            {/* Lead message */}
            {lead.message && (
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mensagem do lead</label>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 whitespace-pre-wrap">{lead.message}</p>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Internal notes */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
                <StickyNote className="h-3.5 w-3.5" /> Notas internas
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={6}
                placeholder="Notas do gestor sobre este lead…"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 resize-none"
              />
            </div>

            {/* Pipeline actions */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-gray-700 mb-1">Ações no funil</div>

              {nextStatus && (
                <button
                  onClick={advance}
                  disabled={saving}
                  className="w-full flex items-center justify-between rounded-lg bg-navy-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-navy-800 disabled:opacity-50"
                >
                  <span>Avançar → {STATUS_LABEL[nextStatus]}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}

              {isActive && (
                <button
                  onClick={markLost}
                  disabled={saving}
                  className="w-full flex items-center justify-between rounded-lg border border-red-200 text-red-600 px-4 py-2.5 text-sm font-semibold hover:bg-red-50 disabled:opacity-50"
                >
                  <span>Marcar como Perdido</span>
                  <AlertCircle className="h-4 w-4" />
                </button>
              )}

              {lead.status === 'LOST' && (
                <button
                  onClick={sendToRemarketing}
                  disabled={saving}
                  className="w-full flex items-center justify-between rounded-lg border border-orange-200 text-orange-600 px-4 py-2.5 text-sm font-semibold hover:bg-orange-50 disabled:opacity-50"
                >
                  <span>Enviar para Remarketing</span>
                  <RefreshCcw className="h-4 w-4" />
                </button>
              )}

              {lead.status === 'REMARKETING' && (
                <button
                  onClick={() => save({ status: 'NEW' })}
                  disabled={saving}
                  className="w-full flex items-center justify-between rounded-lg border border-blue-200 text-blue-600 px-4 py-2.5 text-sm font-semibold hover:bg-blue-50 disabled:opacity-50"
                >
                  <span>Reativar no funil</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-5 border-t shrink-0">
          {confirmDelete ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-red-600">Tem a certeza?</span>
              <button onClick={onDelete} className="rounded-lg bg-red-600 text-white px-3 py-1.5 text-sm hover:bg-red-700">Eliminar</button>
              <button onClick={() => setConfirmDelete(false)} className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50">Cancelar</button>
            </div>
          ) : (
            <button onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-1.5 text-sm text-red-400 hover:text-red-600">
              <Trash2 className="h-4 w-4" /> Eliminar lead
            </button>
          )}
          <button
            onClick={() => save()}
            disabled={saving}
            className="rounded-lg bg-navy-900 text-white px-5 py-2 text-sm font-semibold hover:bg-navy-800 disabled:opacity-50"
          >
            {saving ? 'A guardar…' : 'Guardar alterações'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── New Lead Modal ─────────────────────────────────────────── */
const ALL_SOURCES = Object.entries(SOURCE_META)

function NewLeadModal({
  managers, onClose, onCreate,
}: {
  managers: Manager[]
  onClose: () => void
  onCreate: (data: Record<string, unknown>) => Promise<void>
}) {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', source: 'WEBSITE',
    message: '', notes: '', budget: '', propertyType: '',
    followUpDate: '', assignedManagerId: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.name) { setError('O nome é obrigatório.'); return }
    setLoading(true)
    try {
      await onCreate({
        name: form.name,
        email: form.email || null,
        phone: form.phone || null,
        source: form.source,
        message: form.message || null,
        notes: form.notes || null,
        budget: form.budget ? Number(form.budget) : null,
        propertyType: form.propertyType || null,
        followUpDate: form.followUpDate || null,
        assignedManagerId: form.assignedManagerId || null,
      })
    } catch {
      setError('Erro ao criar lead.')
    } finally {
      setLoading(false)
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b shrink-0">
          <h2 className="text-base font-bold text-navy-900">Novo Lead</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={submit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{error}</div>
          )}

          {/* Source selector */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Canal de Origem *</label>
            <div className="flex flex-wrap gap-2">
              {ALL_SOURCES.map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, source: key }))}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    form.source === key ? meta.cls + ' border-current ring-2 ring-offset-1 ring-current' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {meta.icon} {meta.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Nome completo *</label>
              <input type="text" value={form.name} onChange={set('name')} placeholder="João Silva"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">E-mail</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="joao@email.com"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Telefone / WhatsApp</label>
              <input type="tel" value={form.phone} onChange={set('phone')} placeholder="+351 9XX XXX XXX"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" />
            </div>

            {/* Property type */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Tipo de imóvel / interesse</label>
              <input type="text" value={form.propertyType} onChange={set('propertyType')} placeholder="T2 Lisboa, Algarve, etc."
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" />
            </div>

            {/* Budget */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Orçamento estimado (€)</label>
              <input type="number" value={form.budget} onChange={set('budget')} placeholder="Ex: 5000"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" />
            </div>

            {/* Assign manager */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Atribuir ao gestor</label>
              <select value={form.assignedManagerId} onChange={set('assignedManagerId')}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900">
                <option value="">Sem gestor (atribuir mais tarde)</option>
                {managers.map(m => <option key={m.id} value={m.id}>{m.name ?? m.email}</option>)}
              </select>
            </div>

            {/* Follow-up date */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Data de follow-up</label>
              <input type="date" value={form.followUpDate} onChange={set('followUpDate')}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" />
            </div>

            {/* Message */}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mensagem / interesse do lead</label>
              <textarea value={form.message} onChange={set('message')} rows={3}
                placeholder="O que o lead comunicou…"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 resize-none" />
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-700 mb-1">Notas internas</label>
              <textarea value={form.notes} onChange={set('notes')} rows={2}
                placeholder="Notas para o gestor…"
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 resize-none" />
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-2 p-5 border-t shrink-0">
          <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancelar</button>
          <button
            onClick={submit}
            disabled={loading}
            className="rounded-lg bg-navy-900 text-white px-5 py-2 text-sm font-semibold hover:bg-navy-800 disabled:opacity-50"
          >
            {loading ? 'A criar…' : 'Criar Lead'}
          </button>
        </div>
      </div>
    </div>
  )
}
