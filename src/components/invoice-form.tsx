"use client"

import { useEffect, useState } from "react"

type ClientOpt = { id: string; name: string | null; email: string }
type PropertyOpt = { id: string; name: string; ownerId: string }

export function InvoiceForm({ onCreated }: { onCreated?: () => void }) {
  const [clients, setClients] = useState<ClientOpt[]>([])
  const [properties, setProperties] = useState<PropertyOpt[]>([])
  const [form, setForm] = useState({ clientId: "", propertyId: "", description: "", amount: "", dueDate: "" })
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
          ...form,
          amount: Number(form.amount),
          dueDate: form.dueDate || null,
          propertyId: form.propertyId || null,
        }),
      })
      if (res.ok) {
        setMsg("Invoice created ✓")
        setForm({ clientId: "", propertyId: "", description: "", amount: "", dueDate: "" })
        onCreated?.()
      } else {
        const d = await res.json()
        setMsg(d.error || "Failed")
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-xl border bg-white p-6 space-y-3">
      <div className="font-semibold text-navy-900">New invoice (corrective maintenance / pre-agreed service)</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <select required value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value, propertyId: "" })} className="rounded-md border px-3 py-2 text-sm">
          <option value="">Select client…</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name || c.email}</option>)}
        </select>
        <select value={form.propertyId} onChange={e => setForm({ ...form, propertyId: e.target.value })} disabled={!form.clientId} className="rounded-md border px-3 py-2 text-sm disabled:bg-gray-50">
          <option value="">Property (optional)</option>
          {propsForClient.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input required placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-md border px-3 py-2 text-sm md:col-span-2" />
        <input required type="number" step="0.01" placeholder="Amount (EUR)" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
        <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
      </div>
      {msg && <p className="text-sm text-navy-900">{msg}</p>}
      <button type="submit" disabled={busy} className="rounded-md bg-navy-900 text-white px-4 py-2 text-sm hover:bg-navy-800 disabled:opacity-50">
        {busy ? 'Sending…' : 'Send invoice'}
      </button>
    </form>
  )
}
