import { Landmark, CheckCircle2, Clock, ArrowRight, Zap, Shield, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const integrations = [
  {
    category: 'Bancário',
    items: [
      {
        id: 'nordigen',
        name: 'Nordigen / GoCardless',
        description: 'Open Banking europeu — detecta pagamentos recebidos e agenda payouts automaticamente',
        status: 'planned',
        features: ['Auto-detecta pagamentos de hóspedes', 'Marca payout como pago automaticamente', 'Reconciliação bancária mensal'],
        docs: 'https://nordigen.com/en/products/account-information/',
        eta: 'Q3 2026',
      },
      {
        id: 'stripe',
        name: 'Stripe',
        description: 'Pagamentos de subscrição e invoices automáticos para proprietários',
        status: 'planned',
        features: ['Cobra subscrições automaticamente', 'Gera invoices ao proprietário', 'Webhook para activação de plano'],
        eta: 'Q2 2026',
      },
    ],
  },
  {
    category: 'Pricing Intelligence',
    items: [
      {
        id: 'pricelabs',
        name: 'PriceLabs',
        description: 'Dados de concorrência e ocupação regional para Mid e Premium — alimenta o algoritmo de pricing',
        status: 'planned',
        features: ['Preços de concorrência Airbnb/Booking', 'Ocupação regional em tempo real', 'Sugestões por dia e sazonalidade'],
        eta: 'Q2 2026',
      },
    ],
  },
  {
    category: 'Marketing',
    items: [
      {
        id: 'meta',
        name: 'Meta Ads API',
        description: 'Importa dados de campanhas e gasto real directamente do painel de anúncios',
        status: 'planned',
        features: ['Sync automático de spend por campanha', 'Dados de alcance e conversão', 'CAC calculado automaticamente'],
        eta: 'Q3 2026',
      },
      {
        id: 'brevo',
        name: 'Brevo (Email)',
        description: 'Campanhas de email marketing para leads e proprietários',
        status: 'planned',
        features: ['Sequências de nurturing automáticas', 'Sync de leads do CRM', 'Métricas de abertura e click'],
        eta: 'Q4 2026',
      },
    ],
  },
]

const statusBadge = (status: string) => {
  if (status === 'active') return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium"><CheckCircle2 className="h-3 w-3" /> Activo</span>
  if (status === 'planned') return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-xs font-medium"><Clock className="h-3 w-3" /> Planeado</span>
  return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-500 px-2 py-0.5 text-xs font-medium"><RefreshCw className="h-3 w-3" /> Em breve</span>
}

export default function IntegrationsPage() {
  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-navy-900 flex items-center gap-2">
          <Landmark className="h-7 w-7" />
          Integrações
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Ligações a bancos, plataformas e ferramentas de marketing · roadmap de activação
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4 text-center">
          <div className="text-2xl font-bold text-green-600">0</div>
          <div className="text-xs text-gray-500 mt-1">Activas</div>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <div className="text-2xl font-bold text-amber-500">5</div>
          <div className="text-xs text-gray-500 mt-1">Planeadas</div>
        </div>
        <div className="rounded-xl border bg-white p-4 text-center">
          <div className="text-2xl font-bold text-navy-900">Q2–Q4</div>
          <div className="text-xs text-gray-500 mt-1">2026</div>
        </div>
      </div>

      {/* Integrations by category */}
      {integrations.map(cat => (
        <div key={cat.category} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{cat.category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cat.items.map(item => (
              <div key={item.id} className="rounded-xl border bg-white p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-navy-900">{item.name}</div>
                    <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                  </div>
                  {statusBadge(item.status)}
                </div>
                <ul className="space-y-1">
                  {item.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-600">
                      <Zap className="h-3 w-3 text-amber-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-gray-400">ETA: {item.eta}</span>
                  {item.status === 'active' ? (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Ligado
                    </span>
                  ) : (
                    <span className="text-xs text-gray-300 flex items-center gap-1">
                      <ArrowRight className="h-3 w-3" /> Em desenvolvimento
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
