'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Lock, Loader2 } from 'lucide-react'

type Sender = { id: string; name: string | null; role: string }
type Message = { id: string; body: string; createdAt: string; sender: Sender }
type ConvSummary = {
  id: string
  client: { id: string; clientCode?: string | null; name: string | null; email: string }
  manager: { id: string; name: string | null; email: string }
  messages: Message[]
  _count: { messages: number }
}

export default function AdminMessagesPage() {
  const [convs, setConvs] = useState<ConvSummary[]>([])
  const [active, setActive] = useState<ConvSummary | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/conversations')
      .then(r => r.ok ? r.json() : [])
      .then((data: ConvSummary[]) => {
        setConvs(data)
        if (data.length > 0) setActive(data[0])
      })
  }, [])

  useEffect(() => {
    if (!active) return
    fetchMessages(active.id)
    const id = setInterval(() => fetchMessages(active.id), 4000)
    return () => clearInterval(id)
  }, [active])

  const fetchMessages = async (id: string) => {
    const res = await fetch(`/api/conversations/${id}/messages`)
    if (res.ok) setMessages(await res.json())
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const filtered = convs.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (c.client.clientCode?.toLowerCase().includes(q)) ||
      (c.client.name ?? c.client.email).toLowerCase().includes(q) ||
      c.client.email.toLowerCase().includes(q) ||
      (c.manager.name ?? c.manager.email).toLowerCase().includes(q)
    )
  })

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-3xl font-bold text-navy-900">Mensagens</h1>
        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
          <Lock className="h-3.5 w-3.5" />
          Acesso só de leitura — {convs.length} conversa(s)
        </p>
      </div>

      <div className="flex h-[calc(100vh-200px)] max-h-[650px] rounded-xl border bg-white overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r flex flex-col shrink-0">
          <div className="p-3 border-b">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Pesquisar…"
              className="w-full rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="p-4 text-center text-sm text-gray-400">Sem conversas</div>
            )}
            {filtered.map(c => (
              <button
                key={c.id}
                onClick={() => setActive(c)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b ${
                  active?.id === c.id ? 'bg-navy-50 border-l-2 border-l-navy-900' : ''
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-navy-900 truncate">
                    {c.client.name ?? c.client.email}
                  </span>
                  {c.client.clientCode && (
                    <span className="shrink-0 rounded-full bg-navy-100 text-navy-700 px-1.5 py-0.5 text-[9px] font-bold">
                      {c.client.clientCode}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  Gestor: {c.manager.name ?? c.manager.email}
                </div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {c._count.messages} mensagem(ns)
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat area */}
        {active ? (
          <div className="flex flex-col flex-1">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b">
              <div>
                <div className="font-semibold text-navy-900 text-sm">
                  {active.client.name ?? active.client.email}
                  <span className="mx-2 text-gray-300">↔</span>
                  {active.manager.name ?? active.manager.email}
                </div>
              </div>
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-500 text-xs px-2 py-0.5">
                <Lock className="h-3 w-3" />
                Só leitura
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
              {messages.length === 0 && (
                <div className="text-center text-sm text-gray-400 py-8">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  Sem mensagens
                </div>
              )}
              {messages.map(m => (
                <div key={m.id} className="flex gap-2 items-start">
                  <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                    {(m.sender.name ?? m.sender.role)[0].toUpperCase()}
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-white border px-4 py-2 text-sm max-w-sm">
                    <p className="text-xs font-semibold text-gray-500 mb-0.5">
                      {m.sender.name ?? m.sender.role}
                      <span className="ml-1 text-gray-300">·</span>
                      <span className="ml-1 font-normal text-gray-400">{m.sender.role}</span>
                    </p>
                    <p className="text-gray-800">{m.body}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(m.createdAt).toLocaleString('pt-PT', {
                        day: '2-digit', month: 'short',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            <div className="flex items-center justify-center gap-2 px-4 py-3 border-t bg-gray-50 text-xs text-gray-400">
              <Lock className="h-3.5 w-3.5" />
              Admin — visualização só de leitura
            </div>
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
    </div>
  )
}
