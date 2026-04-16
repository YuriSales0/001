"use client"

import { useEffect, useState } from "react"
import { Copy, CheckCircle2, Link2, Users, TrendingUp, Pencil, Loader2, Share2 } from "lucide-react"
import { showToast } from "@/components/hm/toast"

type ReferralData = {
  referralCode: string
  referralUrl: string
  managerZone: string | null
  stats: { leadCount: number; clientCount: number }
}

export default function ManagerReferralPage() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [editing, setEditing] = useState(false)
  const [codeInput, setCodeInput] = useState("")
  const [zoneInput, setZoneInput] = useState("")
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = async () => {
    setLoading(true)
    setError(false)
    try {
      const res = await fetch("/api/manager/referral")
      if (!res.ok) throw new Error()
      const d = await res.json()
      setData(d)
      setCodeInput(d.referralCode)
      setZoneInput(d.managerZone ?? "")
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const copy = async () => {
    if (!data) return
    await navigator.clipboard.writeText(data.referralUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const save = async () => {
    setSaving(true)
    const res = await fetch("/api/manager/referral", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ referralCode: codeInput, managerZone: zoneInput || null }),
    })
    const result = await res.json().catch(() => ({}))
    setSaving(false)
    if (res.ok) {
      showToast("Referral link updated", "success")
      setEditing(false)
      load()
    } else {
      showToast(result.error ?? "Failed to update", "error")
    }
  }

  const share = async () => {
    if (!data) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: "HostMasters — Property Management Costa Tropical",
          text: "Professional short-term rental management. Check the platform:",
          url: data.referralUrl,
        })
      } catch { /* user cancelled */ }
    } else {
      copy()
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-pulse" style={{ fontFamily: "system-ui, sans-serif" }}>
        <div className="h-10 rounded bg-gray-100 w-64" />
        <div className="h-32 rounded-xl bg-gray-100" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-24 rounded-xl bg-gray-100" />
          <div className="h-24 rounded-xl bg-gray-100" />
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6" style={{ fontFamily: "system-ui, sans-serif" }}>
        <p className="text-sm text-red-500 text-center p-4 rounded-lg bg-red-50">
          Failed to load referral data. <button onClick={load} className="underline">Try again</button>
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6" style={{ fontFamily: "system-ui, sans-serif" }}>
      <div>
        <h1 className="text-2xl font-bold text-navy-900">My Referral Link</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Share this link with property owners in your territory. New clients registering through it will be automatically assigned to you.
        </p>
      </div>

      {/* Main referral card */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)" }}>
        <div className="absolute inset-0 opacity-20" style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(201,168,76,0.2) 0%, transparent 70%)" }} />
        <div className="relative p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium mb-4" style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.25)" }}>
            <Link2 className="h-3.5 w-3.5" />
            Your personal link
          </div>

          {!editing ? (
            <>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <code className="text-lg sm:text-xl font-mono text-white break-all">{data.referralUrl}</code>
              </div>
              {data.managerZone && (
                <p className="text-xs text-gray-400 mb-4">Territory: {data.managerZone}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={copy}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#C9A84C] text-[#111827] px-4 py-2 text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  {copied ? <><CheckCircle2 className="h-4 w-4" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy link</>}
                </button>
                <button
                  onClick={share}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 text-white px-4 py-2 text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  <Share2 className="h-4 w-4" /> Share
                </button>
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/5 text-white px-4 py-2 text-sm font-semibold hover:bg-white/10 transition-colors"
                >
                  <Pencil className="h-4 w-4" /> Customize
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-3 max-w-md">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Referral code</label>
                <input
                  value={codeInput}
                  onChange={e => setCodeInput(e.target.value)}
                  placeholder="your-name"
                  className="w-full rounded-lg px-3 py-2 text-sm font-mono"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
                />
                <p className="text-[10px] text-gray-400 mt-1">Only letters, numbers, and hyphens (3-40 chars). Must be unique.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Territory</label>
                <input
                  value={zoneInput}
                  onChange={e => setZoneInput(e.target.value)}
                  placeholder="Almuñécar, Nerja, etc."
                  className="w-full rounded-lg px-3 py-2 text-sm"
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff" }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={save}
                  disabled={saving || !codeInput.trim()}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#C9A84C] text-[#111827] px-4 py-2 text-sm font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</> : "Save"}
                </button>
                <button
                  onClick={() => { setEditing(false); setCodeInput(data.referralCode); setZoneInput(data.managerZone ?? "") }}
                  disabled={saving}
                  className="rounded-lg border border-white/20 bg-white/5 text-white px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Users}
          label="Clients in my portfolio"
          value={data.stats.clientCount}
          hint="Property owners registered through your link or assigned to you"
          color="#C9A84C"
        />
        <StatCard
          icon={TrendingUp}
          label="Leads in my pipeline"
          value={data.stats.leadCount}
          hint="Open opportunities you can still convert into clients"
          color="#2A7A4F"
        />
      </div>

      {/* How it works */}
      <div className="rounded-xl border bg-white p-6">
        <h3 className="font-semibold text-navy-900 mb-3">How it works</h3>
        <ol className="space-y-3 text-sm">
          <Step n={1}>
            Share your personal link with property owners — in conversations, emails, WhatsApp, or social media.
          </Step>
          <Step n={2}>
            When a prospect visits <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{data.referralUrl}</code>, we automatically tag them as yours.
          </Step>
          <Step n={3}>
            If they register and become a client, they&rsquo;re assigned to your portfolio automatically.
          </Step>
          <Step n={4}>
            You start earning 15% of their subscription and 3% of their gross rental, month after month.
          </Step>
        </ol>
      </div>

      {/* Pre-written message */}
      <div className="rounded-xl border bg-gray-50 p-6">
        <h3 className="font-semibold text-navy-900 mb-3">Ready-to-send pitch</h3>
        <p className="text-xs text-gray-500 mb-2">Copy this message and personalise it before sending:</p>
        <div className="rounded-lg bg-white border p-4 text-sm text-gray-700 whitespace-pre-wrap mb-3">
{`Hi [Name],

I know you own a property on the Costa Tropical and might be interested in how to get better returns without the headaches.

I work with HostMasters, a platform that handles everything — listing, guest comms, cleaning, maintenance, fiscal compliance (Modelo 179, IRNR, NRU registration). Transparent fees, real data dashboard, and AI-driven pricing.

Check it out here: ${data.referralUrl}

Happy to walk you through it whenever suits you.

Best,
[Your name]`}
        </div>
        <button
          onClick={() => {
            const pitch = `Hi [Name],\n\nI know you own a property on the Costa Tropical and might be interested in how to get better returns without the headaches.\n\nI work with HostMasters, a platform that handles everything — listing, guest comms, cleaning, maintenance, fiscal compliance (Modelo 179, IRNR, NRU registration). Transparent fees, real data dashboard, and AI-driven pricing.\n\nCheck it out here: ${data.referralUrl}\n\nHappy to walk you through it whenever suits you.\n\nBest,\n[Your name]`
            navigator.clipboard.writeText(pitch)
            showToast("Pitch copied to clipboard", "success")
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-colors"
        >
          <Copy className="h-4 w-4" /> Copy message
        </button>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, hint, color }: {
  icon: React.ElementType
  label: string
  value: number
  hint: string
  color: string
}) {
  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: color + "20" }}>
          <Icon className="h-4 w-4" style={{ color }} />
        </div>
        <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">{label}</p>
      </div>
      <p className="text-3xl font-bold text-navy-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{hint}</p>
    </div>
  )
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="shrink-0 h-6 w-6 rounded-full bg-navy-900 text-white flex items-center justify-center text-xs font-bold">
        {n}
      </span>
      <span className="text-gray-700 pt-0.5">{children}</span>
    </li>
  )
}
