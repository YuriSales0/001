'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, Lock, Loader2 } from 'lucide-react'

type Sender = { id: string; name: string | null; role: string }
type Message = { id: string; body: string; createdAt: string; sender: Sender }
type ConvSummary = {
  id: string
  client: { id: string; name: string | null; email: string }
  manager: { id: string; name: string | null; email: string }
  messages: Message[]
  unreadCount: number
  readonly: boolean
}

export default function ManagerMessagesPage() {
  const [convs, setConvs] = useState<ConvSummary[]>([])
  const [active, setActive] = useState<ConvSummary | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [myId, setMyId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadConvs = async () => {
    const res = await fetch('/api/conversations')
    if (res.ok) {
      const data: ConvSummary[] = await res.json()
      setConvs(data)
      if (!active && data.length > 0) setActive(data[0])
    }
  }

  const fetchMessages = async (convId: string) => {
    const res = await fetch(`/api/conversations/${convId}/messages`)
    if (res.ok) {
      const msgs: Message[] = await res.json()
      setMessages(msgs)
    }
  }

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.ok ? r.json() : null).then(s => {
      if (s?.user?.id) setMyId(s.user.id)
    })
    loadConvs()
  }, [])

  // Auto-select first conv
  useEffect(() => {
    if (active) fetchMessages(active.id)
  }, [active])

  // Poll every 4s
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => {
      fetchMessages(active.id)
      loadConvs()
    }, 4000)
    return () => clearInterval(id)
  }, [active])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const selectConv = (c: ConvSummary) => {
    setActive(c)
    setText('')
  }

  const send = async () => {
    if (!active || active.readonly || !text.trim()) return
    setSending(true)
    await fetch(`/api/conversations/${active.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text }),
    })
    setText('')
    setSending(false)
    fetchMessages(active.id)
    loadConvs()
  }

  const myConvs  = convs.filter(c => !c.readonly)
  const otherConvs = convs.filter(c => c.readonly)

  return (
    <div className="flex h-[calc(100vh-80px)] max-h-[750px] rounded-xl border bg-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r flex flex-col shrink-0">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="text-sm font-bold text-navy-900">Mensagens</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {myConvs.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs text-gray-500 uppercase font-semibold">Os meus clientes</div>
              {myConvs.map(c => (
                <button
                  key={c.id}
                  onClick={() => selectConv(c)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b ${
                    active?.id === c.id ? 'bg-navy-50 border-l-2 border-l-navy-900' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-navy-900 truncate">
                      {c.client.name ?? c.client.email}
                    </span>
                    {c.unreadCount > 0 && (
                      <span className="shrink-0 rounded-full bg-navy-900 text-white text-xs px-1.5 py-0.5 min-w-[20px] text-center">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                  {c.messages[0] && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{c.messages[0].body}</p>
                  )}
                </button>
              ))}
            </>
          )}

          {otherConvs.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs text-gray-500 uppercase font-semibold mt-1">Outros gestores</div>
              {otherConvs.map(c => (
                <button
                  key={c.id}
                  onClick={() => selectConv(c)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b ${
                    active?.id === c.id ? 'bg-gray-100' : ''
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-500 truncate">
                      {c.client.name ?? c.client.email}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 truncate mt-0.5 pl-4">
                    {c.manager.name ?? c.manager.email}
                  </p>
                </button>
              ))}
            </>
          )}

          {convs.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-400">
              Sem conversas
            </div>
          )}
        </div>
      </aside>

      {/* Chat area */}
      {active ? (
        <div className="flex flex-col flex-1">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b">
            <div className="h-8 w-8 rounded-full bg-navy-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {(active.client.name ?? active.client.email)[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-navy-900 text-sm truncate">
                {active.client.name ?? active.client.email}
              </div>
              <div className="text-xs text-gray-500">Cliente</div>
            </div>
            {active.readonly && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-500 text-xs px-2 py-0.5">
                <Lock className="h-3 w-3" />
                Só leitura
              </span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-sm text-gray-400 py-8">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                Sem mensagens
              </div>
            )}
            {messages.map(m => {
              const isMe = m.sender.id === myId
              return (
                <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                    isMe
                      ? 'bg-navy-900 text-white rounded-br-sm'
                      : 'bg-white border text-gray-800 rounded-bl-sm'
                  }`}>
                    {!isMe && (
                      <p className="text-xs font-semibold mb-0.5 text-gray-500">
                        {m.sender.name ?? m.sender.role}
                      </p>
                    )}
                    <p>{m.body}</p>
                    <p className={`text-xs mt-1 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                      {new Date(m.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {!active.readonly ? (
            <div className="flex items-center gap-2 px-4 py-3 border-t bg-white">
              <input
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Escreve uma mensagem…"
                className="flex-1 rounded-full border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
              />
              <button
                onClick={send}
                disabled={sending || !text.trim()}
                className="rounded-full bg-navy-900 p-2.5 text-white hover:bg-navy-800 disabled:opacity-40"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 px-4 py-3 border-t bg-gray-50 text-xs text-gray-400">
              <Lock className="h-3.5 w-3.5" />
              Conversa de outro gestor — só leitura
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Selecciona uma conversa</p>
          </div>
        </div>
      )}
    </div>
  )
}
