"use client"

import { useEffect, useRef, useState } from "react"
import { Camera, Save, Lock, Wrench, Percent, TrendingUp, Star, Shield, Zap, AlertTriangle } from "lucide-react"
import { ProfileContractSection } from "@/components/hm/profile-contract-section"
import { useLocale } from "@/i18n/provider"

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
  const { t } = useLocale()
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
    }).catch(() => { setError(t('profile.loadFailed')); setLoading(false) })
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
    else { const d = await res.json(); setError(d.error ?? t('profile.failedToSave')) }
    setSaving(false)
  }

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(""); setPwSaved(false)
    if (pw.next !== pw.confirm) { setPwError(t('profile.passwordsDoNotMatch')); return }
    if (pw.next.length < 8) { setPwError(t('profile.passwordMinLength')); return }
    const res = await fetch("/api/profile", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: pw.current, newPassword: pw.next }),
    })
    if (res.ok) { setPwSaved(true); setPw({ current: "", next: "", confirm: "" }); setTimeout(() => setPwSaved(false), 3000) }
    else { const d = await res.json(); setPwError(d.error ?? t('profile.failedToUpdatePassword')) }
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">{t('common.loading')}</div>

  return (
    <div className="space-y-6 p-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-hm-black">{t('common.myProfile')}</h1>
        <p className="text-sm text-gray-500">{t('crew.profile.roleDesc')}</p>
      </div>

      {/* Performance Score */}
      {score && <ScoreSection score={score} />}

      {/* Role info */}
      <div className="rounded-xl border bg-emerald-50 border-emerald-100 p-4 flex gap-4">
        <Wrench className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-sm text-emerald-800 space-y-1">
          <p className="font-semibold">{t('crew.profile.responsibilities')}</p>
          <p>{t('crew.profile.responsibilitiesDesc')}</p>
        </div>
      </div>

      {profile?.commissionRate != null && (
        <div className="rounded-xl border bg-white p-4 flex items-center gap-4">
          <div className="rounded-lg p-2 bg-amber-50">
            <Percent className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">{t('crew.profile.yourTaskRate')}</p>
            <p className="text-2xl font-bold text-hm-black">{profile.commissionRate}%</p>
          </div>
          <div className="ml-auto text-xs text-gray-400">{t('crew.profile.setByAdmin')}</div>
        </div>
      )}

      {/* Contract */}
      <ProfileContractSection />

      {/* Photo + identity */}
      <form onSubmit={save} className="rounded-xl border bg-white p-5 space-y-5">
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center"
                 style={{ border: '3px solid var(--hm-gold)' }}>
              {form.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <Wrench className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 rounded-full p-1.5 text-white shadow"
              style={{ background: 'var(--hm-gold)' }}>
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>
          <div>
            <p className="font-semibold text-hm-black">{profile?.name ?? profile?.email}</p>
            <p className="text-xs text-gray-500">{profile?.email}</p>
            <span className="mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800">CREW</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">{t('profile.fullName')}</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">{t('common.phone')}</label>
            <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
              placeholder="+34 600 000 000" />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">{t('crew.profile.bio')}</label>
            <textarea rows={3} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold resize-none"
              placeholder={t('crew.profile.bioPlaceholder')} />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex items-center justify-between pt-1">
          {saved && <span className="text-sm text-green-600 font-medium">{t('profile.savedSuccessfully')}</span>}
          <button type="submit" disabled={saving}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-hm-black text-white px-4 py-2.5 text-sm font-semibold hover:bg-hm-black/90 disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? t('profile.saving') : t('profile.saveChanges')}
          </button>
        </div>
      </form>

      {/* Password */}
      <form onSubmit={savePassword} className="rounded-xl border bg-white p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Lock className="h-4 w-4 text-gray-400" />
          <span className="text-sm font-semibold text-hm-black">{t('profile.changePassword')}</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[[t('profile.currentPassword'), "current"], [t('profile.newPassword'), "next"], [t('profile.confirmNew'), "confirm"]].map(([label, key]) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{label}</label>
              <input type="password" value={pw[key as keyof typeof pw]}
                onChange={e => setPw(p => ({ ...p, [key]: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" />
            </div>
          ))}
        </div>
        {pwError && <p className="text-sm text-red-600">{pwError}</p>}
        <div className="flex items-center justify-between">
          {pwSaved && <span className="text-sm text-green-600 font-medium">{t('profile.passwordUpdated')}</span>}
          <button type="submit"
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white text-gray-700 px-4 py-2.5 text-sm font-medium hover:bg-gray-50">
            {t('profile.updatePassword')}
          </button>
        </div>
      </form>
    </div>
  )
}

const LEVEL_STYLE: Record<string, { icon: typeof Star; color: string; bg: string; min: number; next: number | null }> = {
  SUSPENDED: { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', min: 0, next: 50 },
  BASIC:     { icon: Shield,        color: 'text-blue-600', bg: 'bg-blue-50', min: 50, next: 150 },
  VERIFIED:  { icon: Zap,           color: 'text-amber-600', bg: 'bg-amber-50', min: 150, next: 300 },
  EXPERT:    { icon: TrendingUp,    color: 'text-green-600', bg: 'bg-green-50', min: 300, next: 500 },
  ELITE:     { icon: Star,          color: 'text-yellow-600', bg: 'bg-yellow-50', min: 500, next: null },
}

const REASON_EMOJIS: Record<string, string> = {
  TASK_ON_TIME: '✅',
  VALIDATED_NO_REPAIR: '🏆',
  OWNER_POSITIVE: '⭐',
  PEAK_AVAILABILITY: '📅',
  NOT_ACCEPTED: '⚠️',
  ACCEPTED_NOT_DONE: '❌',
  COMPLAINT: '🔴',
  UNREPORTED_DAMAGE: '🚨',
}

function ScoreSection({ score }: { score: ScoreData }) {
  const { t } = useLocale()

  const levelLabels: Record<string, { label: string; bonus: string }> = {
    SUSPENDED: { label: t('crew.score.suspended'), bonus: t('crew.score.suspendedDesc') },
    BASIC:     { label: t('crew.score.basic'),     bonus: t('crew.score.basicDesc') },
    VERIFIED:  { label: t('crew.score.verified'),  bonus: t('crew.score.verifiedDesc') },
    EXPERT:    { label: t('crew.score.expert'),    bonus: t('crew.score.expertDesc') },
    ELITE:     { label: t('crew.score.elite'),     bonus: t('crew.score.eliteDesc') },
  }

  const reasonLabels: Record<string, string> = {
    TASK_ON_TIME: t('crew.profile.scoreReasons.taskOnTime'),
    VALIDATED_NO_REPAIR: t('crew.profile.scoreReasons.validatedNoRepair'),
    OWNER_POSITIVE: t('crew.profile.scoreReasons.ownerPositive'),
    PEAK_AVAILABILITY: t('crew.profile.scoreReasons.peakAvailability'),
    NOT_ACCEPTED: t('crew.profile.scoreReasons.notAccepted'),
    ACCEPTED_NOT_DONE: t('crew.profile.scoreReasons.acceptedNotDone'),
    COMPLAINT: t('crew.profile.scoreReasons.complaint'),
    UNREPORTED_DAMAGE: t('crew.profile.scoreReasons.unreportedDamage'),
  }

  const style = LEVEL_STYLE[score.level] ?? LEVEL_STYLE.BASIC
  const labels = levelLabels[score.level] ?? levelLabels.BASIC
  const config = { ...style, label: labels.label, bonus: labels.bonus }
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
            <p className="text-3xl font-bold text-hm-black">{score.currentScore}</p>
            <p className="text-xs text-gray-400">{t('crew.profile.points')}</p>
          </div>
        </div>

        {/* Progress to next level */}
        {config.next && nextLevel && (
          <div className="mb-4">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
              <span>{config.label} ({config.min})</span>
              <span>{levelLabels[nextLevel]?.label} ({config.next})</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100">
              <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'var(--hm-gold)' }} />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">{config.next - score.currentScore} {t('crew.profile.pointsToNextLevel')}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg bg-gray-50 p-3 text-center">
            <p className="text-lg font-bold text-hm-black">{score.totalTasks}</p>
            <p className="text-[10px] text-gray-500">{t('crew.profile.totalTasks')}</p>
          </div>
          <div className="rounded-lg bg-green-50 p-3 text-center">
            <p className="text-lg font-bold text-green-700">{approvalRate}%</p>
            <p className="text-[10px] text-gray-500">{t('crew.profile.approvalRate')}</p>
          </div>
          <div className="rounded-lg bg-red-50 p-3 text-center">
            <p className="text-lg font-bold text-red-600">{score.totalRejected}</p>
            <p className="text-[10px] text-gray-500">{t('crew.profile.rejected')}</p>
          </div>
        </div>

        {/* Incentive box */}
        <div className="rounded-lg p-3 mb-4" style={{ background: 'rgba(176,138,62,0.08)', border: '1px solid rgba(176,138,62,0.15)' }}>
          <p className="text-xs font-bold text-gray-800 mb-1">{t('crew.profile.howScoreWorks')}</p>
          <ul className="text-[11px] text-gray-600 space-y-1">
            <li>{t('crew.profile.scoreTip1')}</li>
            <li>{t('crew.profile.scoreTip2')}</li>
            <li>{t('crew.profile.scoreTip3')}</li>
            <li>{t('crew.profile.scoreTip4')}</li>
          </ul>
        </div>
      </div>

      {/* Recent history */}
      {score.history.length > 0 && (
        <div className="border-t">
          <div className="px-5 py-3 bg-gray-50">
            <p className="text-xs font-semibold text-gray-700">{t('crew.profile.recentScoreChanges')}</p>
          </div>
          <div className="divide-y max-h-60 overflow-y-auto">
            {score.history.slice(0, 10).map((e, i) => {
              const emoji = REASON_EMOJIS[e.reason] ?? '📋'
              const label = reasonLabels[e.reason] ?? e.reason
              return (
                <div key={i} className="px-5 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{emoji}</span>
                    <div>
                      <p className="text-xs text-gray-700">{label}</p>
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
