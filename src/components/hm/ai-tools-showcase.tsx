"use client"

import { useLocale } from "@/i18n/provider"
import { Brain, MessageCircle, Shield, Globe, BarChart3, Phone, Star } from "lucide-react"

// Icons indexed to match aiTools.tools[] order in i18n messages.
const TOOL_ICONS = [Brain, MessageCircle, Phone, Star, Shield, Globe, BarChart3]

// Bento layout order (indices into aiTools.tools[]):
//   Row 1 (lg): AI Pricing (hero, 2-col) · Market Intelligence
//   Row 2 (lg): Chat IA · VAGF · Scorecard
//   Row 3 (lg): AI Monitor · Team Assistant (hero, 2-col)
const BENTO_ORDER = [0, 5, 1, 2, 3, 4, 6] as const
const HERO_SET = new Set<number>([0, 6])

export function AiToolsShowcase() {
  const { t } = useLocale()

  return (
    <section
      className="relative overflow-hidden py-20 sm:py-28"
      style={{ background: 'var(--hm-ivory, #FAF8F4)' }}
    >
      {/* Subtle gold glow integrates the cards into a single panel */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(176,138,62,0.10) 0%, transparent 55%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header */}
        <div className="mx-auto mb-14 max-w-3xl text-center sm:mb-16">
          <p
            className="mb-3 text-sm font-semibold uppercase tracking-widest"
            style={{ color: '#B08A3E' }}
          >
            {t('aiTools.badge')}
          </p>
          <h2
            className="font-serif text-3xl font-bold leading-tight tracking-tight sm:text-4xl"
            style={{ color: '#0B1E3A' }}
          >
            {t('aiTools.title')}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-gray-600">
            {t('aiTools.subtitle')}
          </p>
        </div>

        {/* Bento grid: 1 col on mobile, 3 col bento on lg (heroes span 2) */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {BENTO_ORDER.map((i) => {
            const Icon = TOOL_ICONS[i]
            const isHero = HERO_SET.has(i)
            return (
              <div
                key={i}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl sm:p-7 ${
                  isHero ? 'lg:col-span-2' : ''
                }`}
                style={{ borderColor: '#E8E3D8' }}
              >
                {/* Gold accent bar slides in on hover */}
                <span
                  aria-hidden
                  className="absolute left-0 top-0 h-0.5 w-0 transition-all duration-300 group-hover:w-full"
                  style={{
                    background: 'linear-gradient(90deg, #B08A3E 0%, rgba(176,138,62,0) 100%)',
                  }}
                />

                {/* Icon + name */}
                <div className="mb-3 flex items-start gap-4">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110"
                    style={{ background: 'rgba(176,138,62,0.12)' }}
                  >
                    <Icon className="h-5 w-5" style={{ color: '#B08A3E' }} />
                  </div>
                  <h3
                    className={`font-bold leading-tight ${isHero ? 'text-base sm:text-lg' : 'text-sm'}`}
                    style={{ color: '#0B1E3A' }}
                  >
                    {t(`aiTools.tools.${i}.name`)}
                  </h3>
                </div>

                {/* Description */}
                <p
                  className={`mb-5 flex-1 leading-relaxed text-gray-600 ${
                    isHero ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
                  }`}
                >
                  {t(`aiTools.tools.${i}.desc`)}
                </p>

                {/* Stat footer */}
                <div
                  className="flex items-baseline gap-2 border-t pt-4"
                  style={{ borderColor: '#f0ece3' }}
                >
                  <span
                    className={`font-serif font-bold ${isHero ? 'text-3xl sm:text-4xl' : 'text-2xl'}`}
                    style={{ color: '#B08A3E' }}
                  >
                    {t(`aiTools.tools.${i}.stat`)}
                  </span>
                  <span className="text-[11px] uppercase tracking-wider text-gray-500">
                    {t(`aiTools.tools.${i}.statLabel`)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Strategic closer */}
        <p
          className="mt-12 text-center text-sm font-semibold tracking-wide sm:text-base"
          style={{ color: '#0B1E3A' }}
        >
          {t('aiTools.footer')}
        </p>
      </div>
    </section>
  )
}
