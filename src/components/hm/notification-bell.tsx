"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Bell, Check, CheckCheck, X } from "lucide-react"
import { cn } from "@/lib/utils"

type Notification = {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  read: boolean
  createdAt: string
}

const TYPE_ICON: Record<string, string> = {
  TASK_ASSIGNED: "📋", TASK_CONFIRMED: "✅", TASK_SUBMITTED: "📸",
  TASK_APPROVED: "🏆", TASK_REJECTED: "❌", TASK_REDISTRIBUTED: "🔄",
  CREW_PAYOUT_READY: "💰", CREW_PAYOUT_PAID: "✅", CREW_SCORE_CHANGE: "📊",
  CREW_LEVEL_UP: "⬆️", CREW_LEVEL_DOWN: "⬇️",
  NEW_LEAD: "🎯", CLIENT_REGISTERED: "👤", CLIENT_PROPERTY_APPROVED: "🏠",
  COMMISSION_PAID: "💸",
  PROPERTY_APPROVED: "🏠", CONTRACT_READY: "📝", PROPERTY_ACTIVE: "🟢",
  BOOKING_RECEIVED: "📅", PAYOUT_COMPLETED: "💰", VISIT_COMPLETED: "🧹",
  TAX_DEADLINE: "⚠️",
  INTERVENTION_OPENED: "🚨", INTERVENTION_RESOLVED: "✅",
  AI_ALERT: "🤖", GENERAL: "🔔",
}

function timeAgo(date: string): string {
  const ms = Date.now() - new Date(date).getTime()
  const min = Math.floor(ms / 60000)
  if (min < 1) return "just now"
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const d = Math.floor(hr / 24)
  return `${d}d ago`
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const ref = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=20")
      if (!res.ok) return
      const data = await res.json()
      setItems(data.notifications ?? [])
      setUnread(data.unreadCount ?? 0)
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 30_000)
    return () => clearInterval(interval)
  }, [load])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    })
    setItems(prev => prev.map(n => ({ ...n, read: true })))
    setUnread(0)
  }

  const markOneRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] }),
    })
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    setUnread(prev => Math.max(0, prev - 1))
  }

  const handleClick = (n: Notification) => {
    if (!n.read) markOneRead(n.id)
    if (n.link) window.location.href = n.link
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen(o => !o); if (!open) load() }}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-gray-600" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] flex items-center justify-center rounded-full text-[10px] font-bold text-white px-1"
                style={{ background: "#C9A84C" }}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border bg-white shadow-2xl z-50 overflow-hidden"
             style={{ maxHeight: "28rem" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 flex items-center gap-1"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="overflow-y-auto" style={{ maxHeight: "22rem" }}>
            {items.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-400">
                <Bell className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                No notifications yet
              </div>
            )}
            {items.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50",
                  !n.read && "bg-amber-50/40"
                )}
              >
                <span className="text-base mt-0.5 shrink-0">{TYPE_ICON[n.type] ?? "🔔"}</span>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm leading-snug", !n.read ? "font-semibold text-gray-900" : "text-gray-700")}>
                    {n.title}
                  </p>
                  {n.body && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>
                {!n.read && (
                  <span className="mt-1.5 h-2 w-2 rounded-full shrink-0" style={{ background: "#C9A84C" }} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
