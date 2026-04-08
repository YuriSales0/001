'use client'

import { useEffect, useState } from 'react'
import { Building2, MapPin, RefreshCw, Link2, Check, Plus, X, Clock } from 'lucide-react'

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
  owner: { id: string; name: string | null; email: string }
}

type Client = { id: string; name: string | null; email: string }

type SyncResult = {
  ok: boolean
  summary: Record<string, { events: number; created: number; error?: string }>
  syncedAt: string
}

const STATUS_BADGE: Record<string, string> = {
  PENDING_APPROVAL: 'bg-amber-100 text-amber-700',
  ACTIVE:           'bg-green-100 text-green-700',
  INACTIVE:         'bg-gray-100 text-gray-500',
  MAINTENANCE:      'bg-orange-100 text-orange-600',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING_APPROVAL: 'Aguarda aprovação',
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
  const [addForm, setAddForm]       = useState({
    name: '', address: '', city: '', postalCode: '', ownerId: '', commissionRate: '18',
  })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError]     = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const [propRes, clientRes] = await Promise.all([
        fetch('/api/properties'),
        fetch('/api/users?role=CLIENT'),
      ])
      if (propRes.ok) {
        const data = (await propRes.json()) as Property[]
        setProperties(data)
        setDrafts(
          Object.fromEntries(
            data.map(p => [p.id, { airbnb: p.airbnbIcalUrl || '', booking: p.bookingIcalUrl || '' }]),
          ),
        )
      }
      if (clientRes.ok) setClients(await clientRes.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const saveUrls = async (id: string) => {
    setSaving(id)
    try {
      const draft = drafts[id]
      await fetch(`/api/properties/${id}/ota`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          airbnbIcalUrl: draft.airbnb || null,
          bookingIcalUrl: draft.booking || null,
        }),
      })
      await load()
    } finally {
      setSaving(null)
    }
  }

  const sync = async (id: string) => {
    setSyncing(id)
    try {
      const res = await fetch(`/api/properties/${id}/sync`, { method: 'POST' })
      if (res.ok) {
        const data = (await res.json()) as SyncResult
        setLastSync(s => ({ ...s, [id]: data }))
      }
    } finally {
      setSyncing(null)
    }
  }

  const submitAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    if (!addForm.name || !addForm.address || !addForm.city || !addForm.ownerId) {
      setAddError('Preenche todos os campos obrigatórios.')
      return
    }
    setAddLoading(true)
    try {
      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addForm.name,
          address: addForm.address,
          city: addForm.city,
          postalCode: addForm.postalCode || undefined,
          ownerId: addForm.ownerId,
          commissionRate: parseFloat(addForm.commissionRate) || 18,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        setAddError(err.error || 'Erro ao criar propriedade.')
        return
      }
      setShowAdd(false)
      setAddForm({ name: '', address: '', city: '', postalCode: '', ownerId: '', commissionRate: '18' })
      await load()
    } finally {
      setAddLoading(false)
    }
  }

  const pending = properties.filter(p => p.status === 'PENDING_APPROVAL')

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy-900">Propriedades</h1>
          <p className="text-sm text-gray-600">Gere propriedades, conecta calendários e sincroniza disponibilidade.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-navy-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-navy-800"
        >
          <Plus className="h-4 w-4" /> Nova Propriedade
        </button>
      </div>

      {/* Pending approval banner */}
      {pending.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-amber-600 shrink-0" />
          <div className="text-sm text-amber-800">
            <span className="font-semibold">{pending.length} propriedade{pending.length > 1 ? 's' : ''}</span> aguarda{pending.length === 1 ? '' : 'm'} aprovação do proprietário — o owner receberá um pedido de integração e aprovação.
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-400">A carregar…</div>
      ) : properties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Building2 className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-navy-900">Sem Propriedades</h2>
          <p className="text-gray-500 mt-2 max-w-md">Cria a primeira propriedade com o botão acima.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {properties.map(p => {
            const draft = drafts[p.id] || { airbnb: '', booking: '' }
            const result = lastSync[p.id]
            const isPending = p.status === 'PENDING_APPROVAL'
            return (
              <div key={p.id} className={`rounded-xl border bg-white overflow-hidden ${isPending ? 'border-amber-200' : ''}`}>
                <div className="p-6 border-b">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-navy-900">{p.name}</h3>
                      <p className="text-gray-500 flex items-center gap-1 mt-1 text-sm">
                        <MapPin className="h-4 w-4" /> {p.address}, {p.city}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Proprietário: {p.owner.name ?? p.owner.email}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[p.status] ?? p.status}
                    </span>
                  </div>
                </div>

                {/* iCal integration (editable by admin/manager here) */}
                <div className="p-6 space-y-4">
                  <div className="text-sm font-semibold text-navy-900 flex items-center gap-2">
                    <Link2 className="h-4 w-4" /> Calendários iCal
                    {isPending && (
                      <span className="text-xs font-normal text-amber-600">— o proprietário deve aprovar após conectar</span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs uppercase text-gray-500 mb-1">
                        Airbnb iCal URL
                        {p.airbnbConnected && <Check className="inline h-3 w-3 text-green-600 ml-1" />}
                      </label>
                      <input
                        type="url"
                        placeholder="https://www.airbnb.com/calendar/ical/..."
                        value={draft.airbnb}
                        onChange={e => setDrafts(s => ({ ...s, [p.id]: { ...draft, airbnb: e.target.value } }))}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                      <p className="text-xs text-gray-400 mt-1">Airbnb → Anúncio → Disponibilidade → Sincronizar calendários → Exportar</p>
                    </div>

                    <div>
                      <label className="block text-xs uppercase text-gray-500 mb-1">
                        Booking.com iCal URL
                        {p.bookingConnected && <Check className="inline h-3 w-3 text-green-600 ml-1" />}
                      </label>
                      <input
                        type="url"
                        placeholder="https://admin.booking.com/hotel/.../ical?..."
                        value={draft.booking}
                        onChange={e => setDrafts(s => ({ ...s, [p.id]: { ...draft, booking: e.target.value } }))}
                        className="w-full rounded-md border px-3 py-2 text-sm"
                      />
                      <p className="text-xs text-gray-400 mt-1">Booking.com Extranet → Tarifas e Disponibilidade → Sincronizar calendários → Exportar</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => saveUrls(p.id)}
                      disabled={saving === p.id}
                      className="rounded-md bg-navy-900 text-white px-4 py-2 text-sm hover:bg-navy-800 disabled:opacity-50"
                    >
                      {saving === p.id ? 'A guardar…' : 'Guardar URLs'}
                    </button>
                    <button
                      onClick={() => sync(p.id)}
                      disabled={syncing === p.id || (!p.airbnbIcalUrl && !p.bookingIcalUrl)}
                      className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-1"
                    >
                      <RefreshCw className={`h-4 w-4 ${syncing === p.id ? 'animate-spin' : ''}`} />
                      Sincronizar
                    </button>
                  </div>

                  {result && (
                    <div className="text-xs rounded-md bg-gray-50 p-3 mt-2">
                      <div className="font-semibold mb-1">Última sync — {new Date(result.syncedAt).toLocaleString('pt-PT')}</div>
                      {Object.entries(result.summary).map(([source, info]) => (
                        <div key={source}>
                          <span className="capitalize">{source}</span>: {info.error
                            ? <span className="text-red-600">erro — {info.error}</span>
                            : <span>{info.events} eventos, {info.created} novos bloqueios</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Nova Propriedade modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="text-base font-bold text-navy-900">Nova Propriedade</h2>
              <button onClick={() => setShowAdd(false)} className="rounded-md p-1 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={submitAdd} className="p-5 space-y-4">
              {addError && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{addError}</div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nome da propriedade *</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                  placeholder="Ex: Apartamento T2 Lisboa"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Morada *</label>
                  <input
                    type="text"
                    value={addForm.address}
                    onChange={e => setAddForm(f => ({ ...f, address: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                    placeholder="Rua, número"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Cidade *</label>
                  <input
                    type="text"
                    value={addForm.city}
                    onChange={e => setAddForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                    placeholder="Lisboa"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Código Postal</label>
                  <input
                    type="text"
                    value={addForm.postalCode}
                    onChange={e => setAddForm(f => ({ ...f, postalCode: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                    placeholder="1000-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Comissão (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={addForm.commissionRate}
                    onChange={e => setAddForm(f => ({ ...f, commissionRate: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Proprietário *</label>
                <select
                  value={addForm.ownerId}
                  onChange={e => setAddForm(f => ({ ...f, ownerId: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                >
                  <option value="">Seleciona o proprietário…</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name ?? c.email} ({c.email})</option>
                  ))}
                </select>
                {clients.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">Nenhum cliente encontrado.</p>
                )}
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
                A propriedade será criada como <strong>Aguarda aprovação</strong>. O proprietário deve conectar as APIs do Airbnb e Booking.com e aprovar antes de ficar ativa.
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="rounded-lg bg-navy-900 text-white px-4 py-2 text-sm font-semibold hover:bg-navy-800 disabled:opacity-50"
                >
                  {addLoading ? 'A criar…' : 'Criar Propriedade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
