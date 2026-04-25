"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Sparkles, RefreshCw, Loader2, ChevronRight, AlertOctagon, Clock,
  CheckCircle2, MessageSquare, X, Copy, ExternalLink,
} from "lucide-react"

type ActionItem = {
  id: string
  type: 'lead' | 'client' | 'task' | 'opportunity'
  priority: 'high' | 'medium' | 'low'
  title: string
  context: string
  suggestedAction: string
  draftMessage?: string | null
  linkedHref?: string | null
}

type Briefing = {
  generatedAt: string
  managerName: string
  itemCount: number
  items: ActionItem[]
  cached?: boolean
}

const PRIORITY_STYLE: Record<string, { bg: string; border: string; text: string; label: string }> = {
  high:   { bg: 'rgba(220,38,38,0.06)',   border: '#fecaca', text: '#dc2626', label: 'High' },
  medium: { bg: 'rgba(176,138,62,0.07)',  border: '#e8d9b6', text: '#B08A3E', label: 'Medium' },
  low:    { bg: 'rgba(11,30,58,0.04)',    border: '#e5e7eb', text: '#0B1E3A', label: 'Low' },
}

const TYPE_LABEL: Record<string, string> = {
  lead: 'Lead',
  client: 'Cliente',
  task: 'Tarefa',
  opportunity: 'Oportunidade',
}

const DISMISS_KEY = 'hm_manager_copilot_dismissed'

function loadDismissed(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(DISMISS_KEY)
    if (!raw) return new Set()
    return new Set(JSON.parse(raw) as string[])
  } catch { return new Set() }
}

function saveDismissed(set: Set<string>) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(DISMISS_KEY, JSON.stringify(Array.from(set))) } catch {}
}

export function ManagerCopilot() {
  const [briefing, setBriefing] = useState<Briefing | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const load = async (force = false) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/manager/ai-briefing${force ? '?refresh=1' : ''}`)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to load briefing')
        return
      }
      const data: Briefing = await res.json()
      setBriefing(data)
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setDismissed(loadDismissed())
    load(false)
  }, [])

  const dismiss = (id: string) => {
    const next = new Set(dismissed)
    next.add(id)
    setDismissed(next)
    saveDismissed(next)
  }

  const undismissAll = () => {
    setDismissed(new Set())
    saveDismissed(new Set())
  }

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 1500)
    } catch {}
  }

  const visible = (briefing?.items ?? []).filter(i => !dismissed.has(i.id))
  const dismissedCount = (briefing?.items ?? []).length - visible.length

  return (
    <div className="rounded-2xl border bg-white overflow-hidden"
         style={{ borderColor: '#E8E3D8' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b"
           style={{ background: 'linear-gradient(180deg, rgba(176,138,62,0.05) 0%, #ffffff 100%)', borderColor: '#E8E3D8' }}>
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg flex items-center justify-center"
               style={{ background: 'rgba(176,138,62,0.12)' }}>
            <Sparkles className="h-4.5 w-4.5" style={{ color: '#B08A3E' }} />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest" style={{ color: '#0B1E3A' }}>
              AI Co-pilot
            </h2>
            <p className="text-[11px] text-gray-500">
              {loading ? 'A analisar a tua carteira…'
                : briefing
                  ? `${visible.length} acção${visible.length === 1 ? '' : 'es'} hoje${briefing.cached ? ' · cache' : ''}`
                  : 'Pronto'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dismissedCount > 0 && (
            <button onClick={undismissAll}
                    className="text-[11px] text-gray-500 hover:text-gray-700">
              Recuperar {dismissedCount} dispensada{dismissedCount === 1 ? '' : 's'}
            </button>
          )}
          <button onClick={() => load(true)}
                  disabled={loading}
                  className="rounded-lg p-2 hover:bg-gray-100 disabled:opacity-50"
                  title="Forçar nova análise">
            <RefreshCw className={`h-4 w-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Body */}
      {loading && !briefing ? (
        <div className="px-5 py-10 text-center">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-xs text-gray-500">Co-pilot a preparar o teu briefing…</p>
        </div>
      ) : error ? (
        <div className="px-5 py-10 text-center">
          <AlertOctagon className="h-5 w-5 text-red-500 mx-auto mb-2" />
          <p className="text-xs text-red-600">{error}</p>
          <button onClick={() => load(true)} className="text-xs underline mt-2 text-gray-500 hover:text-gray-700">
            Tentar novamente
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-semibold" style={{ color: '#0B1E3A' }}>Tudo em dia</p>
          <p className="text-xs text-gray-500 mt-1">Sem acções urgentes para hoje. Boa altura para trabalho profundo.</p>
        </div>
      ) : (
        <ul className="divide-y" style={{ borderColor: '#f5f0e3' }}>
          {visible.map(item => {
            const style = PRIORITY_STYLE[item.priority] ?? PRIORITY_STYLE.low
            const isOpen = expanded === item.id
            return (
              <li key={item.id} className="hover:bg-amber-50/20 transition-colors">
                <div className="px-5 py-3">
                  <div className="flex items-start gap-3">
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0 mt-0.5"
                          style={{ background: style.bg, border: `1px solid ${style.border}`, color: style.text }}>
                      {style.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{item.context}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px]">
                        <span className="text-gray-400">{TYPE_LABEL[item.type] ?? item.type}</span>
                        {item.linkedHref && (
                          <Link href={item.linkedHref}
                                className="inline-flex items-center gap-1 font-semibold"
                                style={{ color: '#B08A3E' }}>
                            Abrir <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                        <button onClick={() => setExpanded(isOpen ? null : item.id)}
                                className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700">
                          {isOpen ? 'Fechar' : 'Detalhes'} <ChevronRight className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                        </button>
                      </div>
                    </div>
                    <button onClick={() => dismiss(item.id)}
                            className="text-gray-300 hover:text-gray-600 p-1 -mr-1"
                            title="Dispensar">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {isOpen && (
                    <div className="mt-3 ml-12 space-y-2">
                      <div className="rounded-lg p-3 bg-gray-50 border" style={{ borderColor: '#E8E3D8' }}>
                        <p className="text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: '#B08A3E' }}>
                          Próximo passo
                        </p>
                        <p className="text-xs text-gray-700">{item.suggestedAction}</p>
                      </div>

                      {item.draftMessage && (
                        <div className="rounded-lg p-3 border" style={{ background: 'rgba(176,138,62,0.04)', borderColor: '#E8E3D8' }}>
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5" style={{ color: '#B08A3E' }}>
                              <MessageSquare className="h-3 w-3" /> Draft sugerido
                            </p>
                            <button
                              onClick={() => copy(item.draftMessage!, item.id)}
                              className="inline-flex items-center gap-1 text-[10px] text-gray-500 hover:text-gray-700"
                            >
                              {copied === item.id
                                ? <><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Copiado</>
                                : <><Copy className="h-3 w-3" /> Copiar</>}
                            </button>
                          </div>
                          <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{item.draftMessage}</p>
                          <p className="text-[10px] text-gray-400 italic mt-2">
                            Revê e ajusta antes de enviar. AI sugere — tu decides.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      {briefing && !loading && (
        <div className="px-5 py-2.5 border-t bg-gray-50 flex items-center justify-between"
             style={{ borderColor: '#E8E3D8' }}>
          <p className="text-[10px] text-gray-400 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Gerado {new Date(briefing.generatedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-[10px] text-gray-400 italic">AI augmenta. Manager decide.</p>
        </div>
      )}
    </div>
  )
}
