"use client"

import { useLocale } from "@/i18n/provider"
import {
  Brain, Phone, Shield, MessageCircle, Star, Globe, BarChart3,
  User, UserCheck, Eye, ArrowDown, Sparkles, ClipboardCheck,
} from "lucide-react"

/**
 * Hybrid flow map — shows how AI agents and humans coordinate, end-to-end,
 * for a layperson buyer to grasp the operating model. Three stages, three
 * lanes (AI / Human / Owner sees), connections between lanes.
 */

type Step = { icon: typeof Brain; label: string; sub?: string }

const STAGES: Array<{
  id: string
  title: string
  subtitle: string
  ai: Step[]
  human: Step[]
  owner: Step[]
}> = [
  {
    id: 'arrival',
    title: 'Reserva chega',
    subtitle: 'Hóspede reserva via Airbnb / Booking / direto',
    ai: [
      { icon: Brain,      label: 'AI Pricing',         sub: 'optimiza preço com 7 factores' },
      { icon: Shield,     label: 'AI Monitor',         sub: '43 verificações diárias' },
      { icon: BarChart3,  label: 'Market Intelligence',sub: 'compara com concorrência' },
    ],
    human: [
      { icon: UserCheck,  label: 'Manager',            sub: 'monitoriza pipeline' },
      { icon: User,       label: 'Crew Captain',       sub: 'agenda equipa local' },
    ],
    owner: [
      { icon: Eye,        label: 'Notificação no portal', sub: '"Nova reserva confirmada"' },
    ],
  },
  {
    id: 'stay',
    title: 'Estadia',
    subtitle: 'Hóspede chega, fica, parte',
    ai: [
      { icon: MessageCircle, label: 'Stay AI Chat 24/7',  sub: 'WiFi, códigos, dicas locais' },
      { icon: Sparkles,      label: 'Smart Lock',         sub: 'código temporário gerado' },
      { icon: Shield,        label: 'AI Monitor',         sub: 'flags eventos anómalos' },
    ],
    human: [
      { icon: User,          label: 'Crew',               sub: 'limpeza + check-in + fotos' },
      { icon: UserCheck,     label: 'Manager',            sub: 'recebe escalation se complexo' },
    ],
    owner: [
      { icon: Eye,           label: 'Estado live no portal', sub: '"Casa pronta ✓ · Hóspede dentro"' },
    ],
  },
  {
    id: 'after',
    title: 'Pós-checkout',
    subtitle: 'Feedback, payout, relatório',
    ai: [
      { icon: Phone,         label: 'VAGF Voice Agent',   sub: 'liga ao hóspede 24-48h depois' },
      { icon: Star,          label: 'Property Scorecard', sub: 'actualiza score live' },
      { icon: Brain,         label: 'Cross-Validate',     sub: 'Sonnet re-valida scores' },
      { icon: Globe,         label: 'Translation Agent',  sub: 'relatório no idioma do owner' },
    ],
    human: [
      { icon: ClipboardCheck,label: 'Crew Captain',       sub: 'aprova trabalho da Crew' },
      { icon: UserCheck,     label: 'Manager',            sub: 'mensagem pessoal mensal' },
    ],
    owner: [
      { icon: Eye,           label: 'Relatório PDF + payout', sub: 'na sua língua, com fotos' },
    ],
  },
]

export function HybridFlowMap() {
  const { t } = useLocale()
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden"
             style={{ background: '#0B1E3A' }}>
      {/* Subtle gold radial glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0"
           style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(176,138,62,0.10) 0%, transparent 60%)' }} />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest"
             style={{ color: '#B08A3E' }}>
            {t('flowMap.badge') || 'Como funciona, na prática'}
          </p>
          <h2 className="font-serif text-3xl font-bold leading-tight tracking-tight sm:text-4xl text-white">
            {t('flowMap.title') || 'AI executa o invisível. Pessoas tratam de si.'}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-300">
            {t('flowMap.subtitle') || 'Cada reserva passa por 3 estágios. Os agentes IA fazem o trabalho rotineiro 24/7. Os humanos (Manager, Crew, Captain) tratam das relações e decisões que importam. Você só vê os resultados.'}
          </p>
        </div>

        {/* Stages grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STAGES.map((stage, idx) => (
            <div key={stage.id} className="space-y-3">
              {/* Stage header */}
              <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-2"
                     style={{ background: 'rgba(176,138,62,0.15)', border: '1px solid rgba(176,138,62,0.3)' }}>
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#B08A3E' }}>
                    Estágio {idx + 1}
                  </span>
                </div>
                <h3 className="font-serif text-xl font-bold text-white">{stage.title}</h3>
                <p className="text-xs text-gray-400 mt-1">{stage.subtitle}</p>
              </div>

              {/* AI lane */}
              <div className="rounded-xl border p-4"
                   style={{ background: 'rgba(176,138,62,0.06)', borderColor: 'rgba(176,138,62,0.2)' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Sparkles className="h-3.5 w-3.5" style={{ color: '#B08A3E' }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#B08A3E' }}>
                    AI agentes
                  </span>
                </div>
                <ul className="space-y-2">
                  {stage.ai.map((s, i) => {
                    const Icon = s.icon
                    return (
                      <li key={i} className="flex items-start gap-2">
                        <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: '#B08A3E' }} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{s.label}</p>
                          {s.sub && <p className="text-[10px] text-gray-400 leading-snug">{s.sub}</p>}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* Connector */}
              <div className="flex justify-center">
                <ArrowDown className="h-4 w-4" style={{ color: 'rgba(176,138,62,0.5)' }} />
              </div>

              {/* Human lane */}
              <div className="rounded-xl border p-4 bg-white/5"
                   style={{ borderColor: 'rgba(255,255,255,0.15)' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <User className="h-3.5 w-3.5 text-white" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white">
                    Equipa humana
                  </span>
                </div>
                <ul className="space-y-2">
                  {stage.human.map((s, i) => {
                    const Icon = s.icon
                    return (
                      <li key={i} className="flex items-start gap-2">
                        <Icon className="h-4 w-4 mt-0.5 shrink-0 text-white" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-white truncate">{s.label}</p>
                          {s.sub && <p className="text-[10px] text-gray-400 leading-snug">{s.sub}</p>}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>

              {/* Connector */}
              <div className="flex justify-center">
                <ArrowDown className="h-4 w-4 text-white/40" />
              </div>

              {/* Owner sees lane */}
              <div className="rounded-xl border-2 p-4"
                   style={{ background: 'rgba(176,138,62,0.18)', borderColor: '#B08A3E' }}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Eye className="h-3.5 w-3.5" style={{ color: '#B08A3E' }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#B08A3E' }}>
                    O que vê (owner)
                  </span>
                </div>
                <ul className="space-y-2">
                  {stage.owner.map((s, i) => {
                    const Icon = s.icon
                    return (
                      <li key={i} className="flex items-start gap-2">
                        <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: '#B08A3E' }} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white">{s.label}</p>
                          {s.sub && <p className="text-[10px] text-gray-300 leading-snug italic">{s.sub}</p>}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Closing principle */}
        <div className="mt-12 text-center max-w-2xl mx-auto">
          <p className="text-sm sm:text-base font-serif italic" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {t('flowMap.principle') || 'Você não opera nada. AI cuida do trabalho 24/7. Pessoas reais cuidam das decisões importantes. Tudo o que chega ao seu painel está pronto para si.'}
          </p>
        </div>

      </div>
    </section>
  )
}
