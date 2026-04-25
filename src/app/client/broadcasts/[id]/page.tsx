"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, Send, Loader2, MessageCircle } from "lucide-react"

type Reply = {
  id: string
  bodyText: string
  createdAt: string
  author: { id: string; name: string | null; email: string; role: string; image: string | null }
}

type BroadcastDetail = {
  id: string
  subject: string
  bodyMarkdown: string
  ctaText: string | null
  ctaUrl: string | null
  sender: { id: string; name: string | null; email: string; image: string | null }
  sentAt: string | null
  language: string
  replies: Reply[]
}

const URL_FORBIDDEN_CHARS = new Set(['"', '<', '>', '\\', '^', '`', '{', '|', '}', ' ', '\t', '\n', '\r'])

// Validate a URL is safe to render — returns null if not.
function safeHref(url: string): string | null {
  if (!url || typeof url !== 'string') return null
  const trimmed = url.trim()
  if (!trimmed) return null
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed.charAt(i)
    const code = trimmed.charCodeAt(i)
    if (URL_FORBIDDEN_CHARS.has(ch)) return null
    if (code < 32 || code === 127) return null
  }
  try {
    const u = new URL(trimmed)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null
    return u.toString()
  } catch {
    return null
  }
}

// Tiny inline-only markdown render for the broadcast body.
function renderMarkdown(md: string): string {
  const escape = (s: string) => s
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

  const lines = escape(md.trim()).split('\n')
  const out: string[] = []
  let inList = false
  const flush = () => { if (inList) { out.push('</ul>'); inList = false } }
  const inline = (s: string) => s
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\W)\*(?!\s)([^*]+?)\*(?!\w)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, (_m, text, url) => {
      const safe = safeHref(url)
      if (!safe) return text // drop link, keep visible text
      return `<a href="${escape(safe)}" target="_blank" rel="noopener" style="color:#B08A3E;text-decoration:underline">${text}</a>`
    })

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) { flush(); continue }
    if (/^##\s+/.test(line)) {
      flush()
      out.push(`<h3 style="margin:24px 0 8px;font-size:18px;color:#0B1E3A;font-weight:700">${inline(line.replace(/^##\s+/, ''))}</h3>`)
      continue
    }
    if (/^[-•]\s+/.test(line)) {
      if (!inList) { out.push('<ul style="margin:8px 0 16px;padding-left:20px">'); inList = true }
      out.push(`<li style="margin:4px 0">${inline(line.replace(/^[-•]\s+/, ''))}</li>`)
      continue
    }
    flush()
    out.push(`<p style="margin:0 0 14px;line-height:1.65">${inline(line)}</p>`)
  }
  flush()
  return out.join('\n')
}

function Avatar({ name, image, size = 32 }: { name: string; image: string | null; size?: number }) {
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" className="rounded-full object-cover" style={{ height: size, width: size }} />
  }
  const initials = name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
         style={{ height: size, width: size, background: '#0B1E3A', color: '#B08A3E' }}>
      {initials}
    </div>
  )
}

