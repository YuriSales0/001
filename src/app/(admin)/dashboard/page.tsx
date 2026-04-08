'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  Building2, Users, CalendarDays, Euro, Wallet, AlertTriangle,
  FileText, UserPlus, Search, X, ChevronDown,
} from 'lucide-react'

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

type Client = { id: string; clientCode: string | null; name: string | null; email: string }

const fmtEUR = (n: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
const fmtDate = (s: string) => new Date(s).toLocaleDateString('pt-PT')

/* ─── Client Search Dropdown ─────────────────────────────────────────────── */
function ClientFilter({ clients, selected, onSelect }: {
  clients: Client[]
  selected: Client | null
  onSelect: (c: Client | null) => void
}) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)

  const filtered = search
    ? clients.filter(c =>
        c.clientCode?.toLowerCase().includes(search.toLowerCase()) ||
        (c.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase())
      )
    : clients

  return (
    <div className="relative">
      <div className={`flex items-center gap-2 rounded-xl border bg-white px-3 py-2 text-sm min-w-[260px] ${open ? 'ring-2 ring-navy-900' : ''}`}>
        <Search className="h-4 w-4 text-gray-400 shrink-0" />
        {selected ? (
          <div className="flex items-center gap-2 flex-1">
            <span className="font-medium text-navy-900 truncate">{selected.name ?? selected.email}</span>
            {selected.clientCode && (
              <span className="rounded-full bg-navy-100 text-navy-700 px-2 py-0.5 text-[10px] font-bold">{selected.clientCode}</span>
            )}
          </div>
        ) : (
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="Filtrar por cliente ou ID…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-gray-400"
          />
        )}
        {selected ? (
          <button onClick={() => { onSelect(null); setSearch('') }} className="ml-auto rounded p-0.5 hover:bg-gray-100">
            <X className="h-3.5 w-3.5 text-gray-400" />
          </button>
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        )}
      </div>

      {open && !selected && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl border bg-white shadow-lg max-h-60 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400">Nenhum resultado</div>
            ) : (
              filtered.map(c => (
                <button
                  key={c.id}
                  onClick={() => { onSelect(c); setOpen(false); setSearch('') }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-3"
                >
                  <div>
                    <div className="text-sm font-medium text-navy-900">{c.name ?? c.email}</div>
                    <div className="text-xs text-gray-400">{c.email}</div>
                  </div>
                  {c.clientCode && (
                    <span className="ml-auto rounded-full bg-navy-100 text-navy-700 px-2 py-0.5 text-[10px] font-bold shrink-0">
                      {c.clientCode}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Main Dashboard ─────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch clients list once
  useEffect(() => {
    fetch('/api/users?role=CLIENT')
      .then(r => r.ok ? r.json() : [])
      .then((data: Client[]) => setClients(data))
  }, [])

  const loadStats = useCallback((clientId?: string) => {
    setLoading(true)
    const url = clientId ? `/api/admin/stats?clientId=${clientId}` : '/api/admin/stats'
    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setStats(d); setLoading(false) })
  }, [])

  useEffect(() => {
    loadStats(selectedClient?.id)
  }, [selectedClient, loadStats])

  const handleClientSelect = (c: Client | null) => {
    setSelectedClient(c)
  }

  const cards = stats ? [
    { label: 'Propriedades', value: stats.propertiesCount, icon: Building2, href: '/my-properties' },
    { label: 'Clientes', value: selectedClient ? '1' : stats.clientsCount, icon: Users, href: '/team' },
    { label: 'Reservas ativas', value: stats.activeReservations, icon: CalendarDays, href: '/calendar' },
    { label: 'Receita este mês', value: fmtEUR(stats.monthRevenue), icon: Euro, sub: `Comissão ${fmtEUR(stats.monthCommission)}` },
    { label: 'Payouts abertos', value: fmtEUR(stats.openPayouts.net), icon: Wallet, sub: `${stats.openPayouts.count} agendados`, href: '/payouts' },
    { label: 'Faturas pendentes', value: fmtEUR(stats.pendingInvoices.total), icon: FileText, sub: `${stats.pendingInvoices.count} enviadas`, href: '/payouts' },
    { label: 'Tarefas em atraso', value: stats.overdueTasks, icon: AlertTriangle, danger: stats.overdueTasks > 0, href: '/calendar' },
    ...(selectedClient ? [] : [{ label: 'Leads abertos', value: stats.leadsOpen, icon: UserPlus, href: '/crm' }]),
  ] : []

  return (
    <div className="p-6 space-y-6">
      {/* Header + Client filter */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">
            {selectedClient ? `${selectedClient.name ?? selectedClient.email}` : 'Dashboard'}
          </h1>
          <p className="text-sm text-gray-500">
            {selectedClient
              ? `Visão individual · ${selectedClient.clientCode ?? selectedClient.email}`
              : 'Visão geral — todas as propriedades e clientes'}
          </p>
        </div>
        <ClientFilter clients={clients} selected={selectedClient} onSelect={handleClientSelect} />
      </div>

      {/* Selected client banner */}
      {selectedClient && (
        <div className="rounded-xl border border-navy-200 bg-navy-50 px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-navy-900">{selectedClient.name ?? selectedClient.email}</span>
            {selectedClient.clientCode && (
              <span className="rounded-full bg-navy-200 text-navy-800 px-2 py-0.5 text-xs font-bold">{selectedClient.clientCode}</span>
            )}
            <span className="text-xs text-navy-600">{selectedClient.email}</span>
          </div>
          <button
            onClick={() => setSelectedClient(null)}
            className="ml-auto text-xs text-navy-600 hover:text-navy-900 flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" /> Ver todos
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-4 animate-pulse h-24" />
          ))}
        </div>
      ) : stats ? (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {cards.map(c => {
              const Icon = c.icon
              const inner = (
                <div className={`rounded-xl border bg-white p-4 h-full ${c.danger ? 'border-red-200' : ''} ${c.href ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase text-gray-500 tracking-wide">{c.label}</span>
                    <Icon className={`h-4 w-4 ${c.danger ? 'text-red-500' : 'text-gray-300'}`} />
                  </div>
                  <div className={`text-2xl font-bold mt-2 ${c.danger ? 'text-red-600' : 'text-navy-900'}`}>{c.value}</div>
                  {c.sub && <div className="text-xs text-gray-400 mt-1">{c.sub}</div>}
                </div>
              )
              return c.href ? (
                <Link key={c.label} href={c.href}>{inner}</Link>
              ) : (
                <div key={c.label}>{inner}</div>
              )
            })}
          </div>

          {/* Check-ins / Check-outs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border bg-white">
              <div className="px-4 py-3 border-b font-semibold text-navy-900 text-sm">
                Check-ins próximos (7 dias)
              </div>
              <div className="divide-y">
                {stats.upcomingCheckIns.length === 0 && (
                  <div className="p-4 text-sm text-gray-400">Nenhum check-in</div>
                )}
                {stats.upcomingCheckIns.map(r => (
                  <div key={r.id} className="px-4 py-3 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium text-navy-900">{r.guestName}</div>
                      <div className="text-xs text-gray-500">{r.property.name} · {r.property.city}</div>
                    </div>
                    <div className="text-xs text-gray-500 shrink-0">{fmtDate(r.checkIn)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-white">
              <div className="px-4 py-3 border-b font-semibold text-navy-900 text-sm">
                Check-outs próximos (7 dias)
              </div>
              <div className="divide-y">
                {stats.upcomingCheckOuts.length === 0 && (
                  <div className="p-4 text-sm text-gray-400">Nenhum check-out</div>
                )}
                {stats.upcomingCheckOuts.map(r => (
                  <div key={r.id} className="px-4 py-3 flex items-center justify-between text-sm">
                    <div>
                      <div className="font-medium text-navy-900">{r.guestName}</div>
                      <div className="text-xs text-gray-500">{r.property.name} · {r.property.city}</div>
                    </div>
                    <div className="text-xs text-gray-500 shrink-0">{fmtDate(r.checkOut)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-sm text-gray-400">Erro ao carregar.</div>
      )}

      {/* Quick nav */}
      <div className="flex flex-wrap gap-2">
        {[
          { href: '/calendar', label: 'Calendário' },
          { href: '/payouts', label: 'Payouts' },
          { href: '/team', label: 'Equipa' },
          { href: '/my-properties', label: 'Propriedades' },
          { href: '/crm', label: 'CRM' },
        ].map(l => (
          <Link key={l.href} href={l.href}
            className="rounded-lg border px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-navy-900">
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
