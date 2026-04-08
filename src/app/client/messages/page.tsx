'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, Loader2 } from 'lucide-react'

type Sender = { id: string; name: string | null; role: string }
type Message = { id: string; body: string; createdAt: string; sender: Sender }
type Conversation = {
  id: string
  manager: { id: string; name: string | null; email: string }
  messages: Message[]
}

export default function ClientMessagesPage() {
  const [conv, setConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [noManager, setNoManager] = useState(false)
  const [myId, setMyId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Load conversation list (creates/finds the client's conv)
  const loadConv = async () => {
    const res = await fetch('/api/conversations')
    if (!res.ok) {
      setNoManager(true)
      return
    }
    const data: Conversation[] = await res.json()
    if (data.length === 0) { setNoManager(true); return }
    setConv(data[0])
    fetchMessages(data[0].id)
  }

  const fetchMessages = async (id: string) => {
    const res = await fetch(`/api/conversations/${id}/messages`)
    if (res.ok) {
      const msgs: Message[] = await res.json()
      setMessages(msgs)
      if (msgs.length > 0) setMyId(prev => prev) // keep
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  useEffect(() => {
    // Get own id from session endpoint (reuse auth)
    fetch('/api/auth/session').then(r => r.ok ? r.json() : null).then(s => {
      if (s?.user?.id) setMyId(s.user.id)
    })
    loadConv()
  }, [])

  // Poll every 4s
  useEffect(() => {
    if (!conv) return
    const id = setInterval(() => fetchMessages(conv.id), 4000)
    return () => clearInterval(id)
  }, [conv])

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = async () => {
    if (!conv || !text.trim()) return
    setSending(true)
    await fetch(`/api/conversations/${conv.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text }),
    })
    setText('')
    setSending(false)
    fetchMessages(conv.id)
  }

  if (noManager) {
    return (
      <div className="p-8 text-center">
        <MessageCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
        <h2 className="text-lg font-semibold text-gray-700 mb-1">Sem gestor atribuído</h2>
        <p className="text-sm text-gray-500">Contacta o administrador para te atribuir um gestor.</p>
      </div>
    )
  }

  if (!conv) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-navy-900" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-h-[700px]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white rounded-t-xl">
        <div className="h-9 w-9 rounded-full bg-navy-900 flex items-center justify-center text-white text-sm font-bold">
          {(conv.manager.name ?? conv.manager.email)[0].toUpperCase()}
        </div>
        <div>
          <div className="font-semibold text-navy-900 text-sm">
            {conv.manager.name ?? conv.manager.email}
          </div>
          <div className="text-xs text-gray-500">Gestor</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {messages.length === 0 && (
          <div className="text-center text-sm text-gray-400 py-8">
            <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            Sem mensagens ainda. Envia a primeira!
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
      <div className="flex items-center gap-2 px-4 py-3 border-t bg-white rounded-b-xl">
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
    </div>
  )
}
