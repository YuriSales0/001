"use client"

import { useEffect, useState } from "react"
import { MonthlyReportCard } from "@/components/hm/monthly-report-card"
import { TrendingUp, Calendar } from "lucide-react"

type Payout = {
  id: string
  grossAmount: number
  commission: number
  commissionRate: number
  netAmount: number
  scheduledFor: string
  paidAt: string | null
  status: "SCHEDULED" | "PAID" | "CANCELLED"
  property: { id: string; name: string }
  reservation: { id: string; guestName: string; checkIn: string; checkOut: string; nights: number }
}

type MonthGroup = {
  monthKey: string
  monthName: string
  year: number
  month: number
  payouts: Payout[]
  grossIncome: number
  commission: number
  cleaningFees: number
  expenses: number
  netPayout: number
  transferDate: string
  transferStatus: "pending" | "sent"
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
]

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

function groupByMonth(payouts: Payout[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>()
  for (const p of payouts) {
    const d = new Date(p.scheduledFor)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!map.has(key)) {
      const month = d.getMonth() + 1
      const year = d.getFullYear()
      // Transfer date: 3rd of the following month
      const transferDate = new Date(year, month, 3).toISOString()
      map.set(key, {
        monthKey: key,
        monthName: MONTHS[d.getMonth()],
        year,
        month,
        payouts: [],
        grossIncome: 0,
        commission: 0,
        cleaningFees: 0,
        expenses: 0,
        netPayout: 0,
        transferDate,
        transferStatus: p.status === "PAID" ? "sent" : "pending",
      })
    }
    const group = map.get(key)!
    group.payouts.push(p)
    group.grossIncome += p.grossAmount
    group.commission += p.commission
    group.netPayout += p.netAmount
  }
  return Array.from(map.values()).sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year
    return b.month - a.month
  })
}

export default function OwnerFinancials() {
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/payouts")
      .then(r => r.ok ? r.json() : [])
      .then(setPayouts)
      .finally(() => setLoading(false))
  }, [])

  const monthGroups = groupByMonth(payouts.filter(p => p.status !== "CANCELLED"))

  const yearToDate = monthGroups.reduce(
    (acc, g) => {
      acc.gross   += g.grossIncome
      acc.net     += g.netPayout
      acc.bookings += g.payouts.length
      return acc
    },
    { gross: 0, net: 0, bookings: 0 }
  )

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-32 rounded-hm bg-hm-sand" />
        <div className="h-64 rounded-hm bg-hm-sand" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-hm-black">My Earnings</h1>
        <p className="mt-1 font-sans text-lg text-hm-slate/70">
          Your monthly statements and net payments.
        </p>
      </div>

      {/* Year-to-date summary */}
      <div className="rounded-hm border border-hm-border overflow-hidden"
           style={{ background: 'var(--hm-sand)' }}>
        <div className="px-6 py-4 border-b border-hm-border">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-hm-gold-dk" />
            <h2 className="font-serif font-bold text-hm-black text-lg">Year to date</h2>
          </div>
        </div>
        <div className="grid grid-cols-3 divide-x divide-hm-border">
          <div className="px-6 py-5 text-center">
            <p className="font-sans text-xs uppercase tracking-widest text-hm-slate/60 mb-1">
              Total earnings
            </p>
            <p className="font-serif text-2xl font-bold text-hm-black">{fmtEUR(yearToDate.net)}</p>
          </div>
          <div className="px-6 py-5 text-center">
            <p className="font-sans text-xs uppercase tracking-widest text-hm-slate/60 mb-1">
              Gross income
            </p>
            <p className="font-serif text-2xl font-bold text-hm-black">{fmtEUR(yearToDate.gross)}</p>
          </div>
          <div className="px-6 py-5 text-center">
            <p className="font-sans text-xs uppercase tracking-widest text-hm-slate/60 mb-1">
              Bookings
            </p>
            <p className="font-serif text-2xl font-bold text-hm-black">{yearToDate.bookings}</p>
          </div>
        </div>
      </div>

      {/* Monthly statements */}
      {monthGroups.length === 0 ? (
        <div className="rounded-hm border border-hm-border p-12 text-center"
             style={{ background: 'var(--hm-sand)' }}>
          <Calendar className="h-12 w-12 mx-auto mb-3 text-hm-slate/30" />
          <p className="font-serif text-xl text-hm-black mb-1">No statements yet</p>
          <p className="font-sans text-hm-slate/60">
            Your first statement will appear here after your first booking is completed.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <h2 className="font-serif text-xl font-bold text-hm-black">Monthly statements</h2>
          {monthGroups.map(group => (
            <MonthlyReportCard
              key={group.monthKey}
              month={String(group.month)}
              year={group.year}
              grossIncome={group.grossIncome}
              commission={group.commission}
              cleaningFees={group.cleaningFees}
              expenses={group.expenses}
              netPayout={group.netPayout}
              transferDate={group.transferDate}
              transferStatus={group.transferStatus}
            />
          ))}
        </div>
      )}
    </div>
  )
}
