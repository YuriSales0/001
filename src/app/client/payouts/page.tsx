"use client"

import { useEffect, useState } from "react"

type Payout = {
  id: string
  grossAmount: number
  commission: number
  netAmount: number
  scheduledFor: string
  paidAt: string | null
  status: 'SCHEDULED' | 'PAID' | 'CANCELLED'
  property: { id: string; name: string }
  reservation: { id: string; guestName: string; checkIn: string; checkOut: string }
}

type Invoice = {
  id: string
  description: string
  amount: number
  status: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED'
  dueDate: string | null
  paidAt: string | null
  property: { id: string; name: string } | null
  createdBy: { name: string | null; email: string }
  createdAt: string
}

const fmtEUR = (n: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(n)
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-GB')

export default function ClientPayouts() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/payouts').then(r => r.ok ? r.json() : []),
      fetch('/api/invoices').then(r => r.ok ? r.json() : []),
    ]).then(([p, i]) => {
      setPayouts(p)
      setInvoices(i)
      setLoading(false)
    })
  }, [])

  const totalIn = payouts.filter(p => p.status === 'SCHEDULED').reduce((s, p) => s + p.netAmount, 0)
  const totalOut = invoices.filter(i => i.status === 'SENT' || i.status === 'DRAFT').reduce((s, i) => s + i.amount, 0)

  if (loading) return <div className="p-6 text-gray-500">Loading…</div>

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-navy-900">My Payouts</h1>
        <p className="text-sm text-gray-600">Earnings from your rentals and any service invoices.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">Scheduled to receive</div>
          <div className="text-2xl font-semibold text-green-700 mt-1">{fmtEUR(totalIn)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">Pending invoices to pay</div>
          <div className="text-2xl font-semibold text-orange-600 mt-1">{fmtEUR(totalOut)}</div>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-navy-900 mb-2">Rental payouts</h2>
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Guest</th>
                <th className="px-4 py-3">Check-out</th>
                <th className="px-4 py-3">Payout date</th>
                <th className="px-4 py-3 text-right">Gross</th>
                <th className="px-4 py-3 text-right">Commission</th>
                <th className="px-4 py-3 text-right">Net</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {payouts.length === 0 && (
                <tr><td colSpan={8} className="text-center py-8 text-gray-500">No payouts yet</td></tr>
              )}
              {payouts.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3">{p.property.name}</td>
                  <td className="px-4 py-3">{p.reservation.guestName}</td>
                  <td className="px-4 py-3">{fmtDate(p.reservation.checkOut)}</td>
                  <td className="px-4 py-3">{fmtDate(p.scheduledFor)}</td>
                  <td className="px-4 py-3 text-right">{fmtEUR(p.grossAmount)}</td>
                  <td className="px-4 py-3 text-right text-orange-600">{fmtEUR(p.commission)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{fmtEUR(p.netAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={p.status === 'PAID' ? 'rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs' : 'rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs'}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-navy-900 mb-2">Service invoices</h2>
        <div className="rounded-xl border bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Issued by</th>
                <th className="px-4 py-3">Due</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 && (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">No invoices</td></tr>
              )}
              {invoices.map(i => (
                <tr key={i.id} className="border-t">
                  <td className="px-4 py-3">{fmtDate(i.createdAt)}</td>
                  <td className="px-4 py-3">{i.description}</td>
                  <td className="px-4 py-3">{i.property?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{i.createdBy.name || i.createdBy.email}</td>
                  <td className="px-4 py-3">{i.dueDate ? fmtDate(i.dueDate) : '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold">{fmtEUR(i.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={
                      i.status === 'PAID' ? 'rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs'
                      : i.status === 'SENT' ? 'rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-xs'
                      : 'rounded-full bg-gray-200 text-gray-700 px-2 py-0.5 text-xs'
                    }>{i.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
