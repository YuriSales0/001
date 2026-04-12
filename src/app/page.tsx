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
  Users,
} from "lucide-react"

/* ── Plans ── */
const plans = [
  {
    name: "Starter",
    price: "€89",
    commission: "20%",
    features: [
      "Portal do proprietário",
      "Relatórios mensais",
      "Calendário de reservas",
      "Manutenção coordenada",
      "Suporte por email",
    ],
  },
  {
    name: "Mid",
    price: "€129",
    commission: "18%",
    popular: true,
    features: [
      "Tudo do Starter",
      "Smart Lock integrado",
      "Relatórios semanais",
      "Suporte prioritário",
      "Dashboard avançado",
      "Market intelligence",
    ],
  },
  {
    name: "Premium",
    price: "€169",
    commission: "15%",
    features: [
      "Tudo do Mid",
      "AI Dynamic Pricing",
      "Revenue optimization",
      "Dados de mercado exclusivos",
      "Account manager dedicado",
      "Comissão mais baixa",
    ],
  },
]

/* ── Social proof numbers ── */
const stats = [
  { value: "40+", label: "Propriedades geridas" },
  { value: "92%", label: "Taxa de ocupação média" },
  { value: "€2.4M", label: "Volume gerido em 2025" },
  { value: "4.8★", label: "Rating médio dos hóspedes" },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* ───────── Header ───────── */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "#C9A84C" }}>
              <Building2 className="h-4.5 w-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <span className="text-lg font-bold" style={{ color: "#111827" }}>
              Host<span style={{ color: "#C9A84C" }}>Masters</span>
            </span>
          </Link>
          <nav className="hidden sm:flex items-center gap-8 text-sm text-gray-600">
            <a href="#problema" className="hover:text-gray-900 transition-colors">O Problema</a>
            <a href="#solucao" className="hover:text-gray-900 transition-colors">Solução</a>
            <a href="#planos" className="hover:text-gray-900 transition-colors">Planos</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Entrar
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold px-5 py-2.5 rounded-lg transition-all hover:opacity-90"
              style={{ background: "#111827", color: "#fff" }}
            >
              Começar grátis
            </Link>
          </div>
        </div>
      </header>

      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden" style={{ background: "#111827" }}>
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 opacity-30"
             style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(201,168,76,0.15) 0%, transparent 70%)" }} />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="hm-hero-animate hm-hero-delay-1 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-8"
                 style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.25)" }}>
              <Zap className="h-3.5 w-3.5" />
              Costa Tropical · España
            </div>

            <h1 className="hm-hero-animate hm-hero-delay-1 text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-[1.1] tracking-tight">
              A sua propriedade merece{" "}
              <span style={{ color: "#C9A84C" }}>mais do que gestão.</span>
              <br />
              Merece inteligência.
            </h1>

            <p className="hm-hero-animate hm-hero-delay-2 mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed">
              Você comprou na Costa Tropical para investir — não para se preocupar com limpezas,
              hóspedes difíceis ou preços desajustados. O HostMasters trata de tudo com dados reais,
              AI pricing e total transparência.
            </p>

            <div className="hm-hero-animate hm-hero-delay-3 mt-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-lg text-base font-semibold transition-all hover:scale-[1.02]"
                style={{ background: "#C9A84C", color: "#111827" }}
              >
                1° mês grátis no plano Premium
                <ArrowRight className="h-4 w-4" />
              </Link>
              <span className="text-sm text-gray-500">Sem compromisso. Cancele quando quiser.</span>
            </div>

            {/* Trust line */}
            <div className="hm-hero-animate hm-hero-delay-4 mt-12 flex items-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-gray-400" /> Sem lock-in
              </span>
              <span className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-gray-400" /> 4.8★ rating médio
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="h-4 w-4 text-gray-400" /> 40+ propriedades
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
              O problema
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "#111827" }}>
              Ser proprietário à distância não devia ser assim tão difícil
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: TrendingDown,
                title: "Preços ao acaso",
                desc: "Sem dados de mercado, o preço é um palpite. Perde receita nos picos e não atrai nas épocas baixas.",
              },
              {
                icon: Eye,
                title: "Zero visibilidade",
                desc: "Não sabe o que se passa na sua propriedade até receber uma reclamação ou uma conta surpresa.",
              },
              {
                icon: Clock,
                title: "Comunicação lenta",
                desc: "Emails perdidos, fotos que não chegam, relatórios que só vêm quando insiste.",
              },
              {
                icon: BarChart3,
                title: "Comissões opacas",
                desc: "Não sabe quanto fica para si. Os custos escondidos comem a rentabilidade sem aviso.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-gray-100 p-6 hover:shadow-lg hover:border-gray-200 transition-all"
              >
                <div className="h-11 w-11 rounded-lg flex items-center justify-center mb-4"
                     style={{ background: "rgba(163,45,45,0.08)" }}>
                  <item.icon className="h-5 w-5" style={{ color: "#A32D2D" }} />
                </div>
                <h3 className="font-semibold text-lg mb-2" style={{ color: "#111827" }}>{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
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
              A solução
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "#111827" }}>
              Gestão com inteligência, não com palpites
            </h2>
            <p className="mt-4 text-gray-500 text-lg">
              Três pilares que fazem do HostMasters diferente de qualquer property manager tradicional.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "AI Dynamic Pricing",
                desc: "Algoritmo que analisa sazonalidade, eventos locais, concorrência e procura em tempo real para definir o preço óptimo de cada noite.",
                highlight: "Até +25% de receita vs. preço fixo",
              },
              {
                icon: BarChart3,
                title: "Dados próprios, não estimativas",
                desc: "Dashboard com dados reais das suas reservas, receitas e custos. Relatórios mensais detalhados ao cêntimo — sem surpresas.",
                highlight: "Transparência total nos números",
              },
              {
                icon: Eye,
                title: "Market Intelligence",
                desc: "Acesso a dados de mercado da Costa Tropical: taxas de ocupação por zona, preços médios, tendências de procura e benchmarks.",
                highlight: "Decisões baseadas em dados reais",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl p-8 border transition-all hover:shadow-lg"
                style={{ background: "#fff", borderColor: "#E8E3D8" }}
              >
                <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-5"
                     style={{ background: "rgba(201,168,76,0.12)" }}>
                  <item.icon className="h-6 w-6" style={{ color: "#C9A84C" }} />
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: "#111827" }}>{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{item.desc}</p>
                <p className="text-sm font-semibold" style={{ color: "#2A7A4F" }}>
                  <CheckCircle2 className="h-4 w-4 inline mr-1" />
                  {item.highlight}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Social proof numbers ───────── */}
      <section className="py-16" style={{ background: "#111827" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="text-3xl sm:text-4xl font-bold" style={{ color: "#C9A84C" }}>
                  {s.value}
                </div>
                <div className="mt-1 text-sm text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Plans ───────── */}
      <section id="planos" className="py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#C9A84C" }}>
              Planos
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "#111827" }}>
              Escolha o nível de serviço que precisa
            </h2>
            <p className="mt-4 text-gray-500 text-lg">
              Todos os planos incluem gestão completa. Quanto mais investe, menor a comissão e mais ferramentas inteligentes.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border-2 relative transition-all hover:shadow-lg ${
                  plan.popular ? "scale-[1.02]" : ""
                }`}
                style={{
                  borderColor: plan.popular ? "#C9A84C" : "#E5E7EB",
                  background: plan.popular ? "#111827" : "#fff",
                }}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="text-xs font-bold uppercase tracking-wider px-4 py-1.5 rounded-full"
                          style={{ background: "#C9A84C", color: "#111827" }}>
                      Recomendado
                    </span>
                  </div>
                )}
                <h3 className={`text-xl font-bold ${plan.popular ? "text-white" : ""}`}
                    style={!plan.popular ? { color: "#111827" } : {}}>
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className={`text-4xl font-bold ${plan.popular ? "text-white" : ""}`}
                        style={!plan.popular ? { color: "#111827" } : {}}>
                    {plan.price}
                  </span>
                  <span className={plan.popular ? "text-gray-400" : "text-gray-500"}>/mês</span>
                </div>
                <p className="mt-1 text-sm" style={{ color: plan.popular ? "#C9A84C" : "#2A7A4F" }}>
                  Comissão: {plan.commission}
                </p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <CheckCircle2
                        className="h-4 w-4 mt-0.5 shrink-0"
                        style={{ color: plan.popular ? "#C9A84C" : "#2A7A4F" }}
                      />
                      <span className={`text-sm ${plan.popular ? "text-gray-300" : "text-gray-600"}`}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className="mt-8 block text-center py-3.5 rounded-lg font-semibold text-sm transition-all hover:opacity-90"
                  style={
                    plan.popular
                      ? { background: "#C9A84C", color: "#111827" }
                      : { background: "#111827", color: "#fff" }
                  }
                >
                  {plan.popular ? "1° mês grátis" : "Começar agora"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────── Testimonials / Social proof ───────── */}
      <section className="py-20 sm:py-28" style={{ background: "#FAFAF8" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#C9A84C" }}>
              Proprietários satisfeitos
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "#111827" }}>
              Quem confia no HostMasters
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Finalmente sei exactamente quanto rende a minha propriedade. Os relatórios mensais são impecáveis e a equipa é sempre acessível.",
                name: "Lars Eriksson",
                origin: "Estocolmo, Suécia",
                flag: "🇸🇪",
              },
              {
                quote: "O AI Pricing aumentou a minha receita em 30% no primeiro verão. Nunca pensei que uma property manager usasse tecnologia assim.",
                name: "Karen de Vries",
                origin: "Amesterdão, Holanda",
                flag: "🇳🇱",
              },
              {
                quote: "Moro em Londres e giro tudo pelo portal. Vejo reservas, manutenção, payouts — tudo transparente. Recomendo a qualquer proprietário.",
                name: "James Whitfield",
                origin: "Londres, Reino Unido",
                flag: "🇬🇧",
              },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-2xl p-8 border"
                style={{ background: "#fff", borderColor: "#E8E3D8" }}
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" style={{ color: "#C9A84C" }} />
                  ))}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{t.flag}</span>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: "#111827" }}>{t.name}</p>
                    <p className="text-xs text-gray-400">{t.origin}</p>
                  </div>
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
            Pronto para ter{" "}
            <span style={{ color: "#C9A84C" }}>controlo real</span>{" "}
            sobre a sua propriedade?
          </h2>
          <p className="mt-5 text-lg text-gray-400 max-w-xl mx-auto">
            Comece com o plano Premium durante 1 mês sem custos.
            Veja a diferença que dados reais e AI pricing fazem na sua receita.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-base font-semibold transition-all hover:scale-[1.02]"
              style={{ background: "#C9A84C", color: "#111827" }}
            >
              Começar 1 mês grátis
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-base font-medium border transition-colors hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.2)", color: "#fff" }}
            >
              Entrar no portal
            </Link>
          </div>
          <p className="mt-6 text-xs text-gray-500">
            Sem compromisso · Sem cartão de crédito · Cancele a qualquer momento
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
            &copy; 2026 HostMasters. Gestão premium de propriedades de curta duração.
          </p>
        </div>
      </footer>
    </div>
  )
}
