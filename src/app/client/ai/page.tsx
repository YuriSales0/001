'use client'

import { useEffect, useState } from 'react'
import { Sparkles, Lock, TrendingUp, Calendar, ArrowRight } from 'lucide-react'
import Link from 'next/link'

type PlanData = {
  subscriptionPlan: string | null
  properties: { id: string; name: string }[]
}

type DataPoint = {
  monthOfYear: number
  _avg: { priceCharged: number | null }
  _count: number
}

export default function ClientAIPage() {
  const [plan, setPlan] = useState<PlanData | null>(null)
  const [stats, setStats] = useState<DataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/me').then(r => r.json()).then(setPlan).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (plan?.subscriptionPlan && ['MID', 'PREMIUM'].includes(plan.subscriptionPlan)) {
      fetch('/api/client/pricing-stats').then(r => r.ok ? r.json() : []).then(setStats)
    }
  }, [plan])

  if (loading) return <div className="p-8 text-center text-gray-400">A carregar…</div>

  const hasAccess = plan?.subscriptionPlan && ['MID', 'PREMIUM'].includes(plan.subscriptionPlan)

  if (!hasAccess) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-6">
        <div className="h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
          <Lock className="h-8 w-8 text-amber-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">AI Pricing Intelligence</h2>
          <p className="text-gray-500">
            Disponível nos planos <strong>Mid</strong> e <strong>Premium</strong>.
            O sistema analisa a concorrência nas plataformas e sugere os preços mais competitivos
            para maximizar a tua receita na Costa Tropical.
          </p>
        </div>
        <div className="rounded-hm border bg-white p-5 text-left space-y-3">
          {[
            'Análise de preços de concorrência (Airbnb, Booking)',
            'Sugestões por dia da semana e sazonalidade',
            'Ajuste automático por ocupação regional',
            'Relatório mensal de optimização de receita',
          ].map(f => (
            <div key={f} className="flex items-center gap-2 text-sm text-gray-700">
              <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
              {f}
            </div>
          ))}
        </div>
        <Link
          href="/client/plan"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 text-white px-6 py-3 font-semibold text-sm hover:bg-amber-600 transition-colors"
        >
          Ver planos
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const maxAvg = Math.max(...stats.map(m => m._avg.priceCharged ?? 0), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-amber-500" />
          AI Pricing Intelligence
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Análise de preços das tuas propriedades · plano {plan?.subscriptionPlan}
        </p>
      </div>

      {stats.length === 0 ? (
        <div className="rounded-hm border-2 border-dashed border-gray-200 p-12 text-center">
          <Sparkles className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700 mb-1">Dados em recolha</h3>
          <p className="text-sm text-gray-500">
            Os dados são recolhidos a cada reserva. As análises estarão disponíveis em breve.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-hm border bg-white p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              Sazonalidade — preço médio/noite
            </h3>
            <div className="space-y-2">
              {stats.map(m => (
                <div key={m.monthOfYear} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-7">{MONTH_NAMES[m.monthOfYear - 1]}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${((m._avg.priceCharged ?? 0) / maxAvg) * 100}%` }}
                    >
                      <span className="text-[10px] font-bold text-amber-900">
                        €{(m._avg.priceCharged ?? 0).toFixed(0)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-hm border bg-amber-50 border-amber-200 p-5 flex flex-col justify-between">
            <div>
              <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Integração com concorrência
              </h3>
              <p className="text-sm text-amber-800">
                A equipa HostMasters está a activar a integração com dados de mercado (PriceLabs)
                para o teu plano {plan?.subscriptionPlan}. Receberás uma notificação assim que estiver disponível.
              </p>
            </div>
            <div className="mt-4 text-xs text-amber-700 bg-amber-100 rounded-lg px-3 py-2">
              Previsão: Q2 2026 · Os teus dados históricos já estão a ser recolhidos
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
