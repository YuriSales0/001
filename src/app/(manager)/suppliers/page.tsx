"use client"

import { useEffect, useState } from "react"
import { Plus, Phone, Mail, Building2, Search, X, Trash2 } from "lucide-react"

type SupplierType = "CLEANER" | "PLUMBER" | "ELECTRICIAN" | "GENERAL"

interface Supplier {
  id: string
  name: string
  type: SupplierType
  phone: string
  email: string | null
  notes: string | null
  properties: { property: { id: string; name: string; city: string } }[]
}

const TYPE_LABELS: Record<SupplierType, string> = {
  CLEANER:     "Cleaner",
  PLUMBER:     "Plumber",
  ELECTRICIAN: "Electrician",
  GENERAL:     "General",
}

const TYPE_COLOR: Record<SupplierType, string> = {
  CLEANER:     "bg-sky-100 text-sky-800",
  PLUMBER:     "bg-blue-100 text-blue-800",
  ELECTRICIAN: "bg-amber-100 text-amber-800",
  GENERAL:     "bg-gray-100 text-gray-700",
}

const TYPES: SupplierType[] = ["CLEANER", "PLUMBER", "ELECTRICIAN", "GENERAL"]

export default function SuppliersPage() {
  const [suppliers, setSuppliers]   = useState<Supplier[]>([])
  const [loading, setLoading]       = useState(true)
  const [filterType, setFilterType] = useState("all")
  const [search, setSearch]         = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [form, setForm]             = useState({ name: "", type: "CLEANER" as SupplierType, phone: "", email: "", notes: "" })
  const [formError, setFormError]   = useState("")
  const [saving, setSaving]         = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch("/api/suppliers")
    if (res.ok) setSuppliers(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = suppliers.filter(s => {
    if (filterType !== "all" && s.type !== filterType) return false
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")
    if (!form.name || !form.phone) {
      setFormError("Name and phone are required.")
      return
    }
    setSaving(true)
    const res = await fetch("/api/suppliers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:  form.name,
        type:  form.type,
        phone: form.phone,
        email: form.email || null,
        notes: form.notes || null,
      }),
    })
    setSaving(false)
    if (!res.ok) {
      const err = await res.json()
      setFormError(err.error ?? "Failed to create supplier.")
      return
    }
    setShowCreate(false)
    setForm({ name: "", type: "CLEANER", phone: "", email: "", notes: "" })
    load()
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    await fetch(`/api/suppliers/${id}`, { method: "DELETE" })
    setDeleting(null)
    load()
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Suppliers</h1>
          <p className="text-sm text-gray-500">Manage your vendor and supplier directory.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-navy-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-navy-800"
        >
          <Plus className="h-4 w-4" /> Add supplier
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search suppliers…"
            className="w-full rounded-lg border bg-white pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
          />
        </div>
        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value)}
          className="rounded-lg border bg-white px-3 py-2 text-sm"
        >
          <option value="all">All types</option>
          {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
        </select>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {/* List */}
      {!loading && (
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400 rounded-xl border bg-white">
              {suppliers.length === 0 ? "No suppliers yet. Add the first one." : "No suppliers match your search."}
            </div>
          )}
          {filtered.map(s => (
            <div key={s.id} className="rounded-xl border bg-white p-4 hover:shadow-sm transition-shadow">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                    <Building2 className="h-4 w-4 text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-navy-900">{s.name}</span>
                      <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${TYPE_COLOR[s.type]}`}>
                        {TYPE_LABELS[s.type]}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</span>
                      {s.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{s.email}</span>}
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {s.properties.length} propert{s.properties.length === 1 ? "y" : "ies"}
                      </span>
                    </div>
                    {s.notes && <p className="text-xs text-gray-400 mt-0.5 italic">{s.notes}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a href={`tel:${s.phone}`}
                    className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50">
                    <Phone className="h-3 w-3" /> Call
                  </a>
                  {s.email && (
                    <a href={`mailto:${s.email}`}
                      className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50">
                      <Mail className="h-3 w-3" /> Email
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(s.id, s.name)}
                    disabled={deleting === s.id}
                    className="rounded-lg border px-2.5 py-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-base font-bold text-navy-900">New supplier</h2>
                <p className="text-xs text-gray-500 mt-0.5">Add a vendor to your directory.</p>
              </div>
              <button onClick={() => setShowCreate(false)} className="rounded-md p-1 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitCreate} className="p-5 space-y-4">
              {formError && (
                <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{formError}</div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Name *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                  placeholder="Company or individual name" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as SupplierType }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900">
                  {TYPES.map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone *</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                    placeholder="+34 6xx xxx xxx" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                    placeholder="email@example.com" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Notes</label>
                <input type="text" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
                  placeholder="Any relevant notes" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="rounded-lg bg-navy-900 text-white px-4 py-2 text-sm font-semibold hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed">
                  {saving ? "Saving…" : "Add supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
