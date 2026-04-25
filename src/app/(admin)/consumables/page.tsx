"use client"

import { useEffect, useState, useCallback } from "react"
import { Package, Plus, X, Loader2, ChevronDown, ChevronRight, MoreVertical, ArrowRightLeft, Send, Trash2, Sparkles, AlertOctagon, RotateCcw, Inbox, Filter } from "lucide-react"
import { useLocale } from "@/i18n/provider"
import { showToast } from "@/components/hm/toast"

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

type Property = { id: string; name: string }

export default function ConsumablesPage() {
  const { t } = useLocale()
  const [tab, setTab] = useState<"stock" | "categories" | "movements">("stock")
  const [stock, setStock] = useState<StockCategory[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [expandedCat, setExpandedCat] = useState<string | null>(null)
  const [itemsByCat, setItemsByCat] = useState<Record<string, StockItem[]>>({})
  const [actionItem, setActionItem] = useState<{ item: StockItem; categoryId: string } | null>(null)

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
      const [stockRes, catRes, propRes] = await Promise.all([
        fetch("/api/admin/consumables/stock"),
        fetch("/api/admin/consumables/categories"),
        fetch("/api/properties"),
      ])
      if (stockRes.ok) setStock(await stockRes.json())
      if (catRes.ok) setCategories(await catRes.json())
      if (propRes.ok) {
        const p = await propRes.json()
        setProperties(Array.isArray(p) ? p.map((x: { id: string; name: string }) => ({ id: x.id, name: x.name })) : [])
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshItemsForCategory = async (categoryId: string) => {
    const res = await fetch(`/api/admin/consumables/items?categoryId=${categoryId}`)
    if (res.ok) {
      const data = await res.json()
      setItemsByCat(prev => ({ ...prev, [categoryId]: data }))
    }
    // Also refresh stock totals
    const stockRes = await fetch("/api/admin/consumables/stock")
    if (stockRes.ok) setStock(await stockRes.json())
  }

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
            tab === "movements"
              ? "border-hm-gold text-hm-black"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setTab("movements")}
        >
          Movimentos
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
      ) : tab === "movements" ? (
        <MovementsTab categories={categories} properties={properties} />
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
                            <div key={item.id} className="flex items-center justify-between gap-2 py-1.5 text-xs border-b border-gray-100 last:border-0">
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
                                item.status === 'WASHING'    ? 'bg-indigo-50 text-indigo-700' :
                                item.status === 'IN_TRANSIT' ? 'bg-amber-50 text-amber-700' :
                                item.status === 'QUARANTINE' ? 'bg-orange-50 text-orange-700' :
                                item.status === 'RETIRED'    ? 'bg-gray-100 text-gray-500' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {item.status}
                              </span>
                              {item.status !== 'RETIRED' && (
                                <button
                                  onClick={() => setActionItem({ item, categoryId: cat.id })}
                                  className="text-gray-400 hover:text-gray-700 rounded-md hover:bg-gray-100 p-1 shrink-0"
                                  title="Acções"
                                >
                                  <MoreVertical className="h-3.5 w-3.5" />
                                </button>
                              )}
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

      {/* Item Action Modal */}
      {actionItem && (
        <ItemActionModal
          item={actionItem.item}
          properties={properties}
          onClose={() => setActionItem(null)}
          onDone={() => {
            const cat = actionItem.categoryId
            setActionItem(null)
            refreshItemsForCategory(cat)
          }}
        />
      )}
    </div>
  )
}

// ─── Item Action Modal ────────────────────────────────────────────────────────
type MovementOption = {
  type: string
  label: string
  icon: typeof Send
  needsProperty?: boolean
  needsNotes?: boolean
  destructive?: boolean
}

