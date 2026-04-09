'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Info, X, AlertCircle, Receipt, Plus } from 'lucide-react'
import { useCurrency } from '@/contexts/currency-context'
import { PLATFORM_LABELS, PLATFORM_RULES, PLAN_COMMISSION, DEFAULT_COMMISSION_RATE } from '@/lib/finance'

type Payout = {
  id: string
  grossAmount: number
  commission: number
  commissionRate: number
  netAmount: number
  scheduledFor: string
  paidAt: string | null
  status: 'SCHEDULED' | 'PAID' | 'CANCELLED'
  platform: string | null
  description: string | null
  property: { id: string; name: string; owner: { id: string; name: string | null; email: string } }
  reservation: { id: string; guestName: string; checkIn: string; checkOut: string } | null
}

type Property = { id: string; name: string; owner: { name: string | null; email: string; subscriptionPlan: string | null } }

const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-PT')

const PLATFORMS = ['AIRBNB', 'BOOKING', 'VRBO', 'DIRECT', 'OTHER']

function HowItWorksModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-navy-900">Como funciona — Payouts</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-4 text-sm text-gray-700">

          {/* Fluxo automático */}
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-navy-900 mb-3">Fluxo de pagamento</h3>
            {[
              { label: 'Hóspede paga Airbnb / Booking', status: 'auto', note: 'Payout agendado automaticamente ao criar reserva' },
              { label: 'Dinheiro chega ao banco', status: 'manual', note: 'Admin clica "Mark paid" — futuro: Open Banking detecta automaticamente' },
              { label: 'Invoice ao proprietário', status: 'auto', note: 'Gerado automaticamente quando payout é marcado pago' },
              { label: 'Invoice de subscrição', status: 'manual', note: 'Manual por agora — futuro: Stripe webhook cria automaticamente' },
            ].map(row => (
              <div key={row.label} className="flex items-start gap-3 py-2 border-b last:border-0">
                <span className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  row.status === 'auto' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {row.status === 'auto' ? 'Auto' : 'Manual'}
                </span>
                <div>
                  <div className="font-medium text-navy-900 text-xs">{row.label}</div>
                  <div className="text-gray-500 text-xs">{row.note}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-navy-900">Data de pagamento por plataforma</h3>
            {Object.entries(PLATFORM_RULES).map(([platform, rule]) => (
              <div key={platform} className="flex items-center justify-between">
                <span className="text-gray-600">{PLATFORM_LABELS[platform] ?? platform}</span>
                <span className="font-medium text-navy-900">{rule}</span>
              </div>
            ))}
          </div>
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-semibold text-navy-900">Comissão por plano</h3>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {[
                { plan: 'STARTER', rate: '20%', price: 'Grátis' },
                { plan: 'BASIC',   rate: '20%', price: '€89/mês' },
                { plan: 'MID',     rate: '18%', price: '€139/mês' },
                { plan: 'PREMIUM', rate: '15%', price: '€199/mês' },
              ].map(r => (
                <div key={r.plan} className="rounded-md bg-gray-50 px-3 py-2">
                  <div className="font-semibold text-navy-900">{r.plan}</div>
                  <div className="text-gray-500">{r.price}</div>
                  <div className="text-orange-600 font-bold">{r.rate}</div>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500">
            O payout é calculado automaticamente sobre o valor bruto de cada reserva.
            Dias úteis excluem sábados e domingos.
          </p>
        </div>
        <div className="p-5 border-t">
          <button onClick={onClose} className="w-full rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white hover:bg-navy-800">
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}

function CreatePayoutModal({
  properties,
  onClose,
  onCreated,
}: {
  properties: Property[]
  onClose: () => void
  onCreated: () => void
}) {
  const { fmt } = useCurrency()
  const [propertyId, setPropertyId] = useState('')
  const [grossAmount, setGrossAmount] = useState('')
  const [platform, setPlatform] = useState('')
  const [scheduledFor, setScheduledFor] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const gross = parseFloat(grossAmount) || 0
  const selectedProp = properties.find(p => p.id === propertyId)
  const plan = selectedProp?.owner?.subscriptionPlan ?? null
  const rate = PLAN_COMMISSION[plan ?? ''] ?? DEFAULT_COMMISSION_RATE
  const commission = gross > 0 ? +(gross * rate).toFixed(2) : 0
  const net = gross > 0 ? +(gross - commission).toFixed(2) : 0
  const rateLabel = `${+(rate * 100).toFixed(1)}%`

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!propertyId || gross <= 0) { setError('Selecciona uma propriedade e um valor válido.'); return }
    setSaving(true)
    setError('')
    const res = await fetch('/api/payouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId, grossAmount: gross, scheduledFor, platform: platform || undefined, description: description || undefined }),
    })
    setSaving(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError((data as { error?: string }).error || 'Erro ao criar payout.')
      return
    }
    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-navy-900">Criar payout manual</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Propriedade *</label>
            <select value={propertyId} onChange={e => setPropertyId(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" required>
              <option value="">Seleccionar propriedade...</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name} — {p.owner.name || p.owner.email}</option>
              ))}
            </select>
            {selectedProp && (
              <p className="mt-1 text-xs text-gray-500">
                Proprietário: {selectedProp.owner.name || selectedProp.owner.email}
                {selectedProp.owner.subscriptionPlan && (
                  <span className="ml-1.5 rounded-full bg-gray-100 px-1.5 py-0.5 font-medium text-gray-600">{selectedProp.owner.subscriptionPlan}</span>
                )}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Valor bruto (EUR) *</label>
              <input type="number" min="1" step="0.01" value={grossAmount} onChange={e => setGrossAmount(e.target.value)} placeholder="0.00" className="w-full rounded-md border px-3 py-2 text-sm" required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Plataforma</label>
              <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
                <option value="">Nenhuma</option>
                {PLATFORMS.map(pl => <option key={pl} value={pl}>{PLATFORM_LABELS[pl] ?? pl}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Data agendada *</label>
            <input type="date" value={scheduledFor} onChange={e => setScheduledFor(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" required />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="ex: Ajuste manual — Jan 2026" className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          {gross > 0 && (
            <div className="rounded-lg bg-gray-50 border divide-y text-sm">
              <div className="flex justify-between px-3 py-2">
                <span className="text-gray-500">Valor recebido (bruto)</span>
                <span className="font-medium">{fmt(gross)}</span>
              </div>
              <div className="flex justify-between px-3 py-2 text-orange-600">
                <span>
                  Comissão HostMasters
                  {plan
                    ? <span className="ml-1 rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-bold">{plan} · {rateLabel}</span>
                    : <span className="ml-1 text-xs text-gray-400">(plano padrão · {rateLabel})</span>
                  }
                </span>
                <span>− {fmt(commission)}</span>
              </div>
              <div className="flex justify-between px-3 py-2.5 font-semibold">
                <span>Payout ao proprietário</span>
                <span className="text-green-600">{fmt(net)}</span>
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border py-2.5 text-sm font-medium hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50">
              {saving ? 'A criar...' : 'Criar payout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PayoutsPage() {
  const { fmt } = useCurrency()
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [clientFilter, setClientFilter] = useState('')
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [overdueOnly, setOverdueOnly] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])

  const now = new Date()
  const isOverdue = (p: Payout) => p.status === 'SCHEDULED' && new Date(p.scheduledFor) < now

  const load = async (filter = '') => {
    setLoading(true)
    try {
      const url = filter ? `/api/payouts?client=${encodeURIComponent(filter)}` : '/api/payouts'
      const res = await fetch(url)
      if (res.ok) setPayouts(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const loadProperties = async () => {
    const res = await fetch('/api/properties?limit=200')
    if (res.ok) {
      const data = await res.json() as { properties?: Property[] } | Property[]
      setProperties(Array.isArray(data) ? data : (data.properties ?? []))
    }
  }

  useEffect(() => { load(); loadProperties() }, [])

  const [paying, setPaying] = useState<string | null>(null)

  const markPaid = async (id: string, ownerName: string, amount: number) => {
    if (!confirm(`Confirm payout to ${ownerName} of ${fmt(amount)}?\n\nThis will:\n- Mark payout as paid\n- Generate invoice automatically\n- Send Owner Statement by email`)) return
    setPaying(id)
    await fetch(`/api/payouts/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'PAID' }) })
    setPaying(null)
    load()
  }

  const displayed = overdueOnly ? payouts.filter(isOverdue) : payouts

  const totals = payouts.reduce(
    (acc, p) => {
      if (p.status === 'SCHEDULED') {
        acc.scheduled += p.netAmount
        acc.commission += p.commission
        if (isOverdue(p)) acc.overdueCount++
      }
      return acc
    },
    { scheduled: 0, commission: 0, overdueCount: 0 },
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-navy-900">Payouts</h1>
          <p className="text-sm text-gray-600">Pagamentos automaticos por plataforma - comissao calculada por plano</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setShowHowItWorks(true)} className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50">
            <Info className="h-4 w-4" />
            Como funciona
          </button>
          <Link href="/manager/invoices" className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 text-gray-700 px-4 py-2 text-sm hover:bg-gray-200">
            <Receipt className="h-4 w-4" />
            Invoices
          </Link>
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 rounded-md bg-navy-900 text-white px-4 py-2 text-sm hover:bg-navy-800">
            <Plus className="h-4 w-4" />
            Criar payout
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">Agendado (liquido)</div>
          <div className="text-2xl font-semibold text-navy-900 mt-1">{fmt(totals.scheduled)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">Comissao pendente</div>
          <div className="text-2xl font-semibold text-navy-900 mt-1">{fmt(totals.commission)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">Payouts abertos</div>
          <div className="text-2xl font-semibold text-navy-900 mt-1">{payouts.filter(p => p.status === 'SCHEDULED').length}</div>
        </div>
        <div className="rounded-xl border bg-white p-4 flex flex-col">
          <div className="text-xs uppercase text-gray-500 mb-1">Em atraso</div>
          <button
            onClick={() => setOverdueOnly(o => !o)}
            className={`mt-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${overdueOnly ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
          >
            {totals.overdueCount > 0 && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
            )}
            <AlertCircle className="h-4 w-4" />
            {totals.overdueCount} em atraso{overdueOnly && ' (limpar)'}
          </button>
        </div>
      </div>

      <form onSubmit={e => { e.preventDefault(); load(clientFilter) }} className="flex gap-2">
        <input placeholder="Filtrar por cliente, email ou ID..." value={clientFilter} onChange={e => setClientFilter(e.target.value)} className="flex-1 rounded-md border px-3 py-2 text-sm" />
        <button type="submit" className="rounded-md bg-navy-900 text-white px-4 py-2 text-sm hover:bg-navy-800">Filtrar</button>
        {clientFilter && (
          <button type="button" onClick={() => { setClientFilter(''); load('') }} className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50">Limpar</button>
        )}
      </form>

      {overdueOnly && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          A mostrar apenas {totals.overdueCount} payout(s) em atraso.
        </div>
      )}

      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Propriedade</th>
              <th className="px-4 py-3">Proprietario</th>
              <th className="px-4 py-3">Hospede / Descricao</th>
              <th className="px-4 py-3">Plataforma</th>
              <th className="px-4 py-3">Checkout</th>
              <th className="px-4 py-3">Agendado</th>
              <th className="px-4 py-3 text-right">Bruto</th>
              <th className="px-4 py-3 text-right">Comissao</th>
              <th className="px-4 py-3 text-right">Liquido</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={11} className="text-center py-8 text-gray-500">A carregar...</td></tr>}
            {!loading && displayed.length === 0 && <tr><td colSpan={11} className="text-center py-8 text-gray-500">Sem payouts</td></tr>}
            {displayed.map(p => {
              const overdue = isOverdue(p)
              const guestOrDesc = p.reservation?.guestName ?? p.description ?? '—'
              const checkoutStr = p.reservation ? fmtDate(p.reservation.checkOut) : '—'
              return (
                <tr key={p.id} className={`border-t ${overdue ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3 font-medium">{p.property.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.property.owner.name || p.property.owner.email}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {guestOrDesc}
                    {!p.reservation && <span className="ml-1.5 rounded-full bg-purple-100 text-purple-700 px-1.5 py-0.5 text-[10px] font-medium">manual</span>}
                  </td>
                  <td className="px-4 py-3">
                    {p.platform
                      ? <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{PLATFORM_LABELS[p.platform] ?? p.platform}</span>
                      : <span className="text-gray-400 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{checkoutStr}</td>
                  <td className={`px-4 py-3 ${overdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                    {fmtDate(p.scheduledFor)}{overdue && <span className="ml-1 text-xs">(atraso)</span>}
                  </td>
                  <td className="px-4 py-3 text-right">{fmt(p.grossAmount)}</td>
                  <td className="px-4 py-3 text-right text-orange-600">
                    {fmt(p.commission)}<span className="text-gray-400 text-xs ml-1">({p.commissionRate ?? 18}%)</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{fmt(p.netAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={
                      p.status === 'PAID'      ? 'inline-block rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs' :
                      p.status === 'SCHEDULED' ? 'inline-block rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs' :
                                                  'inline-block rounded-full bg-gray-200 text-gray-700 px-2 py-0.5 text-xs'
                    }>
                      {p.status === 'PAID' ? 'Pago' : p.status === 'SCHEDULED' ? 'Agendado' : 'Cancelado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.status === 'SCHEDULED' && (
                      <button
                        onClick={() => markPaid(p.id, p.property.owner.name || p.property.owner.email, p.netAmount)}
                        disabled={paying === p.id}
                        className="inline-flex items-center gap-1.5 text-xs rounded-lg bg-green-600 text-white px-3 py-1.5 hover:bg-green-700 disabled:opacity-50 font-medium transition-colors"
                      >
                        {paying === p.id ? '...' : 'Mark paid'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showHowItWorks && <HowItWorksModal onClose={() => setShowHowItWorks(false)} />}
      {showCreate && (
        <CreatePayoutModal
          properties={properties}
          onClose={() => setShowCreate(false)}
          onCreated={() => load(clientFilter)}
        />
      )}
    </div>
  )
}
