"use client"

import { useLocale } from "@/i18n/provider"
import {
  TrendingUp, Sparkles, AlertCircle, Star, Calendar, Globe,
  ArrowRight, User,
} from "lucide-react"

/**
 * Owner Value Outcomes — answers "what does this mean for MY property?"
 *
 * Different from AiToolsShowcase (which describes the agents) and
 * HybridFlowMap (which shows the lifecycle): this section lists the 6
 * concrete results the owner cares about, each as agent × human → outcome.
 */

type Outcome = {
  icon: typeof TrendingUp
  metric: string         // big number / phrase
  metricSub?: string     // small label under metric
  title: string          // outcome headline
  agent: string
  human: string
  description: string
}

const OUTCOMES: Outcome[] = [
  {
    icon: TrendingUp,
    metric: '+18 — 25%',
    metricSub: 'receita extra/ano',
    title: 'Mais dinheiro por reserva, sem mais trabalho seu',
    agent: 'AI Pricing',
    human: 'Manager valida ajustes',
    description: 'Em vez de tarifa fixa, o preço sobe em alta procura e protege ocupação em época baixa. Manager garante que nunca fica acima do que o mercado aceita.',
  },
  {
    icon: Sparkles,
    metric: 'Zero',
    metricSub: 'gestão diária',
    title: 'Você não opera nada — nunca',
    agent: 'Stay Chat + Crew',
    human: 'Captain coordena tudo',
    description: 'Hóspedes recebem respostas 24/7 sem o incomodar. Limpezas, check-ins e manutenção acontecem em silêncio. Você abre o painel e tudo está pronto.',
  },
  {
    icon: AlertCircle,
    metric: '<24h',
    metricSub: 'detecção de problemas',
    title: 'Más reviews intercetadas antes do hóspede partir',
    agent: 'VAGF + AI Monitor',
    human: 'Captain investiga + Manager liga',
    description: 'Chamada IA 24-48h após checkout captura o que correu mal. Se algo grave, Captain investiga e Manager liga ao hóspede pessoalmente — antes de o review aparecer no Airbnb.',
  },
  {
    icon: Star,
    metric: '+4.7',
    metricSub: 'rating médio alvo',
    title: 'A sua listagem sempre nos topos',
    agent: 'Property Scorecard',
    human: 'Manager discute melhorias consigo',
    description: 'Score ao vivo em estrutura, amenities, localização e valor. Manager identifica o que melhora ranking nas plataformas e propõe o que vale o investimento.',
  },
  {
    icon: Calendar,
    metric: 'Sex feira',
    metricSub: 'payout semanal',
    title: 'Pagamentos certos, no dia certo',
    agent: 'AI Monitor + Stripe Connect',
    human: 'Admin valida antes do envio',
    description: '43 verificações diárias garantem que cada euro chega. Statement automático no seu email. Admin valida discrepâncias antes de qualquer envio.',
  },
  {
    icon: Globe,
    metric: '8 línguas',
    metricSub: 'comunicação nativa',
    title: 'Tudo no seu idioma — sempre',
    agent: 'Translation Agent',
    human: 'Manager personaliza mensagens',
    description: 'Relatórios, contratos, emails e chat — sempre em PT, EN, ES, DE, NL, FR, SV ou DA. Manager assina cada mensagem importante para que sinta proximidade real.',
  },
]

export function OwnerValueOutcomes() {
  const { t } = useLocale()
  return (
    <section className="py-20 sm:py-28 relative overflow-hidden"
             style={{ background: 'linear-gradient(180deg, #ffffff 0%, var(--hm-ivory, #FAF8F4) 100%)' }}>
      {/* Subtle gold radial */}
      <div aria-hidden className="pointer-events-none absolute inset-0"
           style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(176,138,62,0.08) 0%, transparent 55%)' }} />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest" style={{ color: '#B08A3E' }}>
            {t('ownerValue.badge') || 'Para a sua propriedade'}
          </p>
          <h2 className="font-serif text-3xl font-bold leading-tight tracking-tight sm:text-4xl"
              style={{ color: '#0B1E3A' }}>
            {t('ownerValue.title') || 'Cada agente + cada pessoa = um resultado para si'}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-600">
            {t('ownerValue.subtitle') || 'A combinação de IA com pessoas reais não é abstracta. Estes são os 6 resultados concretos que vão directamente ao seu investimento.'}
          </p>
        </div>

        {/* Outcomes grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {OUTCOMES.map((o, i) => {
            const Icon = o.icon
            return (
              <div
                key={i}
                className="group relative rounded-2xl border bg-white p-6 sm:p-7 transition-all hover:-translate-y-0.5 hover:shadow-xl"
                style={{ borderColor: '#E8E3D8' }}
              >
                {/* Gold accent bar slides in on hover */}
                <span
                  aria-hidden
                  className="absolute left-0 top-0 h-0.5 w-0 transition-all duration-300 group-hover:w-full"
                  style={{ background: 'linear-gradient(90deg, #B08A3E 0%, rgba(176,138,62,0) 100%)' }}
                />

                {/* Icon */}
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl mb-4 transition-transform duration-200 group-hover:scale-110"
                  style={{ background: 'rgba(176,138,62,0.12)' }}
                >
                  <Icon className="h-5 w-5" style={{ color: '#B08A3E' }} />
                </div>

                {/* Big metric */}
                <p className="font-serif text-3xl sm:text-4xl font-bold leading-none"
                   style={{ color: '#B08A3E' }}>
                  {o.metric}
                </p>
                {o.metricSub && (
                  <p className="text-[11px] uppercase tracking-widest text-gray-400 mt-1.5">
                    {o.metricSub}
                  </p>
                )}

                {/* Title */}
                <h3 className="text-base font-bold mt-4 leading-snug" style={{ color: '#0B1E3A' }}>
                  {o.title}
                </h3>

                {/* Agent × Human chain */}
                <div className="flex items-center gap-2 mt-3 mb-3 text-[11px]">
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold"
                        style={{ background: 'rgba(176,138,62,0.10)', color: '#B08A3E' }}>
                    <Sparkles className="h-3 w-3" />
                    {o.agent}
                  </span>
                  <ArrowRight className="h-3 w-3 text-gray-300 shrink-0" />
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold border text-gray-700"
                        style={{ borderColor: '#E8E3D8' }}>
                    <User className="h-3 w-3" />
                    {o.human}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 leading-relaxed">
                  {o.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Closing line */}
        <p className="mt-12 text-center text-sm sm:text-base font-serif italic max-w-2xl mx-auto"
           style={{ color: '#0B1E3A' }}>
          {t('ownerValue.closer') || 'Tecnologia silenciosa. Pessoas visíveis. Resultados que pode medir todos os meses.'}
        </p>
      </div>
    </section>
  )
}
