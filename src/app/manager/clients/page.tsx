"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Users } from "lucide-react"

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
  if (loading) return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold text-navy-900">My Clients</h1>
      <div className="space-y-4 animate-pulse">
        <div className="h-8 rounded bg-gray-100 w-48" />
        <div className="h-40 rounded-xl bg-gray-100" />
        <div className="h-40 rounded-xl bg-gray-100" />
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold text-navy-900">My Clients</h1>
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-[600px] w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Phone</th><th className="px-4 py-3">ID</th></tr>
          </thead>
          <tbody>
            {error && <tr><td colSpan={4} className="text-center py-8"><p className="text-sm text-red-500">Failed to load data</p></td></tr>}
            {!loading && !error && clients.length === 0 && (
              <tr><td colSpan={4}>
                <div className="p-10 text-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">No clients yet</h3>
                  <p className="text-sm text-gray-500 mb-4">Invite your first client to start managing their property.</p>
                  <Link href="/manager/clients/invite" className="inline-flex items-center gap-2 rounded-lg bg-navy-900 text-white px-4 py-2 text-sm font-semibold hover:bg-navy-800">
                    + Invite your first client
                  </Link>
                </div>
              </td></tr>
            )}
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
    </div>
  )
}
