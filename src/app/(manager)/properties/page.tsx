"use client"

import { useEffect, useState } from "react"
import { Plus, X, Building2, MapPin, User, Bed, Bath, TrendingUp } from "lucide-react"

type PropertyStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE" | "PENDING"

interface Property {
  id: string
  name: string
  address: string
  city: string
  country: string | null
  bedrooms: number | null
  bathrooms: number | null
  status: PropertyStatus
  owner: { id: string; name: string | null; email: string }
}

const STATUS_COLOR: Record<PropertyStatus, string> = {
  ACTIVE:      "bg-emerald-100 text-emerald-800",
  INACTIVE:    "bg-gray-100 text-gray-700",
  MAINTENANCE: "bg-amber-100 text-amber-800",
  PENDING:     "bg-blue-100 text-blue-800",
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("all")
  const [search, setSearch] = useState("")

  const [showCreate, setShowCreate] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch("/api/properties")
    if (res.ok) setProperties(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const filtered = properties.filter(p => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) &&
        !p.city.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const counts = {
    ACTIVE:      properties.filter(p => p.status === "ACTIVE").length,
    INACTIVE:    properties.filter(p => p.status === "INACTIVE").length,
    MAINTENANCE: properties.filter(p => p.status === "MAINTENANCE").length,
    PENDING:     properties.filter(p => p.status === "PENDING").length,
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-hm-black">Properties</h1>
          <p className="text-sm text-gray-500">Manage and monitor all rental properties.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-hm-black text-white px-4 py-2.5 text-sm font-semibold hover:bg-hm-black/90"
        >
          <Plus className="h-4 w-4" /> Add property
        </button>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(["ACTIVE", "INACTIVE", "MAINTENANCE", "PENDING"] as PropertyStatus[]).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(filterStatus === s ? "all" : s)}
            className={`rounded-hm border p-4 text-left transition-all hover:shadow-sm ${
              filterStatus === s ? "ring-2 ring-navy-900" : "bg-white"
            }`}
          >
            <p className={`text-[10px] font-bold rounded px-1.5 py-0.5 inline-block mb-2 ${STATUS_COLOR[s]}`}>{s}</p>
            <p className="text-2xl font-bold text-hm-black">{counts[s]}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or city…"
          className="rounded-lg border bg-white px-3 py-2 text-sm flex-1 min-w-[180px] max-w-xs focus:outline-none focus:ring-2 focus:ring-hm-gold"
        />
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="rounded-lg border bg-white px-3 py-2 text-sm"
        >
          <option value="all">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="PENDING">Pending</option>
        </select>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading && <div className="space-y-4 animate-pulse py-4"><div className="h-8 rounded-hm bg-hm-sand w-48" /><div className="h-40 rounded-hm bg-hm-sand" /></div>}
        {!loading && filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400 rounded-hm border bg-white">
            No properties match your filters.
          </div>
        )}
        {filtered.map(p => (
          <div key={p.id} className="rounded-hm border bg-white p-4 hover:shadow-sm transition-shadow">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                  <Building2 className="h-4 w-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-hm-black">{p.name}</span>
                    <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${STATUS_COLOR[p.status]}`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {p.city}{p.country ? `, ${p.country}` : ""}
                    </span>
                    {p.bedrooms != null && (
                      <span className="flex items-center gap-1">
                        <Bed className="h-3 w-3" /> {p.bedrooms}BD
                      </span>
                    )}
                    {p.bathrooms != null && (
                      <span className="flex items-center gap-1">
                        <Bath className="h-3 w-3" /> {p.bathrooms}BA
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" /> {p.owner.name ?? p.owner.email}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/properties/${p.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-gray-50"
                >
                  <TrendingUp className="h-3 w-3" /> View
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add property — redirect to onboarding */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowCreate(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6 text-center" onClick={e => e.stopPropagation()}>
            <Building2 className="mx-auto h-10 w-10 text-gray-400 mb-3" />
            <h2 className="text-base font-bold text-hm-black mb-1">Add a property</h2>
            <p className="text-sm text-gray-500 mb-5">
              Use the full onboarding flow to register a new property with all details and OTA configuration.
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setShowCreate(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">
                Cancel
              </button>
              <a href="/onboarding" className="rounded-lg bg-hm-black text-white px-4 py-2 text-sm font-semibold hover:bg-hm-black/90">
                Go to onboarding
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
