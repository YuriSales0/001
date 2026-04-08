"use client"

import { useEffect, useState } from "react"
import { Plus, X, User, Home, CalendarDays, DollarSign } from "lucide-react"

type ReservationStatus = "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED"
type Platform = "AIRBNB" | "BOOKING" | "DIRECT" | "OTHER"

interface Reservation {
  id: string
  guestName: string
  guestEmail: string | null
  guestPhone: string | null
  property: { id: string; name: string; city: string }
  checkIn: string
  checkOut: string
  amount: number
  platform: Platform | null
  status: ReservationStatus
}

interface Property {
  id: string
  name: string
  city: string
}

const STATUS_COLOR: Record<ReservationStatus, string> = {
  UPCOMING:  "bg-blue-100 text-blue-800",
  ACTIVE:    "bg-emerald-100 text-emerald-800",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
}

const PLATFORM_COLOR: Record<string, string> = {
  AIRBNB:  "bg-rose-100 text-rose-800",
  BOOKING: "bg-blue-100 text-blue-800",
  DIRECT:  "bg-violet-100 text-violet-800",
  OTHER:   "bg-gray-100 text-gray-700",
}

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterProperty, setFilterProperty] = useState("all")

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [form, setForm] = useState({
    propertyId: "", guestName: "", guestEmail: "", guestPhone: "",
    checkIn: "", checkOut: "", amount: "", platform: "DIRECT",
  })

  const load = async () => {
    setLoading(true)
    const [rRes, pRes] = await Promise.all([
      fetch("/api/reservations"),
      fetch("/api/properties"),
    ])
    if (rRes.ok) setReservations(await rRes.json())
    if (pRes.ok) setProperties(await pRes.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = reservations.filter(r => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false
    if (filterProperty !== "all" && r.property.id !== filterProperty) return false
    return true
  })

  const upcoming  = reservations.filter(r => r.status === "UPCOMING").length
  const active    = reservations.filter(r => r.status === "ACTIVE").length
  const completed = reservations.filter(r => r.status === "COMPLETED").length
  const totalRev  = reservations.reduce((s, r) => s + r.amount, 0)

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError("")
    if (!form.propertyId || !form.guestName || !form.checkIn || !form.checkOut || !form.amount) {
      setCreateError("Fill in all required fields.")
      return
    }
    setCreating(true)
    const res = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        propertyId: form.propertyId,
        guestName: form.guestName,
        guestEmail: form.guestEmail || undefined,
        guestPhone: form.guestPhone || undefined,
        checkIn: new Date(form.checkIn).toISOString(),
        checkOut: new Date(form.checkOut).toISOString(),
        amount: parseFloat(form.amount),
        platform: form.platform,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setCreateError(err.error ?? "Failed to create reservation")
    } else {
      setShowCreate(false)
      setForm({ propertyId: "", guestName: "", guestEmail: "", guestPhone: "", checkIn: "", checkOut: "", amount: "", platform: "DIRECT" })
      await load()
    }
    setCreating(false)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Reservations</h1>
          <p className="text-sm text-gray-500">Track and manage all guest reservations.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-navy-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-navy-800"
        >
          <Plus className="h-4 w-4" /> New reservation
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Upcoming",  value: upcoming,            icon: CalendarDays, color: "text-blue-600 bg-blue-50" },
          { label: "Active",    value: active,              icon: User,         color: "text-emerald-600 bg-emerald-50" },
          { label: "Completed", value: completed,           icon: Home,         color: "text-gray-600 bg-gray-100" },
          { label: "Revenue",   value: fmtMoney(totalRev),  icon: DollarSign,   color: "text-amber-600 bg-amber-50" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
            <div className={`rounded-lg p-2 ${color.split(" ")[1]}`}>
              <Icon className={`h-5 w-5 ${color.split(" ")[0]}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-lg font-bold text-navy-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterProperty}
          onChange={e => setFilterProperty(e.target.value)}
          className="rounded-lg border bg-white px-3 py-2 text-sm"
        >
          <option value="all">All properties</option>
          {properties.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="rounded-lg border bg-white px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="UPCOMING">Upcoming</option>
          <option value="ACTIVE">Active</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading && <div className="py-8 text-center text-sm text-gray-400">Loading…</div>}
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400 rounded-xl border bg-white">
            No reservations match your filters.
          </div>
        )}
        {filtered.map(r => {
          const nights = Math.round((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 86400000)
          return (
            <div key={r.id} className="rounded-xl border bg-white p-4 hover:shadow-sm transition-shadow">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <User className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-navy-900">{r.guestName}</span>
                      {r.platform && (
                        <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${PLATFORM_COLOR[r.platform]}`}>
                          {r.platform}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${STATUS_COLOR[r.status]}`}>
                        {r.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Home className="h-3 w-3" /> {r.property.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {fmt(r.checkIn)} — {fmt(r.checkOut)} · {nights}n
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <span className="text-base font-bold text-navy-900">{fmtMoney(r.amount)}</span>
                  {r.guestEmail && (
                    <span className="text-xs text-gray-400 truncate max-w-[160px]">{r.guestEmail}</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-base font-bold text-navy-900">New reservation</h2>
                <p className="text-xs text-gray-500 mt-0.5">Auto-tasks will be generated on save.</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="rounded-md p-1 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitCreate} className="p-5 space-y-4">
              {createError && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{createError}</div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Property *</label>
                  <select
                    value={form.propertyId}
                    onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                  >
                    <option value="">Select a property…</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name} · {p.city}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Guest name *</label>
                  <input type="text" value={form.guestName} onChange={e => setForm(f => ({ ...f, guestName: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" placeholder="Full name" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Platform</label>
                  <select value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900">
                    <option value="AIRBNB">Airbnb</option>
                    <option value="BOOKING">Booking.com</option>
                    <option value="DIRECT">Direct</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Guest email</label>
                  <input type="email" value={form.guestEmail} onChange={e => setForm(f => ({ ...f, guestEmail: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" placeholder="optional" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={form.guestPhone} onChange={e => setForm(f => ({ ...f, guestPhone: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" placeholder="optional" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Check-in *</label>
                  <input type="date" value={form.checkIn} onChange={e => setForm(f => ({ ...f, checkIn: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Check-out *</label>
                  <input type="date" value={form.checkOut} onChange={e => setForm(f => ({ ...f, checkOut: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Amount (€) *</label>
                  <input type="number" min="0" step="0.01" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" placeholder="0.00" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={creating}
                  className="rounded-lg bg-navy-900 text-white px-4 py-2 text-sm font-semibold hover:bg-navy-800 disabled:opacity-50">
                  {creating ? "Saving…" : "Create reservation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
