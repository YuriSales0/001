"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  CalendarDays, MessageCircle, FileText, Lock, Wifi,
  CheckCircle2, TrendingUp, Phone
} from "lucide-react"
import { PlanBadge } from "@/components/hm/plan-badge"

type DashboardData = {
  property: {
    id: string
    name: string
    address: string
    city: string
    plan: string
    status: string
    airbnbUrl?: string
    bookingUrl?: string
    lastCleaningAt?: string
    lastInspectionAt?: string
    smartLockId?: string
  } | null
  earnings: {
    thisMonth: number
    occupancyPct: number
  }
  nextBooking: {
    guestName: string
    guestNationality?: string
    checkIn: string
    checkOut: string
  } | null
  manager?: {
    name: string
    phone?: string
  }
}

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })

const FLAGS: Record<string, string> = {
  GB:"🇬🇧", SE:"🇸🇪", NO:"🇳🇴", DK:"🇩🇰",
  NL:"🇳🇱", DE:"🇩🇪", FR:"🇫🇷", ES:"🇪🇸", IT:"🇮🇹",
}

export default function OwnerDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [propRes, payRes, resRes] = await Promise.all([
          fetch("/api/properties"),
          fetch("/api/payouts"),
          fetch("/api/reservations"),
        ])
        const properties = propRes.ok ? await propRes.json() : []
        const payouts    = payRes.ok  ? await payRes.json()  : []
        const reservations = resRes.ok ? await resRes.json() : []

        const property = properties[0] ?? null
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        const monthPayouts = payouts.filter((p: any) =>
          new Date(p.scheduledFor) >= monthStart && p.status !== "CANCELLED"
        )
        const thisMonth = monthPayouts.reduce((s: number, p: any) => s + p.netAmount, 0)

        const upcoming = reservations
          .filter((r: any) => r.status === "UPCOMING" || r.status === "ACTIVE")
          .sort((a: any, b: any) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime())
        const nextBooking = upcoming[0]
          ? {
              guestName: upcoming[0].guestName,
              guestNationality: upcoming[0].guestNationality,
              checkIn: upcoming[0].checkIn,
              checkOut: upcoming[0].checkOut,
            }
          : null

        // Occupancy: booked nights / days in month
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
        const bookedNights = reservations
          .filter((r: any) => r.status !== "CANCELLED")
          .reduce((s: number, r: any) => s + (r.nights ?? 0), 0)
        const occupancyPct = Math.min(Math.round((bookedNights / daysInMonth) * 100), 100)

        setData({
          property: property
            ? {
                id: property.id,
                name: property.name,
                address: property.address,
                city: property.city,
                plan: property.owner?.subscriptionPlan ?? "STARTER",
                status: property.status,
                airbnbUrl: property.airbnbIcalUrl,
                lastInspectionAt: property.lastInspectionAt,
                smartLockId: property.smartLockId,
              }
            : null,
          earnings: { thisMonth, occupancyPct },
          nextBooking,
          manager: undefined,
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-64 rounded-hm bg-hm-sand" />
        <div className="grid grid-cols-3 gap-4">
          <div className="h-28 rounded-hm bg-hm-sand" />
          <div className="h-28 rounded-hm bg-hm-sand" />
          <div className="h-28 rounded-hm bg-hm-sand" />
        </div>
      </div>
    )
  }

  const prop = data?.property

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-hm-black">
          Good morning
        </h1>
        <p className="mt-1 font-sans text-hm-slate/70 text-lg">
          Here is everything happening with your property today.
        </p>
      </div>

      {prop ? (
        <>
          {/* Property hero card */}
          <div className="rounded-hm border border-hm-border overflow-hidden"
               style={{ background: 'var(--hm-sand)' }}>
            {/* Top bar with plan */}
            <div className="px-6 py-4 border-b border-hm-border flex items-center justify-between">
              <div>
                <h2 className="text-xl font-serif font-bold text-hm-black">{prop.name}</h2>
                <p className="font-sans text-sm text-hm-slate/70 mt-0.5">{prop.address}, {prop.city}</p>
              </div>
              <PlanBadge plan={prop.plan} size="md" />
            </div>

            {/* Earnings hero */}
            <div className="px-6 py-8 text-center border-b border-hm-border"
                 style={{ background: 'var(--hm-ivory)' }}>
              <p className="font-sans text-sm uppercase tracking-widest text-hm-slate/60 mb-2">
                Your earnings this month — net
              </p>
              <p className="text-6xl font-serif font-bold text-hm-black">
                {fmtEUR(data?.earnings.thisMonth ?? 0)}
              </p>
              {/* Occupancy bar */}
              <div className="mt-4 max-w-xs mx-auto">
                <div className="flex items-center justify-between text-sm font-sans text-hm-slate/60 mb-1">
                  <span>Occupancy this month</span>
                  <span className="font-semibold text-hm-black">{data?.earnings.occupancyPct ?? 0}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--hm-border)' }}>
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${data?.earnings.occupancyPct ?? 0}%`,
                      background: 'var(--hm-gold)',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Next booking + condition */}
            <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="font-sans text-xs uppercase tracking-widest text-hm-slate/60 mb-2">
                  Next guest
                </p>
                {data?.nextBooking ? (
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {FLAGS[data.nextBooking.guestNationality ?? ""] ?? "🌍"}
                    </span>
                    <div>
                      <p className="font-serif font-semibold text-hm-black">
                        {data.nextBooking.guestName}
                      </p>
                      <p className="font-sans text-sm text-hm-slate/70">
                        {fmtDate(data.nextBooking.checkIn)} →{" "}
                        {new Date(data.nextBooking.checkOut).toLocaleDateString("en-GB", { day: "2-digit", month: "long" })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="font-sans text-hm-slate/60">No upcoming bookings</p>
                )}
              </div>

              <div>
                <p className="font-sans text-xs uppercase tracking-widest text-hm-slate/60 mb-2">
                  Property condition
                </p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-hm-green" />
                  <span className="font-serif font-semibold text-hm-green">All good</span>
                </div>
                {prop.lastInspectionAt && (
                  <p className="font-sans text-sm text-hm-slate/60 mt-1">
                    Last inspected {fmtDate(prop.lastInspectionAt)}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div>
            <h2 className="text-xl font-serif font-bold text-hm-black mb-4">Quick actions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Link
                href="/client/bookings"
                className="flex items-center gap-4 rounded-hm border border-hm-border p-5 hover:border-hm-gold/50 hover:shadow-sm transition-all"
                style={{ background: 'var(--hm-sand)' }}
              >
                <div className="h-12 w-12 rounded-full flex items-center justify-center"
                     style={{ background: 'var(--hm-gold)', opacity: 0.9 }}>
                  <CalendarDays className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-serif font-bold text-hm-black">Block dates</p>
                  <p className="font-sans text-sm text-hm-slate/70">Reserve time for yourself</p>
                </div>
              </Link>

              <Link
                href="/client/messages"
                className="flex items-center gap-4 rounded-hm border border-hm-border p-5 hover:border-hm-gold/50 hover:shadow-sm transition-all"
                style={{ background: 'var(--hm-sand)' }}
              >
                <div className="h-12 w-12 rounded-full flex items-center justify-center"
                     style={{ background: 'var(--hm-green)' }}>
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-serif font-bold text-hm-black">Contact your manager</p>
                  <p className="font-sans text-sm text-hm-slate/70">We reply within hours</p>
                </div>
              </Link>

              <Link
                href="/client/financials"
                className="flex items-center gap-4 rounded-hm border border-hm-border p-5 hover:border-hm-gold/50 hover:shadow-sm transition-all"
                style={{ background: 'var(--hm-sand)' }}
              >
                <div className="h-12 w-12 rounded-full flex items-center justify-center"
                     style={{ background: 'var(--hm-blue)' }}>
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="font-serif font-bold text-hm-black">View full report</p>
                  <p className="font-sans text-sm text-hm-slate/70">Monthly earnings breakdown</p>
                </div>
              </Link>
            </div>
          </div>

          {/* Status cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {prop.smartLockId && (
              <div className="rounded-hm border border-hm-border p-5"
                   style={{ background: 'var(--hm-sand)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <Lock className="h-5 w-5 text-hm-green" />
                  <span className="font-serif font-semibold text-hm-black">Smart Lock</span>
                </div>
                <p className="font-sans text-sm text-hm-slate/70">
                  Nuki lock active · ID {prop.smartLockId}
                </p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="h-2 w-2 rounded-full bg-hm-green inline-block" />
                  <span className="font-sans text-sm text-hm-green">Connected</span>
                </div>
              </div>
            )}

            <div className="rounded-hm border border-hm-border p-5"
                 style={{ background: 'var(--hm-sand)' }}>
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-5 w-5 text-hm-blue" />
                <span className="font-serif font-semibold text-hm-black">Active listings</span>
              </div>
              <div className="font-sans text-sm text-hm-slate/70 space-y-1">
                <p>✓ Airbnb</p>
                <p>✓ Booking.com</p>
                <p>✓ VRBO</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* No property yet */
        <div className="rounded-hm border border-hm-border p-10 text-center"
             style={{ background: 'var(--hm-sand)' }}>
          <div className="h-16 w-16 rounded-full mx-auto mb-4 flex items-center justify-center"
               style={{ background: 'var(--hm-gold)', opacity: 0.8 }}>
            <Phone className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-hm-black mb-2">
            Your property is being set up
          </h2>
          <p className="font-sans text-hm-slate/70 max-w-md mx-auto">
            Our team is preparing everything. You will receive an email as soon as your property is live.
            In the meantime, feel free to contact your manager.
          </p>
          <Link
            href="/client/messages"
            className="mt-6 inline-flex items-center gap-2 rounded-lg px-6 py-3 font-sans font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--hm-black)' }}
          >
            <MessageCircle className="h-5 w-5" />
            Contact your manager
          </Link>
        </div>
      )}
    </div>
  )
}
