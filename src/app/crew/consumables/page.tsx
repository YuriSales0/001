"use client"

import { useEffect, useState } from "react"
import { Package, Loader2, ChevronDown, ChevronRight, AlertTriangle, ArrowDownRight, ArrowUpRight, Droplet } from "lucide-react"

type StockCategory = {
  id: string
  name: string
  type: string
  unit: string
  available: number
  minimumLevel: number
  stockLevel: {
    totalItems: number
    available: number
    deployed: number
    inLaundry: number
    quarantine: number
    retired: number
  } | null
  itemsByStatus: Record<string, number>
}

type Item = {
  id: string
  serialNumber: string | null
  status: string
  washCount: number
  currentProperty: { id: string; name: string } | null
  movements: { movementType: string; executedAt: string; notes: string | null }[]
}

type Movement = {
  id: string
  movementType: string
  quantity: number
  executedAt: string
  notes: string | null
  item: { category: { name: string } }
  property: { name: string } | null
}

const TYPE_BADGE: Record<string, string> = {
  LAUNDERABLE: "bg-blue-100 text-blue-700",
  DISPOSABLE: "bg-amber-100 text-amber-700",
  DURABLE: "bg-green-100 text-green-700",
  WELCOME_KIT: "bg-purple-100 text-purple-700",
}

const STATUS_BADGE: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700",
  DEPLOYED: "bg-blue-50 text-blue-700",
  IN_LAUNDRY: "bg-indigo-50 text-indigo-700",
  IN_TRANSIT: "bg-yellow-50 text-yellow-700",
  QUARANTINE: "bg-orange-50 text-orange-700",
  RETIRED: "bg-gray-100 text-gray-500",
}

const MOVEMENT_ICON: Record<string, { Icon: React.ElementType; color: string }> = {
  PURCHASE_ENTRY: { Icon: ArrowDownRight, color: "text-emerald-600" },
  DEPLOY_TO_PROPERTY: { Icon: ArrowUpRight, color: "text-blue-600" },
  RETURN_FROM_PROPERTY: { Icon: ArrowDownRight, color: "text-gray-600" },
  SEND_TO_LAUNDRY: { Icon: Droplet, color: "text-indigo-600" },
  RETURN_FROM_LAUNDRY: { Icon: ArrowDownRight, color: "text-indigo-700" },
  RETIRE: { Icon: ArrowUpRight, color: "text-red-600" },
}

