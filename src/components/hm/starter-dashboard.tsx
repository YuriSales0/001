"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Zap, ArrowRight, Check, Camera, Package, Home, Wrench, FileText,
  Sparkles, Lock, TrendingUp,
} from "lucide-react"
import { ONE_TIME_SERVICES, type OneTimeService } from "@/lib/platform-catalog"

const ICONS: Record<string, any> = {
  Camera, Lock, Wrench, FileText, Package, Home, Sparkles,
}

export function StarterDashboard() {
  const [requesting, setRequesting] = useState<string | null>(null)
  const [requested, setRequested] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const requestService = async (s: OneTimeService) => {
    if (requesting) return
    setRequesting(s.id)
    const res = await fetch('/api/client/service-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId: s.id }),
    })
    setRequesting(null)
    if (res.ok) setRequested(prev => ({ ...prev, [s.id]: true }))
  }

  // Client-only render — prevents hydration mismatches from locale cookies,
  // toLocaleString, or any browser-specific DOM diffs.
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-36 rounded-2xl bg-gray-100 animate-pulse" />
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ═══ BANNER — compact, links to /client/plus ═══ */}
      <Link href="/client/plus" className="block group">
        <div className="rounded-2xl overflow-hidden relative transition-transform group-hover:scale-[1.003]"
          style={{ background: 'linear-gradient(135deg, #0B1E3A 0%, #142B4D 60%, #1F3A66 100%)' }}>
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }} />
          <div className="relative px-6 py-6 md:px-8 md:py-7 text-white flex items-center justify-between gap-6">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest mb-2"
                style={{ color: '#D4AF5A' }}>
                <TrendingUp className="h-3.5 w-3.5" /> O seu imóvel pode render muito mais
              </div>
              <h2 className="text-xl md:text-2xl font-serif font-bold leading-tight text-white">
                Alugue a sua propriedade a curto prazo com a HostMasters
                e <span style={{ color: '#D4AF5A' }}>rentabilize até +25%</span>.
              </h2>
              <p className="text-sm mt-2 max-w-xl" style={{ color: 'rgba(255,255,255,0.75)' }}>
                Simulador de receita · Veja quanto ganha com cada plano · Compare assinatura vs avulso
              </p>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-all group-hover:scale-105"
                style={{ background: '#D4AF5A', color: '#0B1E3A' }}>
                Ver simulação <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </div>
        </div>
      </Link>

      {/* ═══ ONE-TIME SERVICES grid ═══ */}
      <div>
        <h2 className="text-xl font-serif font-bold text-hm-black mb-1">Serviços para o seu imóvel</h2>
        <p className="text-sm text-gray-500 mb-4">
          Sem assinatura. Paga apenas o que precisa, quando precisa.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ONE_TIME_SERVICES.map(s => {
            const Icon = ICONS[s.icon] ?? Package
            const done = requested[s.id]
            return (
              <div key={s.id} className="rounded-xl border bg-white p-4 flex flex-col gap-2.5 hover:shadow-md transition-shadow relative">
                {s.popular && (
                  <span className="absolute -top-2 left-3 text-[9px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5"
                    style={{ background: '#B08A3E', color: '#0B1E3A' }}>
                    Popular
                  </span>
                )}
                <div className="flex items-start justify-between">
                  <div className="h-9 w-9 rounded-lg flex items-center justify-center"
                    style={{ background: 'rgba(176,138,62,0.1)' }}>
                    <Icon className="h-4 w-4" style={{ color: '#B08A3E' }} />
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-hm-black">€{s.price}</p>
                    {s.durationLabel && <p className="text-[9px] text-gray-400">{s.durationLabel}</p>}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-sm text-hm-black mb-0.5 leading-tight">{s.title}</h3>
                  <p className="text-[11px] text-gray-500 leading-relaxed">{s.desc.slice(0, 80)}…</p>
                </div>
                <button onClick={() => requestService(s)} disabled={!!requesting || done}
                  className={`w-full rounded-lg py-2 text-xs font-bold transition-all ${
                    done
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'text-white hover:opacity-90 disabled:opacity-50'
                  }`}
                  style={done ? {} : { background: '#0B1E3A' }}>
                  {done
                    ? <><Check className="inline h-3 w-3 mr-1" /> Pedido enviado</>
                    : requesting === s.id
                    ? 'A enviar…'
                    : 'Solicitar'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
