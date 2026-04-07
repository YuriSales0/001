"use client"
import { useEffect, useState } from "react"
import { Building2, MapPin } from "lucide-react"

type Property = {
  id: string
  name: string
  address: string
  city: string
  status: string
  airbnbConnected: boolean
  bookingConnected: boolean
}

export default function ClientProperties() {
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/properties').then(r => r.ok ? r.json() : []).then(d => { setProperties(d); setLoading(false) })
  }, [])

  if (loading) return <div className="p-6 text-gray-500">Loading…</div>

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold text-navy-900">My Properties</h1>
      {properties.length === 0 && (
        <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
          <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          No properties yet. Contact your manager to onboard your first property.
        </div>
      )}
      {properties.map(p => (
        <div key={p.id} className="rounded-xl border bg-white p-6">
          <h3 className="text-xl font-bold text-navy-900">{p.name}</h3>
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4" /> {p.address}, {p.city}
          </p>
          <div className="text-xs text-gray-500 mt-3">
            Airbnb: {p.airbnbConnected ? '✅ connected' : '— not connected'} ·
            Booking: {p.bookingConnected ? '✅ connected' : '— not connected'}
          </div>
        </div>
      ))}
    </div>
  )
}
