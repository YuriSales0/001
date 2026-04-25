'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MessageCircle, Lock, Send, Eye, Loader2, Plus, X, CheckCircle2, Globe, Users } from 'lucide-react'
import { showToast } from '@/components/hm/toast'

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
  const [tab, setTab] = useState<'inbox' | 'broadcasts'>('inbox')
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
    const tick = () => {
      if (!document.hidden) fetchMessages(active.id)
    }
    const id = setInterval(tick, 4000)
    const onVisible = () => {
      if (!document.hidden) fetchMessages(active.id)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
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
        <h1 className="text-2xl font-serif font-bold text-gray-900">Mensagens</h1>
        {tab === 'inbox' ? (
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <Lock className="h-3.5 w-3.5"/> Acesso só de leitura — {convs.length} conversa(s)
          </p>
        ) : (
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <Send className="h-3.5 w-3.5"/> Canal directo do founder para os assinantes
          </p>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b mb-4">
        <button
          onClick={() => setTab('inbox')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'inbox' ? 'border-hm-gold text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Conversas Manager ↔ Cliente
        </button>
        <button
          onClick={() => setTab('broadcasts')}
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'broadcasts' ? 'border-hm-gold text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Broadcasts (founder → assinantes)
        </button>
      </div>

      {tab === 'broadcasts' ? <BroadcastsTab /> : (
      <div className="flex h-[calc(100vh-260px)] max-h-[650px] rounded-hm border bg-white overflow-hidden">
        {/* Sidebar */}
        <aside className="w-72 border-r flex flex-col shrink-0">
          <div className="p-3 border-b">
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Pesquisar…"
              className="w-full rounded-lg border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"/>
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
      )}
    </div>
  )
}

// ─── Broadcasts Tab ───────────────────────────────────────────────────────────

type Broadcast = {
  id: string
  subject: string
  bodyMarkdown: string
  ctaText: string | null
  ctaUrl: string | null
  audienceType: string
  audienceValue: string | null
  status: string
  sentAt: string | null
  recipientCount: number
  failedCount: number
  createdAt: string
  sender: { id: string; name: string | null; email: string }
}

const LANGUAGES: { code: string; label: string }[] = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'fr', label: 'Français' },
  { code: 'sv', label: 'Svenska' },
  { code: 'da', label: 'Dansk' },
]