export default function ClientBroadcastDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const [data, setData] = useState<BroadcastDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = () => {
    fetch(`/api/client/broadcasts/${id}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { if (id) load() }, [id])

  useEffect(() => {
    if (data?.replies?.length) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [data?.replies?.length])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim()) return
    setPosting(true)
    setError('')
    try {
      const res = await fetch(`/api/client/broadcasts/${id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bodyText: replyText.trim() }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.error ?? 'Failed to send')
        return
      }
      setReplyText('')
      load()
    } finally {
      setPosting(false)
    }
  }

  const fmt = (s: string) =>
    new Date(s).toLocaleString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  if (loading) {
    return <div className="p-6"><Loader2 className="h-5 w-5 animate-spin text-gray-400" /></div>
  }
  if (!data) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-sm text-gray-500">Mensagem não encontrada.</p>
        <Link href="/client/broadcasts" className="text-sm font-semibold mt-3 inline-flex items-center gap-1"
              style={{ color: '#B08A3E' }}>
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Link href="/client/broadcasts" className="text-xs font-semibold inline-flex items-center gap-1 text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-3.5 w-3.5" /> Mensagens
      </Link>

      {/* Broadcast card */}
      <article className="rounded-2xl border bg-white overflow-hidden"
               style={{ borderColor: '#E8E3D8' }}>
        <header className="px-6 py-5 border-b"
                style={{ background: 'linear-gradient(180deg, #FAF8F4 0%, #ffffff 100%)', borderColor: '#E8E3D8' }}>
          <div className="flex items-center gap-3">
            <Avatar name={data.sender.name ?? data.sender.email} image={data.sender.image} size={44} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold" style={{ color: '#0B1E3A' }}>
                {data.sender.name ?? 'HostMasters'}
              </p>
              <p className="text-[11px] uppercase tracking-widest" style={{ color: '#B08A3E' }}>
                Founder, HostMasters
              </p>
            </div>
            <span className="text-xs text-gray-400">{data.sentAt && fmt(data.sentAt)}</span>
          </div>
          <h1 className="text-xl font-bold mt-4" style={{ color: '#0B1E3A' }}>
            {data.subject}
          </h1>
        </header>
        <div className="px-6 py-5 text-[15px] text-gray-700"
             dangerouslySetInnerHTML={{ __html: renderMarkdown(data.bodyMarkdown) }} />
        {data.ctaText && safeHref(data.ctaUrl ?? '') && (
          <div className="px-6 pb-6">
            <a href={safeHref(data.ctaUrl ?? '') ?? '#'} target="_blank" rel="noopener"
               className="inline-block rounded-lg px-5 py-2.5 text-sm font-bold transition-all hover:brightness-110"
               style={{ background: '#B08A3E', color: '#0B1E3A' }}>
              {data.ctaText}
            </a>
          </div>
        )}
      </article>

      {/* Reply thread */}
      <section className="rounded-2xl border bg-white"
               style={{ borderColor: '#E8E3D8' }}>
        <header className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: '#E8E3D8' }}>
          <MessageCircle className="h-4 w-4" style={{ color: '#B08A3E' }} />
          <span className="text-sm font-bold" style={{ color: '#0B1E3A' }}>Continua a conversa</span>
        </header>

        {data.replies.length > 0 && (
          <div className="px-5 py-4 space-y-3 max-h-96 overflow-y-auto">
            {data.replies.map(r => {
              const isMe = r.author.role === 'CLIENT'
              return (
                <div key={r.id} className={`flex gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  {!isMe && <Avatar name={r.author.name ?? r.author.email} image={r.author.image} size={28} />}
                  <div className="max-w-[75%]">
                    <div className={`rounded-2xl px-4 py-2.5 text-sm ${isMe ? 'rounded-br-sm text-white' : 'rounded-bl-sm border'}`}
                         style={isMe
                           ? { background: '#0B1E3A' }
                           : { background: '#FAF8F4', borderColor: '#E8E3D8', color: '#374151' }}>
                      <p className="whitespace-pre-wrap break-words">{r.bodyText}</p>
                    </div>
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-right text-gray-400' : 'text-gray-400'}`}>
                      {!isMe && (r.author.name ?? 'Founder')} · {fmt(r.createdAt)}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}

        <form onSubmit={submit} className="px-5 py-4 border-t" style={{ borderColor: '#E8E3D8' }}>
          <textarea
            value={replyText}
            onChange={e => setReplyText(e.target.value)}
            rows={3}
            placeholder="Escreve a tua resposta…"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: '#E8E3D8' }}
            maxLength={5000}
          />
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={posting || !replyText.trim()}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 hover:brightness-110"
              style={{ background: '#0B1E3A', color: '#ffffff' }}
            >
              {posting ? <><Loader2 className="h-4 w-4 animate-spin" /> A enviar…</> : <><Send className="h-4 w-4" /> Enviar</>}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}
