'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, X, Send, Loader2, AlertCircle } from 'lucide-react'

type Message = {
  role: 'user' | 'assistant'
  content: string
}

type Props = {
  role?: string
}

const PLACEHOLDER: Record<string, string> = {
  CREW:    'Ex: Como preencho o relatório de checkout?',
  MANAGER: 'Ex: Como calculo a comissão de um payout MID?',
  ADMIN:   'Ex: Quais anomalias estão activas no monitor?',
  CLIENT:  'Ex: Quando recebo o próximo pagamento?',
}

export function AiChat({ role = 'ADMIN' }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState<boolean | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [open, messages])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const userMsg: Message = { role: 'user', content: text }
    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: updated.slice(-10), // últimas 10 mensagens como contexto
        }),
      })
      const data = await res.json()
      setReady(data.ready ?? false)
      setMessages(prev => [...prev, { role: 'assistant', content: data.answer ?? data.error ?? 'Erro ao obter resposta.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro de ligação. Tenta novamente.' }])
    } finally {
      setLoading(false)
    }
  }

  const placeholder = PLACEHOLDER[role] ?? 'Coloca a tua questão…'

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-all ${
          open ? 'bg-gray-800 rotate-90' : 'bg-navy-900 hover:bg-navy-800'
        }`}
        title="Assistente HostMasters"
      >
        {open
          ? <X className="h-5 w-5 text-white" />
          : <Bot className="h-5 w-5 text-white" />
        }
        {/* Unread dot — só quando fechado e há mensagens */}
        {!open && messages.length > 0 && ready === false && (
          <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-amber-400 border-2 border-white" />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-20 right-6 z-40 flex flex-col rounded-2xl border bg-white shadow-2xl"
          style={{ width: 340, height: 480 }}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 rounded-t-2xl border-b bg-navy-900 px-4 py-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white">Assistente HM</p>
              <p className="text-[10px] text-white/50">
                {ready === false ? 'Configuração pendente' : ready === true ? 'Claude Haiku · activo' : role}
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/40 hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 gap-2">
                <Bot className="h-8 w-8 text-gray-200" />
                <p className="text-xs">Olá! Sou o assistente interno da HostMasters.<br />Posso ajudar com procedimentos, regras financeiras e operações.</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                    m.role === 'user'
                      ? 'bg-navy-900 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                  style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-xl rounded-bl-sm px-3 py-2">
                  <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Not configured banner */}
          {ready === false && messages.length > 0 && (
            <div className="mx-3 mb-2 flex items-center gap-1.5 rounded-lg bg-amber-50 border border-amber-200 px-3 py-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />
              <p className="text-[10px] text-amber-700">Adiciona <code className="font-mono">ANTHROPIC_API_KEY</code> no Vercel para activar</p>
            </div>
          )}

          {/* Input */}
          <div className="border-t p-3 flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
              placeholder={placeholder}
              disabled={loading}
              className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900 disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="rounded-lg bg-navy-900 p-2 text-white hover:bg-navy-800 disabled:opacity-40 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
