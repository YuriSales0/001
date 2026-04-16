"use client"
import { useEffect, useState } from "react"

type Payout = {
  id: string
  grossAmount: number
  commission: number
  netAmount: number
  scheduledFor: string
  status: 'SCHEDULED' | 'PAID' | 'CANCELLED'
  property: { id: string; name: string; owner: { id: string; name: string | null; email: string } }
  reservation: { id: string; guestName: string; checkOut: string }
}
const fmtEUR = (n: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(n)
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-GB')

export default function ManagerPayouts() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  useEffect(() => {
    fetch('/api/payouts')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setPayouts)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold text-navy-900">Payouts (my clients)</h1>
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-[600px] w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Client</th><th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Guest</th><th className="px-4 py-3">Scheduled</th>
              <th className="px-4 py-3 text-right">Net</th><th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading…</td></tr>}
            {error && <tr><td colSpan={6} className="text-center py-8"><p className="text-sm text-red-500">Failed to load data</p></td></tr>}
            {!loading && !error && payouts.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-500">No payouts</td></tr>}
            {payouts.map(p => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3">{p.property.owner.name || p.property.owner.email}</td>
                <td className="px-4 py-3">{p.property.name}</td>
                <td className="px-4 py-3">{p.reservation.guestName}</td>
                <td className="px-4 py-3">{fmtDate(p.scheduledFor)}</td>
                <td className="px-4 py-3 text-right font-semibold">{fmtEUR(p.netAmount)}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs">{p.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
