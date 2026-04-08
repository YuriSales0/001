'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  FileText, CreditCard, Download, CheckCircle2, Clock, AlertCircle,
  ChevronDown, ChevronUp, Building2, Wrench, ShoppingBag, Sparkles,
  BarChart3, CalendarDays, X, ArrowDownLeft, ArrowUpRight,
} from 'lucide-react'

/* ─── Types ─────────────────────────────────────────────────────────────── */
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
  property: { id: string; name: string }
  reservation: { id: string; guestName: string; checkIn: string; checkOut: string }
}

type Invoice = {
  id: string
  invoiceNumber: string | null
  invoiceType: string
  description: string
  amount: number
  status: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED'
  dueDate: string | null
  paidAt: string | null
  notes: string | null
  property: { id: string; name: string } | null
  createdBy: { name: string | null; email: string }
  client: { name: string | null; email: string }
  createdAt: string
}

/* ─── Constants ─────────────────────────────────────────────────────────── */
const INVOICE_TYPE_META: Record<string, { label: string; Icon: React.FC<{ className?: string }>; color: string; bg: string }> = {
  CLEANING:        { label: 'Limpeza',       Icon: Sparkles,     color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200' },
  REPAIR:          { label: 'Reparação',      Icon: Wrench,       color: 'text-red-700',    bg: 'bg-red-50 border-red-200' },
  MATERIAL:        { label: 'Material',       Icon: ShoppingBag,  color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200' },
  MANAGEMENT_FEE:  { label: 'Comissão',       Icon: BarChart3,    color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  MONTHLY_PLAN:    { label: 'Plano Mensal',   Icon: CalendarDays, color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
  MONTHLY_SETTLEMENT: { label: 'Liquidação',  Icon: ArrowDownLeft,color: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
  SERVICE:         { label: 'Serviço',        Icon: FileText,     color: 'text-gray-700',   bg: 'bg-gray-50 border-gray-200' },
}

const PLATFORM_LABELS: Record<string, string> = {
  AIRBNB: 'Airbnb', BOOKING: 'Booking.com', DIRECT: 'Direto', VRBO: 'VRBO', OTHER: 'Outro',
}

const fmtEUR = (n: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n)

const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-PT')

/* ─── PDF Download ───────────────────────────────────────────────────────── */
async function downloadInvoicePDF(invoice: Invoice) {
  const jsPDFModule = await import('jspdf')
  const jsPDF = jsPDFModule.default
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const pageW = 210
  const margin = 20
  const contentW = pageW - margin * 2
  let y = 0

  // Navy header bar
  doc.setFillColor(15, 23, 42)
  doc.rect(0, 0, pageW, 45, 'F')

  // Logo text
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('HostMasters', margin, 20)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Gestão de Propriedades', margin, 28)

  // Invoice number (right side of header)
  const invNum = invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase()
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`FATURA Nº ${invNum}`, pageW - margin, 18, { align: 'right' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(fmtDate(invoice.createdAt), pageW - margin, 26, { align: 'right' })
  const typeMeta = INVOICE_TYPE_META[invoice.invoiceType] ?? INVOICE_TYPE_META.SERVICE
  doc.text(typeMeta.label.toUpperCase(), pageW - margin, 34, { align: 'right' })

  y = 55

  // Billing parties
  doc.setTextColor(100, 116, 139)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('EMITIDO POR', margin, y)
  doc.text('PARA', margin + contentW / 2, y)

  y += 5
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text('HostMasters', margin, y)
  const clientName = invoice.client.name || invoice.client.email
  doc.text(clientName, margin + contentW / 2, y)

  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.text(invoice.client.email, margin, y)
  doc.text(invoice.client.email, margin + contentW / 2, y)

  y += 12

  // Divider
  doc.setDrawColor(226, 232, 240)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  // Property
  if (invoice.property) {
    doc.setFontSize(9)
    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'bold')
    doc.text('PROPRIEDADE', margin, y)
    y += 5
    doc.setTextColor(15, 23, 42)
    doc.setFont('helvetica', 'normal')
    doc.text(invoice.property.name, margin, y)
    y += 10
  }

  // Line items header
  doc.setFillColor(248, 250, 252)
  doc.rect(margin, y - 3, contentW, 9, 'F')
  doc.setTextColor(100, 116, 139)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('DESCRIÇÃO', margin + 2, y + 3)
  doc.text('VALOR', pageW - margin - 2, y + 3, { align: 'right' })
  y += 12

  // Line item
  doc.setTextColor(15, 23, 42)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const desc = doc.splitTextToSize(invoice.description, contentW - 30)
  doc.text(desc, margin + 2, y)
  doc.setFont('helvetica', 'bold')
  doc.text(fmtEUR(invoice.amount), pageW - margin - 2, y, { align: 'right' })
  y += desc.length * 5 + 5

  // Divider
  doc.setDrawColor(226, 232, 240)
  doc.line(margin, y, pageW - margin, y)
  y += 8

  // Totals
  const vatRate = 0.23
  const base = invoice.amount / (1 + vatRate)
  const vat = invoice.amount - base

  const totalsX = pageW - margin - 60
  doc.setFontSize(9)
  doc.setTextColor(71, 85, 105)
  doc.setFont('helvetica', 'normal')
  doc.text('Subtotal (sem IVA):', totalsX, y)
  doc.text(fmtEUR(base), pageW - margin - 2, y, { align: 'right' })
  y += 6

  doc.text('IVA 23%:', totalsX, y)
  doc.text(fmtEUR(vat), pageW - margin - 2, y, { align: 'right' })
  y += 3

  doc.setDrawColor(15, 23, 42)
  doc.line(totalsX, y, pageW - margin, y)
  y += 5

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('TOTAL:', totalsX, y)
  doc.text(fmtEUR(invoice.amount), pageW - margin - 2, y, { align: 'right' })
  y += 12

  // Due date & status
  if (invoice.dueDate) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    doc.text(`Vencimento: ${fmtDate(invoice.dueDate)}`, margin, y)
    y += 6
  }

  const isPaid = (invoice.status as string) === 'PAID'
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(isPaid ? 22 : 234, isPaid ? 163 : 88, isPaid ? 74 : 12)
  doc.text(isPaid ? '✓ PAGO' : '⏳ PENDENTE', margin, y)
  y += 14

  // Footer
  doc.setDrawColor(226, 232, 240)
  doc.line(margin, y, pageW - margin, y)
  y += 6
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(148, 163, 184)
  doc.text('HostMasters · hostmasters.com', pageW / 2, y, { align: 'center' })
  y += 4
  doc.text('Obrigado pela sua confiança.', pageW / 2, y, { align: 'center' })

  doc.save(`${invoice.invoiceNumber || 'fatura'}.pdf`)
}

/* ─── Invoice Full View Modal ────────────────────────────────────────────── */
function InvoiceModal({ invoice, onClose, onPaid }: {
  invoice: Invoice
  onClose: () => void
  onPaid: (id: string) => void
}) {
  const [paying, setPaying] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const typeMeta = INVOICE_TYPE_META[invoice.invoiceType] ?? INVOICE_TYPE_META.SERVICE
  const { Icon } = typeMeta
  const isPaid = (invoice.status as string) === 'PAID'
  const isOverdue = !isPaid && invoice.dueDate && new Date(invoice.dueDate) < new Date()

  const vatRate = 0.23
  const base = invoice.amount / (1 + vatRate)
  const vat = invoice.amount - base

  const handlePay = async () => {
    setPaying(true)
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/pay`, { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } finally {
      setPaying(false)
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try { await downloadInvoicePDF(invoice) }
    finally { setDownloading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Navy header */}
        <div className="bg-navy-900 px-6 py-5 text-white relative">
          <button onClick={onClose} className="absolute right-4 top-4 rounded-md p-1 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-start justify-between pr-8">
            <div>
              <div className="text-xs font-semibold text-white/60 uppercase tracking-wide mb-1">
                HostMasters · Fatura
              </div>
              <div className="text-xl font-bold">{invoice.invoiceNumber || invoice.id.slice(0, 8)}</div>
              <div className="text-sm text-white/70 mt-0.5">{fmtDate(invoice.createdAt)}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{fmtEUR(invoice.amount)}</div>
              {isPaid ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-400 mt-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Pago
                </span>
              ) : isOverdue ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 mt-1">
                  <AlertCircle className="h-3.5 w-3.5" /> Em atraso
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400 mt-1">
                  <Clock className="h-3.5 w-3.5" /> Pendente
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Type badge */}
          <div className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${typeMeta.bg} ${typeMeta.color}`}>
            <Icon className="h-3.5 w-3.5" />
            {typeMeta.label}
          </div>

          {/* Property */}
          {invoice.property && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
              {invoice.property.name}
            </div>
          )}

          {/* Description */}
          <div className="rounded-lg bg-gray-50 border p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Descrição</div>
            <div className="text-sm text-gray-800">{invoice.description}</div>
          </div>

          {/* Totals breakdown */}
          <div className="rounded-lg border overflow-hidden">
            <div className="grid grid-cols-2 text-sm divide-y">
              <div className="px-4 py-2.5 text-gray-500 bg-gray-50">Subtotal (sem IVA)</div>
              <div className="px-4 py-2.5 text-right text-gray-700">{fmtEUR(base)}</div>
              <div className="px-4 py-2.5 text-gray-500 bg-gray-50">IVA 23%</div>
              <div className="px-4 py-2.5 text-right text-gray-700">{fmtEUR(vat)}</div>
              <div className="px-4 py-2.5 font-bold text-navy-900 bg-navy-50">Total</div>
              <div className="px-4 py-2.5 text-right font-bold text-navy-900 bg-navy-50">{fmtEUR(invoice.amount)}</div>
            </div>
          </div>

          {/* Due date */}
          {invoice.dueDate && (
            <div className={`flex items-center gap-2 text-sm rounded-lg px-4 py-2.5 ${
              isOverdue ? 'bg-red-50 border border-red-200 text-red-700'
                       : 'bg-amber-50 border border-amber-200 text-amber-700'
            }`}>
              <Clock className="h-4 w-4 shrink-0" />
              Vencimento: {fmtDate(invoice.dueDate)}
              {isOverdue && ' — Em atraso'}
            </div>
          )}

          {invoice.paidAt && (
            <div className="flex items-center gap-2 text-sm text-green-700 rounded-lg px-4 py-2.5 bg-green-50 border border-green-200">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              Pago em {fmtDate(invoice.paidAt)}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {!isPaid && (
              <button
                onClick={handlePay}
                disabled={paying}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-navy-900 text-white px-4 py-3 text-sm font-bold hover:bg-navy-800 disabled:opacity-50"
              >
                <CreditCard className="h-5 w-5" />
                {paying ? 'A redirecionar…' : `Pagar ${fmtEUR(invoice.amount)}`}
              </button>
            )}
            <button
              onClick={handleDownload}
              disabled={downloading}
              className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold hover:bg-gray-50 disabled:opacity-50 ${isPaid ? 'flex-1' : ''}`}
            >
              <Download className="h-4 w-4" />
              {downloading ? 'A gerar…' : 'PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── Invoice Card ───────────────────────────────────────────────────────── */
function InvoiceCard({ invoice, onOpen }: { invoice: Invoice; onOpen: () => void }) {
  const typeMeta = INVOICE_TYPE_META[invoice.invoiceType] ?? INVOICE_TYPE_META.SERVICE
  const { Icon } = typeMeta
  const isPaid = (invoice.status as string) === 'PAID'
  const isOverdue = !isPaid && invoice.dueDate && new Date(invoice.dueDate) < new Date()

  return (
    <div
      onClick={onOpen}
      className={`rounded-xl border bg-white p-4 cursor-pointer hover:shadow-md transition-shadow ${
        isOverdue ? 'border-red-200' : isPaid ? 'border-green-200' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className={`shrink-0 rounded-lg p-2 border ${typeMeta.bg}`}>
            <Icon className={`h-4 w-4 ${typeMeta.color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-gray-400">
                {invoice.invoiceNumber || invoice.id.slice(0, 8)}
              </span>
              <span className={`text-xs font-semibold rounded-full px-2 py-0.5 border ${typeMeta.bg} ${typeMeta.color}`}>
                {typeMeta.label}
              </span>
            </div>
            <p className="text-sm font-semibold text-navy-900 mt-0.5 truncate">{invoice.description}</p>
            {invoice.property && (
              <p className="text-xs text-gray-400 mt-0.5">{invoice.property.name}</p>
            )}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-base font-bold text-navy-900">{fmtEUR(invoice.amount)}</div>
          {isPaid ? (
            <span className="inline-flex items-center gap-0.5 text-xs text-green-600 font-semibold">
              <CheckCircle2 className="h-3 w-3" /> Pago
            </span>
          ) : isOverdue ? (
            <span className="inline-flex items-center gap-0.5 text-xs text-red-600 font-semibold">
              <AlertCircle className="h-3 w-3" /> Atraso
            </span>
          ) : invoice.dueDate ? (
            <span className="text-xs text-amber-600">Vence {fmtDate(invoice.dueDate)}</span>
          ) : (
            <span className="text-xs text-gray-400">Pendente</span>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Main Page ──────────────────────────────────────────────────────────── */
export default function ClientPayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showAllPayouts, setShowAllPayouts] = useState(false)
  const [successBanner, setSuccessBanner] = useState(false)

  const searchParams = useSearchParams()

  const load = useCallback(async () => {
    const [p, i] = await Promise.all([
      fetch('/api/payouts').then(r => r.ok ? r.json() : []),
      fetch('/api/invoices').then(r => r.ok ? r.json() : []),
    ])
    setPayouts(p)
    setInvoices(i)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Handle Stripe success redirect
  useEffect(() => {
    const payment = searchParams.get('payment')
    const invoiceId = searchParams.get('invoiceId')
    if (payment === 'success' && invoiceId) {
      setSuccessBanner(true)
      // Mark invoice paid
      fetch(`/api/invoices/${invoiceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAID' }),
      }).then(() => load())
      setTimeout(() => setSuccessBanner(false), 8000)
    }
  }, [searchParams, load])

  const pendingInvoices = invoices.filter(i => (i.status as string) === 'SENT')
  const paidInvoices = invoices.filter(i => (i.status as string) === 'PAID')
  const scheduledPayouts = payouts.filter(p => p.status === 'SCHEDULED')

  const totalIn = scheduledPayouts.reduce((s, p) => s + p.netAmount, 0)
  const totalOut = pendingInvoices.reduce((s, i) => s + i.amount, 0)

  const displayedPayouts = showAllPayouts ? payouts : payouts.slice(0, 5)

  if (loading) return <div className="p-6 text-sm text-gray-400">A carregar…</div>

  return (
    <div className="p-6 space-y-6">
      {/* Success banner */}
      {successBanner && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
          <p className="text-sm font-semibold text-green-800">Pagamento realizado com sucesso! A fatura foi marcada como paga.</p>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-navy-900">Financeiro</h1>
        <p className="text-sm text-gray-500">Os teus rendimentos e faturas HostMasters</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            <ArrowDownLeft className="h-4 w-4 text-green-500" />
            A receber
          </div>
          <div className="text-2xl font-bold text-green-700">{fmtEUR(totalIn)}</div>
          <div className="text-xs text-gray-400 mt-0.5">{scheduledPayouts.length} payout(s) agendado(s)</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            <ArrowUpRight className="h-4 w-4 text-orange-500" />
            Faturas pendentes
          </div>
          <div className={`text-2xl font-bold ${totalOut > 0 ? 'text-orange-600' : 'text-gray-400'}`}>{fmtEUR(totalOut)}</div>
          <div className="text-xs text-gray-400 mt-0.5">{pendingInvoices.length} fatura(s) por pagar</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            <CheckCircle2 className="h-4 w-4 text-gray-400" />
            Pagas
          </div>
          <div className="text-2xl font-bold text-gray-700">{paidInvoices.length}</div>
          <div className="text-xs text-gray-400 mt-0.5">faturas liquidadas</div>
        </div>
      </div>

      {/* Pending invoices — prominent */}
      {pendingInvoices.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-base font-bold text-navy-900">Faturas em aberto</h2>
            <span className="rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-xs font-bold">
              {pendingInvoices.length}
            </span>
          </div>
          <div className="space-y-3">
            {pendingInvoices.map(inv => (
              <InvoiceCard key={inv.id} invoice={inv} onOpen={() => setSelectedInvoice(inv)} />
            ))}
          </div>
        </section>
      )}

      {/* Payouts section */}
      <section>
        <h2 className="text-base font-bold text-navy-900 mb-3">Rendimentos de aluguer</h2>
        {payouts.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
            <Building2 className="h-10 w-10 mx-auto text-gray-300 mb-2" />
            Sem payouts registados ainda.
          </div>
        ) : (
          <div className="rounded-xl border bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3">Propriedade</th>
                  <th className="px-4 py-3">Hóspede</th>
                  <th className="px-4 py-3 hidden md:table-cell">Plataforma</th>
                  <th className="px-4 py-3 hidden md:table-cell">Checkout</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Pagamento</th>
                  <th className="px-4 py-3 text-right">Bruto</th>
                  <th className="px-4 py-3 text-right hidden md:table-cell">Comissão</th>
                  <th className="px-4 py-3 text-right">Líquido</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {displayedPayouts.map(p => (
                  <tr key={p.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-navy-900">{p.property.name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.reservation.guestName}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {p.platform
                        ? <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{PLATFORM_LABELS[p.platform] ?? p.platform}</span>
                        : <span className="text-gray-400">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{fmtDate(p.reservation.checkOut)}</td>
                    <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">{fmtDate(p.scheduledFor)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{fmtEUR(p.grossAmount)}</td>
                    <td className="px-4 py-3 text-right text-orange-600 hidden md:table-cell">
                      -{fmtEUR(p.commission)}
                      <span className="text-gray-400 text-xs ml-1">({p.commissionRate ?? 18}%)</span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-navy-900">{fmtEUR(p.netAmount)}</td>
                    <td className="px-4 py-3">
                      <span className={
                        p.status === 'PAID'      ? 'rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-semibold' :
                        p.status === 'SCHEDULED' ? 'rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-semibold' :
                                                    'rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-xs font-semibold'
                      }>
                        {p.status === 'PAID' ? 'Pago' : p.status === 'SCHEDULED' ? 'Agendado' : 'Cancelado'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payouts.length > 5 && (
              <div className="border-t px-4 py-2.5">
                <button
                  onClick={() => setShowAllPayouts(s => !s)}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-navy-900"
                >
                  {showAllPayouts ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  {showAllPayouts ? 'Mostrar menos' : `Ver todos (${payouts.length})`}
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Paid invoices (historical) */}
      {paidInvoices.length > 0 && (
        <section>
          <h2 className="text-base font-bold text-navy-900 mb-3">Histórico de faturas pagas</h2>
          <div className="space-y-2">
            {paidInvoices.map(inv => (
              <InvoiceCard key={inv.id} invoice={inv} onOpen={() => setSelectedInvoice(inv)} />
            ))}
          </div>
        </section>
      )}

      {/* Invoice detail modal */}
      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onPaid={(id) => {
            setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'PAID' as const, paidAt: new Date().toISOString() } : i))
            setSelectedInvoice(null)
          }}
        />
      )}
    </div>
  )
}
