"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Users, TrendingUp, Clock, DollarSign,
  Copy, CheckCircle2, Loader2, ExternalLink,
} from "lucide-react"

type PartnerTier = "STANDARD" | "STANDARD_PLUS" | "PREMIUM" | "STRATEGIC"

type DashboardData = {
  partner: {
    name: string
    tier: PartnerTier
    referralCode: string
  }
  stats: {
    totalReferrals: number
    conversions: number
    pendingPayouts: string
    totalEarned: string
  }
  leads: LeadRow[]
  payouts: PayoutRow[]
}

type LeadRow = {
  id: string
  name: string
  email: string | null
  status: string
  createdAt: string
}

type PayoutRow = {
  id: string
  clientName: string | null
  amount: string
  status: string
  holdUntil: string
  paidAt: string | null
  reversedAt: string | null
}

const TIER_BADGE: Record<PartnerTier, { label: string; color: string }> = {
  STANDARD:      { label: "Standard",  color: "bg-gray-100 text-gray-700" },
  STANDARD_PLUS: { label: "Standard+", color: "bg-blue-100 text-blue-700" },
  PREMIUM:       { label: "Premium",   color: "bg-amber-100 text-amber-700" },
  STRATEGIC:     { label: "Strategic", color: "bg-emerald-100 text-emerald-700" },
}

const LEAD_STATUS_COLOR: Record<string, string> = {
  NEW:       "bg-blue-100 text-blue-700",
  CONTACTED: "bg-yellow-100 text-yellow-700",
  QUALIFIED: "bg-purple-100 text-purple-700",
  CONVERTED: "bg-green-100 text-green-700",
  LOST:      "bg-red-100 text-red-700",
  RETAINED:  "bg-teal-100 text-teal-700",
  REMARKETING: "bg-orange-100 text-orange-700",
}

const PAYOUT_STATUS_COLOR: Record<string, string> = {
  PENDING:  "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PAID:     "bg-green-100 text-green-700",
  REVERSED: "bg-red-100 text-red-700",
}

