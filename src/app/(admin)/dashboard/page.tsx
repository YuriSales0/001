"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Building2, Users, CalendarDays, Euro, Wallet, AlertTriangle,
  FileText, UserPlus, TrendingUp, Clock, CheckCircle2, Activity,
} from "lucide-react"
import { AlertBanner } from "@/components/hm/alert-banner"

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

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)
const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    const load = () =>
      fetch("/api/admin/stats")
        .then(r => r.ok ? r.json() : null)
        .then(setStats)

    load()
    const interval = setInterval(load, 60_000)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [])

  if (!stats) {
    return (
      <div className="space-y-6 animate-pulse p-6">
        <div className="h-10 rounded bg-gray-100 w-64" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-gray-100" />)}
        </div>
      </div>
    )
  }

  const metricCards = [
    {
      label: "Active properties",
      value: stats.propertiesCount,
      icon: Building2,
      href: "/my-properties",
      color: "text-navy-700",
    },
    {
      label: "Active owners",
      value: stats.clientsCount,
      icon: Users,
      href: "/team",
      color: "text-navy-700",
    },
    {
      label: "Live reservations",
      value: stats.activeReservations,
      icon: CalendarDays,
      href: "/calendar",
      color: "text-navy-700",
    },
    {
      label: "Revenue this month",
      value: fmtEUR(stats.monthRevenue),
      sub: `Commission ${fmtEUR(stats.monthCommission)}`,
      icon: Euro,
      href: "/my-reports",
      color: "text-navy-700",
    },
    {
      label: "Open payouts",
      value: fmtEUR(stats.openPayouts.net),
      sub: `${stats.openPayouts.count} scheduled`,
      icon: Wallet,
      href: "/payouts",
      color: "text-navy-700",
    },
    {
      label: "Pending invoices",
      value: fmtEUR(stats.pendingInvoices.total),
      sub: `${stats.pendingInvoices.count} sent`,
      icon: FileText,
      href: "/my-reports",
      color: "text-navy-700",
    },
    {
      label: "Overdue tasks",
      value: stats.overdueTasks,
      icon: AlertTriangle,
      href: "#",
      color: stats.overdueTasks > 0 ? "text-red-600" : "text-navy-700",
      danger: stats.overdueTasks > 0,
    },
    {
      label: "Open leads",
      value: stats.leadsOpen,
      icon: UserPlus,
      href: "/crm",
      color: "text-navy-700",
    },
  ]

  return (
    <div className="p-6 space-y-6" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-200 rounded-full px-3 py-1">
            <Activity className="h-3.5 w-3.5" />
            System live
          </span>
        </div>
      </div>

      {/* Alerts */}
      {stats.overdueTasks > 0 && (
        <AlertBanner
          level="error"
          title={`${stats.overdueTasks} overdue task${stats.overdueTasks > 1 ? "s" : ""}`}
          message="Review and assign tasks to prevent SLA breaches."
        />
      )}

      {/* Metric grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metricCards.map(card => {
          const Icon = card.icon
          return (
            <Link
              key={card.label}
              href={card.href}
              className={`rounded-xl border bg-white p-4 hover:shadow-md transition-shadow ${
                card.danger ? "border-red-200 bg-red-50/30" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-gray-400 font-medium">
                  {card.label}
                </span>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </div>
              <div className={`text-2xl font-bold ${card.danger ? "text-red-600" : "text-navy-900"}`}>
                {card.value}
              </div>
              {card.sub && <div className="text-xs text-gray-400 mt-1">{card.sub}</div>}
            </Link>
          )
        })}
      </div>

      {/* Today's operations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Check-ins */}
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-navy-500" />
              <span className="font-semibold text-navy-900 text-sm">Upcoming check-ins (7 days)</span>
            </div>
            <span className="text-xs text-gray-400">{stats.upcomingCheckIns.length}</span>
          </div>
          <div className="divide-y">
            {stats.upcomingCheckIns.length === 0 && (
              <div className="p-4 text-sm text-gray-400 text-center">None scheduled</div>
            )}
            {stats.upcomingCheckIns.map(r => (
              <div key={r.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-gray-900">{r.guestName}</div>
                  <div className="text-xs text-gray-400">{r.property.name}</div>
                </div>
                <div className="text-xs font-medium text-navy-600 bg-navy-50 px-2 py-1 rounded">
                  {fmtDate(r.checkIn)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Check-outs */}
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="font-semibold text-navy-900 text-sm">Upcoming check-outs (7 days)</span>
            </div>
            <span className="text-xs text-gray-400">{stats.upcomingCheckOuts.length}</span>
          </div>
          <div className="divide-y">
            {stats.upcomingCheckOuts.length === 0 && (
              <div className="p-4 text-sm text-gray-400 text-center">None scheduled</div>
            )}
            {stats.upcomingCheckOuts.map(r => (
              <div key={r.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-gray-900">{r.guestName}</div>
                  <div className="text-xs text-gray-400">{r.property.name}</div>
                </div>
                <div className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                  {fmtDate(r.checkOut)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue trend */}
      <div className="rounded-xl border bg-white p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-navy-500" />
            <span className="font-semibold text-navy-900 text-sm">This month at a glance</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-navy-900">{fmtEUR(stats.monthRevenue)}</div>
            <div className="text-xs text-gray-400 mt-0.5">Gross revenue</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{fmtEUR(stats.monthCommission)}</div>
            <div className="text-xs text-gray-400 mt-0.5">Our commission</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-navy-900">{fmtEUR(stats.openPayouts.net)}</div>
            <div className="text-xs text-gray-400 mt-0.5">Owner payouts pending</div>
          </div>
        </div>
      </div>

      {/* Quick nav */}
      <div className="flex flex-wrap gap-2">
        {[
          { href: "/calendar",       label: "Calendar" },
          { href: "/payouts",        label: "Payouts" },
          { href: "/team",           label: "Team & Users" },
          { href: "/my-properties",  label: "Properties" },
          { href: "/crm",            label: "CRM Pipeline" },
          { href: "/my-reports",     label: "Reports" },
        ].map(l => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
