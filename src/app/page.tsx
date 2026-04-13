"use client"

import Link from "next/link"
import {
  Building2,
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
} from "lucide-react"
import { useLocale } from "@/i18n/provider"
import { LanguageSelector } from "@/components/hm/language-selector"
import { PlatformDemo } from "@/components/hm/platform-demo"
import { AiToolsShowcase } from "@/components/hm/ai-tools-showcase"

/* ── Plan data from finance.ts ── */
const plans = [
  { id: "STARTER", commission: "22%", monthlyFee: null, annualFee: null, firstMonthFree: false },
  { id: "BASIC",   commission: "20%", monthlyFee: 89,   annualFee: 890,  firstMonthFree: true },
  { id: "MID",     commission: "17%", monthlyFee: 159,  annualFee: 1590, firstMonthFree: true, popular: true },
  { id: "PREMIUM", commission: "13%", monthlyFee: 269,  annualFee: 2690, firstMonthFree: false },
]

const fmtEUR = (n: number) => `€${n}`

export default function LandingPage() {
  const { t } = useLocale()

  return (
    <div className="min-h-screen" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* ───────── Header ───────── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "#C9A84C" }}>
              <Building2 className="h-[18px] w-[18px] text-white" />
            </div>
            <span className="text-lg font-bold" style={{ color: "#111827" }}>
              Host<span style={{ color: "#C9A84C" }}>Masters</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#problema" className="hover:text-gray-900 transition-colors">{t('landing.nav.problem')}</a>
            <a href="#solucao" className="hover:text-gray-900 transition-colors">{t('landing.nav.solution')}</a>
            <a href="#planos" className="hover:text-gray-900 transition-colors">{t('landing.nav.plans')}</a>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
              {t('landing.nav.enter')}
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold px-5 py-2.5 rounded-lg transition-all hover:opacity-90"
              style={{ background: "#111827", color: "#fff" }}
            >
              {t('landing.nav.startFree')}
            </Link>
          </div>
        </div>
      </header>

      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden" style={{ background: "#111827" }}>
        <div className="absolute inset-0 opacity-20"
             style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(201,168,76,0.15) 0%, transparent 70%)" }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            <div className="hm-hero-animate hm-hero-delay-1 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-8"
                 style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.25)" }}>
              <Zap className="h-3.5 w-3.5" />
              {t('landing.badge')}
            </div>

            <h1 className="hm-hero-animate hm-hero-delay-1 text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
              {t('landing.hero.title1')}{" "}
              <span style={{ color: "#C9A84C" }}>{t('landing.hero.titleGold')}</span>
              <br />
              {t('landing.hero.title2')}
            </h1>

            <p className="hm-hero-animate hm-hero-delay-2 mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed">
              {t('landing.hero.subtitle')}
            </p>

            <div className="hm-hero-animate hm-hero-delay-3 mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-lg text-base font-semibold transition-all hover:scale-[1.02]"
                style={{ background: "#C9A84C", color: "#111827" }}
              >
                {t('landing.hero.cta')}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="text-sm text-gray-500">{t('landing.hero.ctaSub')}</span>
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
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#C9A84C" }}>
              {t('landing.problem.badge')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "#111827" }}>
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
                <h3 className="font-semibold text-lg mb-2" style={{ color: "#111827" }}>
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
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#C9A84C" }}>
              {t('landing.solution.badge')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "#111827" }}>
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
                     style={{ background: "rgba(201,168,76,0.12)" }}>
                  <Icon className="h-6 w-6" style={{ color: "#C9A84C" }} />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: "#111827" }}>
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

      {/* ───────── Plans ───────── */}
      <section id="planos" className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#C9A84C" }}>
              {t('landing.plans.badge')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "#111827" }}>
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
                    borderColor: plan.popular ? "#C9A84C" : "#E5E7EB",
                    background: plan.popular ? "#111827" : "#fff",
                  }}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <span className="text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full whitespace-nowrap"
                            style={{ background: "#C9A84C", color: "#111827" }}>
                        {t('landing.plans.recommended')}
                      </span>
                    </div>
                  )}
                  <h3 className={`text-xl font-bold ${plan.popular ? "text-white" : ""}`}
                      style={!plan.popular ? { color: "#111827" } : {}}>
                    {plan.id.charAt(0) + plan.id.slice(1).toLowerCase()}
                  </h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    {plan.monthlyFee ? (
                      <>
                        <span className={`text-3xl font-bold ${plan.popular ? "text-white" : ""}`}
                              style={!plan.popular ? { color: "#111827" } : {}}>
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
                  <p className="mt-1 text-sm" style={{ color: plan.popular ? "#C9A84C" : "#2A7A4F" }}>
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
                            style={{ color: plan.popular ? "#C9A84C" : "#2A7A4F" }}
                          />
                          <span className={`text-sm ${plan.popular ? "text-gray-300" : "text-gray-600"}`}>
                            {feat}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                  <Link
                    href="/login"
                    className="mt-7 block text-center py-3 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
                    style={
                      plan.popular
                        ? { background: "#C9A84C", color: "#111827" }
                        : { background: "#111827", color: "#fff" }
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

      {/* ───────── Social proof — platform potential ───────── */}
      <section className="py-20 sm:py-28" style={{ background: "#FAFAF8" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#C9A84C" }}>
              {t('landing.social.badge')}
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "#111827" }}>
              {t('landing.social.title')}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl p-8 border"
                style={{ background: "#fff", borderColor: "#E8E3D8" }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, si) => (
                    <Star key={si} className="h-4 w-4 fill-current" style={{ color: "#C9A84C" }} />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  &ldquo;{t(`landing.social.items.${i}.quote`)}&rdquo;
                </p>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "#111827" }}>
                    {t(`landing.social.items.${i}.name`)}
                  </p>
                  <p className="text-xs text-gray-400">{t(`landing.social.items.${i}.origin`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Final CTA ───────── */}
      <section className="py-20 sm:py-28" style={{ background: "#111827" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {t('landing.finalCta.title1')}{" "}
            <span style={{ color: "#C9A84C" }}>{t('landing.finalCta.titleGold')}</span>{" "}
            {t('landing.finalCta.title2')}
          </h2>
          <p className="mt-5 text-lg text-gray-400 max-w-xl mx-auto">
            {t('landing.finalCta.subtitle')}
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-base font-semibold transition-all hover:scale-[1.02]"
              style={{ background: "#C9A84C", color: "#111827" }}
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
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ background: "#C9A84C" }}>
              <Building2 className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-bold" style={{ color: "#111827" }}>
              Host<span style={{ color: "#C9A84C" }}>Masters</span>
            </span>
            <span className="text-xs text-gray-400 ml-2">Costa Tropical · España</span>
          </div>
          <p className="text-xs text-gray-400">
            {t('landing.footer.copyright')} {t('landing.footer.tagline')}
          </p>
        </div>
      </footer>
    </div>
  )
}
