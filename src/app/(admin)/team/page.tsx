"use client"

import { useEffect, useState } from "react"
import { UserPlus } from "lucide-react"

type User = {
  id: string
  name: string | null
  email: string
  role: 'ADMIN' | 'MANAGER' | 'CREW' | 'CLIENT'
  phone: string | null
  manager: { id: string; name: string | null; email: string } | null
}

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", role: "MANAGER", managerId: "" })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/users')
    if (res.ok) setUsers(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError("")
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed')
        return
      }
      setForm({ name: "", email: "", password: "", phone: "", role: "MANAGER", managerId: "" })
      load()
    } finally {
      setCreating(false)
    }
  }

  const managers = users.filter(u => u.role === 'MANAGER')
  const grouped = {
    ADMIN: users.filter(u => u.role === 'ADMIN'),
    MANAGER: users.filter(u => u.role === 'MANAGER'),
    CREW: users.filter(u => u.role === 'CREW'),
    CLIENT: users.filter(u => u.role === 'CLIENT'),
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-navy-900">Team & Users</h1>
        <p className="text-sm text-gray-600">Create staff accounts and assign clients to managers.</p>
      </div>

      <form onSubmit={submit} className="rounded-xl border bg-white p-6 space-y-3">
        <div className="font-semibold text-navy-900 flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> Create user
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <input type="email" required placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <input type="password" required minLength={6} placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="rounded-md border px-3 py-2 text-sm" />
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="rounded-md border px-3 py-2 text-sm">
            <option value="MANAGER">Manager (Customer Success)</option>
            <option value="CREW">Crew (operations)</option>
            <option value="CLIENT">Client (property owner)</option>
            <option value="ADMIN">Admin</option>
          </select>
          {form.role === 'CLIENT' && (
            <select value={form.managerId} onChange={e => setForm({ ...form, managerId: e.target.value })} className="rounded-md border px-3 py-2 text-sm">
              <option value="">Assign manager…</option>
              {managers.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
            </select>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={creating} className="rounded-md bg-navy-900 text-white px-4 py-2 text-sm hover:bg-navy-800 disabled:opacity-50">
          {creating ? 'Creating…' : 'Create user'}
        </button>
      </form>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        (['ADMIN', 'MANAGER', 'CREW', 'CLIENT'] as const).map(role => (
          <div key={role} className="rounded-xl border bg-white overflow-hidden">
            <div className="px-4 py-2 bg-gray-50 text-xs uppercase font-semibold text-gray-600">
              {role} ({grouped[role].length})
            </div>
            <table className="w-full text-sm">
              <tbody>
                {grouped[role].map(u => (
                  <tr key={u.id} className="border-t">
                    <td className="px-4 py-2">{u.name || '—'}</td>
                    <td className="px-4 py-2 text-gray-500">{u.email}</td>
                    <td className="px-4 py-2 text-gray-500">{u.phone || ''}</td>
                    <td className="px-4 py-2 text-gray-500">{u.manager ? `Manager: ${u.manager.name || u.manager.email}` : ''}</td>
                  </tr>
                ))}
                {grouped[role].length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-3 text-center text-gray-400">none</td></tr>
                )}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  )
}
