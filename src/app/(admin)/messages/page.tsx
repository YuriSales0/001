'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Lock } from 'lucide-react'

type Sender = { id: string; name: string | null; role: string; image?: string | null }
type Message = { id: string; body: string; createdAt: string; sender: Sender }
type ConvSummary = {
  id: string
  client:  { id: string; name: string | null; email: string; image?: string | null }
  manager: { id: string; name: string | null; email: string; image?: string | null }
  messages: Message[]
  _count: { messages: number }
}

function Avatar({ name, image, size=7 }: { name: string; image?: string|null; size?: number }) {
  const initials = name.trim().split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()
  const cls = `h-${size} w-${size} rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden`
  if (image) return <img src={image} alt={name} className={`${cls} object-cover`}/> // eslint-disable-line @next/next/no-img-element
  return <div className={`${cls} bg-gray-200 text-gray-600`}>{initials}</div>
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
      .then((data: ConvSummary[]) => { setConvs(data); if (data.length > 0) setActive(data[0]) })
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

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const filtered = convs.filter(c =>
    !search ||
    (c.client.name ?? c.client.email).toLowerCase().includes(search.toLowerCase()) ||
    (c.manager.name ?? c.manager.email).toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Mensagens</h1>
        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
          <Lock className="h-3.5 w-3.5"/> Acesso só de leitura — {convs.length} conversa(s)
        </p>
      </div>

      <div className="flex h-[calc(100vh-200px)] max-h-[650px] rounded-xl border bg-white overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r flex flex-col shrink-0">
          <div className="p-3 border-b">
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar…"
              className="w-full rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 && <div className="p-4 text-center text-sm text-gray-400">Sem conversas</div>}
            {filtered.map(c => (
              <button key={c.id} onClick={() => setActive(c)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b transition-colors ${
                  active?.id === c.id ? 'bg-blue-50 border-l-2 border-l-gray-900' : ''}`}>
                <div className="flex items-center gap-2.5">
                  <Avatar name={c.client.name ?? c.client.email} image={c.client.image}/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{c.client.name ?? c.client.email}</p>
                    <p className="text-xs text-gray-500 truncate">↔ {c.manager.name ?? c.manager.email}</p>
                    <p className="text-xs text-gray-400">{c._count.messages} mensagem(ns)</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Chat */}
        {active ? (
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-white">
              <Avatar name={active.client.name ?? active.client.email} image={active.client.image} size={9}/>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm">
                  {active.client.name ?? active.client.email}
                  <span className="mx-2 text-gray-300">↔</span>
                  {active.manager.name ?? active.manager.email}
                </div>
              </div>
              <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-500 text-xs px-2 py-0.5">
                <Lock className="h-3 w-3"/>Só leitura
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.length === 0 && (
                <div className="text-center text-sm text-gray-400 py-8">
                  <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300"/>
                  Sem mensagens
                </div>
              )}
              {messages.map(m => {
                const displayName = m.sender.name ?? m.sender.role
                return (
                  <div key={m.id} className="flex gap-3 items-end">
                    <Avatar name={displayName} image={m.sender.image} size={7}/>
                    <div className="rounded-2xl rounded-bl-sm bg-white border px-4 py-2.5 text-sm max-w-sm shadow-sm">
                      <p className="text-xs font-semibold text-gray-500 mb-0.5">
                        {displayName}
                        <span className="ml-1 font-normal text-gray-400 capitalize">· {m.sender.role.toLowerCase()}</span>
                      </p>
                      <p className="text-gray-800">{m.body}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(m.createdAt).toLocaleString('pt-PT',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef}/>
            </div>

            <div className="flex items-center justify-center gap-2 px-4 py-3 border-t bg-gray-50 text-xs text-gray-400">
              <Lock className="h-3.5 w-3.5"/>Admin — visualização só de leitura
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-2 text-gray-300"/>
              <p className="text-sm">Selecciona uma conversa</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
