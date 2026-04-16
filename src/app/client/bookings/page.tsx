"use client"

import { useEffect, useState } from "react"
import { CalendarDays, List, Plus, X, AlertTriangle } from "lucide-react"
import { useEscapeKey } from "@/lib/use-escape-key"

type Reservation = {
  id: string
  guestName: string
  guestNationality?: string
  checkIn: string
  checkOut: string
  nights: number
  grossAmount: number
  status: "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED"
  platform: string
}

type BlockedDate = {
  id: string
  startDate: string
  endDate: string
  reason?: string
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

const FLAGS: Record<string, string> = {
  GB:"🇬🇧", SE:"🇸🇪", NO:"🇳🇴", DK:"🇩🇰",
  NL:"🇳🇱", DE:"🇩🇪", FR:"🇫🇷", ES:"🇪🇸",
}

const STATUS_PILL: Record<string, { label: string; cls: string }> = {
  UPCOMING:  { label: "Upcoming",  cls: "bg-hm-blue/10 text-hm-blue" },
  ACTIVE:    { label: "Active",    cls: "bg-hm-gold/15 text-hm-gold-dk" },
  COMPLETED: { label: "Completed", cls: "bg-hm-green/10 text-hm-green" },
  CANCELLED: { label: "Cancelled", cls: "bg-hm-red/10 text-hm-red" },
}

export default function OwnerBookings() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"all" | "upcoming">("upcoming")

  // Block dates form
  const [blocking, setBlocking] = useState(false)
  const [blockForm, setBlockForm] = useState({ start: "", end: "", reason: "" })
  const [blocking_saving, setBlockingSaving] = useState(false)

  useEscapeKey(blocking, () => setBlocking(false))

  useEffect(() => {
    Promise.all([
      fetch("/api/reservations").then(r => r.ok ? r.json() : []),
      fetch("/api/blocked-dates").then(r => r.ok ? r.json() : []),
    ]).then(([r, b]) => {
      setReservations(r)
      setBlockedDates(b)
      setLoading(false)
    })
  }, [])

  const saveBlock = async () => {
    if (!blockForm.start || !blockForm.end) return
    setBlockingSaving(true)
    const res = await fetch("/api/blocked-dates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: blockForm.start,
        endDate: blockForm.end,
        reason: blockForm.reason || "Personal use",
      }),
    })
    if (res.ok) {
      const newBlock = await res.json()
      setBlockedDates(prev => [...prev, newBlock])
      setBlockForm({ start: "", end: "", reason: "" })
      setBlocking(false)
    }
    setBlockingSaving(false)
  }

  const removeBlock = async (id: string) => {
    await fetch(`/api/blocked-dates/${id}`, { method: "DELETE" })
    setBlockedDates(prev => prev.filter(b => b.id !== id))
  }

  const upcoming = reservations
    .filter(r => r.status === "UPCOMING" || r.status === "ACTIVE")
    .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())

  const all = [...reservations].sort(
    (a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()
  )

  const shown = view === "upcoming" ? upcoming : all

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-12 rounded-hm bg-hm-sand" />
        <div className="h-48 rounded-hm bg-hm-sand" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-hm-black">My Bookings</h1>
        <p className="mt-1 font-sans text-lg text-hm-slate/70">
          View all reservations and block dates for personal use.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1 rounded-lg border border-hm-border p-1"
             style={{ background: 'var(--hm-sand)' }}>
          <button
            onClick={() => setView("upcoming")}
            className={`px-4 py-2 rounded-md font-sans text-sm font-medium transition-colors ${
              view === "upcoming"
                ? "bg-hm-black text-white"
                : "text-hm-slate hover:bg-hm-border/60"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              Upcoming
            </span>
          </button>
          <button
            onClick={() => setView("all")}
            className={`px-4 py-2 rounded-md font-sans text-sm font-medium transition-colors ${
              view === "all"
                ? "bg-hm-black text-white"
                : "text-hm-slate hover:bg-hm-border/60"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <List className="h-4 w-4" />
              All ({reservations.length})
            </span>
          </button>
        </div>

        <button
          onClick={() => setBlocking(true)}
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 font-sans font-semibold text-sm text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--hm-gold-dk)', minHeight: '44px' }}
        >
          <Plus className="h-4 w-4" />
          Block dates for personal use
        </button>
      </div>

      {/* Block dates form */}
      {blocking && (
        <div className="rounded-hm border border-hm-gold/40 p-5"
             style={{ background: 'var(--hm-gold)', opacity: undefined, backgroundColor: 'rgba(201,168,76,0.08)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif font-bold text-hm-black">Block dates for personal use</h3>
            <button onClick={() => setBlocking(false)} className="text-hm-slate/60 hover:text-hm-slate">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-sans text-sm text-hm-slate/70 mb-1">From</label>
              <input
                type="date"
                value={blockForm.start}
                onChange={e => setBlockForm(f => ({ ...f, start: e.target.value }))}
                className="w-full rounded-lg border border-hm-border px-3 py-2.5 font-sans text-sm text-hm-black bg-hm-ivory focus:outline-none focus:ring-2 focus:ring-hm-gold"
              />
            </div>
            <div>
              <label className="block font-sans text-sm text-hm-slate/70 mb-1">To</label>
              <input
                type="date"
                value={blockForm.end}
                onChange={e => setBlockForm(f => ({ ...f, end: e.target.value }))}
                className="w-full rounded-lg border border-hm-border px-3 py-2.5 font-sans text-sm text-hm-black bg-hm-ivory focus:outline-none focus:ring-2 focus:ring-hm-gold"
              />
            </div>
            <div>
              <label className="block font-sans text-sm text-hm-slate/70 mb-1">Reason (optional)</label>
              <input
                type="text"
                placeholder="Personal use"
                value={blockForm.reason}
                onChange={e => setBlockForm(f => ({ ...f, reason: e.target.value }))}
                className="w-full rounded-lg border border-hm-border px-3 py-2.5 font-sans text-sm text-hm-black bg-hm-ivory focus:outline-none focus:ring-2 focus:ring-hm-gold"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={saveBlock}
              disabled={blocking_saving || !blockForm.start || !blockForm.end}
              className="rounded-lg px-6 py-2.5 font-sans font-semibold text-sm text-white disabled:opacity-50 transition-opacity hover:opacity-90"
              style={{ background: 'var(--hm-black)', minHeight: '44px' }}
            >
              {blocking_saving ? "Saving…" : "Block these dates"}
            </button>
          </div>
        </div>
      )}

      {/* Blocked dates list */}
      {blockedDates.length > 0 && (
        <div>
          <h2 className="font-serif text-lg font-bold text-hm-black mb-3">Your blocked dates</h2>
          <div className="space-y-2">
            {blockedDates.map(b => (
              <div key={b.id}
                   className="flex items-center justify-between rounded-lg border border-hm-border px-4 py-3"
                   style={{ background: 'var(--hm-sand)' }}>
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-hm-slate/40" />
                  <span className="font-sans text-sm text-hm-black">
                    {fmtDate(b.startDate)} → {fmtDate(b.endDate)}
                  </span>
                  {b.reason && (
                    <span className="font-sans text-sm text-hm-slate/60">· {b.reason}</span>
                  )}
                </div>
                <button
                  onClick={() => removeBlock(b.id)}
                  className="text-hm-slate/40 hover:text-hm-red transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reservations list */}
      <div>
        <h2 className="font-serif text-xl font-bold text-hm-black mb-4">
          {view === "upcoming" ? "Upcoming bookings" : "All bookings"}
        </h2>

        {shown.length === 0 ? (
          <div className="rounded-hm border border-hm-border p-12 text-center"
               style={{ background: 'var(--hm-sand)' }}>
            <CalendarDays className="h-12 w-12 mx-auto mb-3 text-hm-slate/30" />
            <p className="font-serif text-xl text-hm-black">
              {view === "upcoming" ? "No upcoming bookings" : "No bookings yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {shown.map(r => {
              const cfg = STATUS_PILL[r.status]
              return (
                <div key={r.id}
                     className="rounded-hm border border-hm-border p-5"
                     style={{ background: 'var(--hm-sand)' }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{FLAGS[r.guestNationality ?? ""] ?? "🌍"}</span>
                      <div>
                        <p className="font-serif font-bold text-hm-black text-lg">{r.guestName}</p>
                        <p className="font-sans text-sm text-hm-slate/70">
                          {fmtDate(r.checkIn)} → {fmtDate(r.checkOut)} · {r.nights} nights
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-block rounded-full px-3 py-1 text-xs font-sans font-semibold ${cfg.cls}`}>
                        {cfg.label}
                      </span>
                      <p className="font-serif font-bold text-hm-black mt-1">{fmtEUR(r.grossAmount)}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-sans text-xs text-hm-slate/50 bg-hm-ivory border border-hm-border rounded px-2 py-0.5">
                      {r.platform}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
