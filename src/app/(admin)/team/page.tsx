"use client"

import { useEffect, useState } from "react"
import { UserPlus, Trash2, Save, Loader2, Mail, X } from "lucide-react"
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
  const [showInviteModal, setShowInviteModal] = useState(false)

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
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-hm-black">Team & Users</h1>
          <p className="text-sm text-gray-600">Create, edit role/plan/manager, or delete any user.</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#B08A3E] text-[#0B1E3A] px-4 py-2 text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <Mail className="h-4 w-4" />
          Send invite
        </button>
      </div>

      <form onSubmit={submit} className="rounded-hm border bg-white p-6 space-y-3">
        <div className="font-semibold text-hm-black flex items-center gap-2">
          <UserPlus className="h-4 w-4" /> Create user
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" />
          <input type="email" required placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" />
          <input type="password" required minLength={6} placeholder="Password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" />
          <input placeholder="Phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" />
          <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold">
            <option value="MANAGER">Manager (Customer Success)</option>
            <option value="CREW">Crew (operations)</option>
            <option value="CLIENT">Client (property owner)</option>
            <option value="ADMIN">Admin</option>
          </select>
          {form.role === 'CLIENT' && (
            <select value={form.managerId} onChange={e => setForm({ ...form, managerId: e.target.value })} className="rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold">
              <option value="">Assign manager…</option>
              {managers.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
            </select>
          )}
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={creating} className="inline-flex items-center gap-2 rounded-md bg-hm-black text-white px-4 py-2 text-sm hover:bg-hm-black/90 disabled:opacity-50 disabled:cursor-not-allowed">
          {creating ? (<><Loader2 className="h-4 w-4 animate-spin" /> Creating…</>) : (<><UserPlus className="h-4 w-4" /> Create user</>)}
        </button>
      </form>

      {loading ? (
        <p className="text-gray-500">Loading…</p>
      ) : (
        (['ADMIN', 'MANAGER', 'CREW', 'CLIENT'] as const).map(role => (
          <div key={role} className="rounded-hm border bg-white overflow-hidden">
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
                          <button onClick={() => save(u.id)} className="inline-flex items-center gap-1 rounded-md bg-hm-black text-white px-2 py-1 text-xs hover:bg-hm-black/90">
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

      {showInviteModal && (
        <InviteModal
          managers={managers}
          onClose={() => setShowInviteModal(false)}
          onSuccess={() => { setShowInviteModal(false); load() }}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Invite modal — direct invite (bypasses recruit landing)
// ─────────────────────────────────────────────────────────────────

type ManagerOption = { id: string; name: string | null; email: string }

function InviteModal({
  managers, onClose, onSuccess,
}: {
  managers: ManagerOption[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [role, setRole] = useState<"MANAGER" | "CREW" | "CLIENT">("MANAGER")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  // Manager
  const [subShare, setSubShare] = useState("15")
  const [commShare, setCommShare] = useState("3")
  // Crew
  const [crewContractType, setCrewContractType] = useState<"MONTHLY" | "FREELANCER">("FREELANCER")
  const [crewMonthlyRate, setCrewMonthlyRate] = useState("")
  const [crewTaskRate, setCrewTaskRate] = useState("")
  // Client
  const [subscriptionPlan, setSubscriptionPlan] = useState<"STARTER" | "BASIC" | "MID" | "PREMIUM">("STARTER")
  const [managerId, setManagerId] = useState("")
  // Contract
  const [contractTitle, setContractTitle] = useState("")
  const [contractTerms, setContractTerms] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const fillContractDefault = (r: typeof role) => {
    if (r === "MANAGER") {
      setContractTitle(`Manager Agreement — ${name || email || "New Manager"}`)
      setContractTerms(MANAGER_CONTRACT)
    } else if (r === "CREW") {
      setContractTitle(`Crew Agreement — ${name || email || "New Crew"}`)
      setContractTerms(CREW_CONTRACT)
    } else {
      setContractTitle(`Client Service Agreement — ${name || email || "New Client"}`)
      setContractTerms(CLIENT_CONTRACT)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email.trim()) { setError("Email is required"); return }
    setSubmitting(true)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body: any = {
      email: email.trim().toLowerCase(),
      name: name.trim() || null,
      role,
      contractTitle: contractTitle || undefined,
      contractTerms: contractTerms || undefined,
    }

    if (role === "MANAGER") {
      body.managerSubscriptionShare = parseFloat(subShare) / 100
      body.managerCommissionShare = parseFloat(commShare) / 100
    } else if (role === "CREW") {
      body.crewContractType = crewContractType
      if (crewContractType === "MONTHLY" && crewMonthlyRate) body.crewMonthlyRate = parseFloat(crewMonthlyRate)
      if (crewContractType === "FREELANCER" && crewTaskRate) body.crewTaskRate = parseFloat(crewTaskRate)
    } else {
      body.subscriptionPlan = subscriptionPlan
      if (managerId) body.managerId = managerId
    }

    const res = await fetch("/api/invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const data = await res.json().catch(() => ({}))
    setSubmitting(false)

    if (res.ok || res.status === 201) {
      showToast(`Invite sent to ${email}`, "success")
      onSuccess()
    } else {
      setError(data.error ?? "Failed to send invite")
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-hm-black">Send invite</h3>
            <p className="text-xs text-gray-500">Creates a user without password and emails a signup link.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Role picker */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Role</p>
            <div className="grid grid-cols-3 gap-2">
              {(["MANAGER", "CREW", "CLIENT"] as const).map(r => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { setRole(r); fillContractDefault(r) }}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${role === r ? "border-navy-700 bg-navy-50 text-hm-black" : "border-gray-200 hover:bg-gray-50 text-gray-600"}`}
                >
                  {r.charAt(0) + r.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Basic info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              placeholder="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              type="email"
              placeholder="Email *"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              placeholder="Phone (optional)"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="rounded-lg border px-3 py-2 text-sm sm:col-span-2"
            />
          </div>

          {/* Manager compensation */}
          {role === "MANAGER" && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Compensation</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">% of subscription</label>
                  <div className="relative">
                    <input type="number" step="0.5" min="0" max="100" value={subShare} onChange={e => setSubShare(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-hm-gold" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">% of gross rental</label>
                  <div className="relative">
                    <input type="number" step="0.5" min="0" max="100" value={commShare} onChange={e => setCommShare(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-hm-gold" />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Crew contract */}
          {role === "CREW" && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Contract type</p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button type="button" onClick={() => setCrewContractType("MONTHLY")} className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${crewContractType === "MONTHLY" ? "border-navy-700 bg-navy-50 text-hm-black" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  Monthly
                </button>
                <button type="button" onClick={() => setCrewContractType("FREELANCER")} className={`rounded-lg border px-3 py-2.5 text-sm font-semibold transition-colors ${crewContractType === "FREELANCER" ? "border-navy-700 bg-navy-50 text-hm-black" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                  Per task
                </button>
              </div>
              {crewContractType === "MONTHLY" ? (
                <input type="number" step="1" min="0" placeholder="Monthly rate (€)" value={crewMonthlyRate} onChange={e => setCrewMonthlyRate(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" />
              ) : (
                <input type="number" step="1" min="0" placeholder="Per-task rate (€)" value={crewTaskRate} onChange={e => setCrewTaskRate(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" />
              )}
            </div>
          )}

          {/* Client plan */}
          {role === "CLIENT" && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Plan & Manager</p>
              <div className="grid grid-cols-2 gap-3">
                <select value={subscriptionPlan} onChange={e => setSubscriptionPlan(e.target.value as typeof subscriptionPlan)} className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold">
                  <option value="STARTER">Starter (€0)</option>
                  <option value="BASIC">Basic (€89)</option>
                  <option value="MID">Mid (€159)</option>
                  <option value="PREMIUM">Premium (€269)</option>
                </select>
                <select value={managerId} onChange={e => setManagerId(e.target.value)} className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold">
                  <option value="">— No manager —</option>
                  {managers.map(m => <option key={m.id} value={m.id}>{m.name || m.email}</option>)}
                </select>
              </div>
            </div>
          )}

          {/* Contract */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Contract</p>
            <input
              value={contractTitle}
              onChange={e => setContractTitle(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm mb-2"
              placeholder="Contract title"
            />
            <textarea
              value={contractTerms}
              onChange={e => setContractTerms(e.target.value)}
              rows={6}
              className="w-full rounded-lg border px-3 py-2 text-sm font-mono"
              placeholder="Paste or write contract terms…"
            />
            <div className="flex justify-between mt-1">
              <button type="button" onClick={() => fillContractDefault(role)} className="text-xs text-navy-700 hover:underline">
                Load default {role.toLowerCase()} contract
              </button>
              <p className="text-[10px] text-gray-400">Optional. Recipient will sign on signup.</p>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 rounded-lg px-3 py-2 bg-red-50">{error}</p>}
        </form>

        <div className="px-6 py-4 border-t flex items-center justify-end gap-2 bg-gray-50">
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-lg border bg-white px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={submit} disabled={submitting || !email.trim()} className="inline-flex items-center gap-1.5 rounded-lg bg-[#B08A3E] text-[#0B1E3A] px-5 py-2 text-sm font-bold hover:opacity-90 disabled:opacity-50">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : <><Mail className="h-4 w-4" /> Send invite</>}
          </button>
        </div>
      </div>
    </div>
  )
}

const MANAGER_CONTRACT = `# HostMasters Manager Agreement

## 1. Role
The Manager acts as a sales and customer success representative for HostMasters in an assigned geographic territory on the Costa Tropical, Spain.

## 2. Compensation
- 15% of monthly subscription fees from active clients in your portfolio
- 3% of gross rental revenue collected for your clients
- Portfolio bonuses: +€150 at 10 properties, +€400 at 20, +€750 at 30
- Acquisition bonus per newly signed client (one-time, paid after month 2)

## 3. Term
Minimum 6-month commitment. Exclusive geographic territory.
Revenue is paid only on amounts effectively collected from clients.

## 4. Responsibilities
- Attract and close new property owners in the assigned territory
- Provide first-line customer success to portfolio clients
- Operate under HostMasters branding and standards

## 5. Restrictions
- No direct contact with HostMasters Crew for external work
- No offers outside defined plan structure
- 12-month non-compete clause post-contract

By signing, you agree to these terms.`

const CREW_CONTRACT = `# HostMasters Crew Agreement

## 1. Role
The Crew member executes field operations (cleaning, check-in/out, maintenance, inspections) assigned via the HostMasters platform.

## 2. Compensation
As specified in the platform profile. Payment within 24 hours of task completion (subject to photo and checklist submission).

## 3. Standards
- Follow all checklists in the platform
- Submit required photos for each task
- Report any property issues via checkout report

## 4. Term
Open-ended. Either party may terminate with 14 days notice.

By signing, you agree to these terms.`

const CLIENT_CONTRACT = `# HostMasters Service Agreement

## 1. Service
HostMasters manages your short-term rental property including marketing, guest communications, operations, and financial reporting.

## 2. Fees
As specified in your subscription plan. Commission is calculated per the plan terms.

## 3. Term
Month-to-month. Either party may terminate with 30 days notice.

By signing, you agree to these terms.`
