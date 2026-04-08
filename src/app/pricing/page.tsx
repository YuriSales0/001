'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check, Star, Zap } from 'lucide-react'
import { useCurrency } from '@/contexts/currency-context'

type Billing = 'monthly' | 'annual'

const PLANS = [
  {
    id: 'STARTER',
    name: 'Starter',
    monthly: 0,
    annual: 0,
    commission: 20,
    color: 'border-gray-200',
    badge: null,
    features: [
      '1 propriedade',
      'Calendário básico',
      'Relatórios mensais',
      'Suporte por email',
    ],
  },
  {
    id: 'BASIC',
    name: 'Basic',
    monthly: 89,
    annual: 890,
    commission: 20,
    color: 'border-gray-200',
    badge: null,
    features: [
      'Até 3 propriedades',
      'Calendário completo',
      'Relatórios avançados',
      'Gestão de crew',
      'Suporte por email',
    ],
  },
  {
    id: 'MID',
    name: 'Mid',
    monthly: 139,
    annual: 1390,
    commission: 18,
    color: 'border-[#c9a96e]',
    badge: 'Mais popular',
    features: [
      'Até 10 propriedades',
      'Limpeza preventiva automática',
      'Calendário avançado',
      'Relatórios premium',
      'Chat com gestor',
      'Suporte prioritário',
    ],
  },
  {
    id: 'PREMIUM',
    name: 'Premium',
    monthly: 199,
    annual: 1990,
    commission: 15,
    color: 'border-gray-200',
    badge: null,
    features: [
      'Propriedades ilimitadas',
      'Limpeza preventiva automática',
      'Inspecções incluídas',
      'Relatórios personalizados',
      'Chat prioritário',
      'Gestor dedicado',
      'Suporte 24/7',
    ],
  },
]

export default function PricingPage() {
  const [billing, setBilling] = useState<Billing>('monthly')
  const { fmt } = useCurrency()

  const savings2months = (monthly: number) => monthly * 2

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1e3a5f] py-6 px-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-white tracking-tight">
            Unlock<span className="text-[#c9a96e]">Costa</span>
          </Link>
          <Link
            href="/login"
            className="rounded-md bg-[#c9a96e] px-4 py-2 text-sm font-medium text-[#1e3a5f] hover:bg-[#b8965d]"
          >
            Entrar
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16">
        {/* Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#1e3a5f] mb-4">
            Planos transparentes, sem surpresas
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Escolhe o plano ideal para as tuas propriedades na Costa de Espanha.
            Cancela quando quiseres.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-3 mt-8 bg-white rounded-full border p-1 shadow-sm">
            <button
              onClick={() => setBilling('monthly')}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                billing === 'monthly'
                  ? 'bg-[#1e3a5f] text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                billing === 'annual'
                  ? 'bg-[#1e3a5f] text-white'
                  : 'text-gray-600 hover:text-gray-900'
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PLANS.map(plan => {
            const price = billing === 'monthly' ? plan.monthly : plan.annual
            const isFree = price === 0
            const isPopular = plan.badge === 'Mais popular'

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 bg-white p-6 flex flex-col ${plan.color} ${
                  isPopular ? 'shadow-lg scale-105' : ''
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#c9a96e] px-3 py-1 text-xs font-bold text-[#1e3a5f]">
                      <Star className="h-3 w-3 fill-current" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-4">
                  <h2 className="text-lg font-bold text-[#1e3a5f]">{plan.name}</h2>
                  <div className="mt-3">
                    {isFree ? (
                      <span className="text-3xl font-bold text-[#1e3a5f]">Grátis</span>
                    ) : (
                      <>
                        <span className="text-3xl font-bold text-[#1e3a5f]">
                          {fmt(price)}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">
                          /{billing === 'monthly' ? 'mês' : 'ano'}
                        </span>
                      </>
                    )}
                  </div>
                  {billing === 'annual' && !isFree && (
                    <p className="text-xs text-green-600 mt-1">
                      Poupas {fmt(savings2months(plan.monthly))} vs. mensal
                    </p>
                  )}
                </div>

                {/* Commission badge */}
                <div className="mb-4 rounded-lg bg-gray-50 px-3 py-2 text-center">
                  <span className="text-xs text-gray-500">Comissão HostMasters</span>
                  <div className="text-xl font-bold text-[#1e3a5f]">{plan.commission}%</div>
                </div>

                {/* Features */}
                <ul className="flex-1 space-y-2 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

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

        {/* FAQ note */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-6 py-4">
            <Zap className="h-5 w-5 text-blue-500 shrink-0" />
            <p className="text-sm text-blue-800">
              <strong>Desconto anual</strong> = equivalente a 2 meses grátis.
              Os preços apresentados são em EUR. A comissão é calculada automaticamente sobre cada reserva.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
