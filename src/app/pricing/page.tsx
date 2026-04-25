'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Star, Zap, Info } from 'lucide-react'
import { useCurrency } from '@/contexts/currency-context'
import { PLAN_COMMISSION, PLAN_MONTHLY_FEE } from '@/lib/finance'

type Billing = 'monthly' | 'annual'

// Source of truth: finance.ts — never hardcode prices here.
const PLANS = [
  {
    id: 'STARTER',
    name: 'Starter',
    tagline: 'Só gestão. Sem manutenção incluída.',
    monthly: PLAN_MONTHLY_FEE.STARTER,
    annual: PLAN_MONTHLY_FEE.STARTER * 12,
    commission: Math.round(PLAN_COMMISSION.STARTER * 100),
    color: 'border-gray-200',
    badge: null,
    firstMonthFree: false,
    features: [
      'Listagens Airbnb + Booking + VRBO',
      'Fechadura inteligente',
      'Comunicação com hóspedes 24/7',
      'Relatório mensal EN ou DE',
      'Dashboard online',
    ],
    note: 'Manutenção correctiva cobrada à parte.',
  },
  {
    id: 'BASIC',
    name: 'Basic',
    tagline: '1.º mês grátis',
    monthly: PLAN_MONTHLY_FEE.BASIC,
    annual: PLAN_MONTHLY_FEE.BASIC * 10, // 2 months free on annual
    commission: Math.round(PLAN_COMMISSION.BASIC * 100),
    color: 'border-gray-200',
    badge: null,
    firstMonthFree: true,
    features: [
      'Tudo do Starter',
      'Guest AI Assistant 24/7 durante a estadia',
      'Voice feedback após checkout',
      'Manutenção preventiva mensal',
      'Relatório mensal premium (PDF)',
      'Payouts semanais via Stripe Connect',
    ],
    note: 'Manutenção correctiva cobrada à parte.',
  },
  {
    id: 'MID',
    name: 'Mid',
    tagline: '1.º mês grátis',
    monthly: PLAN_MONTHLY_FEE.MID,
    annual: PLAN_MONTHLY_FEE.MID * 10,
    commission: Math.round(PLAN_COMMISSION.MID * 100),
    color: 'border-[#c9a96e]',
    badge: 'Mais popular',
    firstMonthFree: true,
    features: [
      'Tudo do Basic',
      'AI dynamic pricing (+18% receita estimada)',
      'Market Intelligence (competidores Costa Tropical)',
      'Resposta prioritária ao owner <12h',
      'Resposta prioritária ao hóspede <2h',
      'Emergências resolvidas <24h',
    ],
    note: 'Manutenção correctiva cobrada à parte.',
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    tagline: 'Serviço completo, sem limites',
    monthly: PLAN_MONTHLY_FEE.PREMIUM,
    annual: PLAN_MONTHLY_FEE.PREMIUM * 10,
    commission: Math.round(PLAN_COMMISSION.PREMIUM * 100),
    color: 'border-gray-200',
    badge: null,
    firstMonthFree: false,
    features: [
      'Tudo do Mid',
      'AI optimizado (+25% receita estimada)',
      'Transfer aeroporto Málaga/Granada',
      'Lavandaria e roupa de cama premium',
      'Fiscal completo (Modelo 179 + IRNR)',
      'Emergências resolvidas <4h',
    ],
    note: 'Manutenção correctiva cobrada à parte.',
  },
]

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>('monthly')
  const { fmt } = useCurrency()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1e3a5f] py-5 px-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white tracking-tight">
            Unlock<span className="text-[#c9a96e]">Costa</span>
          </Link>
          <Link href="/login" className="rounded-md bg-[#c9a96e] px-4 py-2 text-sm font-medium text-[#1e3a5f] hover:bg-[#b8965d]">
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16">
        {/* Title */}
        <div className="text-center mb-12">
          <p className="text-sm font-semibold text-[#c9a96e] uppercase tracking-widest mb-3">
            Your Property in Coastal Spain, Managed with Care
          </p>
          <h1 className="text-4xl font-serif font-bold text-[#1e3a5f] mb-4">
            Planos transparentes, sem surpresas
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Gestão profissional na Costa de Espanha. Cancela quando quiseres.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-2 mt-8 bg-white rounded-full border p-1 shadow-sm">
            <button
              onClick={() => setBilling('monthly')}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                billing === 'monthly' ? 'bg-[#1e3a5f] text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                billing === 'annual' ? 'bg-[#1e3a5f] text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Anual
              <span className="ml-2 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-semibold">
                2 meses grátis
              </span>
            </button>
          </div>
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {PLANS.map(plan => {
            const price  = billing === 'monthly' ? plan.monthly : plan.annual
            const isFree = price === 0
            const isPopular = !!plan.badge

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 bg-white p-6 flex flex-col ${plan.color} ${isPopular ? 'shadow-xl ring-1 ring-[#c9a96e]/30' : 'shadow-sm'}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#c9a96e] px-3 py-1 text-xs font-bold text-[#1e3a5f] shadow">
                      <Star className="h-3 w-3 fill-current" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Name + tagline */}
                <div className="mb-4 mt-1">
                  <h2 className="text-xl font-bold text-[#1e3a5f]">{plan.name}</h2>
                  <p className="text-xs text-gray-500 mt-0.5">{plan.tagline}</p>
                </div>

                {/* Price */}
                <div className="mb-1">
                  {isFree ? (
                    <span className="text-3xl font-bold text-[#1e3a5f]">Grátis</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold text-[#1e3a5f]">{fmt(price)}</span>
                      <span className="text-sm text-gray-500 ml-1">/{billing === 'monthly' ? 'mês' : 'ano'}</span>
                    </>
                  )}
                </div>
                {billing === 'annual' && !isFree && (
                  <p className="text-xs text-green-600 mb-3">
                    Poupas {fmt(plan.monthly * 2)} vs. mensal
                  </p>
                )}
                {plan.firstMonthFree && billing === 'monthly' && (
                  <p className="text-xs text-[#c9a96e] font-semibold mb-3">1.º mês grátis</p>
                )}

                {/* Commission */}
                <div className="mb-5 rounded-lg bg-gray-50 border px-3 py-2.5 text-center">
                  <span className="text-xs text-gray-500 block">Comissão HostMasters</span>
                  <span className="text-2xl font-bold text-[#1e3a5f]">{plan.commission}%</span>
                  <span className="text-xs text-gray-400 block">sobre valor líquido das plataformas</span>
                </div>

                {/* Features */}
                <ul className="flex-1 space-y-2 mb-5">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                {/* Note */}
                <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 mb-5 text-xs text-amber-700 flex items-start gap-1.5">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  {plan.note}
                </div>

                <Link
                  href={isFree ? '/register' : `/register?plan=${plan.id}&billing=${billing}`}
                  className={`block rounded-lg py-2.5 text-center text-sm font-semibold transition-colors ${
                    isPopular
                      ? 'bg-[#c9a96e] text-[#1e3a5f] hover:bg-[#b8965d]'
                      : 'bg-[#1e3a5f] text-white hover:bg-[#162d4a]'
                  }`}
                >
                  {isFree ? 'Começar grátis' : 'Escolher plano'}
                </Link>
              </div>
            )
          })}
        </div>

        {/* Annual pricing table */}
        <div className="mt-14 rounded-2xl border bg-white p-6 shadow-sm">
          <h3 className="text-base font-bold text-[#1e3a5f] mb-4 flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#c9a96e]" />
            Plano Anual — 2 meses grátis
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-gray-500 border-b">
                  <th className="pb-3">Plano</th>
                  <th className="pb-3">Mensal</th>
                  <th className="pb-3">Anual</th>
                  <th className="pb-3">Poupança</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {PLANS.filter(p => p.monthly > 0).map(p => (
                  <tr key={p.id}>
                    <td className="py-3 font-semibold text-[#1e3a5f]">{p.name}</td>
                    <td className="py-3 text-gray-600">{fmt(p.monthly)}/mês</td>
                    <td className="py-3 text-gray-600">{fmt(p.annual)}/ano</td>
                    <td className="py-3 text-green-600 font-semibold">{fmt(p.monthly * 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-xs text-gray-400 max-w-2xl mx-auto">
          A comissão é calculada sobre o valor líquido recebido das plataformas.
          Manutenção correctiva (reparações, substituições) cobrada à parte em todos os planos —
          com nota fiscal e aprovação do owner acima de €50.
        </p>
      </main>
    </div>
  )
}
