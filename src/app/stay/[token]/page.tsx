"use client"

import { use, useEffect, useRef, useState } from "react"
import { Send, User, Bot, Phone, AlertCircle, Home, Calendar } from "lucide-react"
import { gt } from "@/lib/guest-i18n"

interface Message {
  id: string
  author: 'GUEST' | 'AI' | 'MANAGER' | 'ADMIN' | 'SYSTEM'
  content: string
  aiTopicTag: string | null
  createdAt: string
}

interface StayData {
  propertyName: string
  propertyCity: string
  guestName: string
  checkIn: string
  checkOut: string
  language: string
  escalationStatus: string
  messages: Message[]
}

export default function GuestStayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [data, setData] = useState<StayData | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    const res = await fetch(`/api/guest-stay/${token}`)
    if (!res.ok) {
      setError(res.status === 410 ? gt('stay', 'expired', 'en') : 'Chat not found.')
      setLoading(false)
      return
    }
    const d = await res.json()
    setData(d)
    setLoading(false)
  }

  useEffect(() => { load() }, [token])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [data?.messages.length])

  const send = async () => {
    const msg = input.trim()
    if (!msg || sending) return
    setSending(true)
    setInput('')

    // Optimistic update
    setData(d => d ? {
      ...d,
      messages: [...d.messages, {
        id: 'tmp-' + Date.now(),
        author: 'GUEST',
        content: msg,
        aiTopicTag: null,
        createdAt: new Date().toISOString(),
      }],
    } : d)

    const res = await fetch(`/api/guest-stay/${token}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: msg }),
    })

    if (res.ok) {
      await load()
    } else if (res.status === 429) {
      alert(gt('stay', 'rateLimit', data?.language ?? 'en'))
      // Remove optimistic message
      setData(d => d ? { ...d, messages: d.messages.filter(m => !m.id.startsWith('tmp-')) } : d)
    } else {
      // Other error — remove optimistic and restore input
      setData(d => d ? { ...d, messages: d.messages.filter(m => !m.id.startsWith('tmp-')) } : d)
      setInput(msg)
    }
    setSending(false)
  }

  const escalate = async () => {
    await fetch(`/api/guest-stay/${token}/escalate`, { method: 'POST' })
    await load()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-sm text-gray-400">Loading…</div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm border">
          <AlertCircle className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <h1 className="font-semibold text-hm-black">{error ?? 'Chat not found'}</h1>
          <p className="text-sm text-gray-500 mt-2">
            Contact HostMasters at hello@hostmasters.es for assistance.
          </p>
        </div>
      </div>
    )
  }

  const escalated = data.escalationStatus !== 'NONE'

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-400">HostMasters</p>
            <h1 className="text-lg font-serif font-bold text-hm-black flex items-center gap-2">
              <Home className="h-4 w-4" /> {data.propertyName}
            </h1>
            <p className="text-xs text-gray-500 flex items-center gap-2">
              <Calendar className="h-3 w-3" />
              {new Date(data.checkIn).toLocaleDateString()} – {new Date(data.checkOut).toLocaleDateString()}
            </p>
          </div>
          {!escalated && (
            <button onClick={escalate}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold hover:bg-gray-50 flex items-center gap-1">
              <Phone className="h-3 w-3" /> {gt('stay', 'humanButton', data.language)}
            </button>
          )}
        </div>
      </header>

      {/* Escalation banner */}
      {escalated && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2">
          <div className="max-w-2xl mx-auto text-xs text-amber-800 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {gt('stay', 'escalationBanner', data.language)}
          </div>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {data.messages.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-sm text-gray-500">
                {gt('stay', 'greeting', data.language, { name: data.guestName })}
              </p>
              <p className="text-xs text-gray-400 mt-1">{gt('stay', 'greetingSub', data.language)}</p>
            </div>
          ) : (
            data.messages.filter(m => m.author !== 'SYSTEM').map(m => (
              <MessageBubble key={m.id} message={m} guestName={data.guestName} />
            ))
          )}
          {sending && (
            <div className="flex gap-2">
              <div className="h-8 w-8 rounded-full bg-hm-gold/20 flex items-center justify-center">
                <Bot className="h-4 w-4 text-hm-gold" />
              </div>
              <div className="rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-2">
                <span className="inline-flex gap-1">
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t bg-white px-4 py-3">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send() }}
            placeholder={gt('stay', 'placeholder', data.language)}
            disabled={sending}
            className="flex-1 rounded-full border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
          />
          <button onClick={send} disabled={sending || !input.trim()}
            className="rounded-full bg-hm-black text-white h-10 w-10 flex items-center justify-center disabled:opacity-40">
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="max-w-2xl mx-auto text-[10px] text-gray-400 mt-2 text-center">
          {gt('stay', 'footerNote', data.language)}
        </p>
      </div>
    </div>
  )
}

function MessageBubble({ message, guestName }: { message: Message; guestName: string }) {
  const isGuest = message.author === 'GUEST'
  const isAI = message.author === 'AI'
  const isHuman = message.author === 'MANAGER' || message.author === 'ADMIN'

  if (isGuest) {
    return (
      <div className="flex justify-end gap-2">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-hm-black text-white px-4 py-2">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
          <User className="h-4 w-4 text-gray-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
        isAI ? 'bg-hm-gold/20' : 'bg-emerald-100'
      }`}>
        {isAI ? <Bot className="h-4 w-4 text-hm-gold" /> : <User className="h-4 w-4 text-emerald-700" />}
      </div>
      <div className="max-w-[75%]">
        <div className={`rounded-2xl rounded-tl-sm px-4 py-2 ${
          isAI ? 'bg-gray-100 text-gray-800' : 'bg-emerald-50 text-gray-800 border border-emerald-100'
        }`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        <p className="text-[10px] text-gray-400 mt-1 px-2">
          {isAI ? 'AI Assistant' : isHuman ? `HostMasters team` : 'System'}
          {message.aiTopicTag && isAI && ` · ${message.aiTopicTag}`}
        </p>
      </div>
    </div>
  )
}
