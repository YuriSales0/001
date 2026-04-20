'use client'

import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, Lock, Loader2 } from 'lucide-react'
import { useLocale } from '@/i18n/provider'

type Sender = { id: string; name: string | null; role: string; image?: string | null }
type Message = { id: string; body: string; createdAt: string; sender: Sender }
type ConvSummary = {
  id: string
  client:  { id: string; name: string | null; email: string; image?: string | null }
  manager: { id: string; name: string | null; email: string; image?: string | null }
  messages: Message[]
  unreadCount: number
  readonly: boolean
}

function Avatar({
  name, image, size = 8, dark = false,
}: { name: string; image?: string | null; size?: number; dark?: boolean }) {
  const initials = name.trim().split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()
  const cls = `h-${size} w-${size} rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden`
  if (image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={image} alt={name} className={`${cls} object-cover`} />
    )
  }
  return (
    <div className={`${cls} ${dark ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-600'}`}>
      {initials}
    </div>
  )
}

export default function ManagerMessagesPage() {
  const { t } = useLocale()
  const [convs, setConvs] = useState<ConvSummary[]>([])
  const [active, setActive] = useState<ConvSummary | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(false)
  const [myId, setMyId] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadConvs = async () => {
    try {
      const res = await fetch('/api/conversations')
      if (!res.ok) throw new Error()
      const data: ConvSummary[] = await res.json()
      setConvs(data)
      if (!active && data.length > 0) setActive(data[0])
    } catch { setError(true) }
  }

  const fetchMessages = async (convId: string) => {
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`)
      if (!res.ok) throw new Error()
      setMessages(await res.json())
    } catch { setError(true) }
  }

  useEffect(() => {
    fetch('/api/auth/session').then(r => r.ok ? r.json() : null).then(s => {
      if (s?.user?.id) setMyId(s.user.id)
    })
    loadConvs()
  }, [])

  useEffect(() => { if (active) fetchMessages(active.id) }, [active])

  useEffect(() => {
    if (!active) return
    const tick = () => {
      if (!document.hidden) { fetchMessages(active.id); loadConvs() }
    }
    const id = setInterval(tick, 15000)
    const onVisible = () => {
      if (!document.hidden) { fetchMessages(active.id); loadConvs() }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [active])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!active || active.readonly || !text.trim()) return
    setSending(true)
    const res = await fetch(`/api/conversations/${active.id}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text }),
    })
    setSending(false)
    if (!res.ok) { alert(t('manager.messages.failedToSend')); return }
    setText('')
    fetchMessages(active.id); loadConvs()
  }

  const myConvs    = convs.filter(c => !c.readonly)
  const otherConvs = convs.filter(c => c.readonly)
  const clientName = (c: ConvSummary) => c.client.name ?? c.client.email

  return (
    <div className="flex flex-col">
      {error && <div className="p-4 text-center text-sm text-red-500">{t('manager.messages.loadError')}</div>}
    <div className="flex h-[calc(100vh-80px)] max-h-[750px] rounded-hm border bg-white overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-64 border-r flex flex-col shrink-0">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h2 className="text-sm font-bold text-gray-900">{t('common.messages')}</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {myConvs.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs text-gray-400 uppercase font-semibold tracking-wide">{t('manager.messages.myClients')}</div>
              {myConvs.map(c => (
                <button key={c.id} onClick={() => { setActive(c); setText('') }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b transition-colors ${
                    active?.id === c.id ? 'bg-blue-50 border-l-2 border-l-gray-900' : ''}`}>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={clientName(c)} image={c.client.image} size={8} dark />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-sm font-medium text-gray-900 truncate">{clientName(c)}</span>
                        {c.unreadCount > 0 && (
                          <span className="shrink-0 rounded-full bg-gray-900 text-white text-xs px-1.5 py-0.5 min-w-[18px] text-center">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      {c.messages[0] && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{c.messages[0].body}</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {otherConvs.length > 0 && (
            <>
              <div className="px-4 py-2 text-xs text-gray-400 uppercase font-semibold tracking-wide mt-1">{t('manager.messages.otherManagers')}</div>
              {otherConvs.map(c => (
                <button key={c.id} onClick={() => { setActive(c); setText('') }}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b ${active?.id === c.id ? 'bg-gray-100' : ''}`}>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={clientName(c)} image={c.client.image} size={8} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Lock className="h-3 w-3 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-500 truncate">{clientName(c)}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{c.manager.name ?? c.manager.email}</p>
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {convs.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-400">{t('manager.messages.noConversations')}</div>
          )}
        </div>
      </aside>

      {/* ── Chat area ── */}
      {active ? (
        <div className="flex flex-col flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b bg-white">
            <Avatar name={clientName(active)} image={active.client.image} size={9} dark />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-sm truncate">{clientName(active)}</div>
              <div className="text-xs text-gray-400">{t('manager.messages.client')}</div>
            </div>
            {active.readonly && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-500 text-xs px-2 py-0.5">
                <Lock className="h-3 w-3" />{t('manager.messages.readOnly')}
              </span>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 && (
              <div className="text-center text-sm text-gray-400 py-8">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                {t('manager.messages.noMessages')}
              </div>
            )}
            {messages.map(m => {
              const isMe = m.sender.id === myId
              const displayName = m.sender.name ?? m.sender.role
              return (
                <div key={m.id} className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar next to each message */}
                  <Avatar name={displayName} image={m.sender.image} size={7} dark={isMe} />
                  <div className={`flex flex-col max-w-xs ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && (
                      <p className="text-xs text-gray-400 mb-1 ml-1">{displayName}</p>
                    )}
                    <div className={`rounded-2xl px-4 py-2.5 text-sm ${
                      isMe
                        ? 'bg-gray-900 text-white rounded-br-sm'
                        : 'bg-white border text-gray-800 rounded-bl-sm shadow-sm'
                    }`}>
                      <p>{m.body}</p>
                      <p className={`text-xs mt-1 ${isMe ? 'text-white/50' : 'text-gray-400'}`}>
                        {new Date(m.createdAt).toLocaleTimeString('pt-PT', { hour:'2-digit', minute:'2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          {!active.readonly ? (
            <div className="flex items-center gap-2 px-4 py-3 border-t bg-white">
              <input value={text} onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder={t('manager.messages.placeholder')}
                className="flex-1 rounded-full border px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"/>
              <button onClick={send} disabled={sending || !text.trim()}
                className="rounded-full bg-gray-900 p-2.5 text-white hover:bg-gray-800 disabled:opacity-40">
                {sending ? <Loader2 className="h-4 w-4 animate-spin"/> : <Send className="h-4 w-4"/>}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 px-4 py-3 border-t bg-gray-50 text-xs text-gray-400">
              <Lock className="h-3.5 w-3.5"/>{t('manager.messages.otherManagerReadOnly')}
            </div>
          )}
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
