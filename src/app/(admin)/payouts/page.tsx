'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Info, X, AlertCircle, Receipt } from 'lucide-react'
import { useCurrency } from '@/contexts/currency-context'
import { PLATFORM_LABELS, PLATFORM_RULES } from '@/lib/finance'

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
  property: { id: string; name: string; owner: { id: string; name: string | null; email: string } }
  reservation: { id: string; guestName: string; checkIn: string; checkOut: string }
}

const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-PT')

function HowItWorksModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-navy-900">Como funciona — Payouts</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5 space-y-4 text-sm text-gray-700">
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
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"
          >
            Fechar
          </button>
        </div>
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

  const now = new Date()
  const isOverdue = (p: Payout) =>
    p.status === 'SCHEDULED' && new Date(p.scheduledFor) < now

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

  useEffect(() => { load() }, [])

  const markPaid = async (id: string) => {
    await fetch(`/api/payouts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PAID' }),
    })
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
          <p className="text-sm text-gray-600">
            Pagamentos automáticos por plataforma · comissão calculada por plano
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowHowItWorks(true)}
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Info className="h-4 w-4" />
            Como funciona
          </button>
          <Link
            href="/manager/invoices"
            className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 text-white px-4 py-2 text-sm hover:bg-gray-800"
          >
            <Receipt className="h-4 w-4" />
            Invoices
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">Agendado (líquido)</div>
          <div className="text-2xl font-semibold text-navy-900 mt-1">{fmt(totals.scheduled)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">Comissão pendente</div>
          <div className="text-2xl font-semibold text-navy-900 mt-1">{fmt(totals.commission)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">Payouts abertos</div>
          <div className="text-2xl font-semibold text-navy-900 mt-1">
            {payouts.filter(p => p.status === 'SCHEDULED').length}
          </div>
        </div>
        {/* Overdue button with pulse */}
        <div className="rounded-xl border bg-white p-4 flex flex-col">
          <div className="text-xs uppercase text-gray-500 mb-1">Em atraso</div>
          <button
            onClick={() => setOverdueOnly(o => !o)}
            className={`mt-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              overdueOnly
                ? 'bg-red-600 text-white'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            {totals.overdueCount > 0 && (
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
              </span>
            )}
            <AlertCircle className="h-4 w-4" />
            {totals.overdueCount} em atraso
            {overdueOnly && ' (limpar)'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <form onSubmit={e => { e.preventDefault(); load(clientFilter) }} className="flex gap-2">
        <input
          placeholder="Filtrar por cliente, email ou ID…"
          value={clientFilter}
          onChange={e => setClientFilter(e.target.value)}
          className="flex-1 rounded-md border px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-md bg-navy-900 text-white px-4 py-2 text-sm hover:bg-navy-800">
          Filtrar
        </button>
        {clientFilter && (
          <button
            type="button"
            onClick={() => { setClientFilter(''); load('') }}
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Limpar
          </button>
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
              <th className="px-4 py-3">Proprietário</th>
              <th className="px-4 py-3">Hóspede</th>
              <th className="px-4 py-3">Plataforma</th>
              <th className="px-4 py-3">Checkout</th>
              <th className="px-4 py-3">Agendado</th>
              <th className="px-4 py-3 text-right">Bruto</th>
              <th className="px-4 py-3 text-right">Comissão</th>
              <th className="px-4 py-3 text-right">Líquido</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={11} className="text-center py-8 text-gray-500">A carregar…</td></tr>
            )}
            {!loading && displayed.length === 0 && (
              <tr><td colSpan={11} className="text-center py-8 text-gray-500">Sem payouts</td></tr>
            )}
            {displayed.map(p => {
              const overdue = isOverdue(p)
              return (
                <tr key={p.id} className={`border-t ${overdue ? 'bg-red-50' : ''}`}>
                  <td className="px-4 py-3 font-medium">{p.property.name}</td>
                  <td className="px-4 py-3 text-gray-600">{p.property.owner.name || p.property.owner.email}</td>
                  <td className="px-4 py-3 text-gray-600">{p.reservation.guestName}</td>
                  <td className="px-4 py-3">
                    {p.platform
                      ? <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{PLATFORM_LABELS[p.platform] ?? p.platform}</span>
                      : <span className="text-gray-400 text-xs">—</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-gray-600">{fmtDate(p.reservation.checkOut)}</td>
                  <td className={`px-4 py-3 ${overdue ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                    {fmtDate(p.scheduledFor)}
                    {overdue && <span className="ml-1 text-xs">(atraso)</span>}
                  </td>
                  <td className="px-4 py-3 text-right">{fmt(p.grossAmount)}</td>
                  <td className="px-4 py-3 text-right text-orange-600">
                    {fmt(p.commission)}
                    <span className="text-gray-400 text-xs ml-1">({p.commissionRate ?? 18}%)</span>
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
                        onClick={() => markPaid(p.id)}
                        className="text-xs rounded-md bg-navy-900 text-white px-3 py-1 hover:bg-navy-800"
                      >
                        Marcar pago
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
    </div>
  )
}
