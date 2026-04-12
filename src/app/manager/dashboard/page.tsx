"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Building2, Users, CalendarDays, Euro, AlertTriangle,
  Clock, CheckCircle2, TrendingUp, Bell, RefreshCw,
  UserCheck, ClipboardCheck, Wrench, Home, MessageCircle,
} from "lucide-react"
import { AlertBanner } from "@/components/hm/alert-banner"
import { DashboardGreeting } from "@/components/hm/dashboard-entrance"

type DashboardStats = {
  propertiesCount: number
  clientsCount: number
  activeReservations: number
  rentalVolume: number
  rentalCommission: number
  openPayouts: { count: number; net: number; commission: number }
  overdueTasks: number
  pendingInvoices: { count: number; total: number }
  upcomingCheckIns: { id: string; guestName: string; checkIn: string; property: { name: string } }[]
  upcomingCheckOuts: { id: string; guestName: string; checkOut: string; property: { name: string } }[]
}

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })

export default function ManagerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const load = () => {
    fetch("/api/manager/stats")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        setStats(data)
        setLastRefresh(new Date())
      })
  }

  useEffect(() => {
    load()
    const interval = setInterval(load, 5 * 60 * 1000) // refresh every 5 min
    return () => clearInterval(interval)
  }, [])

  const today = new Date()
  const todayStr = today.toLocaleDateString("en-GB", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric"
  })

  return (
    <div className="p-4 sm:p-6 space-y-6" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <DashboardGreeting />
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 border rounded-lg px-3 py-2 transition-colors hm-animate-in hm-stagger-1"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
          <span className="text-gray-300 ml-1">
            {lastRefresh.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </button>
      </div>

      {/* Alerts panel */}
      {stats && stats.overdueTasks > 0 && (
        <div className="hm-animate-in hm-stagger-2">
          <AlertBanner
            level="error"
            title={`${stats.overdueTasks} overdue task${stats.overdueTasks > 1 ? "s" : ""} require attention`}
            message="Assign or resolve overdue tasks to maintain SLA compliance."
          />
        </div>
      )}

      {/* Top metrics */}
      {stats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 hm-animate-in hm-stagger-2">
          {[
            { label: "Active owners",   value: stats.clientsCount,           icon: Users,        href: "/manager/clients",  color: "text-navy-600" },
            { label: "Live bookings",   value: stats.activeReservations,      icon: CalendarDays, href: "/reservations",     color: "text-navy-600" },
            { label: "Rental volume",   value: fmtEUR(stats.rentalVolume),    icon: Euro,         href: "/revenue",          color: "text-green-600" },
            { label: "Payouts pending", value: fmtEUR(stats.openPayouts.net), icon: Wrench,       href: "/manager/payouts",  color: "text-amber-600" },
            {
              label: "Overdue tasks",
              value: stats.overdueTasks,
              icon: AlertTriangle,
              href: "/tasks",
              color: stats.overdueTasks > 0 ? "text-red-600" : "text-gray-400",
              danger: stats.overdueTasks > 0,
            },
          ].map(card => {
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
                  <span className="text-[11px] uppercase tracking-wider text-gray-400 font-medium leading-tight">
                    {card.label}
                  </span>
                  <Icon className={`h-4 w-4 shrink-0 ${card.color}`} />
                </div>
                <div className={`text-2xl font-bold ${card.danger ? "text-red-600" : "text-navy-900"}`}>
                  {card.value}
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* Operations today */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 hm-animate-in hm-stagger-3">
        {[
          {
            label: "Check-ins today",
            value: stats?.upcomingCheckIns.filter(r => {
              const d = new Date(r.checkIn)
              return d.toDateString() === today.toDateString()
            }).length ?? 0,
            icon: Home,
            color: "bg-blue-50 border-blue-200 text-blue-700",
          },
          {
            label: "Check-outs today",
            value: stats?.upcomingCheckOuts.filter(r => {
              const d = new Date(r.checkOut)
              return d.toDateString() === today.toDateString()
            }).length ?? 0,
            icon: CheckCircle2,
            color: "bg-green-50 border-green-200 text-green-700",
          },
          {
            label: "Pending tasks",
            value: stats?.overdueTasks ?? 0,
            icon: ClipboardCheck,
            color: stats?.overdueTasks ? "bg-red-50 border-red-200 text-red-700" : "bg-gray-50 border-gray-200 text-gray-500",
          },
          {
            label: "Active properties",
            value: stats?.propertiesCount ?? 0,
            icon: Building2,
            color: "bg-amber-50 border-amber-200 text-amber-700",
          },
        ].map(item => {
          const Icon = item.icon
          return (
            <div key={item.label} className={`rounded-xl border p-4 ${item.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">{item.label}</span>
              </div>
              <div className="text-3xl font-bold">{item.value}</div>
            </div>
          )
        })}
      </div>

      {/* Check-ins & Check-outs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 hm-animate-in hm-stagger-4">
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
            <Clock className="h-4 w-4 text-navy-500" />
            <span className="font-semibold text-navy-900 text-sm">Upcoming check-ins</span>
          </div>
          <div className="divide-y max-h-64 overflow-auto">
            {!stats?.upcomingCheckIns.length && (
              <div className="p-4 text-sm text-gray-400 text-center">None in the next 7 days</div>
            )}
            {stats?.upcomingCheckIns.map(r => (
              <div key={r.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium text-gray-900">{r.guestName}</div>
                  <div className="text-xs text-gray-400">{r.property.name}</div>
                </div>
                <div className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                  {fmtDate(r.checkIn)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="font-semibold text-navy-900 text-sm">Upcoming check-outs</span>
          </div>
          <div className="divide-y max-h-64 overflow-auto">
            {!stats?.upcomingCheckOuts.length && (
              <div className="p-4 text-sm text-gray-400 text-center">None in the next 7 days</div>
            )}
            {stats?.upcomingCheckOuts.map(r => (
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

      {/* Alerts legend + Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 hm-animate-in hm-stagger-5">
        {/* Alert types */}
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="h-4 w-4 text-navy-500" />
            <span className="font-semibold text-navy-900 text-sm">Alert status</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-red-600">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
              {stats?.overdueTasks ?? 0} overdue tasks
            </div>
            <div className="flex items-center gap-2 text-amber-600">
              <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              {stats?.openPayouts.count ?? 0} payouts pending
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
              {stats?.propertiesCount ?? 0} properties active
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="rounded-xl border bg-white p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-navy-500" />
            <span className="font-semibold text-navy-900 text-sm">Quick actions</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: "/manager/clients",  label: "My owners",    icon: Users },
              { href: "/reservations",     label: "Reservations", icon: CalendarDays },
              { href: "/tasks",            label: "Tasks",        icon: ClipboardCheck },
              { href: "/manager/messages", label: "Messages",     icon: MessageCircle },
              { href: "/revenue",          label: "Revenue",      icon: Euro },
              { href: "/properties",       label: "Properties",   icon: Building2 },
            ].map(action => {
              const Icon = action.icon
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  <Icon className="h-3.5 w-3.5 text-navy-400" />
                  {action.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