const ACTIONS_BY_STATUS: Record<string, MovementOption[]> = {
  AVAILABLE: [
    { type: 'CHECKOUT_FROM_STORAGE', label: 'Enviar para propriedade', icon: Send, needsProperty: true },
    { type: 'QUARANTINED', label: 'Pôr em quarentena', icon: AlertOctagon, needsNotes: true },
    { type: 'RETIRED', label: 'Retirar definitivamente', icon: Trash2, destructive: true, needsNotes: true },
  ],
  IN_TRANSIT: [
    { type: 'CHECKIN_TO_PROPERTY', label: 'Entregar na propriedade', icon: Send, needsProperty: true },
    { type: 'RETURN_TO_STORAGE', label: 'Voltar ao armazém', icon: Inbox },
  ],
  DEPLOYED: [
    { type: 'PICKUP_FROM_PROPERTY', label: 'Recolher da propriedade', icon: ArrowRightLeft },
    { type: 'SEND_TO_LAUNDRY', label: 'Enviar à lavandaria', icon: Sparkles },
    { type: 'QUARANTINED', label: 'Pôr em quarentena', icon: AlertOctagon, needsNotes: true },
    { type: 'RETIRED', label: 'Retirar definitivamente', icon: Trash2, destructive: true, needsNotes: true },
  ],
  WASHING: [
    { type: 'RETURN_FROM_LAUNDRY', label: 'Voltou da lavandaria', icon: RotateCcw },
    { type: 'QUARANTINED', label: 'Pôr em quarentena', icon: AlertOctagon, needsNotes: true },
    { type: 'RETIRED', label: 'Retirar definitivamente', icon: Trash2, destructive: true, needsNotes: true },
  ],
  QUARANTINE: [
    { type: 'RETURN_TO_STORAGE', label: 'Libertar e voltar ao armazém', icon: Inbox },
    { type: 'RETIRED', label: 'Retirar definitivamente', icon: Trash2, destructive: true, needsNotes: true },
  ],
}

