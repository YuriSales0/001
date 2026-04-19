"use client"
import { useEffect, useState, useCallback } from "react"
import { InvoiceForm } from "@/components/invoice-form"
import { Pencil, Trash2, X, CheckCircle } from "lucide-react"
import { ConfirmDialog } from "@/components/hm/confirm-dialog"
import { showToast } from "@/components/hm/toast"
import { useEscapeKey } from "@/lib/use-escape-key"

type Invoice = {
  id: string
  description: string
  amount: number
  currency: string
  status: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED'
  dueDate: string | null
  notes: string | null
  createdAt: string
  client: { id: string; name: string | null; email: string }
  property: { id: string; name: string } | null
}

const fmt = (n: number, currency = 'EUR') =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(n)
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

const STATUS_STYLES: Record<string, string> = {
  PAID:      'bg-green-50 text-green-700 border-green-200',
  SENT:      'bg-blue-50 text-blue-700 border-blue-200',
  DRAFT:     'bg-gray-100 text-gray-600 border-gray-200',
  CANCELLED: 'bg-red-50 text-red-600 border-red-200',
}

function EditModal({ invoice, onClose, onSaved }: {
  invoice: Invoice
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    description: invoice.description,
    amount: String(invoice.amount),
    dueDate: invoice.dueDate ? invoice.dueDate.slice(0, 10) : '',
    notes: invoice.notes ?? '',
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEscapeKey(true, onClose)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr('')
    const res = await fetch(`/api/invoices/${invoice.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, amount: Number(form.amount), dueDate: form.dueDate || null }),
    })
    setBusy(false)
    if (res.ok) { onSaved(); onClose() }
    else setErr((await res.json()).error || 'Failed to save')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-900">Edit invoice</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        </div>
        <form onSubmit={save} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Client</label>
            <p className="text-sm text-gray-700">{invoice.client.name || invoice.client.email}</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <input
              required value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Amount (EUR)</label>
              <input
                required type="number" step="0.01" min="0" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Due date</label>
              <input
                type="date" value={form.dueDate}
                onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
            <textarea
              rows={2} value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-700 resize-none"
            />
          </div>
          {err && <p className="text-xs text-red-600">{err}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={busy} className="rounded-lg bg-gray-900 text-white px-4 py-2 text-sm hover:bg-gray-700 disabled:opacity-50">
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function ManagerInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch('/api/invoices').then(r => r.ok ? r.json() : []).then(setInvoices).finally(() => setLoading(false))
  }, [])
  useEffect(() => { load() }, [load])

  const [confirmAction, setConfirmAction] = useState<
    | { type: 'markPaid'; id: string; label: string }
    | { type: 'delete'; id: string; label: string }
    | null
  >(null)

  const markPaid = async (id: string) => {
    const res = await fetch(`/api/invoices/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'PAID' }),
    })
    if (!res.ok) { showToast('Failed to mark invoice as paid', 'error'); return }
    load()
  }

  const deleteInvoice = async (id: string) => {
    setDeleting(id)
    const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
    setDeleting(null)
    if (!res.ok) { showToast('Failed to delete invoice', 'error'); return }
    load()
  }

  const totals = invoices.reduce(
    (acc, i) => {
      if (i.status === 'PAID') acc.paid += i.amount
      else if (i.status !== 'CANCELLED') acc.pending += i.amount
      return acc
    },
    { paid: 0, pending: 0 },
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and send invoices to property owners</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-hm border bg-white p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Total invoices</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{invoices.length}</p>
        </div>
        <div className="rounded-hm border bg-white p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Paid</p>
          <p className="text-2xl font-bold text-green-700 mt-1">{fmt(totals.paid)}</p>
        </div>
        <div className="rounded-hm border bg-white p-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Pending</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">{fmt(totals.pending)}</p>
        </div>
      </div>

      <InvoiceForm onCreated={load} />

      <div className="rounded-hm border bg-white overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-[600px] w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-400 tracking-wide">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Due</th>
              <th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading…</td></tr>
            )}
            {!loading && invoices.length === 0 && (
              <tr><td colSpan={7} className="text-center py-10 text-gray-400">No invoices yet</td></tr>
            )}
            {invoices.map(i => (
              <tr key={i.id} className="border-t hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-gray-500 text-xs">{fmtDate(i.createdAt)}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{i.client.name || i.client.email}</p>
                  {i.property && <p className="text-xs text-gray-400">{i.property.name}</p>}
                </td>
                <td className="px-4 py-3 text-gray-700 max-w-[200px] truncate">{i.description}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {i.dueDate ? fmtDate(i.dueDate) : '—'}
                </td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900">
                  {fmt(i.amount, i.currency)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[i.status] ?? ''}`}>
                    {i.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {i.status !== 'PAID' && i.status !== 'CANCELLED' && (
                      <button
                        onClick={() => setConfirmAction({ type: 'markPaid', id: i.id, label: i.client.name || i.client.email })}
                        title="Mark as paid"
                        className="rounded-md p-1.5 text-green-600 hover:bg-green-50 transition-colors"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    {i.status !== 'PAID' && (
                      <button
                        onClick={() => setEditing(i)}
                        title="Edit invoice"
                        className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmAction({ type: 'delete', id: i.id, label: i.client.name || i.client.email })}
                      disabled={deleting === i.id}
                      title="Delete invoice"
                      className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {editing && (
        <EditModal
          invoice={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}

      <ConfirmDialog
        open={confirmAction?.type === 'markPaid'}
        title="Mark invoice as paid"
        message={confirmAction?.type === 'markPaid' ? `Mark invoice for ${confirmAction.label} as paid?` : ''}
        confirmLabel="Mark paid"
        onConfirm={() => {
          if (confirmAction?.type === 'markPaid') markPaid(confirmAction.id)
          setConfirmAction(null)
        }}
        onCancel={() => setConfirmAction(null)}
      />

      <ConfirmDialog
        open={confirmAction?.type === 'delete'}
        title="Delete invoice"
        message={confirmAction?.type === 'delete' ? `Delete invoice for ${confirmAction.label}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (confirmAction?.type === 'delete') deleteInvoice(confirmAction.id)
          setConfirmAction(null)
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  )
}
