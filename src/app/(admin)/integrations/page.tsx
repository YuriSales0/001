import { Landmark, CheckCircle2, Clock, ArrowRight, Zap, Shield, RefreshCw } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const SERVICE_TERMS: Record<string, { title: string; terms: string }> = {
  MANAGER_AGREEMENT: {
    title: 'Acordo de Manager',
    terms: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS — MANAGER

Entre: HostMasters Costa Tropical S.L. ("Empresa")
E: [Nome do Manager] ("Manager")

1. OBJECTO
O Manager compromete-se a gerir uma carteira de proprietários atribuída pela Empresa, incluindo:
- Comunicação com proprietários e hóspedes
- Supervisão de reservas e operações
- Gestão de leads e pipeline comercial
- Coordenação com a equipa operacional (Crew)

2. COMPENSAÇÃO
a) Percentagem sobre assinaturas: [X]% do valor mensal de cada cliente na carteira
b) Percentagem sobre receita bruta: [X]% do valor bruto de cada reserva dos seus clientes
c) Pagamento: mensal, até ao dia 10 do mês seguinte

3. DURAÇÃO
Contrato por tempo indeterminado, com período experimental de 3 meses.
Rescisão: aviso prévio de 30 dias por qualquer das partes.

4. CONFIDENCIALIDADE
O Manager compromete-se a manter sigilo sobre dados de clientes, preços, e informações internas.

5. PROPRIEDADE INTELECTUAL
Todo o trabalho realizado na plataforma HostMasters é propriedade da Empresa.

HostMasters — Costa Tropical, España`,
  },
  CREW_MONTHLY: {
    title: 'Contrato Crew (Mensal)',
    terms: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS — CREW (MENSAL)

Entre: HostMasters Costa Tropical S.L. ("Empresa")
E: [Nome do Crew] ("Prestador")

1. OBJECTO
O Prestador compromete-se a executar tarefas operacionais atribuídas pela Empresa:
- Limpeza de propriedades
- Check-in e check-out de hóspedes
- Inspecções e manutenção preventiva
- Relatórios de estado

2. COMPENSAÇÃO
Valor fixo mensal: €[X]/mês
Pagamento: até ao dia 5 do mês seguinte

3. HORÁRIO E DISPONIBILIDADE
Disponibilidade conforme acordo. Tarefas atribuídas via plataforma HostMasters.

4. DURAÇÃO
Contrato mensal renovável automaticamente. Rescisão: 15 dias de aviso prévio.

HostMasters — Costa Tropical, España`,
  },
  CREW_FREELANCER: {
    title: 'Contrato Crew (Freelancer)',
    terms: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS — CREW (FREELANCER)

Entre: HostMasters Costa Tropical S.L. ("Empresa")
E: [Nome do Crew] ("Prestador")

1. OBJECTO
O Prestador compromete-se a executar tarefas pontuais atribuídas pela Empresa.

2. COMPENSAÇÃO
Valor por tarefa concluída: €[X]/tarefa
Valor por hora (quando aplicável): €[X]/hora
Pagamento: semanal ou mensal conforme acordo.

3. SEM EXCLUSIVIDADE
O Prestador é livre de prestar serviços a terceiros.

4. DURAÇÃO
Sem duração fixa. Cada tarefa aceite constitui um compromisso individual.

HostMasters — Costa Tropical, España`,
  },
  CLIENT_SERVICE: {
    title: 'Contrato de Serviço (Proprietário)',
    terms: `CONTRATO DE GESTÃO DE PROPRIEDADE

Entre: HostMasters Costa Tropical S.L. ("Empresa")
E: [Nome do Proprietário] ("Proprietário")

1. OBJECTO
A Empresa compromete-se a gerir o arrendamento de curta duração da(s) propriedade(s) do Proprietário, incluindo:
- Publicação em plataformas (Airbnb, Booking.com)
- Gestão de reservas e comunicação com hóspedes
- Coordenação de limpeza, check-in/out e manutenção
- Relatórios financeiros mensais

2. COMPENSAÇÃO DA EMPRESA
Plano: [STARTER|BASIC|MID|PREMIUM]
- Comissão: [13-22]% sobre o valor bruto de cada reserva
- Mensalidade: €[0-269]/mês conforme plano
- Taxa de limpeza: conforme plano

3. PAGAMENTO AO PROPRIETÁRIO
O valor líquido (receita bruta - comissão) é transferido conforme calendário da plataforma:
- Airbnb: checkout + 1 dia + 2 dias úteis
- Booking: fim do mês
- Directo: checkout + 7 dias

4. DURAÇÃO
Contrato anual renovável. Rescisão: 60 dias de aviso prévio.

5. RESPONSABILIDADES DO PROPRIETÁRIO
- Manter a propriedade em condições habitáveis
- Autorizar acesso à equipa operacional
- Manter seguro de responsabilidade civil activo

HostMasters — Costa Tropical, España`,
  },
}

const integrations = [
  {
    category: 'Contratos & Termos de Serviço',
    items: [
      {
        id: 'contracts',
        name: 'Gestão de Contratos',
        description: 'Templates de contrato por role — assinatura digital no onboarding',
        status: 'active',
        features: [
          `${Object.keys(SERVICE_TERMS).length} templates: Manager, Crew (mensal/freelancer), Cliente`,
          'Assinatura dual: Admin + User no wizard de onboarding',
          'Contratos visíveis no perfil do Admin',
        ],
        eta: 'Activo',
      },
    ],
  },
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
    category: 'Data Intelligence',
    items: [
      {
        id: 'kepler',
        name: 'Kepler.gl / deck.gl',
        description: 'Visualização geoespacial de pricing e ocupação por zona — base para venda de inteligência de mercado a imobiliárias regionais',
        status: 'planned',
        features: ['Heatmap de preço médio por zona Costa Tropical', 'Hexbin de ocupação por época e micro-mercado', 'Dashboard de mercado para imobiliárias (produto standalone)'],
        eta: '2027',
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
        <h1 className="text-3xl font-bold text-hm-black flex items-center gap-2">
          <Landmark className="h-7 w-7" />
          Integrações
        </h1>
        <p className="text-sm text-gray-600 mt-1">
          Ligações a bancos, plataformas e ferramentas de marketing · roadmap de activação
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-hm border bg-white p-4 text-center">
          <div className="text-2xl font-bold text-green-600">0</div>
          <div className="text-xs text-gray-500 mt-1">Activas</div>
        </div>
        <div className="rounded-hm border bg-white p-4 text-center">
          <div className="text-2xl font-bold text-amber-500">6</div>
          <div className="text-xs text-gray-500 mt-1">Planeadas</div>
        </div>
        <div className="rounded-hm border bg-white p-4 text-center">
          <div className="text-2xl font-bold text-hm-black">Q2–Q4</div>
          <div className="text-xs text-gray-500 mt-1">2026</div>
        </div>
      </div>

      {/* Integrations by category */}
      {integrations.map(cat => (
        <div key={cat.category} className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400">{cat.category}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cat.items.map(item => (
              <div key={item.id} className="rounded-hm border bg-white p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-hm-black">{item.name}</div>
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
