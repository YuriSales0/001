"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, Save, Lock, Wrench, Percent, TrendingUp, Star, Shield, Zap, AlertTriangle } from "lucide-react"
import { ProfileContractSection } from "@/components/hm/profile-contract-section"

type ScoreData = {
  currentScore: number
  level: string
  totalTasks: number
  totalApproved: number
  totalRejected: number
  history: { delta: number; reason: string; createdAt: string }[]
}

interface Profile {
  id: string; name: string | null; email: string; phone: string | null
  image: string | null; bio: string | null; commissionRate: number | null; role: string
}

export default function CrewProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ name: "", phone: "", bio: "", image: "" })
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" })
  const [pwError, setPwError] = useState("")
  const [pwSaved, setPwSaved] = useState(false)
  const [score, setScore] = useState<ScoreData | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/profile").then(r => { if (!r.ok) throw new Error(); return r.json() }),
      fetch("/api/crew-score").then(r => r.ok ? r.json() : null),
    ]).then(([d, s]) => {
      setProfile(d)
      setForm({ name: d.name ?? "", phone: d.phone ?? "", bio: d.bio ?? "", image: d.image ?? "" })
      setScore(s)
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
      body: JSON.stringify(form),
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
        <p className="text-sm text-gray-500">Crew · Field Operations</p>
      </div>

      {/* Performance Score */}
      {score && <ScoreSection score={score} />}

      {/* Role info */}
      <div className="rounded-xl border bg-emerald-50 border-emerald-100 p-4 flex gap-4">
        <Wrench className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-sm text-emerald-800 space-y-1">
          <p className="font-semibold">Crew responsibilities</p>
          <p>You are the operational backbone of HostMasters — handling <strong>check-ins, check-outs, cleaning, maintenance and inspections</strong>. Your work report after each visit is sent directly to the property owner.</p>
        </div>
      </div>

      {profile?.commissionRate != null && (
        <div className="rounded-xl border bg-white p-4 flex items-center gap-4">
          <div className="rounded-lg p-2 bg-amber-50">
            <Percent className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Your per-task rate</p>
            <p className="text-2xl font-bold text-navy-900">{profile.commissionRate}%</p>
          </div>
          <div className="ml-auto text-xs text-gray-400">Set by Admin</div>
        </div>
      )}

      {/* Contract */}
      <ProfileContractSection />

      {/* Photo + identity */}
      <form onSubmit={save} className="rounded-xl border bg-white p-5 space-y-5">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center"
                 style={{ border: '3px solid #B08A3E' }}>
              {form.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <Wrench className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 rounded-full p-1.5 text-white shadow"
              style={{ background: '#B08A3E' }}>
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>
          <div>
            <p className="font-semibold text-navy-900">{profile?.name ?? profile?.email}</p>
            <p className="text-xs text-gray-500">{profile?.email}</p>
            <span className="mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800">CREW</span>
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
            <label className="block text-xs font-semibold text-gray-700 mb-1">Professional bio <span className="text-gray-400 font-normal">(visible to property owners)</span></label>
            <textarea rows={3} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 resize-none"
              placeholder="Introduce yourself. What's your speciality? Years of experience?" />
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

const LEVEL_META: Record<string, { label: string; icon: typeof Star; color: string; bg: string; min: number; next: number | null; bonus: string }> = {
  SUSPENDED: { label: 'Suspended', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', min: 0, next: 50, bonus: 'No tasks assigned' },
  BASIC:     { label: 'Basic',     icon: Shield,        color: 'text-blue-600', bg: 'bg-blue-50', min: 50, next: 150, bonus: 'Standard tasks' },
  VERIFIED:  { label: 'Verified',  icon: Zap,           color: 'text-amber-600', bg: 'bg-amber-50', min: 150, next: 300, bonus: '+5% rate bonus' },
  EXPERT:    { label: 'Expert',    icon: TrendingUp,    color: 'text-green-600', bg: 'bg-green-50', min: 300, next: 500, bonus: '+10% rate bonus + premium properties' },
  ELITE:     { label: 'Elite',     icon: Star,          color: 'text-yellow-600', bg: 'bg-yellow-50', min: 500, next: null, bonus: '+15% rate bonus + independent inspections' },
}

const REASON_LABELS: Record<string, { label: string; emoji: string }> = {
  TASK_ON_TIME: { label: 'Task on time', emoji: '✅' },
  VALIDATED_NO_REPAIR: { label: 'Validated without issues', emoji: '🏆' },
  OWNER_POSITIVE: { label: 'Owner positive review', emoji: '⭐' },
  PEAK_AVAILABILITY: { label: 'Peak availability', emoji: '📅' },
  NOT_ACCEPTED: { label: 'Task not accepted', emoji: '⚠️' },
  ACCEPTED_NOT_DONE: { label: 'Accepted but not done', emoji: '❌' },
  COMPLAINT: { label: 'Complaint received', emoji: '🔴' },
  UNREPORTED_DAMAGE: { label: 'Unreported damage', emoji: '🚨' },
}

function ScoreSection({ score }: { score: ScoreData }) {
  const config = LEVEL_META[score.level] ?? LEVEL_META.BASIC
  const Icon = config.icon
  const progress = config.next
    ? Math.min(100, ((score.currentScore - config.min) / (config.next - config.min)) * 100)
    : 100
  const approvalRate = score.totalTasks > 0
    ? Math.round((score.totalApproved / score.totalTasks) * 100)
    : 100

  const nextLevel = score.level === 'SUSPENDED' ? 'BASIC' : score.level === 'BASIC' ? 'VERIFIED' : score.level === 'VERIFIED' ? 'EXPERT' : score.level === 'EXPERT' ? 'ELITE' : null

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${config.bg}`}>
              <Icon className={`h-5 w-5 ${config.color}`} />
            </div>
            <div>
              <p className={`text-sm font-bold ${config.color}`}>{config.label}</p>
              <p className="text-xs text-gray-500">{config.bonus}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-navy-900">{score.currentScore}</p>
            <p className="text-xs text-gray-400">points</p>
          </div>
        </div>

        {/* Progress to next level */}
        {config.next && nextLevel && (
          <div className="mb-4">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
              <span>{config.label} ({config.min})</span>
              <span>{LEVEL_META[nextLevel]?.label} ({config.next})</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: '#B08A3E' }} />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">{config.next - score.currentScore} points to next level</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-lg font-bold text-navy-900">{score.totalTasks}</p>
            <p className="text-[10px] text-gray-500">Total tasks</p>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <p className="text-lg font-bold text-green-700">{approvalRate}%</p>
            <p className="text-[10px] text-gray-500">Approval rate</p>
          </div>
          <div className="rounded-lg bg-red-50 p-3 text-center">
            <p className="text-lg font-bold text-red-600">{score.totalRejected}</p>
            <p className="text-[10px] text-gray-500">Rejected</p>
          </div>
        </div>

        {/* Incentive box */}
        <div className="rounded-lg p-3 mb-4" style={{ background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.15)' }}>
          <p className="text-xs font-bold text-gray-800 mb-1">How your score works for you</p>
          <ul className="text-[11px] text-gray-600 space-y-1">
            <li>• <strong>Good work on a property = trust score goes up</strong> — you get priority for future tasks there</li>
            <li>• <strong>Higher global score = access to premium properties</strong> with better rates</li>
            <li>• <strong>Level up = rate bonus</strong> — Verified +5%, Expert +10%, Elite +15%</li>
            <li>• <strong>Owners can mark you as favourite</strong> — you always get called first</li>
          </ul>
        </div>
      </div>

      {/* Recent history */}
      {score.history.length > 0 && (
        <div className="border-t">
          <div className="px-5 py-3 bg-gray-50">
            <p className="text-xs font-semibold text-gray-700">Recent score changes</p>
          </div>
          <div className="divide-y max-h-60 overflow-y-auto">
            {score.history.slice(0, 10).map((e, i) => {
              const meta = REASON_LABELS[e.reason] ?? { label: e.reason, emoji: '📋' }
              return (
                <div key={i} className="px-5 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{meta.emoji}</span>
                    <div>
                      <p className="text-xs text-gray-700">{meta.label}</p>
                      <p className="text-[10px] text-gray-400">{new Date(e.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold ${e.delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {e.delta > 0 ? '+' : ''}{e.delta}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
