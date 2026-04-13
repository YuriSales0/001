"use client"
import { useEffect, useState } from "react"

type Client = { id: string; name: string | null; email: string; phone: string | null }

export default function ManagerClients() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  useEffect(() => {
    fetch('/api/users?role=CLIENT')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setClients)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold text-navy-900">My Clients</h1>
      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">ID</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={4} className="text-center py-8 text-gray-400">Loading…</td></tr>}
            {error && <tr><td colSpan={4} className="text-center py-8"><p className="text-sm text-red-500">Failed to load data</p></td></tr>}
            {!loading && !error && clients.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-500">No clients assigned</td></tr>}
            {clients.map(c => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3">{c.name || '—'}</td>
                <td className="px-4 py-3">{c.email}</td>
                <td className="px-4 py-3">{c.phone || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{c.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
