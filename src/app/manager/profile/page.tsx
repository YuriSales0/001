"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, Save, Lock, Users, Percent, TrendingUp } from "lucide-react"

interface Profile {
  id: string; name: string | null; email: string; phone: string | null
  image: string | null; bio: string | null; commissionRate: number | null; role: string
}

export default function ManagerProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ name: "", phone: "", bio: "", image: "", commissionRate: "" })
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" })
  const [pwError, setPwError] = useState("")
  const [pwSaved, setPwSaved] = useState(false)

  useEffect(() => {
    fetch("/api/profile").then(r => { if (!r.ok) throw new Error(); return r.json() }).then(d => {
      setProfile(d)
      setForm({ name: d.name ?? "", phone: d.phone ?? "", bio: d.bio ?? "", image: d.image ?? "", commissionRate: d.commissionRate?.toString() ?? "" })
      setLoading(false)
    }).catch(() => { setError("Failed to load profile"); setLoading(false) })
  }, [])

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setForm(f => ({ ...f, image: ev.target?.result as string }))
    reader.readAsDataURL(file)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setError(""); setSaved(false)
    const res = await fetch("/api/profile", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, commissionRate: form.commissionRate ? parseFloat(form.commissionRate) : undefined }),
    })
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000) }
    else { const d = await res.json(); setError(d.error ?? "Failed to save") }
    setSaving(false)
  }

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(""); setPwSaved(false)
    if (pw.next !== pw.confirm) { setPwError("Passwords do not match"); return }
    if (pw.next.length < 8) { setPwError("Password must be at least 8 characters"); return }
    const res = await fetch("/api/profile", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
    })
    if (res.ok) { setPwSaved(true); setPw({ current: "", next: "", confirm: "" }); setTimeout(() => setPwSaved(false), 3000) }
    else { const d = await res.json(); setPwError(d.error ?? "Failed to update password") }
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">Loading…</div>

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-navy-900">My Profile</h1>
        <p className="text-sm text-gray-500">Manager · Closer &amp; Customer Success</p>
      </div>

      {/* Role info card */}
      <div className="rounded-xl border bg-blue-50 border-blue-100 p-4 flex gap-4">
        <Users className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 space-y-1">
          <p className="font-semibold">Manager responsibilities</p>
          <p>You act as <strong>Closer &amp; Customer Success</strong> for HostMasters. You earn a <strong>3% commission</strong> on each subscription and contract you manage, with the goal of increasing client LTV and reducing CAC.</p>
        </div>
      </div>

      {/* Commission snapshot */}
      {profile?.commissionRate != null && (
        <div className="rounded-xl border bg-white p-4 flex items-center gap-4">
          <div className="rounded-lg p-2 bg-emerald-50">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Your commission rate</p>
            <p className="text-2xl font-bold text-navy-900">{profile.commissionRate}%</p>
          </div>
          <div className="ml-auto text-xs text-gray-400">Set by Admin</div>
        </div>
      )}

      {/* Photo + identity */}
      <form onSubmit={save} className="rounded-xl border bg-white p-5 space-y-5">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center"
                 style={{ border: '3px solid #C9A84C' }}>
              {form.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <Users className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 rounded-full p-1.5 text-white shadow"
              style={{ background: '#C9A84C' }}>
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>
          <div>
            <p className="font-semibold text-navy-900">{profile?.name ?? profile?.email}</p>
            <p className="text-xs text-gray-500">{profile?.email}</p>
            <span className="mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-800">MANAGER</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Full name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
              placeholder="+34 600 000 000" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Professional bio <span className="text-gray-400 font-normal">(visible to your clients)</span></label>
            <textarea rows={4} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 resize-none"
              placeholder="Introduce yourself to your property owners. What's your background? How do you help them?" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <Percent className="h-3 w-3" /> Personal commission (%)
              <span className="text-gray-400 font-normal">— read-only</span>
            </label>
            <input type="number" value={form.commissionRate} disabled
              className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed" />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center justify-between pt-1">
          {saved && <span className="text-sm text-green-600 font-medium">Saved successfully</span>}
          <button type="submit" disabled={saving}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-navy-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-navy-800 disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      {/* Password */}
      <form onSubmit={savePassword} className="rounded-xl border bg-white p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-semibold text-navy-900">Change password</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[["Current password", "current"], ["New password", "next"], ["Confirm new", "confirm"]].map(([label, key]) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
              <input type="password" value={pw[key as keyof typeof pw]}
                onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" />
            </div>
          ))}
        </div>
        {pwError && <p className="text-sm text-red-600">{pwError}</p>}
        <div className="flex items-center justify-between">
          {pwSaved && <span className="text-sm text-green-600 font-medium">Password updated</span>}
          <button type="submit"
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white text-gray-700 px-4 py-2.5 text-sm font-medium hover:bg-gray-50">
            Update password
          </button>
        </div>
      </form>
    </div>
  )
}
