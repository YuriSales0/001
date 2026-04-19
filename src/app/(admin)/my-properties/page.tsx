'use client'

import { useEffect, useState } from 'react'
import {
  Building2, MapPin, RefreshCw, Link2, Check, Plus, X, Clock,
  CheckCircle2, AlertCircle, ExternalLink,
} from 'lucide-react'
import { getSelectedRuleLabels } from '@/lib/house-rules'

type Property = {
  id: string
  name: string
  address: string
  city: string
  postalCode: string | null
  status: string
  airbnbIcalUrl: string | null
  bookingIcalUrl: string | null
  airbnbConnected: boolean
  bookingConnected: boolean
  houseRules: string[]
  owner: { id: string; name: string | null; email: string }
}

type Client = { id: string; name: string | null; email: string }

type SyncResult = {
  ok: boolean
  summary: Record<string, { events: number; created: number; error?: string }>
  syncedAt: string
}

type ApproveState = {
  property: Property
  airbnbIcalUrl: string
  bookingIcalUrl: string
  saving: boolean
  approving: boolean
  error: string
}

const STATUS_BADGE: Record<string, string> = {
  PENDING_CLIENT:   'bg-violet-100 text-violet-700',
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
  ACTIVE:           'bg-green-100 text-green-700',
  INACTIVE:         'bg-gray-100 text-gray-500',
  MAINTENANCE:      'bg-orange-100 text-orange-600',
}
const STATUS_LABEL: Record<string, string> = {
  PENDING_CLIENT:   'Aguarda confirmação do cliente',
  PENDING_APPROVAL: 'Aguarda configuração OTA',
  ACTIVE:           'Ativa',
  INACTIVE:         'Inativa',
  MAINTENANCE:      'Em manutenção',
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [clients, setClients]       = useState<Client[]>([])
  const [loading, setLoading]       = useState(true)
  const [drafts, setDrafts]         = useState<Record<string, { airbnb: string; booking: string }>>({})
  const [saving, setSaving]         = useState<string | null>(null)
  const [syncing, setSyncing]       = useState<string | null>(null)
  const [lastSync, setLastSync]     = useState<Record<string, SyncResult>>({})
  const [showAdd, setShowAdd]       = useState(false)
  const [addForm, setAddForm]       = useState({ name: '', address: '', city: '', postalCode: '', ownerId: '', commissionRate: '18' })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError]     = useState('')
  const [approveState, setApproveState] = useState<ApproveState | null>(null)

  const load = async () => {
    setLoading(true)
    const [propRes, clientRes] = await Promise.all([
      fetch('/api/properties'),
      fetch('/api/users?role=CLIENT'),
    ])
    if (propRes.ok) {
      const data = (await propRes.json()) as Property[]
      setProperties(data)
      setDrafts(Object.fromEntries(data.map(p => [p.id, { airbnb: p.airbnbIcalUrl ?? '', booking: p.bookingIcalUrl ?? '' }])))
    }
    if (clientRes.ok) setClients(await clientRes.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const saveUrls = async (id: string) => {
    setSaving(id)
    const draft = drafts[id]
    await fetch(`/api/properties/${id}/ota`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ airbnbIcalUrl: draft.airbnb || null, bookingIcalUrl: draft.booking || null }),
    })
    await load()
    setSaving(null)
  }

  const sync = async (id: string) => {
    setSyncing(id)
    const res = await fetch(`/api/properties/${id}/sync`, { method: 'POST' })
    if (res.ok) {
      const data = await res.json() as SyncResult
      setLastSync(s => ({ ...s, [id]: data }))
    }
    setSyncing(null)
  }

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    if (!addForm.name || !addForm.address || !addForm.city || !addForm.ownerId) {
      setAddError('Preenche todos os campos obrigatórios.')
      return
    }
    setAddLoading(true)
    const res = await fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: addForm.name, address: addForm.address, city: addForm.city,
        postalCode: addForm.postalCode || undefined, ownerId: addForm.ownerId,
        commissionRate: parseFloat(addForm.commissionRate) || 18,
      }),
    })
    if (!res.ok) {
      const err = await res.json()
      setAddError(err.error || 'Erro ao criar.')
    } else {
      setShowAdd(false)
      setAddForm({ name: '', address: '', city: '', postalCode: '', ownerId: '', commissionRate: '18' })
      await load()
    }
    setAddLoading(false)
  }

  const openApprove = (p: Property) =>
    setApproveState({ property: p, airbnbIcalUrl: p.airbnbIcalUrl ?? '', bookingIcalUrl: p.bookingIcalUrl ?? '', saving: false, approving: false, error: '' })

  const saveApproveOta = async () => {
    if (!approveState) return
    setApproveState(s => s ? { ...s, saving: true, error: '' } : s)
    await fetch(`/api/properties/${approveState.property.id}/ota`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ airbnbIcalUrl: approveState.airbnbIcalUrl || null, bookingIcalUrl: approveState.bookingIcalUrl || null }),
    })
    setApproveState(s => s ? { ...s, saving: false } : s)
  }

  const submitApprove = async () => {
    if (!approveState) return
    setApproveState(s => s ? { ...s, approving: true, error: '' } : s)
    // Save OTA first, then approve
    await fetch(`/api/properties/${approveState.property.id}/ota`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ airbnbIcalUrl: approveState.airbnbIcalUrl || null, bookingIcalUrl: approveState.bookingIcalUrl || null }),
    })
    const res = await fetch(`/api/properties/${approveState.property.id}/approve`, { method: 'POST' })
    if (!res.ok) {
      const err = await res.json()
      setApproveState(s => s ? { ...s, approving: false, error: err.error ?? 'Erro ao aprovar.' } : s)
      return
    }
    setApproveState(null)
    await load()
  }

  const pendingClient   = properties.filter(p => p.status === 'PENDING_CLIENT')
  const pendingApproval = properties.filter(p => p.status === 'PENDING_APPROVAL')
  const pending = [...pendingClient, ...pendingApproval]

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-hm-black">Propriedades</h1>
          <p className="text-sm text-gray-600">Gere propriedades, aprova pedidos e conecta calendários OTA.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-hm-black text-white px-4 py-2.5 text-sm font-semibold hover:bg-hm-black/90"
        >
          <Plus className="h-4 w-4" /> Nova Propriedade
        </button>
      </div>

      {/* Pending banners */}
      {pendingClient.length > 0 && (
        <div className="rounded-hm border border-violet-200 bg-violet-50 p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-violet-600 shrink-0" />
          <div className="text-sm text-violet-800">
            <span className="font-semibold">{pendingClient.length} propriedade{pendingClient.length > 1 ? 's' : ''}</span> aguardam confirmação do cliente — o cliente deve confirmar os dados antes de prosseguir.
          </div>
        </div>
      )}
      {pendingApproval.length > 0 && (
        <div className="rounded-hm border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="text-sm text-amber-800">
            <span className="font-semibold">{pendingApproval.length} propriedade{pendingApproval.length > 1 ? 's' : ''}</span> prontas para configurar — conecta os calendários OTA e ativa.
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-8 rounded-hm bg-hm-sand w-48" />
          <div className="h-40 rounded-hm bg-hm-sand" />
        </div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <Building2 className="h-16 w-16 text-gray-300 mb-4" />
          <p className="text-gray-500">Nenhuma propriedade. Cria a primeira com o botão acima.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {properties.map(p => {
            const draft = drafts[p.id] ?? { airbnb: '', booking: '' }
            const result = lastSync[p.id]
            const isPendingClient   = p.status === 'PENDING_CLIENT'
            const isPendingApproval = p.status === 'PENDING_APPROVAL'
            const isPending = isPendingClient || isPendingApproval

            return (
              <div key={p.id} className={`rounded-hm border bg-white overflow-hidden ${isPending ? 'border-amber-300' : ''}`}>
                <div className="p-6 border-b flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-hm-black">{p.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <MapPin className="h-4 w-4" /> {p.address}, {p.city}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Proprietário: {p.owner.name ?? p.owner.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                    {isPendingClient && (
                      <span className="text-xs text-violet-600 font-medium">Aguarda cliente</span>
                    )}
                    {isPendingApproval && (
                      <button
                        onClick={() => openApprove(p)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 text-white px-3 py-1.5 text-sm font-semibold hover:bg-amber-600"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Configurar e Aprovar
                      </button>
                    )}
                  </div>
                </div>

                {/* House Rules — read-only display */}
                {(p.houseRules ?? []).length > 0 && (
                  <div className="px-6 pt-4 pb-2">
                    <div className="text-sm font-semibold text-hm-black mb-2">House Rules</div>
                    <div className="flex flex-wrap gap-1.5">
                      {getSelectedRuleLabels(p.houseRules).map(r => (
                        <span key={r.key} className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                          <span>{r.icon}</span> {r.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* iCal integration — only for ACTIVE properties inline */}
                {!isPending && (
                  <div className="p-6 space-y-4">
                    <div className="text-sm font-semibold text-hm-black flex items-center gap-2">
                      <Link2 className="h-4 w-4" /> Calendários iCal
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1">
                          Airbnb iCal URL {p.airbnbConnected && <Check className="inline h-3 w-3 text-green-600 ml-1" />}
                        </label>
                        <input type="url"
                          placeholder="https://www.airbnb.com/calendar/ical/..."
                          value={draft.airbnb}
                          onChange={e => setDrafts(s => ({ ...s, [p.id]: { ...draft, airbnb: e.target.value } }))}
                          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
                        />
                        <p className="text-xs text-gray-400 mt-1">Airbnb → Anúncio → Disponibilidade → Exportar calendário</p>
                      </div>
                      <div>
                        <label className="block text-xs uppercase text-gray-500 mb-1">
                          Booking.com iCal URL {p.bookingConnected && <Check className="inline h-3 w-3 text-green-600 ml-1" />}
                        </label>
                        <input type="url"
                          placeholder="https://admin.booking.com/hotel/.../ical?..."
                          value={draft.booking}
                          onChange={e => setDrafts(s => ({ ...s, [p.id]: { ...draft, booking: e.target.value } }))}
                          className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
                        />
                        <p className="text-xs text-gray-400 mt-1">Booking.com Extranet → Tarifas → Sincronizar calendários</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => saveUrls(p.id)} disabled={saving === p.id}
                        className="rounded-md bg-hm-black text-white px-4 py-2 text-sm hover:bg-hm-black/90 disabled:opacity-50">
                        {saving === p.id ? 'A guardar…' : 'Guardar URLs'}
                      </button>
                      <button onClick={() => sync(p.id)} disabled={syncing === p.id || (!p.airbnbIcalUrl && !p.bookingIcalUrl)}
                        className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-1">
                        <RefreshCw className={`h-4 w-4 ${syncing === p.id ? 'animate-spin' : ''}`} /> Sincronizar
                      </button>
                    </div>
                    {result && (
                      <div className="text-xs rounded-md bg-gray-50 p-3">
                        <div className="font-semibold mb-1">Última sync — {new Date(result.syncedAt).toLocaleString('pt-PT')}</div>
                        {Object.entries(result.summary).map(([src, info]) => (
                          <div key={src}>{src}: {info.error ? <span className="text-red-600">erro — {info.error}</span> : <span>{info.events} eventos, {info.created} novos</span>}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ── Nova Propriedade modal ── */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-base font-bold text-hm-black">Nova Propriedade</h2>
                <p className="text-xs text-gray-500 mt-0.5">Como Admin, a propriedade fica ativa imediatamente.</p>
              </div>
              <button onClick={() => setShowAdd(false)} aria-label="Close" className="rounded-md p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={submitAdd} className="p-5 space-y-4">
              {addError && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{addError}</div>}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nome *</label>
                <input type="text" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" placeholder="Apartamento T2 Lisboa" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Morada *</label>
                  <input type="text" value={addForm.address} onChange={e => setAddForm(f => ({ ...f, address: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" placeholder="Rua, número" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Cidade *</label>
                  <input type="text" value={addForm.city} onChange={e => setAddForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" placeholder="Lisboa" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Código Postal</label>
                  <input type="text" value={addForm.postalCode} onChange={e => setAddForm(f => ({ ...f, postalCode: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" placeholder="1000-001" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Comissão (%)</label>
                  <input type="number" min="0" max="100" step="0.5" value={addForm.commissionRate} onChange={e => setAddForm(f => ({ ...f, commissionRate: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Proprietário *</label>
                <select value={addForm.ownerId} onChange={e => setAddForm(f => ({ ...f, ownerId: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold">
                  <option value="">Seleciona o proprietário…</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name ?? c.email} ({c.email})</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={addLoading}
                  className="rounded-lg bg-hm-black text-white px-4 py-2 text-sm font-semibold hover:bg-hm-black/90 disabled:opacity-50">
                  {addLoading ? 'A criar…' : 'Criar e Ativar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Approve modal (with OTA) ── */}
      {approveState && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setApproveState(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between p-5 border-b">
              <div>
                <h2 className="text-base font-bold text-hm-black">Aprovar Propriedade</h2>
                <p className="text-sm text-gray-500">{approveState.property.name} · {approveState.property.owner.name ?? approveState.property.owner.email}</p>
              </div>
              <button onClick={() => setApproveState(null)} aria-label="Close" className="rounded-md p-2 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>

            <div className="p-5 space-y-5">
              {approveState.error && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{approveState.error}</div>
              )}

              <p className="text-sm text-gray-600">Conecta os calendários OTA antes de ativar a propriedade (opcional mas recomendado).</p>

              {/* Airbnb */}
              <div className="rounded-lg bg-rose-50 border border-rose-100 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-rose-800">Airbnb</span>
                  <a href="https://www.airbnb.com/hosting/listings" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-rose-700 hover:underline">
                    Abrir Airbnb <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <p className="text-xs text-rose-700">Anúncio → Disponibilidade → Sincronizar calendários → Exportar</p>
                <input type="url"
                  value={approveState.airbnbIcalUrl}
                  onChange={e => setApproveState(s => s ? { ...s, airbnbIcalUrl: e.target.value } : s)}
                  placeholder="https://www.airbnb.com/calendar/ical/XXXXX.ics?s=..."
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                {approveState.airbnbIcalUrl && <span className="inline-flex items-center gap-1 text-xs text-green-600 font-semibold"><Check className="h-3 w-3" /> Preenchido</span>}
              </div>

              {/* Booking.com */}
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-blue-800">Booking.com</span>
                  <a href="https://admin.booking.com" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-700 hover:underline">
                    Abrir Extranet <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <p className="text-xs text-blue-700">Extranet → Tarifas e Disponibilidade → Sincronização → Exportar</p>
                <input type="url"
                  value={approveState.bookingIcalUrl}
                  onChange={e => setApproveState(s => s ? { ...s, bookingIcalUrl: e.target.value } : s)}
                  placeholder="https://admin.booking.com/hotel/hoteladmin/ical.html?..."
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                {approveState.bookingIcalUrl && <span className="inline-flex items-center gap-1 text-xs text-green-600 font-semibold"><Check className="h-3 w-3" /> Preenchido</span>}
              </div>

              {/* Status summary */}
              <div className="flex items-center gap-3 text-xs">
                <span className={`inline-flex items-center gap-1 ${approveState.airbnbIcalUrl ? 'text-green-600' : 'text-gray-400'}`}>
                  {approveState.airbnbIcalUrl ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  Airbnb {approveState.airbnbIcalUrl ? 'conectado' : 'não conectado'}
                </span>
                <span className={`inline-flex items-center gap-1 ${approveState.bookingIcalUrl ? 'text-green-600' : 'text-gray-400'}`}>
                  {approveState.bookingIcalUrl ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                  Booking.com {approveState.bookingIcalUrl ? 'conectado' : 'não conectado'}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center p-5 border-t">
              <button onClick={() => setApproveState(null)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancelar</button>
              <button
                onClick={submitApprove}
                disabled={approveState.approving}
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 text-white px-5 py-2 text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                {approveState.approving ? 'A aprovar…' : 'Aprovar e Ativar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
