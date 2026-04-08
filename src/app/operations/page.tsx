"use client"

import { useEffect, useState } from "react"
import { CalendarDays, Clock, Home, Users, AlertTriangle, CheckCircle2, XCircle } from "lucide-react"

type ReservationStatus = "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED"

type Reservation = {
  id: string
  guestName: string
  guestNationality?: string
  checkIn: string
  checkOut: string
  nights: number
  grossAmount: number
  hostmastersCommission: number
  status: ReservationStatus
  channel: string
  property: { id: string; name: string; owner?: { subscriptionPlan?: string } }
  cleaningStatus?: string
}

const STATUS_COLS: { id: ReservationStatus; label: string; color: string; header: string }[] = [
  { id: "UPCOMING",  label: "Upcoming",  color: "border-blue-200",  header: "bg-blue-50" },
  { id: "ACTIVE",    label: "Active",    color: "border-gold-200",  header: "bg-yellow-50" },
  { id: "COMPLETED", label: "Completed", color: "border-green-200", header: "bg-green-50" },
  { id: "CANCELLED", label: "Cancelled", color: "border-gray-200",  header: "bg-gray-50" },
]

const FLAGS: Record<string, string> = {
  GB:"🇬🇧", SE:"🇸🇪", NO:"🇳🇴", DK:"🇩🇰",
  NL:"🇳🇱", DE:"🇩🇪", FR:"🇫🇷", ES:"🇪🇸", IT:"🇮🇹",
}

const PLAN_SLA: Record<string, { guest: number; owner: number; emergency: number }> = {
  STARTER: { guest: 4, owner: 24, emergency: 48 },
  BASIC:   { guest: 4, owner: 24, emergency: 48 },
  MID:     { guest: 2, owner: 12, emergency: 24 },
  PREMIUM: { guest: 1, owner: 4,  emergency: 4  },
}

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })

function daysUntil(s: string) {
  return Math.ceil((new Date(s).getTime() - Date.now()) / 86_400_000)
}

