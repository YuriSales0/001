"use client"
import { useEffect, useState } from "react"
import { useLocale } from "@/i18n/provider"
import { intlLocale } from "@/i18n"
import { Banknote } from "lucide-react"

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

export default function ManagerPayouts() {
  const { locale } = useLocale()
  const dateLoc = intlLocale(locale)
  const fmtDate = (s: string) => new Date(s).toLocaleDateString(dateLoc)
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
      <div>
        <h1 className="text-3xl font-serif font-bold text-hm-black">Client Revenue</h1>
        <p className="text-sm text-gray-500 mt-1">
          Payouts processed to your clients&apos; properties. Your own earnings are in <a href="/manager/commission" className="text-blue-600 underline">My Commission</a>.
        </p>
      </div>
      <div className="rounded-hm border bg-white overflow-hidden">
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
            {loading && <tr><td colSpan={6} className="py-8"><div className="space-y-3 animate-pulse"><div className="h-4 rounded bg-hm-sand w-3/4 mx-auto" /><div className="h-4 rounded bg-hm-sand w-1/2 mx-auto" /></div></td></tr>}
            {error && <tr><td colSpan={6} className="text-center py-8"><p className="text-sm text-red-500">Failed to load data</p></td></tr>}
            {!loading && !error && payouts.length === 0 && (
              <tr><td colSpan={6} className="py-12 text-center">
                <Banknote className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                <p className="font-serif font-bold text-hm-black">No payouts</p>
                <p className="text-sm text-gray-500 mt-0.5">Client payouts will appear here once bookings are completed.</p>
              </td></tr>
            )}
            {payouts.map(p => (
              <tr key={p.id} className="border-t">
                <td className="px-4 py-3 max-w-[160px]"><span className="block truncate" title={p.property.owner.name || p.property.owner.email}>{p.property.owner.name || p.property.owner.email}</span></td>
                <td className="px-4 py-3 max-w-[180px]"><span className="block truncate" title={p.property.name}>{p.property.name}</span></td>
                <td className="px-4 py-3 max-w-[160px]"><span className="block truncate" title={p.reservation.guestName}>{p.reservation.guestName}</span></td>
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