const PAYOUT_STATUS_INFO: Record<string, string> = {
  PENDING:  "Commission in 30-day holding period",
  APPROVED: "Ready for payment — will be paid by day 5 of next month",
  PAID:     "Paid",
  REVERSED: "Client cancelled within 60 days — commission reversed",
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

const fmtEUR = (v: string | number) => {
  const n = typeof v === "string" ? parseFloat(v) : v
  return isNaN(n) ? "0.00" : n.toFixed(2) + " EUR"
}

export default function PartnerDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  // Handle magic link token in URL
  useEffect(() => {
    const token = searchParams.get("token")
    if (token) {
      // Set the cookie and remove token from URL
      document.cookie = `hm_partner_token=${token}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
      // Remove token from URL
      router.replace("/partner")
    }
    setAuthChecked(true)
  }, [searchParams, router])

  const loadData = useCallback(async () => {
    try {
      const [dashRes, leadsRes] = await Promise.all([
        fetch("/api/partner/dashboard"),
        fetch("/api/partner/leads"),
      ])
      if (dashRes.status === 401 || leadsRes.status === 401) {
        router.push("/partner/login")
        return
      }
      if (!dashRes.ok || !leadsRes.ok) throw new Error()
      const dash = await dashRes.json()
      const leads = await leadsRes.json()
      setData({ ...dash, leads })
    } catch {
      router.push("/partner/login")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (!authChecked) return
    loadData()
  }, [authChecked, loadData])

  const copyCode = () => {
    if (!data) return
    const url = `${window.location.origin}?ref=${data.partner.referralCode}`
    navigator.clipboard.writeText(url).then(() => {
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!data) return null

  const { partner, stats, leads, payouts } = data
  const tierMeta = TIER_BADGE[partner.tier]

  const totalPending = payouts
    .filter(p => p.status === "PENDING" || p.status === "APPROVED")
    .reduce((s, p) => s + parseFloat(p.amount), 0)
  const totalPaid = payouts
    .filter(p => p.status === "PAID")
    .reduce((s, p) => s + parseFloat(p.amount), 0)

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-gray-900">
            Welcome, {partner.name}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Your referral dashboard
          </p>
        </div>
        <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold ${tierMeta.color}`}>
          {tierMeta.label} Partner
        </span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard icon={Users} label="Total Referrals" value={stats.totalReferrals} color="text-blue-600" />
        <KpiCard icon={TrendingUp} label="Conversions" value={stats.conversions} color="text-green-600" />
        <KpiCard icon={Clock} label="Pending Payouts" value={fmtEUR(stats.pendingPayouts)} color="text-amber-600" />
        <KpiCard icon={DollarSign} label="Total Earned" value={fmtEUR(stats.totalEarned)} color="text-emerald-600" />
      </div>

      {/* Referral Code */}
      <div className="bg-white rounded-xl border p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Your Referral Link</h2>
        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3">
          <code className="text-sm font-mono flex-1 truncate text-gray-700">
            {typeof window !== "undefined" ? window.location.origin : ""}?ref={partner.referralCode}
          </code>
          <button
            onClick={copyCode}
            className="shrink-0 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors"
            style={{ background: "#B08A3E" }}
          >
            {copiedCode ? (
              <><CheckCircle2 className="h-3.5 w-3.5" /> Copied</>
            ) : (
              <><Copy className="h-3.5 w-3.5" /> Copy</>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Share this link with property owners. Code: <strong>{partner.referralCode}</strong>
        </p>
      </div>

      {/* Recent Leads */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="text-sm font-semibold text-gray-700">Recent Referrals</h2>
        </div>
        {leads.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            No referrals yet. Share your link to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Name</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Email</th>
                  <th className="px-5 py-3 text-center font-medium text-gray-500">Status</th>
                  <th className="px-5 py-3 text-right font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{lead.name}</td>
                    <td className="px-5 py-3 text-gray-500">{lead.email || "-"}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${LEAD_STATUS_COLOR[lead.status] || "bg-gray-100 text-gray-600"}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-gray-500">{fmtDate(lead.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payouts */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Payouts</h2>
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-500">Pending: <strong className="text-amber-600">{fmtEUR(totalPending)}</strong></span>
            <span className="text-gray-500">Paid: <strong className="text-green-600">{fmtEUR(totalPaid)}</strong></span>
          </div>
        </div>
        {payouts.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            No payouts yet. Payouts are created when your referrals convert.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="px-5 py-3 text-left font-medium text-gray-500">Client</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Amount</th>
                    <th className="px-5 py-3 text-center font-medium text-gray-500">Status</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Hold Until</th>
                    <th className="px-5 py-3 text-right font-medium text-gray-500">Paid Date</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map(p => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">{p.clientName || "-"}</td>
                      <td className="px-5 py-3 text-right font-medium">{fmtEUR(p.amount)}</td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${PAYOUT_STATUS_COLOR[p.status] || "bg-gray-100 text-gray-600"}`}
                          title={PAYOUT_STATUS_INFO[p.status]}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-500">{fmtDate(p.holdUntil)}</td>
                      <td className="px-5 py-3 text-right text-gray-500">
                        {p.status === "PAID" && p.paidAt ? fmtDate(p.paidAt) :
                         p.status === "REVERSED" && p.reversedAt ? fmtDate(p.reversedAt) : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Status legend */}
            <div className="px-5 py-3 border-t bg-gray-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-gray-500">
                {Object.entries(PAYOUT_STATUS_INFO).map(([status, info]) => (
                  <div key={status} className="flex items-start gap-1.5">
                    <span className={`inline-block w-2 h-2 rounded-full mt-1 shrink-0 ${
                      status === "PENDING" ? "bg-yellow-400" :
                      status === "APPROVED" ? "bg-blue-400" :
                      status === "PAID" ? "bg-green-400" : "bg-red-400"
                    }`} />
                    <span><strong>{status}:</strong> {info}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function KpiCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
}) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`h-4 w-4 ${color}`} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
