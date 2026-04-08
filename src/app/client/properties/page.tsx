'use client'

import { useEffect, useState } from 'react'
import { Building2, MapPin, Check, AlertCircle, Plus, X, Clock } from 'lucide-react'

type Property = {
  id: string
  name: string
  address: string
  city: string
  postalCode: string | null
  status: string
  airbnbConnected: boolean
  bookingConnected: boolean
}

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  PENDING_APPROVAL: { cls: 'bg-amber-100 text-amber-700', label: 'Aguarda aprovação' },
  ACTIVE:           { cls: 'bg-green-100 text-green-700', label: 'Ativa' },
  INACTIVE:         { cls: 'bg-gray-100 text-gray-500',   label: 'Inativa' },
  MAINTENANCE:      { cls: 'bg-orange-100 text-orange-600', label: 'Em manutenção' },
}

export default function ClientProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', city: '', postalCode: '' })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState(false)

  const load = () =>
    fetch('/api/properties')
      .then(r => r.ok ? r.json() : [])
      .then((d: Property[]) => { setProperties(d); setLoading(false) })

  useEffect(() => { load() }, [])

  const pending = properties.filter(p => p.status === 'PENDING_APPROVAL')

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    if (!form.name || !form.address || !form.city) {
      setAddError('Preenche nome, morada e cidade.')
      return
    }
    setAddLoading(true)
    const res = await fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, address: form.address, city: form.city, postalCode: form.postalCode || undefined }),
    })
    if (!res.ok) {
      const err = await res.json()
      setAddError(err.error || 'Erro ao submeter.')
    } else {
      setAddSuccess(true)
      setForm({ name: '', address: '', city: '', postalCode: '' })
      await load()
      setTimeout(() => { setShowAdd(false); setAddSuccess(false) }, 2000)
    }
    setAddLoading(false)
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">A carregar…</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">As Minhas Propriedades</h1>
          <p className="text-sm text-gray-500">Acompanha o estado das tuas propriedades.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-navy-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-navy-800"
        >
          <Plus className="h-4 w-4" /> Solicitar Propriedade
        </button>
      </div>

      {/* Pending banner */}
      {pending.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-0.5">
              {pending.length === 1 ? '1 propriedade aguarda aprovação' : `${pending.length} propriedades aguardam aprovação`}
            </p>
            <p className="text-xs">O teu gestor irá rever, conectar os calendários e ativar em breve.</p>
          </div>
        </div>
      )}

      {properties.length === 0 && (
        <div className="rounded-xl border bg-white p-10 text-center">
          <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-3">Ainda sem propriedades.</p>
          <button onClick={() => setShowAdd(true)} className="rounded-lg bg-navy-900 text-white px-4 py-2 text-sm font-semibold hover:bg-navy-800">
            Solicitar a primeira
          </button>
        </div>
      )}

      <div className="space-y-4">
        {properties.map(p => {
          const badge = STATUS_BADGE[p.status] ?? { cls: 'bg-gray-100 text-gray-600', label: p.status }
          return (
            <div key={p.id} className={`rounded-xl border bg-white p-5 ${p.status === 'PENDING_APPROVAL' ? 'border-amber-200' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-base font-bold text-navy-900">{p.name}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="h-4 w-4 shrink-0" /> {p.address}, {p.city}
                  </p>

                  {p.status === 'ACTIVE' && (
                    <div className="flex items-center gap-4 mt-3">
                      <span className={`inline-flex items-center gap-1 text-xs ${p.airbnbConnected ? 'text-green-600' : 'text-gray-400'}`}>
                        {p.airbnbConnected ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                        Airbnb {p.airbnbConnected ? 'conectado' : 'não conectado'}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs ${p.bookingConnected ? 'text-green-600' : 'text-gray-400'}`}>
                        {p.bookingConnected ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                        Booking.com {p.bookingConnected ? 'conectado' : 'não conectado'}
                      </span>
                    </div>
                  )}

                  {p.status === 'PENDING_APPROVAL' && (
                    <p className="text-xs text-amber-600 mt-2">
                      A aguardar que o gestor reveja e ative a propriedade.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Solicitar Propriedade modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-base font-bold text-navy-900">Solicitar Propriedade</h2>
                <p className="text-xs text-gray-500 mt-0.5">O gestor irá rever e ativar a propriedade.</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="rounded-md p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={submitRequest} className="p-5 space-y-4">
              {addError && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{addError}</div>}
              {addSuccess && (
                <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 flex items-center gap-2">
                  <Check className="h-4 w-4" /> Solicitação enviada! O gestor irá rever em breve.
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Nome da propriedade *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Apartamento T2 Cascais"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Morada *</label>
                <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Rua, número"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Cidade *</label>
                  <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="Lisboa"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Código Postal</label>
                  <input type="text" value={form.postalCode} onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))}
                    placeholder="1000-001"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" />
                </div>
              </div>

              <div className="rounded-lg bg-gray-50 border p-3 text-xs text-gray-500">
                Após o envio, o teu gestor irá rever os dados, conectar os calendários Airbnb e Booking.com e ativar a propriedade.
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={addLoading}
                  className="rounded-lg bg-navy-900 text-white px-4 py-2 text-sm font-semibold hover:bg-navy-800 disabled:opacity-50">
                  {addLoading ? 'A enviar…' : 'Enviar Solicitação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
