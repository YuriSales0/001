"use client"

import { use, useEffect, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft, Send, User, Bot, Shield, AlertCircle, CheckCircle2, Home, Mail, Phone, Calendar,
} from "lucide-react"

interface Chat {
  id: string
  escalationStatus: 'NONE' | 'PENDING_MANAGER' | 'PENDING_ADMIN' | 'RESOLVED'
  language: string
  messageCount: number
  property: { name: string; city: string }
  reservation: { guestName: string; guestEmail: string | null; guestPhone: string | null; checkIn: string; checkOut: string }
  client: { id: string; name: string | null; email: string }
  messages: Array<{
    id: string
    author: 'GUEST' | 'AI' | 'MANAGER' | 'ADMIN' | 'SYSTEM'
    content: string
    aiTopicTag: string | null
    createdAt: string
  }>
}

export default function StayDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [chat, setChat] = useState<Chat | null>(null)
  const [loading, setLoading] = useState(true)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    const res = await fetch(`/api/admin/stay-chats/${id}`)
    if (res.ok) setChat(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [id])
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [chat?.messages.length])

  const send = async () => {
    const msg = reply.trim()
    if (!msg || sending) return
    setSending(true)
    const res = await fetch(`/api/admin/stay-chats/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: msg }),
    })
    if (res.ok) {
      setReply('')
      await load()
    }
    setSending(false)
  }

  const resolve = async () => {
    await fetch(`/api/admin/stay-chats/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resolve' }),
    })
    await load()
  }

  const escalateAdmin = async () => {
    await fetch(`/api/admin/stay-chats/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'escalate-admin' }),
    })
    await load()
  }

  const resendSms = async () => {
    const res = await fetch(`/api/admin/stay-chats/${id}/resend-sms`, { method: 'POST' })
    const data = await res.json()
    alert(data.ok ? 'SMS sent' : `SMS failed: ${data.error ?? 'unknown'}`)
    await load()
  }

  if (loading) {
    return <div className="p-6 text-sm text-gray-400">Loading…</div>
  }
  if (!chat) {
    return <div className="p-6 text-sm text-gray-500">Chat not found.</div>
  }

  const escalated = chat.escalationStatus === 'PENDING_MANAGER' || chat.escalationStatus === 'PENDING_ADMIN'

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <header className="border-b bg-white px-6 py-3">
        <Link href="/stays" className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <ArrowLeft className="h-3 w-3" /> Back to chats
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-serif font-bold text-hm-black">
              {chat.reservation.guestName}
              <span className="text-gray-400 font-normal text-base"> · {chat.property.name}</span>
            </h1>
            <div className="flex flex-wrap gap-3 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1"><Home className="h-3 w-3" /> {chat.property.city}</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />
                {new Date(chat.reservation.checkIn).toLocaleDateString('en-GB')} – {new Date(chat.reservation.checkOut).toLocaleDateString('en-GB')}
              </span>
              {chat.reservation.guestEmail && (
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {chat.reservation.guestEmail}</span>
              )}
              {chat.reservation.guestPhone && (
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {chat.reservation.guestPhone}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={resendSms}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center gap-1">
              <Send className="h-3 w-3" /> Resend SMS
            </button>
            {escalated && (
              <>
                <button onClick={escalateAdmin}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Escalate to Admin
                </button>
                <button onClick={resolve}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Mark resolved
                </button>
              </>
            )}
            {chat.escalationStatus === 'RESOLVED' && (
              <span className="text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 px-3 py-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Resolved
              </span>
            )}
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 bg-gray-50">
        <div className="max-w-3xl mx-auto space-y-3">
          {chat.messages.map(m => (
            <AdminMessageBubble key={m.id} message={m} />
          ))}
        </div>
      </div>

      <div className="border-t bg-white px-6 py-3">
        <div className="max-w-3xl mx-auto flex gap-2">
          <input
            type="text"
            value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send() }}
            placeholder="Reply as HostMasters team…"
            disabled={sending}
            className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
          />
          <button onClick={send} disabled={sending || !reply.trim()}
            className="rounded-lg bg-hm-black text-white px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-40">
            <Send className="h-4 w-4" /> Send
          </button>
        </div>
      </div>
    </div>
  )
}

function AdminMessageBubble({ message: m }: { message: Chat['messages'][number] }) {
  if (m.author === 'SYSTEM') {
    return (
      <div className="flex justify-center">
        <span className="text-[10px] text-gray-400 italic rounded-full bg-white px-3 py-1 border">
          {m.content}
        </span>
      </div>
    )
  }

  const isGuest = m.author === 'GUEST'
  const isAI = m.author === 'AI'
  const isHuman = m.author === 'MANAGER' || m.author === 'ADMIN'

  const align = isGuest ? 'justify-start' : 'justify-end'
  const bubble = isGuest
    ? 'bg-white border text-gray-800'
    : isAI
    ? 'bg-hm-gold/10 border border-hm-gold/20 text-gray-800'
    : 'bg-hm-black text-white'
  const icon = isGuest ? User : isAI ? Bot : Shield
  const Icon = icon
  const label = isGuest ? 'Guest' : isAI ? 'AI Assistant' : m.author.toLowerCase()

  return (
    <div className={`flex gap-2 ${align}`}>
      {isGuest && (
        <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
          <Icon className="h-3.5 w-3.5 text-gray-600" />
        </div>
      )}
      <div className="max-w-[70%]">
        <div className={`rounded-2xl px-4 py-2 ${bubble} ${isGuest ? 'rounded-tl-sm' : 'rounded-tr-sm'}`}>
          <p className="text-sm whitespace-pre-wrap">{m.content}</p>
        </div>
        <p className={`text-[10px] text-gray-400 mt-1 ${isGuest ? 'text-left' : 'text-right'}`}>
          {label}{m.aiTopicTag && isAI && ` · ${m.aiTopicTag}`} · {new Date(m.createdAt).toLocaleString('en-GB')}
        </p>
      </div>
      {!isGuest && (
        <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
          isAI ? 'bg-hm-gold/20' : 'bg-hm-black'
        }`}>
          <Icon className={`h-3.5 w-3.5 ${isAI ? 'text-hm-gold' : 'text-white'}`} />
        </div>
      )}
    </div>
  )
}
