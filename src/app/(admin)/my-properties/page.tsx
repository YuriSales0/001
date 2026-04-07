"use client"

import { useEffect, useState } from "react"
import { Building2, MapPin, RefreshCw, Link2, Check } from "lucide-react"

type Property = {
  id: string
  name: string
  address: string
  city: string
  status: string
  airbnbIcalUrl: string | null
  bookingIcalUrl: string | null
  airbnbConnected: boolean
  bookingConnected: boolean
}

type SyncResult = {
  ok: boolean
  summary: Record<string, { events: number; created: number; error?: string }>
  syncedAt: string
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [drafts, setDrafts] = useState<Record<string, { airbnb: string; booking: string }>>({})
  const [saving, setSaving] = useState<string | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<Record<string, SyncResult>>({})

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/properties')
      if (res.ok) {
        const data = (await res.json()) as Property[]
        setProperties(data)
        setDrafts(
          Object.fromEntries(
            data.map(p => [
              p.id,
              { airbnb: p.airbnbIcalUrl || '', booking: p.bookingIcalUrl || '' },
            ]),
          ),
        )
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const saveUrls = async (id: string) => {
    setSaving(id)
    try {
      const draft = drafts[id]
      await fetch(`/api/properties/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          airbnbIcalUrl: draft.airbnb || null,
          bookingIcalUrl: draft.booking || null,
        }),
      })
      await load()
    } finally {
      setSaving(null)
    }
  }

  const sync = async (id: string) => {
    setSyncing(id)
    try {
      const res = await fetch(`/api/properties/${id}/sync`, { method: 'POST' })
      if (res.ok) {
        const data = (await res.json()) as SyncResult
        setLastSync(s => ({ ...s, [id]: data }))
      }
    } finally {
      setSyncing(null)
    }
  }

  if (loading) return <div className="p-6 text-gray-500">Loading properties…</div>

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Building2 className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-navy-900">No Properties Yet</h2>
        <p className="text-gray-500 mt-2 max-w-md">
          Once a property is added, you can connect its Airbnb and Booking.com calendars here.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-navy-900">Properties</h1>
        <p className="text-sm text-gray-600">Connect Airbnb and Booking.com calendars to keep availability in sync.</p>
      </div>

      <div className="space-y-6">
        {properties.map(p => {
          const draft = drafts[p.id] || { airbnb: '', booking: '' }
          const result = lastSync[p.id]
          return (
            <div key={p.id} className="rounded-xl border bg-white overflow-hidden">
              <div className="p-6 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-navy-900">{p.name}</h3>
                    <p className="text-gray-500 flex items-center gap-1 mt-1 text-sm">
                      <MapPin className="h-4 w-4" /> {p.address}, {p.city}
                    </p>
                  </div>
                  <span className="rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs">
                    {p.status}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="text-sm font-semibold text-navy-900 flex items-center gap-2">
                  <Link2 className="h-4 w-4" /> Calendar integrations
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs uppercase text-gray-500 mb-1">
                      Airbnb iCal URL
                      {p.airbnbConnected && <Check className="inline h-3 w-3 text-green-600 ml-1" />}
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.airbnb.com/calendar/ical/..."
                      value={draft.airbnb}
                      onChange={e => setDrafts(s => ({ ...s, [p.id]: { ...draft, airbnb: e.target.value } }))}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      In Airbnb: Listing → Availability → Sync calendars → Export Calendar
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-gray-500 mb-1">
                      Booking.com iCal URL
                      {p.bookingConnected && <Check className="inline h-3 w-3 text-green-600 ml-1" />}
                    </label>
                    <input
                      type="url"
                      placeholder="https://admin.booking.com/hotel/.../ical?..."
                      value={draft.booking}
                      onChange={e => setDrafts(s => ({ ...s, [p.id]: { ...draft, booking: e.target.value } }))}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      In Booking.com Extranet: Rates & Availability → Sync calendars → Export
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => saveUrls(p.id)}
                    disabled={saving === p.id}
                    className="rounded-md bg-navy-900 text-white px-4 py-2 text-sm hover:bg-navy-800 disabled:opacity-50"
                  >
                    {saving === p.id ? 'Saving…' : 'Save URLs'}
                  </button>
                  <button
                    onClick={() => sync(p.id)}
                    disabled={syncing === p.id || (!p.airbnbIcalUrl && !p.bookingIcalUrl)}
                    className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    <RefreshCw className={`h-4 w-4 ${syncing === p.id ? 'animate-spin' : ''}`} />
                    Sync now
                  </button>
                </div>

                {result && (
                  <div className="text-xs rounded-md bg-gray-50 p-3 mt-2">
                    <div className="font-semibold mb-1">Last sync — {new Date(result.syncedAt).toLocaleString()}</div>
                    {Object.entries(result.summary).map(([source, info]) => (
                      <div key={source}>
                        <span className="capitalize">{source}</span>: {info.error
                          ? <span className="text-red-600">error — {info.error}</span>
                          : <span>{info.events} events found, {info.created} new blocks</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
