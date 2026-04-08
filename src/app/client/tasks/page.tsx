'use client'

import { useEffect, useState } from 'react'
import { Plus, X, Wrench, ShoppingCart, Car, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

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

const MANUAL_TYPES = [
  { value: 'MAINTENANCE_CORRECTIVE', label: 'Manutenção Correctiva', icon: Wrench, desc: 'Reparação ou substituição (cobrada à parte, aprovação > €50)' },
  { value: 'CLEANING',               label: 'Limpeza Extra',         icon: Wrench, desc: 'Limpeza adicional fora do calendário normal' },
  { value: 'SHOPPING',               label: 'Compras Pré-chegada',   icon: ShoppingCart, desc: 'Produtos no imóvel antes da chegada do hóspede (PREMIUM)' },
  { value: 'TRANSFER',               label: 'Transfer Aeroporto',    icon: Car,   desc: 'Transfer Málaga/Granada (PREMIUM)' },
  { value: 'MAINTENANCE_PREVENTIVE', label: 'Manutenção Preventiva', icon: Wrench, desc: 'Revisão preventiva programada' },
  { value: 'INSPECTION',             label: 'Inspecção',             icon: Wrench, desc: 'Inspecção do imóvel' },
]

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

const TYPE_LABELS: Record<string, string> = {
  CHECK_IN:               'Check-in',
  CHECK_OUT:              'Check-out',
  CLEANING:               'Limpeza',
  MAINTENANCE_PREVENTIVE: 'Manutenção Preventiva',
  MAINTENANCE_CORRECTIVE: 'Manutenção Correctiva',
  INSPECTION:             'Inspecção',
  TRANSFER:               'Transfer',
  SHOPPING:               'Compras',
  LAUNDRY:                'Lavandaria',
}

const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })

