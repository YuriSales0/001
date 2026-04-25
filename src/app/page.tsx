"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  TrendingDown,
  Clock,
  Eye,
  Brain,
  BarChart3,
  Shield,
  Star,
  Zap,
  Globe,
  UserPlus,
  MessageCircle,
  FileSignature,
  Settings,
  Rocket,
  Mail,
  Phone,
  MapPin,
  Send,
} from "lucide-react"
import { useLocale } from "@/i18n/provider"
import { LanguageSelector } from "@/components/hm/language-selector"
import { PlatformDemo } from "@/components/hm/platform-demo"
import { AiToolsShowcase } from "@/components/hm/ai-tools-showcase"
import { HybridFlowMap } from "@/components/hm/hybrid-flow-map"
import { ReferralTracker } from "@/components/hm/referral-tracker"
import { HmLogo } from "@/components/hm/hm-logo"
import { RevenueSimulator } from "@/components/hm/revenue-simulator"
import { PLAN_COMMISSION, PLAN_MONTHLY_FEE } from "@/lib/finance"

/* ── Plan data derived from finance.ts (single source of truth) ── */
const plans = (['STARTER', 'BASIC', 'MID', 'PREMIUM'] as const).map(id => {
  const monthly = PLAN_MONTHLY_FEE[id]
  return {
    id,
    commission: `${Math.round(PLAN_COMMISSION[id] * 100)}%`,
    monthlyFee: monthly > 0 ? monthly : null,
    annualFee: monthly > 0 ? monthly * 10 : null, // 2 months free on annual
    firstMonthFree: id === 'BASIC' || id === 'MID',
    popular: id === 'MID',
  }
})

const fmtEUR = (n: number) => `€${n}`

