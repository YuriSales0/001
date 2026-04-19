"use client"

import { useEffect, useState } from "react"
import { DollarSign, TrendingUp, Percent, BarChart3, Building2 } from "lucide-react"

interface Reservation {
  id: string
  amount: number
  checkIn: string
  checkOut: string
  property: { id: string; name: string; city: string }
}

interface Payout {
  id: string
  grossAmount: number
  commission: number
  commissionRate: number
  netAmount: number
  scheduledFor: string | null
  status: string
  property: { id: string; name: string }
}

interface PropertyRevRow {
  propertyId: string
  name: string
  revenue: number
  commission: number
  net: number
  reservations: number
}

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

const MONTHS = [
  { value: "2026-01", label: "January 2026" },
  { value: "2026-02", label: "February 2026" },
  { value: "2026-03", label: "March 2026" },
  { value: "2026-04", label: "April 2026" },
  { value: "2026-05", label: "May 2026" },
  { value: "2026-06", label: "June 2026" },
]

export default function RevenuePage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const [rRes, pRes] = await Promise.all([
        fetch("/api/reservations"),
        fetch("/api/payouts").catch(() => null),
      ])
      if (rRes.ok) setReservations(await rRes.json())
      if (pRes?.ok) setPayouts(await pRes.json())
      setLoading(false)
    }
    load()
  }, [])

  // Filter by selected month
  const monthRes = reservations.filter(r => r.checkOut.startsWith(selectedMonth))
  const monthPayouts = payouts.filter(p => p.scheduledFor?.startsWith(selectedMonth))

  // Aggregate by property
  const byProperty = new Map<string, PropertyRevRow>()
  monthPayouts.forEach(p => {
    const existing = byProperty.get(p.property.id)
    if (existing) {
      existing.revenue    += p.grossAmount
      existing.commission += p.commission
      existing.net        += p.netAmount
      existing.reservations += 1
    } else {
      byProperty.set(p.property.id, {
        propertyId: p.property.id,
        name: p.property.name,
        revenue: p.grossAmount,
        commission: p.commission,
        net: p.netAmount,
        reservations: 1,
      })
    }
  })

  // Fallback: if no payouts, use reservations
  if (byProperty.size === 0) {
    monthRes.forEach(r => {
      const existing = byProperty.get(r.property.id)
      const commissionRate = 0.17
      const commission = r.amount * commissionRate
      const net = r.amount - commission
      if (existing) {
        existing.revenue += r.amount
        existing.commission += commission
        existing.net += net
        existing.reservations += 1
      } else {
        byProperty.set(r.property.id, {
          propertyId: r.property.id,
          name: r.property.name,
          revenue: r.amount,
          commission,
          net,
          reservations: 1,
        })
      }
    })
  }

  const rows = Array.from(byProperty.values())
  const totalRevenue    = rows.reduce((s, r) => s + r.revenue, 0)
  const totalCommission = rows.reduce((s, r) => s + r.commission, 0)
  const totalNet        = rows.reduce((s, r) => s + r.net, 0)
  const totalRes        = rows.reduce((s, r) => s + r.reservations, 0)
  const avgCommRate     = totalRevenue > 0 ? Math.round((totalCommission / totalRevenue) * 100) : 0

  const statCards = [
    { label: "Gross Revenue",  value: fmtMoney(totalRevenue),    icon: DollarSign, color: "text-emerald-600", bg: "bg-emerald-50" },
    { label: "Net to Owners",  value: fmtMoney(totalNet),        icon: TrendingUp, color: "text-blue-600",    bg: "bg-blue-50" },
    { label: "Commission",     value: fmtMoney(totalCommission), icon: Percent,    color: "text-violet-600",  bg: "bg-violet-50" },
    { label: "Reservations",   value: String(totalRes),          icon: BarChart3,  color: "text-amber-600",   bg: "bg-amber-50" },
  ]

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-hm-black">Revenue</h1>
          <p className="text-sm text-gray-500">Financial overview and property performance.</p>
        </div>
        <select
          value={selectedMonth}
          onChange={e => setSelectedMonth(e.target.value)}
          className="rounded-lg border bg-white px-3 py-2 text-sm"
        >
          {MONTHS.map(m => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-hm border bg-white p-4 flex items-center gap-3">
            <div className={`rounded-lg p-2 ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-lg font-bold text-hm-black">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-4 animate-pulse py-4"><div className="h-8 rounded-hm bg-hm-sand w-48" /><div className="h-40 rounded-hm bg-hm-sand" /></div>
      ) : rows.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400 rounded-hm border bg-white">
          No revenue data for this period.
        </div>
      ) : (
        <div className="rounded-hm border bg-white overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <BarChart3 className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-hm-black">Revenue by property</span>
            <span className="text-xs text-gray-400 ml-auto">{avgCommRate}% avg commission</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  {["Property", "Gross", "Commission", "Net to owner", "Reservations"].map(h => (
                    <th key={h} className={`px-4 py-2.5 text-xs font-semibold text-gray-500 ${h === "Property" ? "text-left" : "text-right"}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.propertyId} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-gray-400" />
                        <span className="font-medium text-hm-black">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">{fmtMoney(r.revenue)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {fmtMoney(r.commission)}
                      <span className="ml-1 text-[10px] text-gray-400">
                        ({r.revenue > 0 ? Math.round((r.commission / r.revenue) * 100) : 0}%)
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-emerald-700">{fmtMoney(r.net)}</td>
                    <td className="px-4 py-3 text-right">{r.reservations}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold">
                  <td className="px-4 py-3 text-hm-black">Total</td>
                  <td className="px-4 py-3 text-right">{fmtMoney(totalRevenue)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{fmtMoney(totalCommission)}</td>
                  <td className="px-4 py-3 text-right text-emerald-700">{fmtMoney(totalNet)}</td>
                  <td className="px-4 py-3 text-right">{totalRes}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
