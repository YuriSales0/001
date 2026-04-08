'use client'

import { useEffect, useState } from 'react'
import { Building2, MapPin, Check, AlertCircle, ChevronRight, X, ExternalLink, CheckCircle2, Clock } from 'lucide-react'

type Property = {
  id: string
  name: string
  address: string
  city: string
  postalCode: string | null
  status: string
  airbnbConnected: boolean
  bookingConnected: boolean
  airbnbIcalUrl: string | null
  airbnbListingId: string | null
  bookingIcalUrl: string | null
  bookingPropertyId: string | null
}

type WizardState = {
  property: Property
  step: 1 | 2 | 3
  airbnbIcalUrl: string
  airbnbListingId: string
  bookingIcalUrl: string
  bookingPropertyId: string
  saving: boolean
  approving: boolean
  error: string
}

const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
  PENDING_APPROVAL: { cls: 'bg-amber-100 text-amber-700', label: 'Aguarda aprovação' },
  ACTIVE:           { cls: 'bg-green-100 text-green-700', label: 'Ativa' },
  INACTIVE:         { cls: 'bg-gray-100 text-gray-500',  label: 'Inativa' },
  MAINTENANCE:      { cls: 'bg-orange-100 text-orange-600', label: 'Em manutenção' },
}

export default function ClientProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [wizard, setWizard] = useState<WizardState | null>(null)

  const load = () =>
    fetch('/api/properties')
      .then(r => r.ok ? r.json() : [])
      .then((d: Property[]) => { setProperties(d); setLoading(false) })

  useEffect(() => { load() }, [])

  const openWizard = (p: Property) =>
    setWizard({
      property: p,
      step: 1,
      airbnbIcalUrl: p.airbnbIcalUrl ?? '',
      airbnbListingId: p.airbnbListingId ?? '',
      bookingIcalUrl: p.bookingIcalUrl ?? '',
      bookingPropertyId: p.bookingPropertyId ?? '',
      saving: false,
      approving: false,
      error: '',
    })

  const saveOta = async (nextStep: 1 | 2 | 3) => {
    if (!wizard) return
    setWizard(w => w ? { ...w, saving: true, error: '' } : w)
    const res = await fetch(`/api/properties/${wizard.property.id}/ota`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        airbnbIcalUrl:    wizard.airbnbIcalUrl || null,
        airbnbListingId:  wizard.airbnbListingId || null,
        bookingIcalUrl:   wizard.bookingIcalUrl || null,
        bookingPropertyId: wizard.bookingPropertyId || null,
      }),
    })
    const data = await res.json()
    if (!res.ok) {
      setWizard(w => w ? { ...w, saving: false, error: data.error ?? 'Erro ao guardar.' } : w)
      return
    }
    setWizard(w => w ? { ...w, saving: false, step: nextStep, property: { ...w.property, ...data } } : w)
  }

  const approve = async () => {
    if (!wizard) return
    setWizard(w => w ? { ...w, approving: true, error: '' } : w)
    const res = await fetch(`/api/properties/${wizard.property.id}/approve`, { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      setWizard(w => w ? { ...w, approving: false, error: data.error ?? 'Erro ao aprovar.' } : w)
      return
    }
    setWizard(null)
    await load()
  }

  const pending = properties.filter(p => p.status === 'PENDING_APPROVAL')

  if (loading) return <div className="p-6 text-sm text-gray-400">A carregar…</div>

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">As Minhas Propriedades</h1>
        <p className="text-sm text-gray-500">Gerir e acompanhar as tuas propriedades.</p>
      </div>

      {/* Pending banner */}
      {pending.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">
              {pending.length === 1 ? '1 propriedade aguarda a tua aprovação' : `${pending.length} propriedades aguardam a tua aprovação`}
            </p>
            <p>Para ativar cada propriedade, conecta as APIs do Airbnb e Booking.com e confirma os dados.</p>
          </div>
        </div>
      )}

      {properties.length === 0 && (
        <div className="rounded-xl border bg-white p-10 text-center">
          <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">Ainda sem propriedades. O teu gestor irá adicionar a primeira.</p>
        </div>
      )}

      <div className="space-y-4">
        {properties.map(p => {
          const badge = STATUS_BADGE[p.status] ?? { cls: 'bg-gray-100 text-gray-600', label: p.status }
          const isPending = p.status === 'PENDING_APPROVAL'
          return (
            <div key={p.id} className={`rounded-xl border bg-white overflow-hidden ${isPending ? 'border-amber-200' : ''}`}>
              <div className="p-5 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-navy-900">{p.name}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4 shrink-0" /> {p.address}, {p.city}
                  </p>
                  {/* OTA status */}
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
                </div>
                {isPending && (
                  <button
                    onClick={() => openWizard(p)}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 text-white px-3 py-2 text-sm font-semibold hover:bg-amber-600"
                  >
                    Configurar e Aprovar <ChevronRight className="h-4 w-4" />
                  </button>
                )}
                {!isPending && (
                  <button
                    onClick={() => openWizard(p)}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    Gerir integrações
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* OTA Wizard Modal */}
      {wizard && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => !wizard.saving && !wizard.approving && setWizard(null)}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <p className="text-xs text-gray-500 mb-0.5">{wizard.property.name}</p>
                <h2 className="text-base font-bold text-navy-900">
                  {wizard.step === 1 && 'Passo 1 de 3 — Airbnb'}
                  {wizard.step === 2 && 'Passo 2 de 3 — Booking.com'}
                  {wizard.step === 3 && 'Passo 3 de 3 — Confirmar e Aprovar'}
                </h2>
              </div>
              <button onClick={() => setWizard(null)} disabled={wizard.saving || wizard.approving} className="rounded-md p-1 hover:bg-gray-100 disabled:opacity-40">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex px-5 pt-4 gap-2">
              {[1, 2, 3].map(s => (
                <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= wizard.step ? 'bg-navy-900' : 'bg-gray-200'}`} />
              ))}
            </div>

            <div className="p-5 space-y-4">
              {wizard.error && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{wizard.error}</div>
              )}

              {/* Step 1 — Airbnb */}
              {wizard.step === 1 && (
                <>
                  <div className="rounded-lg bg-rose-50 border border-rose-100 p-3 text-sm text-rose-800 space-y-1">
                    <p className="font-semibold">Como obter o URL do Airbnb:</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-xs">
                      <li>Acede ao teu anúncio no <span className="font-medium">Airbnb.com</span></li>
                      <li>Vai a <span className="font-medium">Disponibilidade → Sincronizar calendários</span></li>
                      <li>Clica em <span className="font-medium">Exportar calendário</span> e copia o link</li>
                    </ol>
                    <a href="https://www.airbnb.com/hosting/listings" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-rose-700 font-medium text-xs mt-1 hover:underline">
                      Abrir Airbnb <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">URL iCal do Airbnb</label>
                    <input
                      type="url"
                      value={wizard.airbnbIcalUrl}
                      onChange={e => setWizard(w => w ? { ...w, airbnbIcalUrl: e.target.value } : w)}
                      placeholder="https://www.airbnb.com/calendar/ical/XXXXX.ics?s=..."
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">ID do anúncio Airbnb <span className="font-normal text-gray-400">(opcional)</span></label>
                    <input
                      type="text"
                      value={wizard.airbnbListingId}
                      onChange={e => setWizard(w => w ? { ...w, airbnbListingId: e.target.value } : w)}
                      placeholder="Ex: 12345678"
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                    />
                    <p className="text-xs text-gray-400 mt-1">Encontra o ID no URL do teu anúncio: airbnb.com/rooms/<strong>12345678</strong></p>
                  </div>

                  <div className="flex justify-between pt-1">
                    <button
                      onClick={() => saveOta(2)}
                      disabled={wizard.saving}
                      className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40"
                    >
                      Saltar este passo →
                    </button>
                    <button
                      onClick={() => saveOta(2)}
                      disabled={wizard.saving || !wizard.airbnbIcalUrl}
                      className="rounded-lg bg-navy-900 text-white px-5 py-2 text-sm font-semibold hover:bg-navy-800 disabled:opacity-50"
                    >
                      {wizard.saving ? 'A guardar…' : 'Guardar e continuar'}
                    </button>
                  </div>
                </>
              )}

              {/* Step 2 — Booking.com */}
              {wizard.step === 2 && (
                <>
                  <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm text-blue-800 space-y-1">
                    <p className="font-semibold">Como obter o URL do Booking.com:</p>
                    <ol className="list-decimal list-inside space-y-0.5 text-xs">
                      <li>Entra na <span className="font-medium">Extranet do Booking.com</span></li>
                      <li>Vai a <span className="font-medium">Tarifas e Disponibilidade → Sincronização de calendários</span></li>
                      <li>Clica em <span className="font-medium">Exportar calendário</span> e copia o link iCal</li>
                    </ol>
                    <a href="https://admin.booking.com" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-700 font-medium text-xs mt-1 hover:underline">
                      Abrir Booking.com Extranet <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">URL iCal do Booking.com</label>
                    <input
                      type="url"
                      value={wizard.bookingIcalUrl}
                      onChange={e => setWizard(w => w ? { ...w, bookingIcalUrl: e.target.value } : w)}
                      placeholder="https://admin.booking.com/hotel/hoteladmin/ical.html?..."
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">ID da propriedade Booking.com <span className="font-normal text-gray-400">(opcional)</span></label>
                    <input
                      type="text"
                      value={wizard.bookingPropertyId}
                      onChange={e => setWizard(w => w ? { ...w, bookingPropertyId: e.target.value } : w)}
                      placeholder="Ex: 1234567"
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                    />
                    <p className="text-xs text-gray-400 mt-1">Encontra o ID na Extranet: admin.booking.com/hotel/hoteladmin/<strong>1234567</strong>/info</p>
                  </div>

                  <div className="flex justify-between pt-1">
                    <button onClick={() => setWizard(w => w ? { ...w, step: 1 } : w)} className="text-sm text-gray-500 hover:text-gray-700">
                      ← Voltar
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveOta(3)}
                        disabled={wizard.saving}
                        className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-40"
                      >
                        Saltar →
                      </button>
                      <button
                        onClick={() => saveOta(3)}
                        disabled={wizard.saving || !wizard.bookingIcalUrl}
                        className="rounded-lg bg-navy-900 text-white px-5 py-2 text-sm font-semibold hover:bg-navy-800 disabled:opacity-50"
                      >
                        {wizard.saving ? 'A guardar…' : 'Guardar e continuar'}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* Step 3 — Review & Approve */}
              {wizard.step === 3 && (
                <>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">Revê as integrações antes de aprovar a propriedade:</p>

                    {/* Airbnb row */}
                    <div className={`flex items-center justify-between rounded-lg border p-3 ${wizard.property.airbnbConnected ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center gap-2">
                        {wizard.property.airbnbConnected
                          ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                          : <AlertCircle className="h-4 w-4 text-gray-400" />}
                        <span className="text-sm font-medium">Airbnb</span>
                      </div>
                      <span className={`text-xs ${wizard.property.airbnbConnected ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                        {wizard.property.airbnbConnected ? 'Conectado' : 'Não conectado'}
                      </span>
                    </div>

                    {/* Booking row */}
                    <div className={`flex items-center justify-between rounded-lg border p-3 ${wizard.property.bookingConnected ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex items-center gap-2">
                        {wizard.property.bookingConnected
                          ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                          : <AlertCircle className="h-4 w-4 text-gray-400" />}
                        <span className="text-sm font-medium">Booking.com</span>
                      </div>
                      <span className={`text-xs ${wizard.property.bookingConnected ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                        {wizard.property.bookingConnected ? 'Conectado' : 'Não conectado'}
                      </span>
                    </div>

                    {!wizard.property.airbnbConnected && !wizard.property.bookingConnected && (
                      <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>É necessário conectar pelo menos uma plataforma para aprovar a propriedade.</span>
                      </div>
                    )}

                    {(wizard.property.airbnbConnected || wizard.property.bookingConnected) && (
                      <div className="rounded-lg bg-navy-50 border border-navy-100 p-3 text-xs text-navy-800">
                        Ao aprovar, a propriedade ficará <strong>Ativa</strong> e as reservas serão sincronizadas automaticamente.
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between pt-1">
                    <button onClick={() => setWizard(w => w ? { ...w, step: 2 } : w)} className="text-sm text-gray-500 hover:text-gray-700">
                      ← Voltar
                    </button>
                    <button
                      onClick={approve}
                      disabled={wizard.approving || (!wizard.property.airbnbConnected && !wizard.property.bookingConnected)}
                      className="inline-flex items-center gap-2 rounded-lg bg-green-600 text-white px-5 py-2 text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      {wizard.approving ? 'A aprovar…' : 'Aprovar Propriedade'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