export default function OperationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Reservation | null>(null)

  useEffect(() => {
    fetch("/api/reservations")
      .then(r => r.ok ? r.json() : [])
      .then(setReservations)
      .finally(() => setLoading(false))
  }, [])

  const byStatus = (status: ReservationStatus) =>
    reservations.filter(r => r.status === status)
      .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())

  const activeCount = byStatus("ACTIVE").length
  const upcomingCount = byStatus("UPCOMING").length

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <div className="px-6 py-4 border-b bg-white flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-navy-900">Operations</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {activeCount} active · {upcomingCount} upcoming
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
              <Clock className="h-3.5 w-3.5" />
              {activeCount} guests in property
            </span>
          )}
        </div>
      </div>

      {/* Kanban columns */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 p-4 h-full" style={{ minWidth: 'max-content' }}>
          {STATUS_COLS.map(col => {
            const items = byStatus(col.id)
            return (
              <div
                key={col.id}
                className={`flex flex-col w-72 rounded-xl border-2 bg-white flex-shrink-0 ${col.color}`}
              >
                <div className={`px-3 py-2.5 rounded-t-xl border-b ${col.header} flex items-center justify-between`}>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    {col.label}
                  </span>
                  <span className="text-xs font-bold bg-white text-gray-500 rounded-full px-2 py-0.5 border">
                    {items.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {loading && (
                    <div className="space-y-2">
                      <div className="h-28 rounded-lg bg-gray-100 animate-pulse" />
                      <div className="h-24 rounded-lg bg-gray-100 animate-pulse" />
                    </div>
                  )}
                  {items.map(r => {
                    const plan = r.property.owner?.subscriptionPlan ?? "STARTER"
                    const sla = PLAN_SLA[plan]
                    const daysIn = daysUntil(r.checkIn)
                    return (
                      <div
                        key={r.id}
                        onClick={() => setSelected(r)}
                        className="rounded-lg border border-gray-200 bg-white p-3 cursor-pointer hover:border-navy-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            {r.guestNationality && (
                              <span className="text-base">{FLAGS[r.guestNationality] ?? "🌍"}</span>
                            )}
                            <span className="text-sm font-semibold text-gray-900 truncate">
                              {r.guestName}
                            </span>
                          </div>
                          <span className="text-xs text-gray-400 shrink-0 ml-1">{r.channel}</span>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1.5">
                          <Home className="h-3 w-3 text-gray-400" />
                          <span className="truncate">{r.property.name}</span>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                          <CalendarDays className="h-3 w-3 text-gray-400" />
                          {fmtDate(r.checkIn)} → {fmtDate(r.checkOut)} · {r.nights}n
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${
                              plan === "PREMIUM" ? "bg-gray-900 text-yellow-400" :
                              plan === "MID" ? "bg-yellow-100 text-yellow-700" :
                              "bg-gray-100 text-gray-600"
                            }`}>
                              {plan}
                            </span>
                            {r.status === "UPCOMING" && daysIn <= 2 && daysIn >= 0 && (
                              <span className="text-[10px] text-orange-600 bg-orange-50 rounded px-1.5 py-0.5 font-medium">
                                {daysIn === 0 ? "Today!" : `${daysIn}d`}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-bold text-gray-900">
                            {fmtEUR(r.grossAmount)}
                          </span>
                        </div>
                      </div>
                    )
                  })}

                  {!loading && items.length === 0 && (
                    <div className="text-center py-8 text-xs text-gray-300">No reservations</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reservation detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30">
          <div className="w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selected.guestNationality && (
                  <span className="text-xl">{FLAGS[selected.guestNationality] ?? "🌍"}</span>
                )}
                <div>
                  <div className="font-bold text-navy-900">{selected.guestName}</div>
                  <div className="text-xs text-gray-400">{selected.property.name}</div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Dates */}
              <div className="rounded-xl border bg-blue-50 border-blue-200 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Check-in</div>
                    <div className="font-bold text-navy-900">
                      {new Date(selected.checkIn).toLocaleDateString("en-GB", { day: "2-digit", month: "long" })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Check-out</div>
                    <div className="font-bold text-navy-900">
                      {new Date(selected.checkOut).toLocaleDateString("en-GB", { day: "2-digit", month: "long" })}
                    </div>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">{selected.nights} nights · {selected.channel}</div>
              </div>

              {/* Financials */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Financials</h3>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Gross booking</span>
                    <span className="font-semibold">{fmtEUR(selected.grossAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">HostMasters commission</span>
                    <span className="text-green-600 font-semibold">
                      {fmtEUR(selected.hostmastersCommission ?? selected.grossAmount * 0.2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* SLA */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">
                  SLA — {selected.property.owner?.subscriptionPlan ?? "STARTER"} Plan
                </h3>
                {(() => {
                  const plan = selected.property.owner?.subscriptionPlan ?? "STARTER"
                  const sla = PLAN_SLA[plan]
                  return (
                    <div className="grid grid-cols-3 gap-2 text-center">
                      {[
                        { label: "Guest response", hours: sla.guest },
                        { label: "Owner response", hours: sla.owner },
                        { label: "Emergency", hours: sla.emergency },
                      ].map(item => (
                        <div key={item.label} className="rounded-lg bg-gray-50 border p-2">
                          <div className="text-lg font-bold text-navy-900">{item.hours}h</div>
                          <div className="text-[10px] text-gray-400">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>

              {/* Cycle checklist */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Full cycle</h3>
                <div className="space-y-1.5">
                  {[
                    { label: "Booking confirmed → owner notified", done: true },
                    { label: "Guest welcome email sent", done: true },
                    { label: "Nuki code generated", done: true },
                    { label: "48h before check-in → cleaning confirmed", done: selected.status !== "UPCOMING" },
                    { label: "Pre-stay inspection", done: selected.status === "ACTIVE" || selected.status === "COMPLETED" },
                    { label: "Guest reminder sent", done: selected.status !== "UPCOMING" },
                    { label: "Check-in → Nuki code active", done: selected.status === "ACTIVE" || selected.status === "COMPLETED" },
                    { label: "Check-out → inspection + cleaning", done: selected.status === "COMPLETED" },
                    { label: "Review request sent", done: selected.status === "COMPLETED" },
                    { label: "Financials logged", done: selected.status === "COMPLETED" },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-sm">
                      {item.done ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-gray-300 shrink-0" />
                      )}
                      <span className={item.done ? "text-gray-500 line-through" : "text-gray-700"}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