function ItemActionModal({
  item,
  properties,
  onClose,
  onDone,
}: {
  item: StockItem
  properties: { id: string; name: string }[]
  onClose: () => void
  onDone: () => void
}) {
  const [selected, setSelected] = useState<MovementOption | null>(null)
  const [propertyId, setPropertyId] = useState("")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const actions = ACTIONS_BY_STATUS[item.status] ?? []

  const submit = async () => {
    if (!selected) return
    if (selected.needsProperty && !propertyId) {
      setError("Selecciona uma propriedade")
      return
    }
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/admin/consumables/movements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: item.id,
          movementType: selected.type,
          propertyId: selected.needsProperty ? propertyId : undefined,
          notes: notes || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? "Falhou ao registar movimento")
        setSaving(false)
        return
      }
      showToast("Movimento registado", "success")
      onDone()
    } catch {
      setError("Falhou ao registar movimento")
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Acção sobre item</h2>
            <p className="text-xs text-gray-500 mt-0.5 font-mono">
              {item.serialNumber ?? item.id.slice(-6)} · {item.status}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          {!selected ? (
            <div className="space-y-1.5">
              {actions.map(a => {
                const Icon = a.icon
                return (
                  <button
                    key={a.type}
                    onClick={() => setSelected(a)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors ${
                      a.destructive
                        ? 'border-red-100 hover:bg-red-50 text-red-700'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium">{a.label}</span>
                  </button>
                )
              })}
            </div>
          ) : (
            <>
              <div className="rounded-lg bg-gray-50 border px-3 py-2">
                <p className="text-xs text-gray-500">Acção</p>
                <p className="text-sm font-semibold text-gray-900">{selected.label}</p>
              </div>

              {selected.needsProperty && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Propriedade</label>
                  <select
                    value={propertyId}
                    onChange={e => setPropertyId(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
                  >
                    <option value="">Selecciona…</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Notas {selected.needsNotes && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  required={selected.needsNotes}
                  placeholder={selected.destructive ? "Razão para retirar (obrigatório)" : "Opcional"}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
                />
              </div>

              {error && <p className="text-xs text-red-600">{error}</p>}

              <div className="flex justify-between gap-2 pt-1">
                <button
                  onClick={() => setSelected(null)}
                  className="rounded-lg border px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
                >
                  ← Voltar
                </button>
                <button
                  onClick={submit}
                  disabled={saving || (selected.needsNotes && !notes)}
                  className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 ${
                    selected.destructive
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-hm-black text-white hover:bg-hm-black/90'
                  }`}
                >
                  {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> A guardar…</> : 'Confirmar'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Movements Tab ────────────────────────────────────────────────────────────
type Movement = {
  id: string
  movementType: string
  executedAt: string
  quantity: number
  notes: string | null
  fromLocation: string | null
  toLocation: string | null
  item: {
    id: string
    serialNumber: string | null
    category: { id: string; name: string; type: string }
  }
  property: { id: string; name: string } | null
}

const MOVEMENT_TYPES = [
  'PURCHASE_ENTRY', 'CHECKOUT_FROM_STORAGE', 'CHECKIN_TO_PROPERTY',
  'PICKUP_FROM_PROPERTY', 'SEND_TO_LAUNDRY', 'RETURN_FROM_LAUNDRY',
  'RETURN_TO_STORAGE', 'RETIRED', 'QUARANTINED',
]

const MOVEMENT_LABEL: Record<string, string> = {
  PURCHASE_ENTRY: 'Entrada (compra)',
  CHECKOUT_FROM_STORAGE: 'Saída do armazém',
  CHECKIN_TO_PROPERTY: 'Entregue na propriedade',
  PICKUP_FROM_PROPERTY: 'Recolhido da propriedade',
  SEND_TO_LAUNDRY: 'Enviado à lavandaria',
  RETURN_FROM_LAUNDRY: 'Voltou da lavandaria',
  RETURN_TO_STORAGE: 'Voltou ao armazém',
  RETIRED: 'Retirado',
  QUARANTINED: 'Quarentena',
}

const MOVEMENT_BADGE: Record<string, string> = {
  PURCHASE_ENTRY: 'bg-emerald-50 text-emerald-700',
  CHECKOUT_FROM_STORAGE: 'bg-amber-50 text-amber-700',
  CHECKIN_TO_PROPERTY: 'bg-blue-50 text-blue-700',
  PICKUP_FROM_PROPERTY: 'bg-amber-50 text-amber-700',
  SEND_TO_LAUNDRY: 'bg-indigo-50 text-indigo-700',
  RETURN_FROM_LAUNDRY: 'bg-emerald-50 text-emerald-700',
  RETURN_TO_STORAGE: 'bg-emerald-50 text-emerald-700',
  RETIRED: 'bg-gray-100 text-gray-500',
  QUARANTINED: 'bg-orange-50 text-orange-700',
}

function MovementsTab({ categories, properties }: { categories: Category[]; properties: { id: string; name: string }[] }) {
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState("")
  const [filterCategoryId, setFilterCategoryId] = useState("")
  const [filterPropertyId, setFilterPropertyId] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterType) params.set("movementType", filterType)
      if (dateFrom) params.set("dateFrom", dateFrom)
      if (dateTo) params.set("dateTo", dateTo)
      const res = await fetch(`/api/admin/consumables/movements?${params}`)
      if (res.ok) setMovements(await res.json())
    } finally {
      setLoading(false)
    }
  }, [filterType, dateFrom, dateTo])

  useEffect(() => { load() }, [load])

  // Client-side filter for category and property (API doesn't support these directly)
  const filtered = movements.filter(m => {
    if (filterCategoryId && m.item.category.id !== filterCategoryId) return false
    if (filterPropertyId && m.property?.id !== filterPropertyId) return false
    return true
  })

  const fmt = (s: string) =>
    new Date(s).toLocaleString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="rounded-hm border bg-white p-4">
        <div className="flex items-center gap-2 mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
          <Filter className="h-3.5 w-3.5" /> Filtros
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
          >
            <option value="">Todos os tipos</option>
            {MOVEMENT_TYPES.map(t => (
              <option key={t} value={t}>{MOVEMENT_LABEL[t]}</option>
            ))}
          </select>
          <select
            value={filterCategoryId}
            onChange={e => setFilterCategoryId(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
          >
            <option value="">Todas as categorias</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filterPropertyId}
            onChange={e => setFilterPropertyId(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
          >
            <option value="">Todas as propriedades</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
            placeholder="De"
          />
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
            placeholder="Até"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-hm border bg-white overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-gray-400">
            <ArrowRightLeft className="h-8 w-8 mx-auto mb-2 text-gray-200" />
            Sem movimentos para os filtros seleccionados
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                  <th className="px-4 py-2.5 text-left font-semibold">Quando</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Tipo</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Item</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Categoria</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Localização</th>
                  <th className="px-4 py-2.5 text-left font-semibold">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{fmt(m.executedAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${MOVEMENT_BADGE[m.movementType] ?? 'bg-gray-100 text-gray-600'}`}>
                        {MOVEMENT_LABEL[m.movementType] ?? m.movementType}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      {m.item.serialNumber ?? m.item.id.slice(-6)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{m.item.category.name}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {m.fromLocation && m.toLocation
                        ? `${m.fromLocation} → ${m.toLocation}`
                        : m.toLocation
                          ? `→ ${m.toLocation}`
                          : m.property?.name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs max-w-xs truncate" title={m.notes ?? ''}>
                      {m.notes ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && filtered.length === 100 && (
          <div className="px-4 py-2 text-[11px] text-gray-400 border-t bg-gray-50">
            A mostrar os 100 movimentos mais recentes. Refina os filtros para ver mais.
          </div>
        )}
      </div>
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