export default function ClientTasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  // Form state
  const [form, setForm] = useState({ propertyId: '', type: 'MAINTENANCE_CORRECTIVE', title: '', description: '', dueDate: '' })
  const [submitting, setSubmitting] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      fetch('/api/tasks').then(r => r.ok ? r.json() : []),
      fetch('/api/properties').then(r => r.ok ? r.json() : []),
    ]).then(([t, p]) => {
      setTasks(t)
      setProperties(p)
      if (p.length > 0 && !form.propertyId) setForm(f => ({ ...f, propertyId: p[0].id }))
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [])

  const submit = async () => {
    if (!form.propertyId || !form.title || !form.dueDate) return
    setSubmitting(true)
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSubmitting(false)
    setShowModal(false)
    setForm(f => ({ ...f, title: '', description: '', dueDate: '' }))
    load()
  }

  const now = new Date()
  const filtered = tasks.filter(t => {
    if (statusFilter === 'PENDING')  return t.status !== 'COMPLETED'
    if (statusFilter === 'COMPLETED') return t.status === 'COMPLETED'
    if (statusFilter === 'OVERDUE')  return t.status !== 'COMPLETED' && new Date(t.dueDate) < now
    return true
  })

  const overdueCount = tasks.filter(t => t.status !== 'COMPLETED' && new Date(t.dueDate) < now).length

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">As minhas tarefas</h1>
          <p className="text-sm text-gray-500">Tarefas automáticas e manuais das tuas propriedades</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-navy-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-navy-800"
        >
          <Plus className="h-4 w-4" />
          Solicitar tarefa
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { value: 'ALL',       label: `Todas (${tasks.length})` },
          { value: 'PENDING',   label: `Abertas (${tasks.filter(t => t.status !== 'COMPLETED').length})` },
          { value: 'OVERDUE',   label: `Em atraso (${overdueCount})`, danger: true },
          { value: 'COMPLETED', label: `Concluídas (${tasks.filter(t => t.status === 'COMPLETED').length})` },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              statusFilter === f.value
                ? f.danger ? 'bg-red-600 text-white' : 'bg-navy-900 text-white'
                : f.danger && overdueCount > 0 ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tasks list */}
      {loading ? (
        <p className="text-gray-400 text-sm">A carregar…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center text-gray-400">
          <Wrench className="h-10 w-10 mx-auto mb-2 text-gray-200" />
          Sem tarefas
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(t => {
            const isOverdue   = t.status !== 'COMPLETED' && new Date(t.dueDate) < now
            const isCompleted = t.status === 'COMPLETED'
            return (
              <div key={t.id} className={`rounded-xl border bg-white p-4 flex items-start gap-4 ${isOverdue ? 'border-red-200 bg-red-50/30' : ''}`}>
                <span className={`inline-flex items-center justify-center h-9 w-9 rounded-full shrink-0 text-xs font-bold ${TYPE_COLORS[t.type] ?? 'bg-gray-100 text-gray-600'}`}>
                  {(TYPE_LABELS[t.type] ?? t.type).slice(0, 2).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`font-semibold text-navy-900 ${isCompleted ? 'line-through text-gray-400' : ''}`}>{t.title}</span>
                    <span className={`text-xs rounded-full px-2 py-0.5 ${TYPE_COLORS[t.type] ?? 'bg-gray-100 text-gray-600'}`}>
                      {TYPE_LABELS[t.type] ?? t.type}
                    </span>
                    {isOverdue && (
                      <span className="inline-flex items-center gap-1 text-xs rounded-full bg-red-100 text-red-600 px-2 py-0.5 font-semibold">
                        <AlertCircle className="h-3 w-3" /> Atrasada
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1 text-xs rounded-full bg-green-100 text-green-700 px-2 py-0.5">
                        <CheckCircle2 className="h-3 w-3" /> Concluída
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>{t.property.name}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {fmtDate(t.dueDate)}
                    </span>
                    {t.assignee && <span>· {t.assignee.name ?? 'Crew'}</span>}
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
                <h2 className="text-lg font-bold text-navy-900">Solicitar nova tarefa</h2>
                <p className="text-xs text-gray-500 mt-0.5">Manutenção correctiva cobrada à parte · aprovação necessária acima de €50</p>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-md p-1 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Property */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                  Propriedade
                </label>
                <select
                  value={form.propertyId}
                  onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                >
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Type (left) + Notes (right) — two columns */}
              <div className="grid grid-cols-2 gap-4">
                {/* Left: task type selector */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Tipo de tarefa
                  </label>
                  <div className="space-y-1.5">
                    {MANUAL_TYPES.map(t => (
                      <button
                        key={t.value}
                        onClick={() => setForm(f => ({ ...f, type: t.value }))}
                        className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                          form.type === t.value
                            ? 'border-navy-900 bg-navy-50 text-navy-900'
                            : 'border-gray-100 bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-sm font-medium">{t.label}</div>
                        <div className="text-xs opacity-60 mt-0.5">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Right: title + notes + date */}
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Título / Descrição
                    </label>
                    <input
                      value={form.title}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder={
                        form.type === 'MAINTENANCE_CORRECTIVE' ? 'Ex: Torneira da cozinha a pingar' :
                        form.type === 'CLEANING'               ? 'Ex: Limpeza extra antes da chegada' :
                        form.type === 'SHOPPING'               ? 'Ex: Compras para família de 4' :
                        form.type === 'TRANSFER'               ? 'Ex: Transfer voo TP1234' :
                        'Descreve a tarefa…'
                      }
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                    />
                  </div>

                  <div className="flex-1 flex flex-col">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Notas para a crew
                    </label>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      placeholder="Detalhes, localização de chaves, códigos de acesso, observações…"
                      className="flex-1 w-full rounded-lg border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-navy-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                      Data pretendida
                    </label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                    />
                  </div>

                  {/* Warning for corrective/premium types */}
                  {form.type === 'MAINTENANCE_CORRECTIVE' && (
                    <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-700">
                      Cobrada à parte. Aprovação necessária acima de €50.
                    </div>
                  )}
                  {(form.type === 'SHOPPING' || form.type === 'TRANSFER') && (
                    <div className="rounded-lg bg-sky-50 border border-sky-100 px-3 py-2 text-xs text-sky-700">
                      Incluído no plano PREMIUM. Noutros planos cobrado à parte.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t">
              <button onClick={() => setShowModal(false)} className="flex-1 rounded-lg border py-2.5 text-sm hover:bg-gray-50">
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={submitting || !form.title || !form.dueDate || !form.propertyId}
                className="flex-1 rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50"
              >
                {submitting ? 'A enviar…' : 'Solicitar tarefa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
