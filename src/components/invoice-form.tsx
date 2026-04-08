"use client"

import { useEffect, useState } from "react"
import { Wrench, ShoppingBag, Sparkles, BarChart3, CalendarDays, FileText } from "lucide-react"

type ClientOpt = { id: string; name: string | null; email: string }
type PropertyOpt = { id: string; name: string; ownerId: string }

const INVOICE_TYPES = [
  { value: 'CLEANING',    label: 'Limpeza',       icon: Sparkles,     desc: 'Empresa de limpeza' },
  { value: 'REPAIR',      label: 'Reparação',      icon: Wrench,       desc: 'Técnico / mão de obra' },
  { value: 'MATERIAL',    label: 'Material',       icon: ShoppingBag,  desc: 'Talão / fatura de loja' },
  { value: 'MANAGEMENT_FEE', label: 'Comissão',    icon: BarChart3,    desc: 'Comissão de gestão' },
  { value: 'MONTHLY_PLAN',   label: 'Plano Mensal', icon: CalendarDays, desc: 'Subscrição mensal' },
  { value: 'SERVICE',     label: 'Outro Serviço',  icon: FileText,     desc: 'Serviço diverso' },
]

export function InvoiceForm({ onCreated }: { onCreated?: () => void }) {
  const [clients, setClients] = useState<ClientOpt[]>([])
  const [properties, setProperties] = useState<PropertyOpt[]>([])
  const [form, setForm] = useState({
    clientId: "",
    propertyId: "",
    description: "",
    amount: "",
    dueDate: "",
    invoiceType: "SERVICE",
  })
  const [msg, setMsg] = useState("")
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetch('/api/users?role=CLIENT').then(r => r.ok ? r.json() : []).then(setClients)
    fetch('/api/properties').then(r => r.ok ? r.json() : []).then(setProperties)
  }, [])

  const propsForClient = form.clientId ? properties.filter(p => p.ownerId === form.clientId) : []

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg("")
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: form.clientId,
          propertyId: form.propertyId || null,
          description: form.description,
          amount: Number(form.amount),
          dueDate: form.dueDate || null,
          invoiceType: form.invoiceType,
        }),
      })
      if (res.ok) {
        setMsg("Fatura criada com sucesso ✓")
        setForm({ clientId: "", propertyId: "", description: "", amount: "", dueDate: "", invoiceType: "SERVICE" })
        onCreated?.()
      } else {
        const d = await res.json()
        setMsg(d.error || "Erro ao criar")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border bg-white p-6 space-y-5 shadow-sm">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-navy-900" />
        <span className="font-bold text-navy-900">Nova Fatura Manual</span>
      </div>

      {/* Type selector */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-2">Tipo de serviço</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {INVOICE_TYPES.map(t => {
            const Icon = t.icon
            const selected = form.invoiceType === t.value
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => setForm(f => ({ ...f, invoiceType: t.value }))}
                className={`flex items-center gap-2 rounded-lg border p-2.5 text-left transition-colors
                  ${selected ? 'border-navy-900 bg-navy-50 text-navy-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${selected ? 'text-navy-900' : 'text-gray-400'}`} />
                <div>
                  <div className={`text-xs font-semibold ${selected ? 'text-navy-900' : 'text-gray-700'}`}>{t.label}</div>
                  <div className="text-[10px] text-gray-400">{t.desc}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Cliente *</label>
          <select
            required
            value={form.clientId}
            onChange={e => setForm(f => ({ ...f, clientId: e.target.value, propertyId: "" }))}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
          >
            <option value="">Selecionar cliente…</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name || c.email}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Propriedade</label>
          <select
            value={form.propertyId}
            onChange={e => setForm(f => ({ ...f, propertyId: e.target.value }))}
            disabled={!form.clientId}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 disabled:bg-gray-50 disabled:text-gray-400"
          >
            <option value="">Nenhuma / geral</option>
            {propsForClient.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-gray-700 mb-1">Descrição *</label>
          <input
            required
            placeholder="Ex: Limpeza pós-checkout — 3 abril 2026"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Valor (EUR) *</label>
          <input
            required
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">Data de vencimento</label>
          <input
            type="date"
            value={form.dueDate}
            onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
          />
        </div>
      </div>

      {msg && (
        <div className={`rounded-lg px-3 py-2 text-sm ${msg.includes('✓') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-navy-900 text-white px-5 py-2.5 text-sm font-semibold hover:bg-navy-800 disabled:opacity-50"
        >
          {busy ? 'A criar…' : 'Emitir Fatura'}
        </button>
      </div>
    </form>
  )
}
