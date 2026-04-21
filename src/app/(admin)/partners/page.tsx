"use client"

import { useEffect, useState } from "react"
import { Handshake, Plus, Filter, Loader2, X, Copy, CheckCircle2, DollarSign, CheckCheck } from "lucide-react"
import { showToast } from "@/components/hm/toast"
import { useLocale } from "@/i18n/provider"

type Partner = {
  id: string
  name: string
  businessName: string | null
  email: string | null
  phone: string | null
  tier: PartnerTier
  referralCode: string
  status: PartnerStatusType
  commissionFixed: string | null
  commissionPct: string | null
  totalReferrals: number
  totalConversions: number
  totalCommission: string
  zone: string | null
  notes: string | null
  createdAt: string
  leadCount: number
  conversionCount: number
}

type PartnerTier = "STANDARD" | "STANDARD_PLUS" | "PREMIUM" | "STRATEGIC"
type PartnerStatusType = "ACTIVE" | "INACTIVE" | "SUSPENDED"

const TIER_META: Record<PartnerTier, { label: string; color: string; key: string }> = {
  STANDARD:       { label: "Standard",   color: "bg-gray-100 text-gray-700",       key: "tierStandard" },
  STANDARD_PLUS:  { label: "Standard+",  color: "bg-blue-100 text-blue-700",       key: "tierStandardPlus" },
  PREMIUM:        { label: "Premium",    color: "bg-amber-100 text-amber-700",     key: "tierPremium" },
  STRATEGIC:      { label: "Strategic",  color: "bg-emerald-100 text-emerald-700", key: "tierStrategic" },
}

const STATUS_META: Record<PartnerStatusType, { label: string; color: string; key: string }> = {
  ACTIVE:     { label: "Active",    color: "bg-green-100 text-green-700",   key: "statusActive" },
  INACTIVE:   { label: "Inactive",  color: "bg-gray-100 text-gray-500",    key: "statusInactive" },
  SUSPENDED:  { label: "Suspended", color: "bg-red-100 text-red-700",      key: "statusSuspended" },
}

const COMMISSION_DEFAULTS: Record<PartnerTier, string> = {
  STANDARD:       "50 EUR fixed",
  STANDARD_PLUS:  "75 EUR fixed",
  PREMIUM:        "200 EUR or 10% first year",
  STRATEGIC:      "Negotiated",
}

type PartnerPayoutRow = {
  id: string
  partnerId: string
  partnerName: string
  clientName: string | null
  amount: string
  status: "PENDING" | "APPROVED" | "PAID" | "REVERSED"
  holdUntil: string
  paidAt: string | null
  reversedAt: string | null
  createdAt: string
}

