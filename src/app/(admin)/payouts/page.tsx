'use client'

import { useEffect, useState } from 'react'

type Payout = {
  id: string
  grossAmount: number
  commission: number
  netAmount: number
  scheduledFor: string
  paidAt: string | null
  status: 'SCHEDULED' | 'PAID' | 'CANCELLED'
  property: { id: string; name: string; owner: { id: string; name: string | null; email: string } }
  reservation: { id: string; guestName: string; checkIn: string; checkOut: string }
}

const fmtEUR = (n: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(n)
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-GB')

export default function PayoutsPage() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/payouts')
      if (res.ok) setPayouts(await res.json())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

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
      }
      return acc
    },
    { scheduled: 0, commission: 0 },
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-navy-900">Payouts</h1>
        <p className="text-sm text-gray-600">
          Owner payouts auto-scheduled D+7 after check-out · 18% commission
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">Scheduled (net to owners)</div>
          <div className="text-2xl font-semibold text-navy-900 mt-1">{fmtEUR(totals.scheduled)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">Pending commission</div>
          <div className="text-2xl font-semibold text-navy-900 mt-1">{fmtEUR(totals.commission)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">Open payouts</div>
          <div className="text-2xl font-semibold text-navy-900 mt-1">
            {payouts.filter(p => p.status === 'SCHEDULED').length}
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Guest</th>
              <th className="px-4 py-3">Check-out</th>
              <th className="px-4 py-3">Scheduled</th>
              <th className="px-4 py-3 text-right">Gross</th>
              <th className="px-4 py-3 text-right">Commission</th>
              <th className="px-4 py-3 text-right">Net</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={10} className="text-center py-8 text-gray-500">
                  Loading…
                </td>
              </tr>
            )}
            {!loading && payouts.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-8 text-gray-500">
                  No payouts yet
                </td>
              </tr>
            )}
            {payouts.map(p => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3">{p.property.name}</td>
                <td className="px-4 py-3">{p.property.owner.name || p.property.owner.email}</td>
                <td className="px-4 py-3">{p.reservation.guestName}</td>
                <td className="px-4 py-3">{fmtDate(p.reservation.checkOut)}</td>
                <td className="px-4 py-3">{fmtDate(p.scheduledFor)}</td>
                <td className="px-4 py-3 text-right">{fmtEUR(p.grossAmount)}</td>
                <td className="px-4 py-3 text-right text-orange-600">{fmtEUR(p.commission)}</td>
                <td className="px-4 py-3 text-right font-semibold">{fmtEUR(p.netAmount)}</td>
                <td className="px-4 py-3">
                  <span
                    className={
                      p.status === 'PAID'
                        ? 'inline-block rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs'
                        : p.status === 'SCHEDULED'
                        ? 'inline-block rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs'
                        : 'inline-block rounded-full bg-gray-200 text-gray-700 px-2 py-0.5 text-xs'
                    }
                  >
                    {p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  {p.status === 'SCHEDULED' && (
                    <button
                      onClick={() => markPaid(p.id)}
                      className="text-xs rounded-md bg-navy-900 text-white px-3 py-1 hover:bg-navy-800"
                    >
                      Mark paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
