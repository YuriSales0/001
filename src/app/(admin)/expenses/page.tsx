"use client"

import { useEffect, useState, useCallback } from "react"
import { DollarSign, Plus, Filter, CheckCircle2, Clock, X, Loader2, Camera, Upload } from "lucide-react"
import { showToast } from "@/components/hm/toast"
import { useLocale } from "@/i18n/provider"

type Expense = {
  id: string
  description: string
  category: string
  subcategory: string | null
  amount: number
  vatAmount: number | null
  vatRate: number | null
  expenseDate: string
  dueDate: string | null
  supplierName: string
  supplierTaxId: string | null
  supplierInvoice: string | null
  status: string
  paymentMethod: string | null
  notes: string | null
  property: { id: string; name: string } | null
  createdAt: string
}

const CATEGORIES = [
  "CONSUMABLES", "LAUNDRY", "RENT", "UTILITIES", "SUBSCRIPTIONS",
  "VEHICLES", "MARKETING", "PROFESSIONAL_SERVICES", "SALARIES", "TAXES", "OTHER",
]

const STATUSES = ["DRAFT", "PENDING_APPROVAL", "APPROVED", "PAID", "REJECTED", "CANCELLED"]

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING_APPROVAL: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  PAID: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-400",
}

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 2 }).format(n)

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

