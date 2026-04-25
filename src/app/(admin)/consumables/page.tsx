"use client"

import { useEffect, useState, useCallback } from "react"
import { Package, Plus, X, Loader2, ChevronDown, ChevronRight } from "lucide-react"
import { useLocale } from "@/i18n/provider"

type StockLevel = {
  totalItems: number
  available: number
  deployed: number
  inLaundry: number
  inTransit: number
  quarantine: number
  retired: number
  minimumLevel: number
  criticalLevel: number
}

type StockCategory = {
  id: string
  name: string
  type: string
  unit: string
  standardLifecycle: number | null
  imageUrl: string | null
  stockLevel: StockLevel | null
  itemsByStatus: Record<string, number>
}

type Category = {
  id: string
  name: string
  type: string
  unit: string
  standardLifecycle: number | null
  active: boolean
  stockLevel: StockLevel | null
  _count: { items: number; propertySetups: number }
}

const TYPE_BADGE: Record<string, string> = {
  LAUNDERABLE: "bg-blue-100 text-blue-700",
  DISPOSABLE: "bg-amber-100 text-amber-700",
  DURABLE: "bg-green-100 text-green-700",
  WELCOME_KIT: "bg-purple-100 text-purple-700",
}

type StockItem = {
  id: string
  serialNumber: string | null
  status: string
  washCount: number
  currentProperty: { id: string; name: string } | null
}

