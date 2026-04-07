"use client"
import { useEffect, useState, useCallback } from "react"
import { InvoiceForm } from "@/components/invoice-form"

type Invoice = {
  id: string
  description: string
  amount: number
  status: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED'
  createdAt: string
  client: { id: string; name: string | null; email: string }
  property: { id: string; name: string } | null
}
const fmtEUR = (n: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(n)
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-GB')

export default function ManagerInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const load = useCallback(() => { fetch('/api/invoices').then(r => r.ok ? r.json() : []).then(setInvoices) }, [])
  useEffect(() => { load() }, [load])

  const markPaid = async (id: string) => {
    await fetch(`/api/invoices/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'PAID' }) })
    load()
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-navy-900">Invoices</h1>
      <InvoiceForm onCreated={load} />
      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Date</th><th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Description</th><th className="px-4 py-3 text-right">Amount</th>
              <th className="px-4 py-3">Status</th><th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-500">No invoices</td></tr>}
            {invoices.map(i => (
              <tr key={i.id} className="border-t">
                <td className="px-4 py-3">{fmtDate(i.createdAt)}</td>
                <td className="px-4 py-3">{i.client.name || i.client.email}</td>
                <td className="px-4 py-3">{i.description}</td>
                <td className="px-4 py-3 text-right font-semibold">{fmtEUR(i.amount)}</td>
                <td className="px-4 py-3"><span className={i.status === 'PAID' ? 'rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs' : 'rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-xs'}>{i.status}</span></td>
                <td className="px-4 py-3 text-right">
                  {i.status === 'SENT' && <button onClick={() => markPaid(i.id)} className="text-xs rounded-md bg-navy-900 text-white px-3 py-1 hover:bg-navy-800">Mark paid</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
