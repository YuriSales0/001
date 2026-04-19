"use client"

import { useEffect, useState } from "react"
import { FileText, Download, Building2 } from "lucide-react"
import { generateMonthlyReportPDF } from "@/lib/pdf"

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

const PLATFORM_LABELS: Record<string, string> = {
  AIRBNB: "Airbnb", BOOKING: "Booking.com", DIRECT: "Direct", OTHER: "Other",
}

type Property = { id: string; name: string; city: string }

type ReportDetail = {
  property: { name: string; city: string; commissionRate: number; owner: { name: string | null } }
  reservations: {
    id: string; guestName: string; checkIn: string; checkOut: string
    amount: number; platform: string | null
  }[]
  expenses: {
    id: string; description: string; category: string; amount: number; date: string
  }[]
  grossRevenue: number
  totalExpenses: number
  commissionRate: number
  commission: number
  ownerPayout: number
}

export default function ReportsPage() {
  const now = new Date()
  const [properties, setProperties]       = useState<Property[]>([])
  const [propertyId, setPropertyId]       = useState("")
  const [month, setMonth]                 = useState(now.getMonth()) // 0-indexed
  const [year, setYear]                   = useState(now.getFullYear())
  const [report, setReport]               = useState<ReportDetail | null>(null)
  const [loading, setLoading]             = useState(false)
  const [noData, setNoData]               = useState(false)

  // Load properties once
  useEffect(() => {
    fetch("/api/properties")
      .then(r => r.ok ? r.json() : [])
      .then((data: Property[]) => {
        setProperties(data)
        if (data.length > 0) setPropertyId(data[0].id)
      })
  }, [])

  // Fetch report whenever property/month/year changes
  useEffect(() => {
    if (!propertyId) return
    setLoading(true)
    setNoData(false)
    setReport(null)
    fetch(`/api/reports/detail?propertyId=${propertyId}&month=${month + 1}&year=${year}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && !data.error) {
          setReport(data)
          setNoData(data.reservations.length === 0 && data.expenses.length === 0)
        }
      })
      .finally(() => setLoading(false))
  }, [propertyId, month, year])

  const handleDownload = () => {
    if (!report) return
    const doc = generateMonthlyReportPDF({
      propertyName: report.property.name,
      ownerName:    report.property.owner.name ?? "Owner",
      month:        MONTHS[month],
      year,
      reservations: report.reservations.map(r => ({
        guest:    r.guestName,
        checkIn:  fmtDate(r.checkIn),
        checkOut: fmtDate(r.checkOut),
        amount:   r.amount,
        platform: PLATFORM_LABELS[r.platform ?? "OTHER"] ?? r.platform ?? "—",
      })),
      expenses: report.expenses.map(e => ({
        description: e.description,
        category:    e.category,
        amount:      e.amount,
      })),
      grossRevenue:  report.grossRevenue,
      totalExpenses: report.totalExpenses,
      commissionRate: report.commissionRate,
      commission:    report.commission,
      ownerPayout:   report.ownerPayout,
    })
    doc.save(`HM-Report-${report.property.name.replace(/\s+/g, '-')}-${MONTHS[month]}-${year}.pdf`)
  }

  const years = [now.getFullYear() - 1, now.getFullYear()]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-hm-black">Financial Reports</h1>
        <button
          onClick={handleDownload}
          disabled={!report || noData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-hm-black text-white text-sm font-medium hover:bg-hm-black/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Download className="h-4 w-4" /> Download PDF
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Property selector */}
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-400" />
          <select
            value={propertyId}
            onChange={e => setPropertyId(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white text-hm-black focus:outline-none focus:ring-2 focus:ring-navy-300"
          >
            {properties.length === 0 && <option value="">No properties</option>}
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name} — {p.city}</option>
            ))}
          </select>
        </div>
        {/* Year selector */}
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white text-hm-black focus:outline-none focus:ring-2 focus:ring-navy-300"
        >
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {/* Month tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {MONTHS.map((m, i) => (
          <button
            key={m}
            onClick={() => setMonth(i)}
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              month === i
                ? "bg-hm-black text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            {m.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* No data */}
      {!loading && noData && (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No data for {MONTHS[month]} {year}</p>
          <p className="text-sm text-gray-400 mt-1">No reservations or expenses recorded for this period.</p>
        </div>
      )}

      {/* Report content */}
      {!loading && report && !noData && (
        <>
          {/* Property + period info */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
            <p className="text-sm text-gray-500">
              <span className="font-semibold text-hm-black">{report.property.name}</span>
              {" — "}{MONTHS[month]} {year}
              {" · "}<span className="text-gray-400">Owner: {report.property.owner.name ?? "—"}</span>
            </p>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Gross Revenue</p>
              <p className="text-2xl font-bold text-hm-black">{fmtEUR(report.grossRevenue)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">{fmtEUR(report.totalExpenses)}</p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">
                Commission ({report.commissionRate}%)
              </p>
              <p className="text-2xl font-bold text-gray-600">{fmtEUR(report.commission)}</p>
            </div>
            <div className="rounded-xl border bg-hm-black p-5">
              <p className="text-xs uppercase tracking-wider text-gray-300 mb-1">Owner Payout</p>
              <p className="text-2xl font-bold text-white">{fmtEUR(report.ownerPayout)}</p>
            </div>
          </div>

          {/* Reservations table */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <FileText className="h-4 w-4 text-navy-500" />
              <span className="font-semibold text-hm-black text-sm">
                Income — {report.reservations.length} reservation{report.reservations.length !== 1 ? "s" : ""}
              </span>
            </div>
            {report.reservations.length === 0 ? (
              <p className="p-5 text-sm text-gray-400 text-center">No reservations this month</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-5 py-3 font-medium text-gray-500">Guest</th>
                    <th className="px-5 py-3 font-medium text-gray-500">Check-in</th>
                    <th className="px-5 py-3 font-medium text-gray-500">Check-out</th>
                    <th className="px-5 py-3 font-medium text-gray-500">Platform</th>
                    <th className="px-5 py-3 font-medium text-gray-500 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {report.reservations.map(r => (
                    <tr key={r.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3 font-medium text-hm-black">{r.guestName}</td>
                      <td className="px-5 py-3 text-gray-600">{fmtDate(r.checkIn)}</td>
                      <td className="px-5 py-3 text-gray-600">{fmtDate(r.checkOut)}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {PLATFORM_LABELS[r.platform ?? "OTHER"] ?? r.platform ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-medium text-green-600">
                        {fmtEUR(r.amount)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td className="px-5 py-3 font-bold text-hm-black" colSpan={4}>Total Income</td>
                    <td className="px-5 py-3 text-right font-bold text-hm-black">
                      {fmtEUR(report.grossRevenue)}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Expenses table */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
              <span className="font-semibold text-hm-black text-sm">
                Expenses — {report.expenses.length} item{report.expenses.length !== 1 ? "s" : ""}
              </span>
            </div>
            {report.expenses.length === 0 ? (
              <p className="p-5 text-sm text-gray-400 text-center">No expenses this month</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-5 py-3 font-medium text-gray-500">Description</th>
                    <th className="px-5 py-3 font-medium text-gray-500">Date</th>
                    <th className="px-5 py-3 font-medium text-gray-500">Category</th>
                    <th className="px-5 py-3 font-medium text-gray-500 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {report.expenses.map(e => (
                    <tr key={e.id} className="border-b border-gray-50 last:border-0">
                      <td className="px-5 py-3 text-hm-black">{e.description}</td>
                      <td className="px-5 py-3 text-gray-500">{fmtDate(e.date)}</td>
                      <td className="px-5 py-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {e.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-red-600">{fmtEUR(e.amount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50">
                    <td className="px-5 py-3 font-bold text-hm-black" colSpan={3}>Total Expenses</td>
                    <td className="px-5 py-3 text-right font-bold text-red-600">
                      {fmtEUR(report.totalExpenses)}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Final summary */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Gross Revenue</span>
                <span className="font-medium">{fmtEUR(report.grossRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Expenses</span>
                <span className="font-medium text-red-600">−{fmtEUR(report.totalExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">
                  Management Commission ({report.commissionRate}%)
                </span>
                <span className="font-medium text-red-600">−{fmtEUR(report.commission)}</span>
              </div>
              <div className="border-t border-gray-300 pt-3 flex justify-between text-base">
                <span className="font-bold text-hm-black">Owner Payout</span>
                <span className="font-bold text-hm-black">{fmtEUR(report.ownerPayout)}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