export default function LandingPage() {
  const { t } = useLocale()

  return (
    <div className="min-h-screen font-sans">
      <ReferralTracker />
      {/* ───────── Header ───────── */}
      <header className="sticky top-0 z-50 border-b bg-hm-paper/90 backdrop-blur-md" style={{ borderColor: 'var(--hm-cream-dark)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <HmLogo size={36} />
            <span className="text-lg font-semibold tracking-tight" style={{ color: '#0B1E3A' }}>
              Host<span style={{ color: '#B08A3E' }}>Masters</span>
            </span>
            <span className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest"
                  style={{ background: 'rgba(176,138,62,0.15)', color: '#B08A3E' }}>Beta</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm" style={{ color: '#4A5568' }}>
            <a href="#problema" className="hover:text-hm-ink transition-colors">{t('landing.nav.problem')}</a>
            <a href="#solucao" className="hover:text-hm-ink transition-colors">{t('landing.nav.solution')}</a>
            <a href="#planos" className="hover:text-hm-ink transition-colors">{t('landing.nav.plans')}</a>
            <a href="#simulator" className="hover:text-hm-ink transition-colors">{t('landing.simulator.badge')}</a>
            <a href="#contacto" className="hover:text-hm-ink transition-colors">{t('landing.nav.contact')}</a>
            <Link href="/careers" className="font-semibold hover:text-hm-ink transition-colors" style={{ color: "#B08A3E" }}>
              Careers
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Link href="/login" className="text-sm hover:text-hm-ink transition-colors hidden sm:block" style={{ color: '#4A5568' }}>
              {t('landing.nav.enter')}
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold px-5 py-2.5 rounded-lg transition-all hover:brightness-110"
              style={{ background: "#0B1E3A", color: "#F6F2EA" }}
            >
              {t('landing.nav.startFree')}
            </Link>
          </div>
        </div>
      </header>

      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden" style={{ background: "#0B1E3A" }}>
        <div className="absolute inset-0 opacity-20"
             style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(176,138,62,0.12) 0%, transparent 70%)" }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            <div className="hm-hero-animate hm-hero-delay-1 hm-eyebrow mb-8" style={{ color: "#B08A3E" }}>
              {t('landing.badge')}
            </div>

            <h1 className="hm-hero-animate hm-hero-delay-1 text-3xl sm:text-5xl lg:text-6xl font-semibold leading-[1.1] tracking-[-0.025em]" style={{ color: '#F6F2EA' }}>
              {t('landing.hero.title1')}{" "}
              <span style={{ color: "#B08A3E" }}>{t('landing.hero.titleGold')}</span>
              <br />
              {t('landing.hero.title2')}
            </h1>

            <p className="hm-hero-animate hm-hero-delay-2 mt-6 text-lg sm:text-xl max-w-2xl leading-relaxed" style={{ color: 'var(--hm-stone)' }}>
              {t('landing.hero.subtitle')}
            </p>

            <div className="hm-hero-animate hm-hero-delay-3 mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-lg text-base font-bold transition-all hover:brightness-110"
                style={{ background: "#B08A3E", color: "#0B1E3A" }}
              >
                {t('landing.hero.cta')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="text-sm" style={{ color: 'var(--hm-stone)' }}>{t('landing.hero.ctaSub')}</span>
            </div>

            <div className="hm-hero-animate hm-hero-delay-4 mt-12 flex flex-wrap items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-gray-400" /> {t('landing.hero.noLockin')}
              </span>
              <span className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-gray-400" /> {t('landing.hero.intlOwners')}
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-gray-400" /> {t('landing.hero.aiPowered')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Problem ───────── */}
      <section id="problema" className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#B08A3E" }}>
              {t('landing.problem.badge')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight" style={{ color: "#0B1E3A" }}>
              {t('landing.problem.title')}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[TrendingDown, Eye, Clock, BarChart3].map((Icon, i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-100 p-6 hover:shadow-lg hover:border-gray-200 transition-all"
              >
                <div className="h-11 w-11 rounded-lg flex items-center justify-center mb-4"
                     style={{ background: "rgba(163,45,45,0.08)" }}>
                  <Icon className="h-5 w-5" style={{ color: "#A32D2D" }} />
                </div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: "#0B1E3A" }}>
                  {t(`landing.problem.items.${i}.title`)}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {t(`landing.problem.items.${i}.desc`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Solution ───────── */}
      <section id="solucao" className="py-20 sm:py-28" style={{ background: "#FAFAF8" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#B08A3E" }}>
              {t('landing.solution.badge')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight" style={{ color: "#0B1E3A" }}>
              {t('landing.solution.title')}
            </h2>
            <p className="mt-4 text-gray-500 text-lg">{t('landing.solution.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[Brain, BarChart3, Eye].map((Icon, i) => (
              <div
                key={i}
                className="rounded-2xl p-8 border transition-all hover:shadow-lg"
                style={{ background: "#fff", borderColor: "#E8E3D8" }}
              >
                <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-5"
                     style={{ background: "rgba(176,138,62,0.12)" }}>
                  <Icon className="h-6 w-6" style={{ color: "#B08A3E" }} />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: "#0B1E3A" }}>
                  {t(`landing.solution.items.${i}.title`)}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">
                  {t(`landing.solution.items.${i}.desc`)}
                </p>
                <p className="text-sm font-semibold" style={{ color: "#2A7A4F" }}>
                  <CheckCircle2 className="h-4 w-4 inline mr-1" />
                  {t(`landing.solution.items.${i}.highlight`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Platform Demo ───────── */}
      <PlatformDemo />

      {/* ───────── AI Tools ───────── */}
      <AiToolsShowcase />

      {/* ───────── Hybrid flow map: AI + humans + owner ───────── */}
      <HybridFlowMap />

      {/* ───────── Plans ───────── */}
      <section id="planos" className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#B08A3E" }}>
              {t('landing.plans.badge')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight" style={{ color: "#0B1E3A" }}>
              {t('landing.plans.title')}
            </h2>
            <p className="mt-4 text-gray-500 text-lg">{t('landing.plans.subtitle')}</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {plans.map((plan) => {
              const planKey = plan.id.toLowerCase()
              return (
                <div
                  key={plan.id}
                  className={`rounded-2xl p-7 border-2 relative transition-all hover:shadow-lg ${plan.popular ? "scale-[1.02]" : ""}`}
                  style={{
                    borderColor: plan.popular ? "#B08A3E" : "#E5E7EB",
                    background: plan.popular ? "#0B1E3A" : "#fff",
                  }}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full whitespace-nowrap"
                            style={{ background: "#B08A3E", color: "#0B1E3A" }}>
                        {t('landing.plans.recommended')}
                      </span>
                    </div>
                  )}
                  <h3 className={`text-xl font-bold ${plan.popular ? "text-white" : ""}`}
                      style={!plan.popular ? { color: "#0B1E3A" } : {}}>
                    {plan.id.charAt(0) + plan.id.slice(1).toLowerCase()}
                  </h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    {plan.monthlyFee ? (
                      <>
                        <span className={`text-3xl font-bold ${plan.popular ? "text-white" : ""}`}
                              style={!plan.popular ? { color: "#0B1E3A" } : {}}>
                          {fmtEUR(plan.monthlyFee)}
                        </span>
                        <span className={plan.popular ? "text-gray-400" : "text-gray-500"}>
                          {t('landing.plans.monthlyFee')}
                        </span>
                      </>
                    ) : (
                      <span className={`text-lg font-semibold ${plan.popular ? "text-gray-300" : "text-gray-500"}`}>
                        {t('landing.plans.noMonthlyFee')}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm" style={{ color: plan.popular ? "#B08A3E" : "#2A7A4F" }}>
                    {t('landing.plans.commission')}: {plan.commission}
                  </p>
                  <ul className="mt-5 space-y-2.5">
                    {[0, 1, 2, 3, 4, 5].map((fi) => {
                      const feat = t(`landing.plans.${planKey}.features.${fi}`)
                      if (feat === `landing.plans.${planKey}.features.${fi}`) return null
                      return (
                        <li key={fi} className="flex items-start gap-2">
                          <CheckCircle2
                            className="h-4 w-4 mt-0.5 shrink-0"
                            style={{ color: plan.popular ? "#B08A3E" : "#2A7A4F" }}
                          />
                          <span className={`text-sm ${plan.popular ? "text-gray-300" : "text-gray-600"}`}>
                            {feat}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                  <Link
                    href="/register"
                    className="mt-7 block text-center py-3 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
                    style={
                      plan.popular
                        ? { background: "#B08A3E", color: "#0B1E3A" }
                        : { background: "#0B1E3A", color: "#fff" }
                    }
                  >
                    {plan.firstMonthFree ? t('landing.plans.firstMonthFree') : t('landing.plans.startNow')}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ───────── Revenue simulator ───────── */}
      <section id="simulator" className="py-20 sm:py-28" style={{ background: 'var(--hm-ivory, #FAF8F4)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#B08A3E' }}>
              {t('landing.simulator.badge')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-3" style={{ color: '#0B1E3A' }}>
              {t('landing.simulator.title')}
            </h2>
            <p className="text-base text-gray-600">
              {t('landing.simulator.subtitle')}
            </p>
          </div>
          <RevenueSimulator />
        </div>
      </section>

      {/* ───────── Trust badges — infra real (substitui social proof) ───────── */}
      <section className="py-16 sm:py-20" style={{ background: "#FAFAF8" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#B08A3E" }}>
              {t('landing.trust.badge')}
            </p>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight" style={{ color: "#0B1E3A" }}>
              {t('landing.trust.title')}
            </h2>
          </div>

          {/* 6 logos — grayscale, hover restores brand */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-6 sm:gap-8 items-center max-w-4xl mx-auto">
            {[
              { name: 'Airbnb',      label: 'A i r b n b',  color: '#FF5A5F' },
              { name: 'Booking.com', label: 'Booking.com',  color: '#003B95' },
              { name: 'VRBO',        label: 'VRBO',         color: '#0F3B66' },
              { name: 'Stripe',      label: 'stripe',       color: '#635BFF' },
              { name: 'Revolut',     label: 'Revolut',      color: '#0075EB' },
              { name: 'Nuki',        label: 'Nuki',         color: '#1A1A1A' },
            ].map(b => (
              <div
                key={b.name}
                className="group flex items-center justify-center h-14 transition-all"
                title={b.name}
              >
                <span
                  className="font-bold text-base sm:text-lg tracking-tight transition-colors duration-200 grayscale group-hover:grayscale-0"
                  style={{ color: '#0B1E3A' }}
                  onMouseEnter={(e) => { (e.target as HTMLSpanElement).style.color = b.color }}
                  onMouseLeave={(e) => { (e.target as HTMLSpanElement).style.color = '#0B1E3A' }}
                >
                  {b.label}
                </span>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-gray-500 mt-8 max-w-2xl mx-auto leading-relaxed">
            {t('landing.trust.description')}
          </p>
        </div>
      </section>

      {/* ───────── Client Journey ───────── */}
      <section className="py-20 sm:py-28" style={{ background: 'var(--hm-ivory)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#B08A3E' }}>
              {t('landing.journey.badge')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: '#0B1E3A' }}>
              {t('landing.journey.title')}
            </h2>
            <p className="mt-3 text-gray-500 max-w-lg mx-auto">
              {t('landing.journey.subtitle')}
            </p>
          </div>

          {/* Steps 1-4 */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-6 sm:left-8 top-0 bottom-0 w-px hidden sm:block" style={{ background: 'rgba(176,138,62,0.2)' }} />

            <div className="space-y-8">
              {[
                { step: 1, icon: UserPlus, titleKey: 'step1Title', descKey: 'step1Desc' },
                { step: 2, icon: MessageCircle, titleKey: 'step2Title', descKey: 'step2Desc' },
                { step: 3, icon: FileSignature, titleKey: 'step3Title', descKey: 'step3Desc' },
                { step: 4, icon: Settings, titleKey: 'step4Title', descKey: 'step4Desc' },
              ].map(({ step, icon: Icon, titleKey, descKey }) => (
                <div key={step} className="flex gap-5 sm:gap-7 items-start">
                  <div className="relative z-10 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center rounded-full shrink-0 shadow-md"
                       style={{ background: '#0B1E3A' }}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: '#B08A3E' }} />
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ background: '#B08A3E' }}>
                      {step}
                    </span>
                  </div>
                  <div className="pt-2 sm:pt-4">
                    <h3 className="text-lg font-bold" style={{ color: '#0B1E3A' }}>
                      {t(`landing.journey.${titleKey}`)}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 max-w-md">
                      {t(`landing.journey.${descKey}`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 5 — the big one */}
          <div className="mt-12 rounded-2xl overflow-hidden" style={{ background: '#0B1E3A' }}>
            <div className="px-6 sm:px-10 py-8 sm:py-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-full shrink-0"
                     style={{ background: 'rgba(176,138,62,0.15)' }}>
                  <Rocket className="h-7 w-7" style={{ color: '#B08A3E' }} />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#B08A3E' }}>
                    Step 5
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    {t('landing.journey.step5Title')}
                  </h3>
                </div>
              </div>

              <p className="text-sm text-gray-400 mb-6 max-w-lg">
                {t('landing.journey.step5Desc')}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Array.from({ length: 10 }, (_, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: '#B08A3E' }} />
                    <span className="text-sm text-gray-300">{t(`landing.journey.feat${i + 1}`)}</span>
                  </div>
                ))}
              </div>

              {/* AI Features highlight */}
              <div className="mt-6 pt-6 border-t" style={{ borderColor: 'rgba(176,138,62,0.15)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="h-5 w-5" style={{ color: '#B08A3E' }} />
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#B08A3E' }}>
                    Powered by AI
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from({ length: 4 }, (_, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <Zap className="h-4 w-4 shrink-0" style={{ color: '#B08A3E' }} />
                      <span className="text-sm text-gray-300">{t(`landing.journey.feat${i + 11}`)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t" style={{ borderColor: 'rgba(176,138,62,0.15)' }}>
                <p className="text-lg sm:text-xl font-bold text-center" style={{ color: '#B08A3E' }}>
                  {t('landing.journey.cta')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Contact Us ───────── */}
      <ContactSection />

      {/* ───────── Work with us (subtle teaser → /careers) ───────── */}
      <section className="py-16 sm:py-20" style={{ background: "#071328" }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="rounded-2xl p-8 sm:p-10 flex flex-col sm:flex-row items-center gap-6 sm:gap-10"
               style={{ background: "linear-gradient(135deg, rgba(176,138,62,0.08) 0%, rgba(176,138,62,0.02) 100%)", border: "1px solid rgba(176,138,62,0.15)" }}>
            <div className="flex-1">
              <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#B08A3E" }}>
                {t('landing.join.badge')}
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                {t('landing.join.title')}
              </h3>
              <p className="text-sm text-gray-400">
                {t('landing.join.subtitle')}
              </p>
            </div>
            <Link
              href="/careers"
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold transition-all hover:scale-[1.02] shrink-0"
              style={{ background: "#B08A3E", color: "#0B1E3A" }}
            >
              {t('landing.join.manager.cta')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ───────── Final CTA ───────── */}
      <section className="py-20 sm:py-28" style={{ background: "#0B1E3A" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-tight">
            {t('landing.finalCta.title1')}{" "}
            <span style={{ color: "#B08A3E" }}>{t('landing.finalCta.titleGold')}</span>{" "}
            {t('landing.finalCta.title2')}
          </h2>
          <p className="mt-5 text-lg text-gray-400 max-w-xl mx-auto">
            {t('landing.finalCta.subtitle')}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-base font-semibold transition-all hover:scale-[1.02]"
              style={{ background: "#B08A3E", color: "#0B1E3A" }}
            >
              {t('landing.finalCta.cta')}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-base font-medium border transition-colors hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.2)", color: "#fff" }}
            >
              {t('landing.finalCta.enterPortal')}
            </Link>
          </div>
          <p className="mt-6 text-xs text-gray-500">
            {t('landing.finalCta.disclaimer')}
          </p>
        </div>
      </section>

      {/* ───────── Footer ───────── */}
      <footer className="border-t border-gray-100 bg-white py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <HmLogo size={24} />
            <span className="text-sm font-semibold tracking-tight" style={{ color: '#0B1E3A' }}>
              Host<span style={{ color: '#B08A3E' }}>Masters</span>
            </span>
            <span className="text-xs text-gray-400 ml-1">Costa Tropical · España</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Privacy</a>
            <a href="/terms" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Terms</a>
            <a href="/partner/login" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Partner Portal</a>
            <p className="text-xs text-gray-400">
              {t('landing.footer.copyright')} {t('landing.footer.tagline')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ── Contact Us Section ── */
function ContactSection() {
  const { t } = useLocale()
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    location: "",
    partnerCode: "",
    contactMethod: "email" as "email" | "whatsapp" | "phone",
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError(t("landing.contact.required"))
      return
    }

    setSending(true)
    try {
      const notes = [
        form.location ? `Location: ${form.location}` : "",
        `Preferred contact: ${form.contactMethod}`,
        form.phone ? `Phone: ${form.phone}` : "",
      ]
        .filter(Boolean)
        .join(" | ")

      const res = await fetch("/api/leads/public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || null,
          source: "WEBSITE",
          message: form.message.trim(),
          notes,
          partnerCode: form.partnerCode.trim() || undefined,
        }),
      })

      if (!res.ok) throw new Error("Failed")
      setSent(true)
    } catch {
      setError(t("common.error"))
    } finally {
      setSending(false)
    }
  }

  return (
    <section id="contacto" className="py-20 sm:py-28" style={{ background: "var(--hm-ivory, #FAF8F4)" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p
            className="text-sm font-semibold uppercase tracking-widest mb-3"
            style={{ color: "#B08A3E" }}
          >
            {t("landing.contact.badge")}
          </p>
          <h2
            className="text-3xl sm:text-4xl font-serif font-bold tracking-tight"
            style={{ color: "#0B1E3A" }}
          >
            {t("landing.contact.title")}
          </h2>
          <p className="mt-4 text-gray-500 text-lg">
            {t("landing.contact.subtitle")}
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: "#fff", borderColor: "#E8E3D8" }}
        >
          <div className="grid md:grid-cols-5">
            {/* Left — info panel */}
            <div
              className="md:col-span-2 p-8 sm:p-10 flex flex-col justify-between"
              style={{ background: "#0B1E3A" }}
            >
              <div>
                <h3 className="text-xl font-serif font-bold text-white mb-4">
                  {t("landing.contact.whyTitle")}
                </h3>
                <p className="text-sm leading-relaxed mb-8" style={{ color: "rgba(246,242,234,0.7)" }}>
                  {t("landing.contact.whyDesc")}
                </p>

                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "rgba(176,138,62,0.15)" }}
                    >
                      <Clock className="h-5 w-5" style={{ color: "#B08A3E" }} />
                    </div>
                    <span className="text-sm font-semibold text-white">
                      {t("landing.contact.responsePromise")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "rgba(176,138,62,0.15)" }}
                    >
                      <Mail className="h-5 w-5" style={{ color: "#B08A3E" }} />
                    </div>
                    <span className="text-sm text-gray-300">
                      {t("landing.contact.emailAddress")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "rgba(176,138,62,0.15)" }}
                    >
                      <Phone className="h-5 w-5" style={{ color: "#B08A3E" }} />
                    </div>
                    <span className="text-sm text-gray-300">
                      {t("landing.contact.whatsappNumber")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "rgba(176,138,62,0.15)" }}
                    >
                      <MapPin className="h-5 w-5" style={{ color: "#B08A3E" }} />
                    </div>
                    <span className="text-sm text-gray-300">
                      {t("landing.contact.hqLocation")}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: "rgba(176,138,62,0.15)" }}
                    >
                      <Globe className="h-5 w-5" style={{ color: "#B08A3E" }} />
                    </div>
                    <span className="text-sm text-gray-300">
                      {t("landing.contact.languages")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t" style={{ borderColor: "rgba(176,138,62,0.15)" }}>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" style={{ color: "#B08A3E" }} />
                  <span className="text-xs text-gray-400">
                    {t("landing.contact.noCommitment")}
                  </span>
                </div>
              </div>
            </div>

            {/* Right — form */}
            <div className="md:col-span-3 p-8 sm:p-10">
              {sent ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <div
                    className="h-16 w-16 rounded-full flex items-center justify-center mb-6"
                    style={{ background: "rgba(42,122,79,0.1)" }}
                  >
                    <CheckCircle2 className="h-8 w-8" style={{ color: "#2A7A4F" }} />
                  </div>
                  <h3
                    className="text-2xl font-serif font-bold mb-3"
                    style={{ color: "#0B1E3A" }}
                  >
                    {t("landing.contact.thankYouTitle")}
                  </h3>
                  <p className="text-gray-500 max-w-sm">
                    {t("landing.contact.thankYouDesc")}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Name & Email row */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="block text-sm font-semibold mb-1.5"
                        style={{ color: "#0B1E3A" }}
                      >
                        {t("landing.contact.nameLabel")} *
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={handleChange}
                        placeholder={t("landing.contact.namePlaceholder")}
                        className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2"
                        style={{
                          borderColor: "#E8E3D8",
                          background: "#FAFAF8",
                          color: "#0B1E3A",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block text-sm font-semibold mb-1.5"
                        style={{ color: "#0B1E3A" }}
                      >
                        {t("landing.contact.emailLabel")} *
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        required
                        value={form.email}
                        onChange={handleChange}
                        placeholder={t("landing.contact.emailPlaceholder")}
                        className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2"
                        style={{
                          borderColor: "#E8E3D8",
                          background: "#FAFAF8",
                          color: "#0B1E3A",
                        }}
                      />
                    </div>
                  </div>

                  {/* Phone & Location row */}
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label
                        htmlFor="contact-phone"
                        className="block text-sm font-semibold mb-1.5"
                        style={{ color: "#0B1E3A" }}
                      >
                        {t("landing.contact.phoneLabel")}
                      </label>
                      <input
                        id="contact-phone"
                        name="phone"
                        type="tel"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder={t("landing.contact.phonePlaceholder")}
                        className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2"
                        style={{
                          borderColor: "#E8E3D8",
                          background: "#FAFAF8",
                          color: "#0B1E3A",
                        }}
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="contact-location"
                        className="block text-sm font-semibold mb-1.5"
                        style={{ color: "#0B1E3A" }}
                      >
                        {t("landing.contact.locationLabel")}
                      </label>
                      <input
                        id="contact-location"
                        name="location"
                        type="text"
                        value={form.location}
                        onChange={handleChange}
                        placeholder={t("landing.contact.locationPlaceholder")}
                        className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2"
                        style={{
                          borderColor: "#E8E3D8",
                          background: "#FAFAF8",
                          color: "#0B1E3A",
                        }}
                      />
                    </div>
                  </div>

                  {/* Partner code */}
                  <div>
                    <label htmlFor="contact-partner" className="block text-sm font-semibold mb-2" style={{ color: "#0B1E3A" }}>
                      {t("landing.contact.partnerCodeLabel")}
                    </label>
                    <input
                      id="contact-partner"
                      name="partnerCode"
                      value={form.partnerCode}
                      onChange={handleChange}
                      placeholder={t("landing.contact.partnerCodePlaceholder")}
                      className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2"
                      style={{ borderColor: "#E8E3D8", background: "#FAFAF8", color: "#0B1E3A" }}
                    />
                  </div>

                  {/* Preferred contact method */}
                  <div>
                    <label
                      className="block text-sm font-semibold mb-2"
                      style={{ color: "#0B1E3A" }}
                    >
                      {t("landing.contact.contactMethodLabel")}
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {(["email", "whatsapp", "phone"] as const).map((method) => (
                        <label
                          key={method}
                          className="flex items-center gap-2 cursor-pointer rounded-lg border px-4 py-2.5 text-sm transition-all"
                          style={{
                            borderColor:
                              form.contactMethod === method ? "#B08A3E" : "#E8E3D8",
                            background:
                              form.contactMethod === method
                                ? "rgba(176,138,62,0.08)"
                                : "#FAFAF8",
                            color: "#0B1E3A",
                          }}
                        >
                          <input
                            type="radio"
                            name="contactMethod"
                            value={method}
                            checked={form.contactMethod === method}
                            onChange={handleChange}
                            className="sr-only"
                          />
                          {method === "email" && <Mail className="h-4 w-4" style={{ color: "#B08A3E" }} />}
                          {method === "whatsapp" && <MessageCircle className="h-4 w-4" style={{ color: "#B08A3E" }} />}
                          {method === "phone" && <Phone className="h-4 w-4" style={{ color: "#B08A3E" }} />}
                          {t(`landing.contact.contactMethod${method.charAt(0).toUpperCase() + method.slice(1)}`)}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="contact-message"
                      className="block text-sm font-semibold mb-1.5"
                      style={{ color: "#0B1E3A" }}
                    >
                      {t("landing.contact.messageLabel")} *
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      required
                      rows={4}
                      value={form.message}
                      onChange={handleChange}
                      placeholder={t("landing.contact.messagePlaceholder")}
                      className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 resize-none"
                      style={{
                        borderColor: "#E8E3D8",
                        background: "#FAFAF8",
                        color: "#0B1E3A",
                      }}
                    />
                  </div>

                  {/* Error message */}
                  {error && (
                    <p className="text-sm font-medium" style={{ color: "#A32D2D" }}>
                      {error}
                    </p>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={sending}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-lg text-sm font-bold transition-all hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: "#B08A3E", color: "#0B1E3A" }}
                  >
                    {sending ? (
                      t("landing.contact.sending")
                    ) : (
                      <>
                        {t("landing.contact.submitBtn")}
                        <Send className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