export default function ExpensesPage() {
  const { t } = useLocale()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filterCategory, setFilterCategory] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [ocrResult, setOcrResult] = useState<{
    supplierName: string | null; supplierTaxId: string | null; invoiceNumber: string | null
    date: string | null; items: { description: string; quantity: number; unitPrice: number }[]
    subtotal: number | null; vatRate: number | null; vatAmount: number | null; total: number | null
    category: string; suggestedCategory: string | null
  } | null>(null)
  const fileInputRef = useState<HTMLInputElement | null>(null)

  const handleOcrUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      showToast(t('admin.expenses.imageTooLarge'), 'error')
      return
    }
    setScanning(true)
    try {
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      const res = await fetch('/api/admin/expenses/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        showToast(err.error ?? t('admin.expenses.ocrFailed'), 'error')
        return
      }
      const data = await res.json()
      setOcrResult(data)
      setShowCreate(true)
      showToast(t('admin.expenses.ocrSuccess'), 'success')
    } catch {
      showToast(t('admin.expenses.ocrFailed'), 'error')
    } finally {
      setScanning(false)
    }
  }

  const loadExpenses = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterCategory) params.set("category", filterCategory)
      if (filterStatus) params.set("status", filterStatus)
      const res = await fetch(`/api/admin/expenses?${params}`)
      if (res.ok) {
        const data = await res.json()
        setExpenses(data.expenses)
        setTotal(data.total)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [filterCategory, filterStatus])

  useEffect(() => { loadExpenses() }, [loadExpenses])

  // KPI calculations
  const now = new Date()
  const thisMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthKey = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, "0")}`

  const thisMonthTotal = expenses
    .filter(e => e.expenseDate.startsWith(thisMonthKey))
    .reduce((s, e) => s + e.amount, 0)
  const lastMonthTotal = expenses
    .filter(e => e.expenseDate.startsWith(lastMonthKey))
    .reduce((s, e) => s + e.amount, 0)
  const pendingCount = expenses.filter(e => e.status === "PENDING_APPROVAL").length

  const categoryLabel = (cat: string) => {
    const key = `admin.expenses.category${cat.charAt(0) + cat.slice(1).toLowerCase().replace(/_(\w)/g, (_, c) => c.toUpperCase())}`
    const val = t(key)
    return val !== key ? val : cat
  }

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      DRAFT: t("admin.expenses.statusDraft"),
      PENDING_APPROVAL: t("admin.expenses.statusPending"),
      APPROVED: t("admin.expenses.statusApproved"),
      PAID: t("admin.expenses.statusPaid"),
      REJECTED: t("admin.expenses.statusRejected"),
      CANCELLED: t("admin.expenses.statusCancelled"),
    }
    return map[s] ?? s
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    const res = await fetch(`/api/admin/expenses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) loadExpenses()
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-hm-black flex items-center gap-2">
            <DollarSign className="h-6 w-6 text-gray-400" />
            {t("admin.expenses.title")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t("admin.expenses.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* OCR Upload Button */}
          <label className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold cursor-pointer transition-all hover:brightness-110 ${scanning ? 'opacity-50 pointer-events-none' : ''}`}
                 style={{ background: '#B08A3E', color: '#0B1E3A' }}>
            {scanning ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {t("admin.expenses.scanning")}</>
            ) : (
              <><Camera className="h-4 w-4" /> {t("admin.expenses.scanInvoice")}</>
            )}
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleOcrUpload(f); e.target.value = '' }}
            />
          </label>

          {/* Manual Entry Button */}
          <button
            onClick={() => { setOcrResult(null); setShowCreate(true) }}
            className="inline-flex items-center gap-2 rounded-xl bg-hm-black text-white px-4 py-2.5 text-sm font-semibold hover:bg-hm-black/90"
          >
            <Plus className="h-4 w-4" /> {t("admin.expenses.manualEntry")}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-hm border bg-white p-5">
          <div className="text-xs uppercase text-gray-500">{t("admin.expenses.thisMonth")}</div>
          <div className="text-2xl font-bold text-hm-black mt-1">{fmtEUR(thisMonthTotal)}</div>
        </div>
        <div className="rounded-hm border bg-white p-5">
          <div className="text-xs uppercase text-gray-500">{t("admin.expenses.lastMonth")}</div>
          <div className="text-2xl font-bold text-hm-black mt-1">{fmtEUR(lastMonthTotal)}</div>
        </div>
        <div className="rounded-hm border bg-white p-5">
          <div className="text-xs uppercase text-gray-500">{t("admin.expenses.pendingApproval")}</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{pendingCount}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="rounded-lg border bg-white px-3 py-2 text-sm"
        >
          <option value="">{t("admin.expenses.allCategories")}</option>
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{categoryLabel(c)}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="rounded-lg border bg-white px-3 py-2 text-sm"
        >
          <option value="">{t("admin.expenses.allStatuses")}</option>
          {STATUSES.map(s => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>
      </div>

      {/* Expense Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : expenses.length === 0 ? (
        <div className="rounded-hm border bg-white py-16 text-center text-sm text-gray-400">
          <DollarSign className="h-8 w-8 mx-auto mb-2 text-gray-200" />
          {t("admin.expenses.noExpenses")}
        </div>
      ) : (
        <div className="rounded-hm border bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{t("admin.expenses.date")}</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{t("admin.expenses.description")}</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{t("admin.expenses.category")}</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{t("admin.expenses.supplier")}</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">{t("admin.expenses.amount")}</th>
                  <th className="px-4 py-2.5 text-center text-xs font-semibold text-gray-500">{t("admin.expenses.status")}</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">{t("admin.expenses.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {expenses.map(e => (
                  <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmtDate(e.expenseDate)}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{e.description}</div>
                      {e.property && <div className="text-xs text-gray-400">{e.property.name}</div>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{categoryLabel(e.category)}</td>
                    <td className="px-4 py-3 text-gray-600">{e.supplierName}</td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">{fmtEUR(e.amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_BADGE[e.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {statusLabel(e.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {e.status === "DRAFT" && (
                          <button
                            onClick={() => handleStatusChange(e.id, "PENDING_APPROVAL")}
                            className="rounded px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                          >
                            {t("admin.expenses.submitForApproval")}
                          </button>
                        )}
                        {e.status === "PENDING_APPROVAL" && (
                          <button
                            onClick={() => handleStatusChange(e.id, "APPROVED")}
                            className="rounded px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 inline mr-1" />
                            {t("admin.expenses.approve")}
                          </button>
                        )}
                        {e.status === "APPROVED" && (
                          <button
                            onClick={() => handleStatusChange(e.id, "PAID")}
                            className="rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                          >
                            {t("admin.expenses.markPaid")}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t px-4 py-2.5 text-xs text-gray-400">
            {total} {t("common.total").toLowerCase()}
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateExpenseModal
          onClose={() => { setShowCreate(false); setOcrResult(null) }}
          onCreated={() => { setShowCreate(false); setOcrResult(null); loadExpenses() }}
          ocrData={ocrResult}
        />
      )}
    </div>
  )
}

type OcrData = {
  supplierName: string | null; supplierTaxId: string | null; invoiceNumber: string | null
  date: string | null; items: { description: string; quantity: number; unitPrice: number }[]
  subtotal: number | null; vatRate: number | null; vatAmount: number | null; total: number | null
  category: string; suggestedCategory: string | null
} | null

function CreateExpenseModal({ onClose, onCreated, ocrData }: { onClose: () => void; onCreated: () => void; ocrData?: OcrData }) {
  const { t } = useLocale()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    description: ocrData?.items?.map(i => i.description).join(', ') || "",
    category: ocrData?.category || "OTHER",
    amount: ocrData?.total ? String(ocrData.total) : "",
    vatRate: ocrData?.vatRate ? String(ocrData.vatRate) : "",
    vatAmount: ocrData?.vatAmount ? String(ocrData.vatAmount) : "",
    supplierName: ocrData?.supplierName || "",
    supplierTaxId: ocrData?.supplierTaxId || "",
    supplierInvoice: ocrData?.invoiceNumber || "",
    expenseDate: ocrData?.date || new Date().toISOString().slice(0, 10),
    notes: "",
    paymentMethod: "",
    autoStockEntry: ocrData?.category === 'CONSUMABLES' || ocrData?.category === 'LAUNDRY',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/admin/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: form.description,
          category: form.category,
          amount: parseFloat(form.amount),
          vatRate: form.vatRate ? parseFloat(form.vatRate) : undefined,
          vatAmount: form.vatAmount ? parseFloat(form.vatAmount) : undefined,
          supplierName: form.supplierName,
          supplierTaxId: form.supplierTaxId || undefined,
          supplierInvoice: form.supplierInvoice || undefined,
          expenseDate: form.expenseDate,
          notes: form.notes || undefined,
          paymentMethod: form.paymentMethod || undefined,
          autoStockEntry: form.autoStockEntry,
        }),
      })
      if (res.ok) {
        onCreated()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || t("admin.expenses.failedToSave"))
      }
    } catch {
      setError(t("admin.expenses.failedToSave"))
    } finally {
      setSaving(false)
    }
  }

  const categoryLabel = (cat: string) => {
    const key = `admin.expenses.category${cat.charAt(0) + cat.slice(1).toLowerCase().replace(/_(\w)/g, (_, c) => c.toUpperCase())}`
    const val = t(key)
    return val !== key ? val : cat
  }

  const CATEGORIES = [
    "CONSUMABLES", "LAUNDRY", "RENT", "UTILITIES", "SUBSCRIPTIONS",
    "VEHICLES", "MARKETING", "PROFESSIONAL_SERVICES", "SALARIES", "TAXES", "OTHER",
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl mx-4">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">{t("admin.expenses.newExpense")}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{t("admin.expenses.description")}</label>
            <input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              required
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t("admin.expenses.category")}</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{categoryLabel(c)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t("admin.expenses.amount")} (*)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                required
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t("admin.expenses.supplierName")}</label>
              <input
                value={form.supplierName}
                onChange={e => setForm(f => ({ ...f, supplierName: e.target.value }))}
                required
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t("admin.expenses.expenseDate")}</label>
              <input
                type="date"
                value={form.expenseDate}
                onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))}
                required
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
              {t("common.cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-hm-black text-white px-4 py-2 text-sm font-semibold hover:bg-hm-black/90 disabled:opacity-50"
            >
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t("admin.expenses.creating")}</>
              ) : (
                <><Plus className="h-4 w-4" /> {t("admin.expenses.create")}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
