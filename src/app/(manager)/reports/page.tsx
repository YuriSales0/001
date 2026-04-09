"use client"

import { useEffect, useState } from "react"
import { FileBarChart, Download, Calendar, Building2, ChevronRight } from "lucide-react"

interface Reservation {
  id: string
  amount: number
  checkIn: string
  checkOut: string
  property: { id: string; name: string; city: string }
}

interface Property {
  id: string
  name: string
  city: string
}

interface ReportSummary {
  propertyId: string
  propertyName: string
  month: string
  revenue: number
  reservations: number
  nights: number
}

const MONTHS = [
  { value: "01", label: "January" }, { value: "02", label: "February" },
  { value: "03", label: "March" },   { value: "04", label: "April" },
  { value: "05", label: "May" },     { value: "06", label: "June" },
  { value: "07", label: "July" },    { value: "08", label: "August" },
  { value: "09", label: "September"},{ value: "10", label: "October" },
  { value: "11", label: "November" },{ value: "12", label: "December" },
]

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

export default function ReportsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState("")
  const [selectedMonth, setSelectedMonth] = useState("")
  const [selectedYear, setSelectedYear] = useState("2026")
  const [selected, setSelected] = useState<ReportSummary | null>(null)
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
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
    load()
  }, [])

  // Build past-month summaries from real reservations
  const summaries: ReportSummary[] = []
  const seen = new Set<string>()
  reservations.forEach(r => {
    const d = new Date(r.checkOut)
    const key = `${r.property.id}-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    if (seen.has(key)) {
      const s = summaries.find(s => s.propertyId === r.property.id &&
        s.month === `${MONTHS[d.getMonth()].label} ${d.getFullYear()}`)
      if (s) { s.revenue += r.amount; s.reservations += 1 }
    } else {
      seen.add(key)
      const nights = Math.round((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 86400000)
      summaries.push({
        propertyId: r.property.id,
        propertyName: r.property.name,
        month: `${MONTHS[d.getMonth()].label} ${d.getFullYear()}`,
        revenue: r.amount,
        reservations: 1,
        nights,
      })
    }
  })

  const handleGenerate = async () => {
    if (!selectedProperty || !selectedMonth || !selectedYear) return
    setGenerating(true)
    const propName = properties.find(p => p.id === selectedProperty)?.name ?? ""
    const monthLabel = MONTHS.find(m => m.value === selectedMonth)?.label ?? ""

    // Compute summary from reservations
    const filtered = reservations.filter(r => {
      const d = new Date(r.checkOut)
      return r.property.id === selectedProperty &&
        d.getFullYear() === parseInt(selectedYear) &&
        String(d.getMonth() + 1).padStart(2, "0") === selectedMonth
    })

    const revenue = filtered.reduce((s, r) => s + r.amount, 0)
    const nights  = filtered.reduce((s, r) =>
      s + Math.round((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 86400000), 0)

    setSelected({
      propertyId: selectedProperty,
      propertyName: propName,
      month: `${monthLabel} ${selectedYear}`,
      revenue,
      reservations: filtered.length,
      nights,
    })
    setGenerating(false)
  }

  const handleDownload = async (summary: ReportSummary) => {
    const { jsPDF } = await import("jspdf")
    const { default: autoTable } = await import("jspdf-autotable")
    const doc = new jsPDF()

    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("HostMasters", 20, 20)
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(`Property Report — ${summary.month}`, 20, 30)

    autoTable(doc, {
      startY: 40,
      head: [["Metric", "Value"]],
      body: [
        ["Property", summary.propertyName],
        ["Period", summary.month],
        ["Reservations", String(summary.reservations)],
        ["Total Nights", String(summary.nights)],
        ["Gross Revenue", fmtMoney(summary.revenue)],
        ["Commission (17%)", fmtMoney(summary.revenue * 0.17)],
        ["Net to Owner", fmtMoney(summary.revenue * 0.83)],
      ],
    })
    doc.save(`report-${summary.propertyName.replace(/\s+/g, "-")}-${summary.month.replace(/\s+/g, "-")}.pdf`)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Reports</h1>
        <p className="text-sm text-gray-500">Generate and download property performance reports.</p>
      </div>

      {/* Generate panel */}
      <div className="rounded-xl border bg-white p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileBarChart className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-semibold text-navy-900">Generate new report</span>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Property *</label>
            <select
              value={selectedProperty}
              onChange={e => setSelectedProperty(e.target.value)}
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
            >
              <option value="">Select a property…</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="w-[140px]">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Month *</label>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
            >
              <option value="">Month…</option>
              {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div className="w-[100px]">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Year</label>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
              className="w-full rounded-lg border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
            >
              {["2024", "2025", "2026"].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <button
            onClick={handleGenerate}
            disabled={generating || !selectedProperty || !selectedMonth}
            className="inline-flex items-center gap-2 rounded-xl bg-navy-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-navy-800 disabled:opacity-50"
          >
            <FileBarChart className="h-4 w-4" />
            {generating ? "Generating…" : "Generate"}
          </button>
        </div>
      </div>

      {/* Two-pane: list + preview */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* List */}
        <div className="lg:col-span-2 space-y-3">
          <p className="text-sm font-semibold text-navy-900">Generated reports</p>
          {loading && <div className="py-8 text-center text-sm text-gray-400">Loading…</div>}
          {!loading && summaries.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400 rounded-xl border bg-white">
              No reports yet. Generate one above.
            </div>
          )}
          {summaries.map((s, i) => (
            <div
              key={i}
              onClick={() => setSelected(s)}
              className={`rounded-xl border bg-white p-4 hover:shadow-sm transition-shadow cursor-pointer ${
                selected?.propertyId === s.propertyId && selected?.month === s.month ? "ring-2 ring-navy-900" : ""
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <FileBarChart className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-navy-900 truncate">{s.propertyName}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{s.month}</span>
                    <span>{s.reservations} reservations</span>
                    <span className="font-medium text-emerald-700">{fmtMoney(s.revenue)}</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
              </div>
            </div>
          ))}
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-navy-900">Preview</p>
          {!selected ? (
            <div className="rounded-xl border bg-white py-16 flex flex-col items-center justify-center text-center text-gray-400">
              <FileBarChart className="h-8 w-8 mb-2" />
              <p className="text-sm">Select a report to preview.</p>
            </div>
          ) : (
            <div className="rounded-xl border bg-white p-5 space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="font-bold text-navy-900">{selected.propertyName}</span>
                </div>
                <p className="text-xs text-gray-500">{selected.month}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Revenue",      value: fmtMoney(selected.revenue),                      color: "text-emerald-700" },
                  { label: "Commission",   value: fmtMoney(selected.revenue * 0.17),               color: "text-gray-700" },
                  { label: "Net to owner", value: fmtMoney(selected.revenue * 0.83),               color: "text-navy-900" },
                  { label: "Reservations", value: String(selected.reservations),                    color: "text-navy-900" },
                  { label: "Nights",       value: String(selected.nights),                          color: "text-navy-900" },
                  { label: "ADR",          value: selected.nights ? fmtMoney(selected.revenue / selected.nights) : "—", color: "text-navy-900" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="rounded-lg bg-gray-50 p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
                    <p className={`text-base font-bold ${color}`}>{value}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => handleDownload(selected)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white text-gray-700 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
              >
                <Download className="h-4 w-4" /> Download PDF
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