const PAYOUT_STATUS_META: Record<string, { label: string; color: string }> = {
  PENDING:  { label: "Pending",  color: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "Approved", color: "bg-blue-100 text-blue-700" },
  PAID:     { label: "Paid",     color: "bg-green-100 text-green-700" },
  REVERSED: { label: "Reversed", color: "bg-red-100 text-red-700" },
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

const fmtEUR = (v: string | number) => {
  const n = typeof v === "string" ? parseFloat(v) : v
  return isNaN(n) ? "0.00 EUR" : `${n.toFixed(2)} EUR`
}

type PartnerForm = {
  name: string
  businessName: string
  email: string
  phone: string
  tier: PartnerTier
  zone: string
  notes: string
  commissionFixed: string
  commissionPct: string
  status: PartnerStatusType
}

const emptyForm: PartnerForm = {
  name: "", businessName: "", email: "", phone: "",
  tier: "STANDARD", zone: "", notes: "",
  commissionFixed: "", commissionPct: "", status: "ACTIVE",
}

export default function AdminPartnersPage() {
  const { t } = useLocale()
  const [activeTab, setActiveTab] = useState<"partners" | "payouts">("partners")
  const [partners, setPartners] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [tierFilter, setTierFilter] = useState<string>("ALL")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PartnerForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  // Payouts
  const [payouts, setPayouts] = useState<PartnerPayoutRow[]>([])
  const [payoutsLoading, setPayoutsLoading] = useState(false)
  const [payingId, setPayingId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/partners")
      if (!res.ok) throw new Error()
      setPartners(await res.json())
    } catch {
      showToast(t("common.error"), "error")
    } finally {
      setLoading(false)
    }
  }

  const loadPayouts = async () => {
    setPayoutsLoading(true)
    try {
      const res = await fetch("/api/admin/partner-payouts")
      if (!res.ok) throw new Error()
      setPayouts(await res.json())
    } catch {
      showToast(t("common.error"), "error")
    } finally {
      setPayoutsLoading(false)
    }
  }

  const markPaid = async (id: string) => {
    setPayingId(id)
    try {
      const res = await fetch(`/api/admin/partner-payouts/${id}/pay`, { method: "POST" })
      if (!res.ok) throw new Error()
      showToast("Payout marked as paid", "success")
      loadPayouts()
    } catch {
      showToast(t("common.error"), "error")
    } finally {
      setPayingId(null)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (activeTab === "payouts") loadPayouts() }, [activeTab])

  const filtered = partners.filter(p => {
    if (tierFilter !== "ALL" && p.tier !== tierFilter) return false
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false
    return true
  })

  const stats = {
    total: partners.length,
    active: partners.filter(p => p.status === "ACTIVE").length,
    totalReferrals: partners.reduce((s, p) => s + p.totalReferrals, 0),
    totalConversions: partners.reduce((s, p) => s + p.conversionCount, 0),
  }

  const openCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setShowModal(true)
  }

  const openEdit = (p: Partner) => {
    setForm({
      name: p.name,
      businessName: p.businessName || "",
      email: p.email || "",
      phone: p.phone || "",
      tier: p.tier,
      zone: p.zone || "",
      notes: p.notes || "",
      commissionFixed: p.commissionFixed || "",
      commissionPct: p.commissionPct || "",
      status: p.status,
    })
    setEditingId(p.id)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      showToast("Name is required", "error")
      return
    }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        businessName: form.businessName || null,
        email: form.email || null,
        phone: form.phone || null,
        tier: form.tier,
        zone: form.zone || null,
        notes: form.notes || null,
        commissionFixed: form.commissionFixed ? parseFloat(form.commissionFixed) : null,
        commissionPct: form.commissionPct ? parseFloat(form.commissionPct) : null,
      }
      if (editingId) {
        payload.status = form.status
      }

      const url = editingId ? `/api/admin/partners/${editingId}` : "/api/admin/partners"
      const method = editingId ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error()
      showToast(editingId ? "Partner updated" : "Partner created", "success")
      setShowModal(false)
      load()
    } catch {
      showToast(t("common.error"), "error")
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (id: string) => {
    if (!confirm(t("admin.partners.deleteConfirm"))) return
    const res = await fetch(`/api/admin/partners/${id}`, { method: "DELETE" })
    if (res.ok) {
      showToast("Partner deactivated", "success")
      load()
    } else {
      showToast(t("common.error"), "error")
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    })
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-hm-black">{t("admin.partners.title")}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t("admin.partners.subtitle")}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
          style={{ background: "#B08A3E" }}
        >
          <Plus className="h-4 w-4" />
          {t("admin.partners.addPartner")}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab("partners")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "partners" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Handshake className="h-4 w-4" />
          Partners
        </button>
        <button
          onClick={() => setActiveTab("payouts")}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === "payouts" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <DollarSign className="h-4 w-4" />
          Payouts
        </button>
      </div>

      {/* ─── Payouts Tab ─── */}
      {activeTab === "payouts" && (
        <div className="space-y-4">
          {payoutsLoading ? (
            <div className="text-center py-10 text-sm text-gray-400">
              <Loader2 className="h-4 w-4 inline animate-spin mr-2" />Loading payouts...
            </div>
          ) : payouts.length === 0 ? (
            <div className="bg-white rounded-xl border p-10 text-center text-sm text-gray-400">
              No partner payouts yet.
            </div>
          ) : (
            <div className="bg-white rounded-xl border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Partner</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Client</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Amount</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Hold Until</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Paid</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map(p => {
                    const statusMeta = PAYOUT_STATUS_META[p.status] || { label: p.status, color: "bg-gray-100 text-gray-600" }
                    return (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-gray-900">{p.partnerName}</td>
                        <td className="px-4 py-3 text-gray-600">{p.clientName || "-"}</td>
                        <td className="px-4 py-3 text-right font-medium">{fmtEUR(p.amount)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusMeta.color}`}>
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500 text-xs">{fmtDate(p.holdUntil)}</td>
                        <td className="px-4 py-3 text-right text-gray-500 text-xs">{p.paidAt ? fmtDate(p.paidAt) : "-"}</td>
                        <td className="px-4 py-3 text-right">
                          {p.status === "APPROVED" && (
                            <button
                              onClick={() => markPaid(p.id)}
                              disabled={payingId === p.id}
                              className="inline-flex items-center gap-1 text-xs font-medium text-white rounded-lg px-3 py-1.5 disabled:opacity-50"
                              style={{ background: "#B08A3E" }}
                            >
                              {payingId === p.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCheck className="h-3 w-3" />
                              )}
                              Mark Paid
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─── Partners Tab ─── */}
      {activeTab === "partners" && <>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label={t("admin.partners.title")} value={stats.total} color="text-navy-700" />
        <StatCard label={t("admin.partners.statusActive")} value={stats.active} color="text-green-600" />
        <StatCard label={t("admin.partners.referrals")} value={stats.totalReferrals} color="text-blue-600" />
        <StatCard label={t("admin.partners.conversions")} value={stats.totalConversions} color="text-amber-600" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border p-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={tierFilter}
          onChange={e => setTierFilter(e.target.value)}
          className="rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="ALL">{t("admin.partners.allTiers")}</option>
          {(Object.keys(TIER_META) as PartnerTier[]).map(k => (
            <option key={k} value={k}>{t(`admin.partners.${TIER_META[k].key}`)}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="ALL">{t("admin.partners.allStatuses")}</option>
          {(Object.keys(STATUS_META) as PartnerStatusType[]).map(k => (
            <option key={k} value={k}>{t(`admin.partners.${STATUS_META[k].key}`)}</option>
          ))}
        </select>
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} partner{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Commission info */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
        <strong>{t("admin.partners.commission")}:</strong> {t("admin.partners.commissionInfo")}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-10 text-sm text-gray-400">
          <Loader2 className="h-4 w-4 inline animate-spin mr-2" />Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border p-10 text-center text-sm text-gray-400">
          {t("admin.partners.noPartners")}
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50/50">
                <th className="px-4 py-3 text-left font-medium text-gray-500">{t("admin.partners.name")}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">{t("admin.partners.tier")}</th>
                <th className="px-4 py-3 text-left font-medium text-gray-500">{t("admin.partners.referralCode")}</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">{t("admin.partners.referrals")}</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">{t("admin.partners.conversions")}</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500">{t("admin.partners.commission")}</th>
                <th className="px-4 py-3 text-center font-medium text-gray-500">{t("admin.partners.status")}</th>
                <th className="px-4 py-3 text-right font-medium text-gray-500"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const tierMeta = TIER_META[p.tier]
                const statusMeta = STATUS_META[p.status]
                return (
                  <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "rgba(176,138,62,0.15)" }}>
                          <Handshake className="h-4 w-4" style={{ color: "#B08A3E" }} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{p.name}</p>
                          {p.businessName && <p className="text-xs text-gray-500">{p.businessName}</p>}
                          {p.zone && <p className="text-xs text-gray-400">{p.zone}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${tierMeta.color}`}>
                        {t(`admin.partners.${tierMeta.key}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{p.referralCode}</code>
                        <button
                          onClick={() => copyCode(p.referralCode)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title="Copy code"
                        >
                          {copiedCode === p.referralCode ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{p.totalReferrals}</td>
                    <td className="px-4 py-3 text-center font-medium">{p.conversionCount}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="text-xs">
                        {p.commissionFixed ? `${fmtEUR(p.commissionFixed)} fixed` : p.commissionPct ? `${p.commissionPct}%` : COMMISSION_DEFAULTS[p.tier]}
                      </div>
                      {parseFloat(p.totalCommission) > 0 && (
                        <div className="text-[11px] text-gray-400">{t("admin.partners.totalCommission")}: {fmtEUR(p.totalCommission)}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusMeta.color}`}>
                        {t(`admin.partners.${statusMeta.key}`)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(p)}
                          className="text-xs text-gray-500 hover:text-gray-800 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                        >
                          Edit
                        </button>
                        {p.status === "ACTIVE" && (
                          <button
                            onClick={() => handleDeactivate(p.id)}
                            className="text-xs text-red-500 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      </>}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? t("admin.partners.editPartner") : t("admin.partners.addPartner")}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <Field label={t("admin.partners.name") + " *"}>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="John Doe"
                />
              </Field>
              <Field label={t("admin.partners.businessName")}>
                <input
                  value={form.businessName}
                  onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  placeholder="Acme Real Estate"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label={t("admin.partners.email")}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </Field>
                <Field label={t("admin.partners.phone")}>
                  <input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label={t("admin.partners.tier")}>
                  <select
                    value={form.tier}
                    onChange={e => setForm(f => ({ ...f, tier: e.target.value as PartnerTier }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {(Object.keys(TIER_META) as PartnerTier[]).map(k => (
                      <option key={k} value={k}>{TIER_META[k].label}</option>
                    ))}
                  </select>
                </Field>
                <Field label={t("admin.partners.zone")}>
                  <input
                    value={form.zone}
                    onChange={e => setForm(f => ({ ...f, zone: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="Almunecar"
                  />
                </Field>
              </div>
              {editingId && (
                <Field label={t("admin.partners.status")}>
                  <select
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as PartnerStatusType }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                  >
                    {(Object.keys(STATUS_META) as PartnerStatusType[]).map(k => (
                      <option key={k} value={k}>{STATUS_META[k].label}</option>
                    ))}
                  </select>
                </Field>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Field label={`${t("admin.partners.commissionFixed")} (EUR)`}>
                  <input
                    type="number"
                    step="0.01"
                    value={form.commissionFixed}
                    onChange={e => setForm(f => ({ ...f, commissionFixed: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="50.00"
                  />
                </Field>
                <Field label={`${t("admin.partners.commissionPct")} (%)`}>
                  <input
                    type="number"
                    step="0.01"
                    value={form.commissionPct}
                    onChange={e => setForm(f => ({ ...f, commissionPct: e.target.value }))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="10.00"
                  />
                </Field>
              </div>
              <Field label={t("admin.partners.notes")}>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </Field>
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
                {t("admin.partners.commissionInfo")}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: "#B08A3E" }}
              >
                {saving
                  ? (editingId ? t("admin.partners.saving") : t("admin.partners.creating"))
                  : (editingId ? t("admin.partners.save") : t("admin.partners.create"))
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  )
}