function BroadcastsTab() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [loading, setLoading] = useState(true)
  const [showComposer, setShowComposer] = useState(false)
  const [openThreads, setOpenThreads] = useState<string | null>(null) // broadcastId

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/broadcasts')
    if (res.ok) setBroadcasts(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const fmt = (s: string) =>
    new Date(s).toLocaleString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  const audienceLabel = (b: Broadcast) => {
    switch (b.audienceType) {
      case 'ALL_PAID': return 'Todos os assinantes pagos'
      case 'ALL_CLIENTS': return 'Todos os clientes'
      case 'BY_PLAN': return `Plano ${b.audienceValue}`
      case 'BY_LANGUAGE': return `Idioma ${b.audienceValue?.toUpperCase()}`
      default: return b.audienceType
    }
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-600',
      SENDING: 'bg-amber-100 text-amber-700',
      SENT: 'bg-emerald-100 text-emerald-700',
      FAILED: 'bg-red-100 text-red-700',
    }
    return map[s] ?? 'bg-gray-100 text-gray-600'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-700">Histórico</h2>
        <button
          onClick={() => setShowComposer(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-hm-black text-white px-4 py-2.5 text-sm font-semibold hover:bg-hm-black/90"
          style={{ background: '#0B1E3A' }}
        >
          <Plus className="h-4 w-4" /> Novo broadcast
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
      ) : broadcasts.length === 0 ? (
        <div className="rounded-hm border bg-white py-16 text-center text-sm text-gray-400">
          <Send className="h-8 w-8 mx-auto mb-2 text-gray-200" />
          Ainda não enviaste nenhum broadcast. Clica em &ldquo;Novo broadcast&rdquo; para começar.
        </div>
      ) : (
        <div className="space-y-2">
          {broadcasts.map(b => {
            const isOpen = openThreads === b.id
            return (
              <div key={b.id} className="rounded-hm border bg-white">
                <button
                  onClick={() => b.status === 'SENT' ? setOpenThreads(isOpen ? null : b.id) : null}
                  className={`w-full text-left p-4 ${b.status === 'SENT' ? 'cursor-pointer hover:bg-gray-50' : ''} transition-colors`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadge(b.status)}`}>
                          {b.status}
                        </span>
                        <h3 className="font-semibold text-gray-900 truncate">{b.subject}</h3>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{b.bodyMarkdown.slice(0, 160)}{b.bodyMarkdown.length > 160 && '…'}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                        <span><Users className="inline h-3 w-3 mr-1" />{audienceLabel(b)}</span>
                        {b.sentAt && <span>Enviado: {fmt(b.sentAt)}</span>}
                        {b.status === 'SENT' && (
                          <span className="text-emerald-600">
                            <CheckCircle2 className="inline h-3 w-3 mr-1" />
                            {b.recipientCount} entregues
                            {b.failedCount > 0 && <span className="text-red-500 ml-1">· {b.failedCount} falhados</span>}
                          </span>
                        )}
                        {b.status === 'DRAFT' && <span className="text-gray-500">Criado: {fmt(b.createdAt)}</span>}
                      </div>
                    </div>
                    {b.status === 'SENT' && (
                      <span className="text-xs text-gray-400 shrink-0">{isOpen ? 'Fechar' : 'Ver respostas →'}</span>
                    )}
                  </div>
                </button>
                {isOpen && <BroadcastThreads broadcastId={b.id} />}
              </div>
            )
          })}
        </div>
      )}

      {showComposer && (
        <BroadcastComposer
          onClose={() => setShowComposer(false)}
          onSent={() => { setShowComposer(false); load() }}
        />
      )}
    </div>
  )
}

// ─── Composer ─────────────────────────────────────────────────────────────────

function BroadcastComposer({ onClose, onSent }: { onClose: () => void; onSent: () => void }) {
  const [step, setStep] = useState<'compose' | 'preview' | 'sending'>('compose')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [ctaText, setCtaText] = useState('')
  const [ctaUrl, setCtaUrl] = useState('')
  const [audienceType, setAudienceType] = useState<'ALL_PAID' | 'ALL_CLIENTS' | 'BY_PLAN' | 'BY_LANGUAGE'>('ALL_PAID')
  const [audienceValue, setAudienceValue] = useState('')
  const [sourceLocale, setSourceLocale] = useState('pt')
  const [audienceCount, setAudienceCount] = useState<number | null>(null)
  const [previewHtml, setPreviewHtml] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number; total: number } | null>(null)

  // Live audience count
  useEffect(() => {
    const t = setTimeout(async () => {
      const res = await fetch('/api/admin/broadcasts/audience-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audienceType, audienceValue: audienceValue || null }),
      })
      if (res.ok) {
        const data = await res.json()
        setAudienceCount(data.count)
      } else {
        setAudienceCount(null)
      }
    }, 200)
    return () => clearTimeout(t)
  }, [audienceType, audienceValue])

  const goPreview = async () => {
    if (subject.trim().length < 3 || body.trim().length < 10) {
      showToast('Assunto e corpo são obrigatórios', 'error')
      return
    }
    const res = await fetch('/api/admin/broadcasts/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, bodyMarkdown: body, ctaText: ctaText || null, ctaUrl: ctaUrl || null }),
    })
    if (res.ok) {
      const data = await res.json()
      setPreviewHtml(data.html)
      setStep('preview')
    } else {
      showToast('Falhou a gerar preview', 'error')
    }
  }

  const send = async () => {
    setSending(true)
    setStep('sending')
    try {
      // 1) Create broadcast as draft
      const draftRes = await fetch('/api/admin/broadcasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          bodyMarkdown: body,
          ctaText: ctaText || null,
          ctaUrl: ctaUrl || null,
          audienceType,
          audienceValue: audienceValue || null,
        }),
      })
      if (!draftRes.ok) {
        const e = await draftRes.json().catch(() => ({}))
        showToast(e.error ?? 'Falhou criar broadcast', 'error')
        setSending(false)
        setStep('preview')
        return
      }
      const draft = await draftRes.json()

      // 2) Send (translates + dispatches)
      const sendRes = await fetch(`/api/admin/broadcasts/${draft.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceLocale }),
      })
      if (!sendRes.ok) {
        const e = await sendRes.json().catch(() => ({}))
        showToast(e.error ?? 'Falhou envio', 'error')
        setSending(false)
        setStep('preview')
        return
      }
      const data = await sendRes.json()
      setResult({ sent: data.sent, failed: data.failed, total: data.total })
    } catch {
      showToast('Erro ao enviar', 'error')
      setStep('preview')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-4xl rounded-xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-5 py-4 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Novo Broadcast</h2>
            <p className="text-xs text-gray-500">
              {step === 'compose' && 'Compõe a mensagem em qualquer língua. Tradução automática para todos os idiomas no envio.'}
              {step === 'preview' && 'Pré-visualização — assim vai chegar aos teus assinantes (na tua língua).'}
              {step === 'sending' && (sending ? 'A traduzir e enviar…' : 'Resultado do envio')}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {step === 'compose' && (
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Assunto</label>
                <input
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  maxLength={200}
                  placeholder="ex: Novidades de Maio"
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Corpo (markdown simples — **negrito**, *itálico*, [link](url), - listas, ## subtítulos)
                </label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  rows={10}
                  placeholder="Olá!&#10;&#10;Queria partilhar contigo as novidades..."
                  className="w-full rounded-lg border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-hm-gold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Botão CTA (opcional)</label>
                  <input
                    value={ctaText}
                    onChange={e => setCtaText(e.target.value)}
                    maxLength={60}
                    placeholder="ex: Entrar no portal"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">URL do CTA</label>
                  <input
                    value={ctaUrl}
                    onChange={e => setCtaUrl(e.target.value)}
                    placeholder="https://hostmasters.es/client"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
                  />
                </div>
              </div>

              <hr className="border-gray-200" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Audience</label>
                  <select
                    value={audienceType}
                    onChange={e => { setAudienceType(e.target.value as typeof audienceType); setAudienceValue('') }}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
                  >
                    <option value="ALL_PAID">Todos os assinantes pagos (Basic+)</option>
                    <option value="ALL_CLIENTS">Todos os clientes</option>
                    <option value="BY_PLAN">Por plano</option>
                    <option value="BY_LANGUAGE">Por idioma</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {audienceType === 'BY_PLAN' && 'Plano'}
                    {audienceType === 'BY_LANGUAGE' && 'Idioma'}
                    {(audienceType === 'ALL_PAID' || audienceType === 'ALL_CLIENTS') && 'Filtro'}
                  </label>
                  {audienceType === 'BY_PLAN' ? (
                    <select
                      value={audienceValue}
                      onChange={e => setAudienceValue(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
                    >
                      <option value="">Selecciona…</option>
                      <option value="STARTER">Starter</option>
                      <option value="BASIC">Basic</option>
                      <option value="MID">Mid</option>
                      <option value="PREMIUM">Premium</option>
                    </select>
                  ) : audienceType === 'BY_LANGUAGE' ? (
                    <select
                      value={audienceValue}
                      onChange={e => setAudienceValue(e.target.value)}
                      className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
                    >
                      <option value="">Selecciona…</option>
                      {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                    </select>
                  ) : (
                    <input disabled placeholder="—" className="w-full rounded-lg border bg-gray-50 px-3 py-2 text-sm text-gray-400" />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Língua de origem (em que estás a escrever)</label>
                <select
                  value={sourceLocale}
                  onChange={e => setSourceLocale(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
                >
                  {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                </select>
              </div>

              <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 flex items-center gap-2">
                <Globe className="h-4 w-4 shrink-0" />
                {audienceCount !== null
                  ? <span>Vai enviar para <strong>{audienceCount}</strong> destinatário(s) — traduzido automaticamente para as línguas deles.</span>
                  : 'A calcular destinatários…'}
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="p-5 space-y-3">
              <div className="rounded-lg bg-gray-50 border px-3 py-2 text-xs text-gray-600">
                <strong>Para:</strong> {audienceCount ?? '?'} destinatário(s) · <strong>Língua origem:</strong> {LANGUAGES.find(l => l.code === sourceLocale)?.label}
              </div>
              <iframe
                srcDoc={previewHtml}
                title="Preview"
                className="w-full h-[480px] rounded-lg border bg-white"
              />
            </div>
          )}

          {step === 'sending' && (
            <div className="p-10 text-center">
              {sending ? (
                <div>
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-700">A traduzir e a enviar…</p>
                  <p className="text-xs text-gray-500 mt-1">Pode demorar 30-60s consoante o número de línguas únicas.</p>
                </div>
              ) : result && (
                <div>
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                  <p className="text-lg font-bold text-gray-900">Enviado</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {result.sent} de {result.total} entregues
                    {result.failed > 0 && <span className="text-red-600"> · {result.failed} falharam</span>}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {step !== 'sending' && (
          <div className="border-t px-5 py-3 flex justify-between items-center shrink-0 bg-gray-50">
            {step === 'compose' ? (
              <>
                <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
                <button
                  onClick={goPreview}
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-800"
                >
                  <Eye className="h-4 w-4" /> Pré-visualizar
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setStep('compose')} className="text-sm text-gray-500 hover:text-gray-700">← Voltar</button>
                <button
                  onClick={send}
                  disabled={!audienceCount}
                  className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold disabled:opacity-50"
                  style={{ background: '#B08A3E', color: '#0B1E3A' }}
                >
                  <Send className="h-4 w-4" /> Enviar a {audienceCount} destinatário(s)
                </button>
              </>
            )}
          </div>
        )}
        {step === 'sending' && !sending && result && (
          <div className="border-t px-5 py-3 flex justify-end shrink-0 bg-gray-50">
            <button
              onClick={onSent}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-800"
            >
              Fechar
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Broadcast threads (admin view) ───────────────────────────────────────────
type ThreadOwner = { id: string; name: string | null; email: string; image: string | null }
type ThreadMessage = {
  id: string
  bodyText: string
  createdAt: string
  readAt: string | null
  author: { id: string; name: string | null; email: string; role: string }
}
type Thread = {
  owner: ThreadOwner
  messages: ThreadMessage[]
  lastAt: string
  unreadFromClient: number
}

function BroadcastThreads({ broadcastId }: { broadcastId: string }) {
  const [threads, setThreads] = useState<Thread[]>([])
  const [loading, setLoading] = useState(true)
  const [activeOwnerId, setActiveOwnerId] = useState<string | null>(null)

  const load = useCallback(() => {
    setLoading(true)
    fetch(`/api/admin/broadcasts/${broadcastId}/threads`)
      .then(r => r.ok ? r.json() : [])
      .then(d => {
        setThreads(d)
        if (d.length > 0 && !activeOwnerId) setActiveOwnerId(d[0].owner.id)
        setLoading(false)
      })
      .catch(() => setLoading(false))
    // activeOwnerId intentionally omitted from deps to avoid loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [broadcastId])

  useEffect(() => { load() }, [load])

  const active = threads.find(t => t.owner.id === activeOwnerId)

  return (
    <div className="border-t bg-gray-50/50">
      {loading ? (
        <div className="p-6 flex justify-center"><Loader2 className="h-4 w-4 animate-spin text-gray-400" /></div>
      ) : threads.length === 0 ? (
        <p className="p-6 text-center text-xs text-gray-400">Ainda sem respostas dos assinantes.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 min-h-[300px]">
          {/* Threads list */}
          <div className="border-r bg-white">
            <div className="px-3 py-2 border-b text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              {threads.length} thread(s)
            </div>
            <div className="overflow-y-auto max-h-[400px]">
              {threads.map(t => (
                <button
                  key={t.owner.id}
                  onClick={() => setActiveOwnerId(t.owner.id)}
                  className={`w-full text-left px-3 py-2.5 border-b transition-colors hover:bg-gray-50 ${
                    activeOwnerId === t.owner.id ? 'bg-amber-50/60' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                         style={{ background: '#0B1E3A', color: '#B08A3E' }}>
                      {(t.owner.name ?? t.owner.email).split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">{t.owner.name ?? t.owner.email}</p>
                      <p className="text-[10px] text-gray-500">{t.messages.length} mensagens</p>
                    </div>
                    {t.unreadFromClient > 0 && (
                      <span className="inline-flex items-center justify-center h-4 min-w-[16px] rounded-full bg-amber-500 text-white text-[9px] font-bold px-1">
                        {t.unreadFromClient}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Thread view */}
          {active ? (
            <div className="sm:col-span-2 flex flex-col bg-white">
              <ThreadView broadcastId={broadcastId} thread={active} onMessageSent={load} />
            </div>
          ) : (
            <div className="sm:col-span-2 flex items-center justify-center text-xs text-gray-400">
              Selecciona um assinante
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ThreadView({
  broadcastId,
  thread,
  onMessageSent,
}: {
  broadcastId: string
  thread: Thread
  onMessageSent: () => void
}) {
  const [reply, setReply] = useState('')
  const [posting, setPosting] = useState(false)

  const fmtT = (s: string) =>
    new Date(s).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reply.trim()) return
    setPosting(true)
    try {
      const res = await fetch(`/api/admin/broadcasts/${broadcastId}/threads/${thread.owner.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bodyText: reply.trim() }),
      })
      if (res.ok) {
        setReply('')
        onMessageSent()
      } else {
        showToast('Falhou enviar resposta', 'error')
      }
    } finally {
      setPosting(false)
    }
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
        {thread.messages.map(m => {
          const isAdmin = m.author.role === 'ADMIN'
          return (
            <div key={m.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%]">
                <div className={`rounded-2xl px-3 py-2 text-sm ${isAdmin ? 'rounded-br-sm text-white' : 'rounded-bl-sm border'}`}
                     style={isAdmin
                       ? { background: '#0B1E3A' }
                       : { background: '#FAF8F4', borderColor: '#E8E3D8', color: '#374151' }}>
                  <p className="whitespace-pre-wrap break-words">{m.bodyText}</p>
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {isAdmin ? 'Tu' : (m.author.name ?? thread.owner.email)} · {fmtT(m.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
      </div>
      <form onSubmit={submit} className="border-t p-3" style={{ borderColor: '#E8E3D8' }}>
        <div className="flex gap-2">
          <input
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder={`Responder a ${thread.owner.name ?? thread.owner.email}…`}
            className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
            maxLength={5000}
          />
          <button
            type="submit"
            disabled={posting || !reply.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold disabled:opacity-50"
            style={{ background: '#B08A3E', color: '#0B1E3A' }}
          >
            {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>
      </form>
    </>
  )
}
