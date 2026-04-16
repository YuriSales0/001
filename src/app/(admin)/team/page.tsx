"use client"

import { useEffect, useState } from "react"
import { UserPlus, Trash2, Save, Loader2 } from "lucide-react"
import { ConfirmDialog } from "@/components/hm/confirm-dialog"
import { showToast } from "@/components/hm/toast"

type Role = 'ADMIN' | 'MANAGER' | 'CREW' | 'CLIENT'
type Plan = 'BASIC' | 'MID' | 'PREMIUM' | null

type User = {
  id: string
  name: string | null
  email: string
  role: Role
  phone: string | null
  managerId: string | null
  subscriptionPlan: Plan
  manager: { id: string; name: string | null; email: string } | null
}

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", role: "MANAGER", managerId: "" })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState("")
  const [edits, setEdits] = useState<Record<string, Partial<User>>>({})
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null)

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

  const setEdit = (id: string, patch: Partial<User>) => {
    setEdits(s => ({ ...s, [id]: { ...s[id], ...patch } }))
  }

  const save = async (id: string) => {
    const patch = edits[id]
    if (!patch) return
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    if (res.ok) {
      setEdits(s => {
        const c = { ...s }
        delete c[id]
        return c
      })
      load()
    } else {
      const d = await res.json()
      showToast(d.error || 'Failed', 'error')
    }
  }

  const remove = async (id: string) => {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
    if (res.ok) load()
    else {
      const d = await res.json()
      showToast(d.error || 'Failed', 'error')
    }
  }

  const managers = users.filter(u => u.role === 'MANAGER')
  const grouped: Record<Role, User[]> = {
    ADMIN: users.filter(u => u.role === 'ADMIN'),
    MANAGER: users.filter(u => u.role === 'MANAGER'),
    CREW: users.filter(u => u.role === 'CREW'),
    CLIENT: users.filter(u => u.role === 'CLIENT'),
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-navy-900">Team & Users</h1>
        <p className="text-sm text-gray-600">Create, edit role/plan/manager, or delete any user.</p>
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
        <button type="submit" disabled={creating} className="inline-flex items-center gap-2 rounded-md bg-navy-900 text-white px-4 py-2 text-sm hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed">
          {creating ? (<><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>) : (<><UserPlus className="h-4 w-4" /> Create user</>)}
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
            <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="min-w-[600px] w-full text-sm">
              <thead className="text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-2 text-left font-normal">Name / Email</th>
                  <th className="px-4 py-2 text-left font-normal">Role</th>
                  {role === 'CLIENT' && <th className="px-4 py-2 text-left font-normal">Plan</th>}
                  {role === 'CLIENT' && <th className="px-4 py-2 text-left font-normal">Manager</th>}
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {grouped[role].map(u => {
                  const e = edits[u.id] || {}
                  const dirty = Object.keys(e).length > 0
                  const currentRole = (e.role ?? u.role) as Role
                  const currentPlan = (e.subscriptionPlan ?? u.subscriptionPlan) as Plan
                  const currentManager = (e.managerId ?? u.managerId) ?? ''
                  return (
                    <tr key={u.id} className="border-t">
                      <td className="px-4 py-2">
                        <div>{u.name || '—'}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </td>
                      <td className="px-4 py-2">
                        <select
                          value={currentRole}
                          onChange={ev => setEdit(u.id, { role: ev.target.value as Role })}
                          className="rounded-md border px-2 py-1 text-xs"
                        >
                          <option value="ADMIN">ADMIN</option>
                          <option value="MANAGER">MANAGER</option>
                          <option value="CREW">CREW</option>
                          <option value="CLIENT">CLIENT</option>
                        </select>
                      </td>
                      {role === 'CLIENT' && (
                        <td className="px-4 py-2">
                          <select
                            value={currentPlan || ''}
                            onChange={ev => setEdit(u.id, { subscriptionPlan: (ev.target.value || null) as Plan })}
                            className="rounded-md border px-2 py-1 text-xs"
                          >
                            <option value="">— none —</option>
                            <option value="BASIC">BASIC</option>
                            <option value="MID">MID</option>
                            <option value="PREMIUM">PREMIUM</option>
                          </select>
                        </td>
                      )}
                      {role === 'CLIENT' && (
                        <td className="px-4 py-2">
                          <select
                            value={currentManager}
                            onChange={ev => setEdit(u.id, { managerId: ev.target.value || null })}
                            className="rounded-md border px-2 py-1 text-xs"
                          >
                            <option value="">— unassigned —</option>
                            {managers.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
                          </select>
                        </td>
                      )}
                      <td className="px-4 py-2 text-right space-x-2 whitespace-nowrap">
                        {dirty && (
                          <button onClick={() => save(u.id)} className="inline-flex items-center gap-1 rounded-md bg-navy-900 text-white px-2 py-1 text-xs hover:bg-navy-800">
                            <Save className="h-3 w-3" /> Save
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget({ id: u.id, label: u.name || u.email })}
                          className="inline-flex items-center gap-1 rounded-md border border-red-200 text-red-600 px-2 py-1 text-xs hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" /> Delete
                        </button>
                      </td>
                    </tr>
                  )
                })}
                {grouped[role].length === 0 && (
                  <tr><td colSpan={role === 'CLIENT' ? 5 : 3} className="px-4 py-3 text-center text-gray-400">none</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        ))
      )}

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete user"
        message={deleteTarget ? `Delete ${deleteTarget.label}? This cannot be undone.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) remove(deleteTarget.id)
          setDeleteTarget(null)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
