'use client'

import { useEffect, useState } from 'react'
import { InvoiceForm } from '@/components/invoice-form'
import { Info, X, AlertCircle, FileText, CreditCard, CheckCircle2, Clock, Wrench, ShoppingBag, Sparkles, BarChart3, CalendarDays } from 'lucide-react'
import { useCurrency } from '@/contexts/currency-context'
import { PLATFORM_LABELS, PLATFORM_RULES } from '@/lib/finance'

type Invoice = {
  id: string
  invoiceNumber: string | null
  invoiceType: string
  description: string
  amount: number
  status: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED'
  dueDate: string | null
  paidAt: string | null
  createdAt: string
  client: { id: string; name: string | null; email: string }
  property: { id: string; name: string } | null
  createdBy: { name: string | null; email: string }
}

const INVOICE_TYPE_META: Record<string, { label: string; color: string }> = {
  CLEANING:           { label: 'Limpeza',       color: 'bg-blue-100 text-blue-700' },
  REPAIR:             { label: 'Reparação',      color: 'bg-red-100 text-red-700' },
  MATERIAL:           { label: 'Material',       color: 'bg-amber-100 text-amber-700' },
  MANAGEMENT_FEE:     { label: 'Comissão',       color: 'bg-purple-100 text-purple-700' },
  MONTHLY_PLAN:       { label: 'Plano Mensal',   color: 'bg-indigo-100 text-indigo-700' },
  MONTHLY_SETTLEMENT: { label: 'Liquidação',     color: 'bg-green-100 text-green-700' },
  SERVICE:            { label: 'Serviço',        color: 'bg-gray-100 text-gray-700' },
}

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
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [clientFilter, setClientFilter] = useState('')
  const [showInvoiceForm, setShowInvoiceForm] = useState(false)
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [overdueOnly, setOverdueOnly] = useState(false)

  const now = new Date()
  const isOverdue = (p: Payout) =>
    p.status === 'SCHEDULED' && new Date(p.scheduledFor) < now

  const markInvoicePaid = async (id: string) => {
    await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PAID' }),
    })
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'PAID' as const, paidAt: new Date().toISOString() } : i))
  }

  const load = async (filter = '') => {
    setLoading(true)
    try {
      const url = filter ? `/api/payouts?client=${encodeURIComponent(filter)}` : '/api/payouts'
      const [payoutsRes, invoicesRes] = await Promise.all([
        fetch(url),
        fetch('/api/invoices'),
      ])
      if (payoutsRes.ok) setPayouts(await payoutsRes.json())
      if (invoicesRes.ok) setInvoices(await invoicesRes.json())
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

  const pendingInvoiceTotal = invoices
    .filter(i => i.status === 'SENT')
    .reduce((s, i) => s + i.amount, 0)

  // Combined sorted list: payouts + invoices, sorted by upcoming date
  type CombinedItem =
    | { kind: 'payout'; data: Payout }
    | { kind: 'invoice'; data: Invoice }

  const getItemDate = (item: CombinedItem) => {
    if (item.kind === 'payout') return new Date(item.data.scheduledFor).getTime()
    return new Date(item.data.dueDate || item.data.createdAt).getTime()
  }

  const allItems: CombinedItem[] = [
    ...(overdueOnly
      ? payouts.filter(isOverdue)
      : payouts
    ).map(p => ({ kind: 'payout' as const, data: p })),
    ...(overdueOnly
      ? []
      : invoices.filter(i => i.status !== 'CANCELLED')
    ).map(i => ({ kind: 'invoice' as const, data: i })),
  ].sort((a, b) => getItemDate(a) - getItemDate(b))

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
          <button
            onClick={() => setShowInvoiceForm(s => !s)}
            className="rounded-md bg-navy-900 text-white px-4 py-2 text-sm hover:bg-navy-800"
          >
            {showInvoiceForm ? 'Fechar' : '+ Factura manual'}
          </button>
        </div>
      </div>

      {showInvoiceForm && <InvoiceForm />}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">Payouts agendados</div>
          <div className="text-2xl font-semibold text-green-700 mt-1">{fmt(totals.scheduled)}</div>
          <div className="text-xs text-gray-400 mt-0.5">a pagar a proprietários</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">Faturas pendentes</div>
          <div className="text-2xl font-semibold text-orange-600 mt-1">{fmt(pendingInvoiceTotal)}</div>
          <div className="text-xs text-gray-400 mt-0.5">a cobrar de proprietários</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">Comissão pendente</div>
          <div className="text-2xl font-semibold text-navy-900 mt-1">{fmt(totals.commission)}</div>
        </div>
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

      {/* ── Combined Payouts + Invoices ──────────────────────────────── */}
      {loading ? (
        <div className="rounded-xl border bg-white p-8 text-center text-gray-400">A carregar…</div>
      ) : allItems.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-gray-400">
          Sem movimentos pendentes.
        </div>
      ) : (
        <div className="space-y-3">
          {allItems.map(item => {
            if (item.kind === 'payout') {
              const p = item.data
              const overdue = isOverdue(p)
              const isPaid = p.status === 'PAID'
              return (
                <div
                  key={`payout-${p.id}`}
                  className={`rounded-xl border bg-white p-4 flex items-center gap-4 ${
                    overdue ? 'border-red-200 bg-red-50/30'
                    : isPaid ? 'border-green-100 opacity-70'
                    : 'border-green-200'
                  }`}
                >
                  {/* Direction badge */}
                  <div className="shrink-0 flex flex-col items-center gap-1">
                    <span className="rounded-lg bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 uppercase tracking-wide">
                      Payout ↑
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-sm font-bold text-navy-900">{p.property.name}</span>
                      {p.platform && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{PLATFORM_LABELS[p.platform] ?? p.platform}</span>
                      )}
                      {overdue && <span className="rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-xs font-semibold">Em atraso</span>}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-3">
                      <span className="font-medium text-gray-700">{p.property.owner.name || p.property.owner.email}</span>
                      <span>· {p.reservation.guestName}</span>
                      <span>· checkout {fmtDate(p.reservation.checkOut)}</span>
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Agendado: <span className={overdue ? 'text-red-600 font-semibold' : 'text-gray-600'}>{fmtDate(p.scheduledFor)}</span>
                      <span className="ml-3">Bruto: {fmt(p.grossAmount)} · Comissão: {fmt(p.commission)} ({p.commissionRate ?? 18}%)</span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="shrink-0 text-right min-w-[90px]">
                    <div className="text-base font-bold text-green-700">+{fmt(p.netAmount)}</div>
                    <span className={
                      isPaid ? 'text-xs text-green-600 font-semibold'
                      : p.status === 'SCHEDULED' ? 'text-xs text-blue-600 font-semibold'
                      : 'text-xs text-gray-400'
                    }>
                      {isPaid ? '✓ Pago' : p.status === 'SCHEDULED' ? 'Agendado' : 'Cancelado'}
                    </span>
                  </div>

                  {/* Action */}
                  {p.status === 'SCHEDULED' && (
                    <button
                      onClick={() => markPaid(p.id)}
                      className="shrink-0 text-xs rounded-lg bg-navy-900 text-white px-3 py-1.5 hover:bg-navy-800 font-semibold"
                    >
                      Marcar pago
                    </button>
                  )}
                </div>
              )
            }

            // Invoice
            const inv = item.data
            const typeMeta = INVOICE_TYPE_META[inv.invoiceType] ?? INVOICE_TYPE_META.SERVICE
            const isPaid = (inv.status as string) === 'PAID'
            const isOverdueInv = !isPaid && inv.dueDate && new Date(inv.dueDate) < now
            return (
              <div
                key={`invoice-${inv.id}`}
                className={`rounded-xl border bg-white p-4 flex items-center gap-4 ${
                  isOverdueInv ? 'border-red-200 bg-red-50/30'
                  : isPaid ? 'border-gray-200 opacity-60'
                  : 'border-orange-200 bg-orange-50/10'
                }`}
              >
                {/* Direction badge */}
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <span className="rounded-lg bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 uppercase tracking-wide">
                    Fatura ↓
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    {inv.invoiceNumber && (
                      <span className="text-xs font-bold text-gray-400">{inv.invoiceNumber}</span>
                    )}
                    <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${typeMeta.color}`}>
                      {typeMeta.label}
                    </span>
                    {isOverdueInv && (
                      <span className="text-xs font-semibold rounded-full px-2 py-0.5 bg-red-100 text-red-700">Em atraso</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-navy-900 truncate">{inv.description}</p>
                  <div className="text-xs text-gray-500 flex items-center gap-3 mt-0.5">
                    <span className="font-medium text-gray-700">{inv.client.name || inv.client.email}</span>
                    {inv.property && <span>· {inv.property.name}</span>}
                    {inv.dueDate
                      ? <span>· vence <span className={isOverdueInv ? 'text-red-600 font-semibold' : 'text-gray-600'}>{fmtDate(inv.dueDate)}</span></span>
                      : <span>· emitida {fmtDate(inv.createdAt)}</span>
                    }
                  </div>
                </div>

                {/* Amount */}
                <div className="shrink-0 text-right min-w-[90px]">
                  <div className={`text-base font-bold ${isPaid ? 'text-gray-400' : 'text-orange-600'}`}>
                    -{fmt(inv.amount)}
                  </div>
                  {isPaid ? (
                    <span className="text-xs text-green-600 font-semibold">✓ Pago</span>
                  ) : (
                    <span className="text-xs text-orange-600 font-semibold">Pendente</span>
                  )}
                </div>

                {/* Action */}
                {!isPaid && (
                  <button
                    onClick={() => markInvoicePaid(inv.id)}
                    className="shrink-0 text-xs rounded-lg border border-orange-300 text-orange-700 bg-orange-50 px-3 py-1.5 hover:bg-orange-100 font-semibold"
                  >
                    Confirmar débito
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showHowItWorks && <HowItWorksModal onClose={() => setShowHowItWorks(false)} />}
    </div>
  )
}
