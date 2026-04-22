"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertCircle, MessageCircle, Clock, CheckCircle2, Home, User } from "lucide-react"

interface StayChat {
  id: string
  token: string
  language: string
  escalationStatus: 'NONE' | 'PENDING_MANAGER' | 'PENDING_ADMIN' | 'RESOLVED'
  escalatedAt: string | null
  messageCount: number
  lastMessageAt: string | null
  createdAt: string
  property: { id: string; name: string; city: string }
  reservation: { guestName: string; checkIn: string; checkOut: string }
  _count: { messages: number }
}

export default function StaysPage() {
  const [chats, setChats] = useState<StayChat[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'escalated'>('escalated')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/stay-chats?${filter === 'escalated' ? 'escalated=true' : ''}`)
      .then(r => r.json())
      .then(data => {
        setChats(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [filter])

  const activeEscalations = chats.filter(c =>
    c.escalationStatus === 'PENDING_MANAGER' || c.escalationStatus === 'PENDING_ADMIN'
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-hm-black">Guest Stay Chats</h1>
          <p className="text-sm text-gray-500">
            AI-handled conversations with guests during their stay. Escalates to Manager/Admin when needed.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter('escalated')}
            className={`text-sm font-semibold px-4 py-2 rounded-lg ${
              filter === 'escalated' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
            Pending {activeEscalations.length > 0 && `(${activeEscalations.length})`}
          </button>
          <button onClick={() => setFilter('all')}
            className={`text-sm font-semibold px-4 py-2 rounded-lg ${
              filter === 'all' ? 'bg-hm-black text-white' : 'bg-gray-100 text-gray-600'
            }`}>
            All chats
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />)}
        </div>
      ) : chats.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-12 text-center">
          <MessageCircle className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-hm-black">No {filter === 'escalated' ? 'escalated ' : ''}chats</p>
          <p className="text-sm text-gray-500 mt-1">
            Chats are created automatically when a guest checks in.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-white divide-y">
          {chats.map(c => <StayChatRow key={c.id} chat={c} />)}
        </div>
      )}
    </div>
  )
}

function StayChatRow({ chat }: { chat: StayChat }) {
  const statusMeta = {
    NONE:            { label: 'AI handling',     color: 'bg-blue-50 text-blue-700',    icon: MessageCircle },
    PENDING_MANAGER: { label: 'Manager needed',  color: 'bg-amber-50 text-amber-700',  icon: AlertCircle },
    PENDING_ADMIN:   { label: 'Admin needed',    color: 'bg-red-50 text-red-700',      icon: AlertCircle },
    RESOLVED:        { label: 'Resolved',        color: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  }[chat.escalationStatus]

  const Icon = statusMeta.icon
  const now = new Date()
  const checkOut = new Date(chat.reservation.checkOut)
  const isActiveStay = now < checkOut

  return (
    <Link href={`/stays/${chat.id}`} className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors">
      <div className="shrink-0 h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
        <User className="h-5 w-5 text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-hm-black">{chat.reservation.guestName}</span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <Home className="h-3 w-3" /> {chat.property.name}, {chat.property.city}
          </span>
          {isActiveStay && (
            <span className="rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold">
              STAYING
            </span>
          )}
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusMeta.color}`}>
            <Icon className="h-3 w-3" /> {statusMeta.label}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1 flex items-center gap-3">
          <span>{chat._count.messages} messages</span>
          <span>·</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />
            {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleString() : 'No activity yet'}
          </span>
        </p>
      </div>
    </Link>
  )
}
