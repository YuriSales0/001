'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { Download, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'

type Client = { id: string; clientCode: string | null; name: string | null; email: string }
type Property = { id: string; name: string; commissionRate: number; ownerId: string }
type Reservation = {
  id: string
  guestName: string
  checkIn: string
  checkOut: string
  amount: number
  platform: string | null
  status: string
}

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

const PLATFORM_LABELS: Record<string, string> = {
  AIRBNB: 'Airbnb', BOOKING: 'Booking.com', DIRECT: 'Direto', VRBO: 'VRBO', OTHER: 'Outro',
}

const fmtEUR = (n: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n)

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' })

export default function AdminReportsPage() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth()) // 0-indexed

  const [clients, setClients] = useState<Client[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loadingData, setLoadingData] = useState(false)

  const [clientSearch, setClientSearch] = useState('')
  const [clientDropdown, setClientDropdown] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null)

  // Load clients
  useEffect(() => {
    fetch('/api/users?role=CLIENT').then(r => r.ok ? r.json() : []).then(setClients)
  }, [])

  // Load properties when client changes
  useEffect(() => {
    setSelectedProperty(null)
    if (selectedClient) {
      fetch('/api/properties').then(r => r.ok ? r.json() : []).then((all: Property[]) => {
        setProperties(all.filter(p => p.ownerId === selectedClient.id))
      })
    } else {
      fetch('/api/properties').then(r => r.ok ? r.json() : []).then(setProperties)
    }
  }, [selectedClient])

  // Load reservations when filters change
  const loadReservations = useCallback(() => {
    const start = new Date(year, month, 1).toISOString()
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString()
    setLoadingData(true)
    const pid = selectedProperty?.id
    const url = `/api/reservations?from=${start}&to=${end}${pid ? `&propertyId=${pid}` : ''}`
    fetch(url)
      .then(r => r.ok ? r.json() : [])
      .then((all: Reservation[]) => {
        // Filter by client if no property selected
        if (selectedClient && !selectedProperty) {
          const propIds = new Set(properties.map(p => p.id))
          setReservations(all.filter((r: Reservation & { propertyId?: string }) =>
            r.propertyId ? propIds.has(r.propertyId) : true
          ))
        } else {
          setReservations(all.filter((r: Reservation) => r.status !== 'CANCELLED'))
        }
      })
      .finally(() => setLoadingData(false))
  }, [year, month, selectedProperty, selectedClient, properties])

  useEffect(() => { loadReservations() }, [loadReservations])

  // Computed totals
  const activeRes = reservations.filter(r => r.status !== 'CANCELLED')

  const commissionRate = selectedProperty?.commissionRate ?? 18
  const grossRevenue = activeRes.reduce((s, r) => s + r.amount, 0)
  const commission = grossRevenue * (commissionRate / 100)
  const net = grossRevenue - commission

  // By platform
  const byPlatform = useMemo(() => {
    const map: Record<string, { count: number; total: number }> = {}
    activeRes.forEach(r => {
      const p = r.platform ?? 'OTHER'
      if (!map[p]) map[p] = { count: 0, total: 0 }
      map[p].count++
      map[p].total += r.amount
    })
    return Object.entries(map).sort((a, b) => b[1].total - a[1].total)
  }, [activeRes])

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const filteredClients = clientSearch
    ? clients.filter(c =>
        c.clientCode?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        (c.name ?? '').toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.email.toLowerCase().includes(clientSearch.toLowerCase())
      )
    : clients

  const downloadPDF = async () => {
    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const margin = 20
    let y = 20

    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, 210, 35, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text('HostMasters — Relatório Mensal', margin, 15)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`${MONTH_NAMES[month]} ${year}${selectedClient ? ' · ' + (selectedClient.name ?? selectedClient.email) : ''}`, margin, 25)

    y = 50
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumo', margin, y)
    y += 8

    const rows = [
      ['Receita Bruta', fmtEUR(grossRevenue)],
      [`Comissão HostMasters (${commissionRate}%)`, `-${fmtEUR(commission)}`],
      ['Líquido ao Proprietário', fmtEUR(net)],
      ['Nº de reservas', String(activeRes.length)],
    ]
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    rows.forEach(([label, value]) => {
      doc.text(label, margin, y)
      doc.text(value, 190, y, { align: 'right' })
      y += 7
    })

    y += 6
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Reservas', margin, y)
    y += 8
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    activeRes.forEach(r => {
      const line = `${r.guestName} · ${fmtDate(r.checkIn)}–${fmtDate(r.checkOut)} · ${PLATFORM_LABELS[r.platform ?? ''] ?? r.platform ?? '—'}`
      doc.text(line, margin, y)
      doc.text(fmtEUR(r.amount), 190, y, { align: 'right' })
      y += 6
      if (y > 270) { doc.addPage(); y = 20 }
    })

    doc.save(`HostMasters-Report-${MONTH_NAMES[month]}-${year}.pdf`)
  }

  const monthLabel = `${MONTH_NAMES[month]} ${year}`

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Relatórios</h1>
          <p className="text-sm text-gray-500">Receita, comissão e liquidação por período</p>
        </div>
        <button
          onClick={downloadPDF}
          className="inline-flex items-center gap-2 rounded-xl bg-navy-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-navy-800"
        >
          <Download className="h-4 w-4" /> Download PDF
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Month navigation */}
        <div className="flex items-center gap-2 rounded-xl border bg-white px-2 py-1.5">
          <button onClick={prevMonth} className="rounded p-1 hover:bg-gray-100">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold text-navy-900 min-w-[140px] text-center capitalize">{monthLabel}</span>
          <button onClick={nextMonth} className="rounded p-1 hover:bg-gray-100">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Client search dropdown */}
        <div className="relative">
          <div className={`flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm min-w-[220px] ${clientDropdown ? 'ring-2 ring-navy-900' : ''}`}>
            <Search className="h-4 w-4 text-gray-400 shrink-0" />
            {selectedClient ? (
              <div className="flex items-center gap-2 flex-1">
                <span className="font-medium text-navy-900 truncate">{selectedClient.name ?? selectedClient.email}</span>
                {selectedClient.clientCode && (
                  <span className="rounded-full bg-navy-100 text-navy-700 px-2 py-0.5 text-[10px] font-bold">{selectedClient.clientCode}</span>
                )}
              </div>
            ) : (
              <input
                value={clientSearch}
                onChange={e => { setClientSearch(e.target.value); setClientDropdown(true) }}
                onFocus={() => setClientDropdown(true)}
                placeholder="Filtrar por cliente…"
                className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400"
              />
            )}
            {selectedClient ? (
              <button onClick={() => { setSelectedClient(null); setClientSearch('') }} className="rounded p-0.5 hover:bg-gray-100">
                <X className="h-3.5 w-3.5 text-gray-400" />
              </button>
            ) : null}
          </div>
          {clientDropdown && !selectedClient && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setClientDropdown(false)} />
              <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl border bg-white shadow-lg max-h-52 overflow-y-auto">
                {filteredClients.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedClient(c); setClientDropdown(false); setClientSearch('') }}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{c.name ?? c.email}</div>
                      <div className="text-xs text-gray-400 truncate">{c.email}</div>
                    </div>
                    {c.clientCode && (
                      <span className="rounded-full bg-navy-100 text-navy-700 px-2 py-0.5 text-[10px] font-bold shrink-0">{c.clientCode}</span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Property filter */}
        {properties.length > 0 && (
          <select
            value={selectedProperty?.id ?? ''}
            onChange={e => setSelectedProperty(properties.find(p => p.id === e.target.value) ?? null)}
            className="rounded-xl border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
          >
            <option value="">Todas as propriedades</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Receita Bruta</div>
          <div className="text-2xl font-bold text-navy-900 mt-2">{fmtEUR(grossRevenue)}</div>
          <div className="text-xs text-gray-400 mt-1">{activeRes.length} reserva(s)</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Comissão ({commissionRate}%)</div>
          <div className="text-2xl font-bold text-orange-600 mt-2">-{fmtEUR(commission)}</div>
          <div className="text-xs text-gray-400 mt-1">HostMasters</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Líquido Proprietário</div>
          <div className="text-2xl font-bold text-green-700 mt-2">{fmtEUR(net)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Preço médio/noite</div>
          <div className="text-2xl font-bold text-navy-900 mt-2">
            {activeRes.length > 0
              ? fmtEUR(grossRevenue / activeRes.reduce((s, r) => {
                  const nights = Math.max(1, Math.round((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 86400000))
                  return s + nights
                }, 0))
              : '—'}
          </div>
        </div>
      </div>

      {/* By platform */}
      {byPlatform.length > 0 && (
        <div className="rounded-xl border bg-white p-5">
          <h2 className="text-sm font-bold text-navy-900 mb-4">Por plataforma</h2>
          <div className="space-y-2">
            {byPlatform.map(([platform, data]) => {
              const pct = grossRevenue > 0 ? (data.total / grossRevenue) * 100 : 0
              return (
                <div key={platform} className="flex items-center gap-3">
                  <div className="w-24 text-xs font-medium text-gray-600 shrink-0">
                    {PLATFORM_LABELS[platform] ?? platform}
                  </div>
                  <div className="flex-1 rounded-full bg-gray-100 h-2">
                    <div
                      className="rounded-full bg-navy-900 h-2 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 w-16 text-right shrink-0">
                    {data.count} res.
                  </div>
                  <div className="text-xs font-semibold text-navy-900 w-20 text-right shrink-0">
                    {fmtEUR(data.total)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Reservations table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <h2 className="text-sm font-bold text-navy-900">Reservas — {monthLabel}</h2>
          {loadingData && <span className="text-xs text-gray-400">A carregar…</span>}
        </div>
        {activeRes.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            {loadingData ? 'A carregar…' : 'Sem reservas neste período.'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Hóspede</th>
                <th className="px-4 py-3 hidden md:table-cell">Check-in</th>
                <th className="px-4 py-3 hidden md:table-cell">Check-out</th>
                <th className="px-4 py-3 hidden md:table-cell">Plataforma</th>
                <th className="px-4 py-3 text-right">Valor</th>
                <th className="px-4 py-3 text-right hidden md:table-cell">Comissão</th>
                <th className="px-4 py-3 text-right hidden md:table-cell">Líquido</th>
              </tr>
            </thead>
            <tbody>
              {activeRes.map(r => {
                const comm = r.amount * (commissionRate / 100)
                return (
                  <tr key={r.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-navy-900">{r.guestName}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{fmtDate(r.checkIn)}</td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell">{fmtDate(r.checkOut)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {r.platform ? (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                          {PLATFORM_LABELS[r.platform] ?? r.platform}
                        </span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">{fmtEUR(r.amount)}</td>
                    <td className="px-4 py-3 text-right text-orange-600 hidden md:table-cell">-{fmtEUR(comm)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-green-700 hidden md:table-cell">{fmtEUR(r.amount - comm)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot className="border-t bg-gray-50">
              <tr>
                <td colSpan={4} className="px-4 py-3 font-bold text-navy-900 hidden md:table-cell">Total</td>
                <td className="px-4 py-3 text-right font-bold">{fmtEUR(grossRevenue)}</td>
                <td className="px-4 py-3 text-right text-orange-600 font-bold hidden md:table-cell">-{fmtEUR(commission)}</td>
                <td className="px-4 py-3 text-right text-green-700 font-bold hidden md:table-cell">{fmtEUR(net)}</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  )
}