export default function CrewConsumablesPage() {
  const [stock, setStock] = useState<StockCategory[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [items, setItems] = useState<Record<string, Item[]>>({})
  const [movements, setMovements] = useState<Movement[]>([])
  const [loading, setLoading] = useState(true)
  const [denied, setDenied] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    fetch('/api/me')
      .then(r => r.ok ? r.json() : null)
      .then(me => {
        if (!me || me.role !== 'CREW' || !me.isCaptain) {
          setDenied(true)
          setLoading(false)
          return
        }
        return Promise.all([
          fetch('/api/admin/consumables/stock').then(r => r.ok ? r.json() : []),
          fetch('/api/admin/consumables/movements').then(r => r.ok ? r.json() : []),
        ]).then(([stockData, movementsData]) => {
          setStock(Array.isArray(stockData) ? stockData : [])
          setMovements(Array.isArray(movementsData) ? movementsData.slice(0, 30) : [])
          setLoading(false)
        })
      })
      .catch(() => setLoading(false))
  }, [])

  const toggleCategory = async (categoryId: string) => {
    if (expanded === categoryId) {
      setExpanded(null)
      return
    }
    setExpanded(categoryId)
    if (!items[categoryId]) {
      const res = await fetch(`/api/admin/consumables/items?categoryId=${categoryId}`)
      if (res.ok) {
        const data = await res.json()
        setItems(prev => ({ ...prev, [categoryId]: data }))
      }
    }
  }

  if (!mounted || loading) {
    return (
      <div className="p-6 flex items-center gap-2 text-sm text-gray-400">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading inventory…
      </div>
    )
  }

  if (denied) {
    return (
      <div className="p-6">
        <div className="rounded-xl border bg-amber-50 border-amber-200 p-6 max-w-xl">
          <div className="font-semibold text-amber-900 mb-1">Captain-only area</div>
          <p className="text-sm text-amber-800">
            Inventory view is restricted to Crew Captains.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div>
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-gray-500" />
          <h1 className="text-2xl font-serif font-bold text-hm-black">Inventory</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Stock overview by category + recent movements. Click a category to see individual items.
        </p>
      </div>

      {/* Stock cards */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Categories</h2>
        {stock.length === 0 ? (
          <div className="rounded-xl border bg-white p-8 text-center text-sm text-gray-400">
            No stock categories configured yet.
          </div>
        ) : (
          stock.map(cat => {
            const sl = cat.stockLevel
            const total = sl?.totalItems ?? 0
            const available = sl?.available ?? 0
            const isLow = cat.minimumLevel > 0 && available <= cat.minimumLevel
            const isOpen = expanded === cat.id
            return (
              <div key={cat.id} className="rounded-xl border bg-white overflow-hidden">
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {isOpen ? <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-hm-black">{cat.name}</span>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${TYPE_BADGE[cat.type] ?? "bg-gray-100 text-gray-600"}`}>
                          {cat.type}
                        </span>
                        {isLow && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 text-red-700 px-2 py-0.5 text-[10px] font-bold">
                            <AlertTriangle className="h-2.5 w-2.5" /> LOW STOCK
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-3">
                        <span>{available} available</span>
                        {sl?.deployed ? <span>{sl.deployed} deployed</span> : null}
                        {sl?.inLaundry ? <span className="text-indigo-600">{sl.inLaundry} in laundry</span> : null}
                        {sl?.quarantine ? <span className="text-orange-600">{sl.quarantine} quarantine</span> : null}
                        {sl?.retired ? <span className="text-gray-400">{sl.retired} retired</span> : null}
                      </div>
                    </div>
                  </div>
                  <div className="text-right ml-3">
                    <div className="text-lg font-bold text-hm-black">{available}</div>
                    <div className="text-[10px] text-gray-400">/ {total} total</div>
                  </div>
                </button>

                {/* Expanded items */}
                {isOpen && (
                  <div className="border-t bg-gray-50/50 px-5 py-4">
                    {!items[cat.id] ? (
                      <div className="text-xs text-gray-400 flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" /> Loading items…
                      </div>
                    ) : items[cat.id].length === 0 ? (
                      <p className="text-xs text-gray-400">No items in this category yet.</p>
                    ) : (
                      <div className="space-y-1">
                        {items[cat.id].slice(0, 20).map(item => (
                          <div key={item.id} className="flex items-center justify-between py-1.5 text-xs border-b border-gray-100 last:border-0">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="font-mono text-gray-600 shrink-0">{item.serialNumber ?? item.id.slice(-6)}</span>
                              {item.currentProperty && (
                                <span className="text-gray-500 truncate">→ {item.currentProperty.name}</span>
                              )}
                              {item.washCount > 0 && (
                                <span className="text-indigo-500 shrink-0">{item.washCount}× washed</span>
                              )}
                            </div>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0 ${STATUS_BADGE[item.status] ?? 'bg-gray-100 text-gray-500'}`}>
                              {item.status}
                            </span>
                          </div>
                        ))}
                        {items[cat.id].length > 20 && (
                          <p className="text-[10px] text-gray-400 pt-2">
                            Showing first 20 of {items[cat.id].length}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Recent movements */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500">Recent movements</h2>
        {movements.length === 0 ? (
          <div className="rounded-xl border bg-white p-6 text-center text-sm text-gray-400">
            No movements recorded yet.
          </div>
        ) : (
          <div className="rounded-xl border bg-white overflow-hidden divide-y">
            {movements.map(m => {
              const icon = MOVEMENT_ICON[m.movementType] ?? { Icon: ArrowUpRight, color: 'text-gray-500' }
              const { Icon } = icon
              return (
                <div key={m.id} className="p-3 flex items-center gap-3 text-sm">
                  <Icon className={`h-4 w-4 ${icon.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-hm-black">
                      {m.movementType.replace(/_/g, ' ').toLowerCase()} · {m.item.category.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {m.quantity}× · {m.property?.name ?? 'warehouse'} · {new Date(m.executedAt).toLocaleDateString('en-GB')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