export default function ConsumablesPage() {
  const { t } = useLocale()
  const [tab, setTab] = useState<"stock" | "categories">("stock")
  const [stock, setStock] = useState<StockCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [itemsByCat, setItemsByCat] = useState<Record<string, StockItem[]>>({})

  const toggleCategory = async (id: string) => {
    if (expandedCat === id) {
      setExpandedCat(null)
      return
    }
    setExpandedCat(id)
    if (!itemsByCat[id]) {
      const res = await fetch(`/api/admin/consumables/items?categoryId=${id}`)
      if (res.ok) {
        const data = await res.json()
        setItemsByCat(prev => ({ ...prev, [id]: data }))
      }
    }
  }

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [stockRes, catRes] = await Promise.all([
        fetch("/api/admin/consumables/stock"),
        fetch("/api/admin/consumables/categories"),
      ])
      if (stockRes.ok) setStock(await stockRes.json())
      if (catRes.ok) setCategories(await catRes.json())
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const typeLabel = (type: string) => {
    const map: Record<string, string> = {
      LAUNDERABLE: t("admin.consumables.typeLaunderable"),
      DISPOSABLE: t("admin.consumables.typeDisposable"),
      DURABLE: t("admin.consumables.typeDurable"),
      WELCOME_KIT: t("admin.consumables.typeWelcomeKit"),
    }
    return map[type] ?? type
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-hm-black flex items-center gap-2">
            <Package className="h-6 w-6 text-gray-400" />
            {t("admin.consumables.title")}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t("admin.consumables.subtitle")}</p>
        </div>
        {tab === "categories" && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-hm-black text-white px-4 py-2.5 text-sm font-semibold hover:bg-hm-black/90"
          >
            <Plus className="h-4 w-4" /> {t("admin.consumables.addCategory")}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "stock"
              ? "border-hm-gold text-hm-black"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setTab("stock")}
        >
          {t("admin.consumables.tabStock")}
        </button>
        <button
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "categories"
              ? "border-hm-gold text-hm-black"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setTab("categories")}
        >
          {t("admin.consumables.tabCategories")}
          {categories.length > 0 && (
            <span className="ml-2 rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-xs font-semibold">
              {categories.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : tab === "stock" ? (
        /* Stock Overview Tab */
        stock.length === 0 ? (
          <div className="rounded-hm border bg-white py-16 text-center text-sm text-gray-400">
            <Package className="h-8 w-8 mx-auto mb-2 text-gray-200" />
            {t("admin.consumables.noStock")}
          </div>
        ) : (
          <div className="space-y-3">
            {stock.map(cat => {
              const sl = cat.stockLevel
              const available = sl?.available ?? 0
              const totalItems = sl?.totalItems ?? 0
              const pct = totalItems > 0 ? Math.round((available / totalItems) * 100) : 0
              const isOpen = expandedCat === cat.id
              return (
                <div key={cat.id} className="rounded-hm border bg-white overflow-hidden">
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className="w-full p-5 text-left hover:bg-gray-50 transition-colors space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {isOpen
                          ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                          : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />}
                        <div>
                          <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase mt-1 ${TYPE_BADGE[cat.type] ?? "bg-gray-100 text-gray-600"}`}>
                            {typeLabel(cat.type)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-lg font-bold text-gray-900">{available}</div>
                        <div className="text-[10px] text-gray-400">/ {totalItems} {t("admin.consumables.total").toLowerCase()}</div>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          pct > 50 ? "bg-green-500" : pct > 20 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-500">
                      <div>
                        <div className="font-medium text-gray-900">{sl?.deployed ?? 0}</div>
                        <div>{t("admin.consumables.deployed")}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{sl?.inLaundry ?? 0}</div>
                        <div>{t("admin.consumables.inLaundry")}</div>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{sl?.retired ?? 0}</div>
                        <div>{t("admin.consumables.retired")}</div>
                      </div>
                    </div>
                  </button>

                  {/* Drill-down: individual items */}
                  {isOpen && (
                    <div className="border-t bg-gray-50/50 px-5 py-4">
                      {!itemsByCat[cat.id] ? (
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                          <Loader2 className="h-3 w-3 animate-spin" /> Loading items…
                        </div>
                      ) : itemsByCat[cat.id].length === 0 ? (
                        <p className="text-xs text-gray-400">No items yet. Use &ldquo;Add stock entry&rdquo; to register new purchases.</p>
                      ) : (
                        <div className="space-y-1">
                          {itemsByCat[cat.id].slice(0, 30).map(item => (
                            <div key={item.id} className="flex items-center justify-between py-1.5 text-xs border-b border-gray-100 last:border-0">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="font-mono text-gray-600 shrink-0">
                                  {item.serialNumber ?? item.id.slice(-6)}
                                </span>
                                {item.currentProperty && (
                                  <span className="text-gray-500 truncate">→ {item.currentProperty.name}</span>
                                )}
                                {item.washCount > 0 && (
                                  <span className="text-indigo-500 shrink-0">{item.washCount}× washed</span>
                                )}
                              </div>
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0 ${
                                item.status === 'AVAILABLE'  ? 'bg-emerald-50 text-emerald-700' :
                                item.status === 'DEPLOYED'   ? 'bg-blue-50 text-blue-700' :
                                item.status === 'IN_LAUNDRY' ? 'bg-indigo-50 text-indigo-700' :
                                item.status === 'QUARANTINE' ? 'bg-orange-50 text-orange-700' :
                                item.status === 'RETIRED'    ? 'bg-gray-100 text-gray-500' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {item.status}
                              </span>
                            </div>
                          ))}
                          {itemsByCat[cat.id].length > 30 && (
                            <p className="text-[10px] text-gray-400 pt-2">
                              Showing first 30 of {itemsByCat[cat.id].length}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      ) : (
        /* Categories Tab */
        categories.length === 0 ? (
          <div className="rounded-hm border bg-white py-16 text-center text-sm text-gray-400">
            <Package className="h-8 w-8 mx-auto mb-2 text-gray-200" />
            {t("admin.consumables.noCategories")}
          </div>
        ) : (
          <div className="rounded-hm border bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{t("admin.consumables.name")}</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{t("admin.consumables.type")}</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{t("admin.consumables.unit")}</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500">{t("admin.consumables.lifecycle")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {categories.map(cat => (
                    <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${TYPE_BADGE[cat.type] ?? "bg-gray-100 text-gray-600"}`}>
                          {typeLabel(cat.type)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{cat.unit}</td>
                      <td className="px-4 py-3 text-right text-gray-600">{cat.standardLifecycle ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {/* Add Category Modal */}
      {showCreate && (
        <AddCategoryModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); loadData() }}
        />
      )}
    </div>
  )
}

function AddCategoryModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { t } = useLocale()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [form, setForm] = useState({
    name: "",
    type: "DISPOSABLE",
    unit: "unit",
    standardLifecycle: "",
  })

  const TYPES = ["LAUNDERABLE", "DISPOSABLE", "DURABLE", "WELCOME_KIT"]

  const typeLabel = (type: string) => {
    const map: Record<string, string> = {
      LAUNDERABLE: t("admin.consumables.typeLaunderable"),
      DISPOSABLE: t("admin.consumables.typeDisposable"),
      DURABLE: t("admin.consumables.typeDurable"),
      WELCOME_KIT: t("admin.consumables.typeWelcomeKit"),
    }
    return map[type] ?? type
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/admin/consumables/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          standardLifecycle: form.standardLifecycle ? parseInt(form.standardLifecycle) : null,
        }),
      })
      if (res.ok) {
        onCreated()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || t("admin.consumables.failedToCreate"))
      }
    } catch {
      setError(t("admin.consumables.failedToCreate"))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl mx-4">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <h2 className="text-lg font-bold text-gray-900">{t("admin.consumables.addCategory")}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{t("admin.consumables.name")}</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              required
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t("admin.consumables.type")}</label>
              <select
                value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
              >
                {TYPES.map(ty => (
                  <option key={ty} value={ty}>{typeLabel(ty)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">{t("admin.consumables.unit")}</label>
              <input
                value={form.unit}
                onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">{t("admin.consumables.lifecycle")}</label>
            <input
              type="number"
              min="1"
              value={form.standardLifecycle}
              onChange={e => setForm(f => ({ ...f, standardLifecycle: e.target.value }))}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
              placeholder="—"
            />
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
                <><Loader2 className="h-4 w-4 animate-spin" /> {t("admin.consumables.creating")}</>
              ) : (
                <><Plus className="h-4 w-4" /> {t("admin.consumables.create")}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
