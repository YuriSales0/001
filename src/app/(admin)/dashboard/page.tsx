"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Building2, Users, CalendarDays, Euro, Wallet, AlertTriangle, FileText, UserPlus,
} from "lucide-react"

type Stats = {
  propertiesCount: number
  clientsCount: number
  activeReservations: number
  monthRevenue: number
  monthCommission: number
  openPayouts: { count: number; net: number; commission: number }
  overdueTasks: number
  leadsOpen: number
  pendingInvoices: { count: number; total: number }
  upcomingCheckIns: { id: string; guestName: string; checkIn: string; property: { name: string; city: string } }[]
  upcomingCheckOuts: { id: string; guestName: string; checkOut: string; property: { name: string; city: string } }[]
}

const fmtEUR = (n: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-GB')

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.ok ? r.json() : null).then(setStats)
  }, [])

  if (!stats) return <div className="p-6 text-gray-500">Loading…</div>

  const cards = [
    { label: 'Properties', value: stats.propertiesCount, icon: Building2 },
    { label: 'Clients', value: stats.clientsCount, icon: Users },
    { label: 'Active reservations', value: stats.activeReservations, icon: CalendarDays },
    { label: 'Revenue this month', value: fmtEUR(stats.monthRevenue), icon: Euro, sub: `Commission ${fmtEUR(stats.monthCommission)}` },
    { label: 'Open payouts', value: fmtEUR(stats.openPayouts.net), icon: Wallet, sub: `${stats.openPayouts.count} scheduled` },
    { label: 'Pending invoices', value: fmtEUR(stats.pendingInvoices.total), icon: FileText, sub: `${stats.pendingInvoices.count} sent` },
    { label: 'Overdue tasks', value: stats.overdueTasks, icon: AlertTriangle, danger: stats.overdueTasks > 0 },
    { label: 'Open leads', value: stats.leadsOpen, icon: UserPlus },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-navy-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-600">Operational overview across all properties and clients.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(c => {
          const Icon = c.icon
          return (
            <div key={c.label} className={`rounded-xl border bg-white p-4 ${c.danger ? 'border-red-200' : ''}`}>
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase text-gray-500">{c.label}</span>
                <Icon className={`h-4 w-4 ${c.danger ? 'text-red-500' : 'text-navy-400'}`} />
              </div>
              <div className={`text-2xl font-semibold mt-2 ${c.danger ? 'text-red-600' : 'text-navy-900'}`}>{c.value}</div>
              {c.sub && <div className="text-xs text-gray-500 mt-1">{c.sub}</div>}
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-white">
          <div className="px-4 py-3 border-b font-semibold text-navy-900">Upcoming check-ins (7 days)</div>
          <div className="divide-y">
            {stats.upcomingCheckIns.length === 0 && <div className="p-4 text-sm text-gray-500">None</div>}
            {stats.upcomingCheckIns.map(r => (
              <div key={r.id} className="p-4 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{r.guestName}</div>
                  <div className="text-xs text-gray-500">{r.property.name} · {r.property.city}</div>
                </div>
                <div className="text-xs text-gray-500">{fmtDate(r.checkIn)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white">
          <div className="px-4 py-3 border-b font-semibold text-navy-900">Upcoming check-outs (7 days)</div>
          <div className="divide-y">
            {stats.upcomingCheckOuts.length === 0 && <div className="p-4 text-sm text-gray-500">None</div>}
            {stats.upcomingCheckOuts.map(r => (
              <div key={r.id} className="p-4 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{r.guestName}</div>
                  <div className="text-xs text-gray-500">{r.property.name} · {r.property.city}</div>
                </div>
                <div className="text-xs text-gray-500">{fmtDate(r.checkOut)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/calendar" className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50">Calendar</Link>
        <Link href="/payouts" className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50">Payouts</Link>
        <Link href="/team" className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50">Team & Users</Link>
        <Link href="/my-properties" className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50">Properties</Link>
      </div>
    </div>
  )
}
