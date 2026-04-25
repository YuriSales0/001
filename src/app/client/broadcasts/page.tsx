"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Mail, ChevronRight, Loader2, Inbox } from "lucide-react"

type BroadcastItem = {
  id: string
  subject: string
  bodyPreview: string
  sender: { id: string; name: string | null; email: string }
  sentAt: string | null
  readAt: string | null
}

export default function ClientBroadcastsPage() {
  const [items, setItems] = useState<BroadcastItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/client/broadcasts")
      .then(r => r.ok ? r.json() : { items: [], unreadCount: 0 })
      .then(data => {
        setItems(data.items ?? [])
        setUnreadCount(data.unreadCount ?? 0)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const fmt = (s: string | null) =>
    s ? new Date(s).toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" }) : ""

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest mb-2"
             style={{ color: '#B08A3E' }}>
          <Mail className="h-3.5 w-3.5" />
          From the founder
        </div>
        <h1 className="text-2xl font-serif font-bold" style={{ color: '#0B1E3A' }}>
          Mensagens da HostMasters
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Comunicações directas do fundador da plataforma.
          {unreadCount > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold"
                  style={{ background: 'rgba(176,138,62,0.15)', color: '#B08A3E' }}>
              {unreadCount} não lida(s)
            </span>
          )}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border bg-white py-20 text-center"
             style={{ borderColor: '#E8E3D8' }}>
          <Inbox className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm text-gray-500">Sem mensagens por agora.</p>
          <p className="text-xs text-gray-400 mt-1">As próximas comunicações do fundador chegarão aqui.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(b => (
            <Link
              key={b.id}
              href={`/client/broadcasts/${b.id}`}
              className={`block rounded-xl border bg-white p-4 transition-all hover:shadow-md hover:-translate-y-0.5 ${
                !b.readAt ? 'ring-1 ring-amber-300/50' : ''
              }`}
              style={{ borderColor: '#E8E3D8' }}
            >
              <div className="flex items-start gap-3">
                {!b.readAt && (
                  <div className="mt-1.5 h-2 w-2 rounded-full shrink-0"
                       style={{ background: '#B08A3E' }} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className={`font-bold text-base truncate ${!b.readAt ? 'text-gray-900' : 'text-gray-700'}`}
                        style={!b.readAt ? { color: '#0B1E3A' } : {}}>
                      {b.subject}
                    </h3>
                    <span className="text-[11px] text-gray-400 shrink-0">{fmt(b.sentAt)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {b.sender.name ?? 'HostMasters'}
                  </p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {b.bodyPreview}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0 mt-2" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
