import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { redirect } from 'next/navigation'
import { Sparkles, TrendingUp, BarChart3, Calendar, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

async function getStats() {
  const [totalPoints, byMonth, byPlatform, byDayOfWeek] = await Promise.all([
    prisma.pricingDataPoint.count(),
    prisma.pricingDataPoint.groupBy({
      by: ['monthOfYear'],
      _avg: { priceCharged: true },
      _count: true,
      orderBy: { monthOfYear: 'asc' },
    }),
    prisma.pricingDataPoint.groupBy({
      by: ['platform'],
      _avg: { priceCharged: true },
      _count: true,
    }),
    prisma.pricingDataPoint.groupBy({
      by: ['dayOfWeek'],
      _avg: { priceCharged: true },
      _count: true,
      orderBy: { dayOfWeek: 'asc' },
    }),
  ])
  return { totalPoints, byMonth, byPlatform, byDayOfWeek }
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const DAY_NAMES   = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

export default async function AIPage() {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) redirect('/login')

  const { totalPoints, byMonth, byPlatform, byDayOfWeek } = await getStats()

  const maxMonthAvg = Math.max(...byMonth.map(m => m._avg.priceCharged ?? 0), 1)
  const maxDayAvg   = Math.max(...byDayOfWeek.map(d => d._avg.priceCharged ?? 0), 1)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-amber-500" />
            AI Pricing Intelligence
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Dados recolhidos automaticamente · modelo próprio em construção · integração PriceLabs disponível para Mid/Premium
          </p>
        </div>
      </div>

      {/* Data collection status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-5">
          <div className="text-xs uppercase text-gray-500">Noites recolhidas</div>
          <div className="text-3xl font-bold text-navy-900 mt-1">{totalPoints.toLocaleString()}</div>
          <div className="text-xs text-gray-400 mt-1">dados de preço acumulados</div>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <div className="text-xs uppercase text-gray-500">Preço médio/noite</div>
          <div className="text-3xl font-bold text-navy-900 mt-1">
            {totalPoints > 0
              ? `€${(byMonth.reduce((s, m) => s + (m._avg.priceCharged ?? 0) * m._count, 0) / Math.max(totalPoints, 1)).toFixed(0)}`
              : '—'}
          </div>
          <div className="text-xs text-gray-400 mt-1">média geral todas as propriedades</div>
        </div>
        <div className="rounded-xl border bg-amber-50 border-amber-200 p-5">
          <div className="text-xs uppercase text-amber-600">Estado do modelo</div>
          <div className="text-lg font-bold text-amber-700 mt-1">
            {totalPoints < 100 ? 'Recolha inicial' : totalPoints < 500 ? 'Em aprendizagem' : 'Dados suficientes'}
          </div>
          <div className="text-xs text-amber-600 mt-1">
            {totalPoints < 100
              ? `${totalPoints}/100 noites para primeiras análises`
              : totalPoints < 500
              ? `${totalPoints}/500 para alta assertividade`
              : 'Modelo com dados regionais sólidos'}
          </div>
        </div>
      </div>

      {totalPoints === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
          <Sparkles className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h3 className="font-semibold text-gray-700 mb-1">Sem dados ainda</h3>
          <p className="text-sm text-gray-500 max-w-md mx-auto">
            Os dados de pricing são recolhidos automaticamente a cada reserva criada.
            Cria reservas para começar a acumular o dataset.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By month */}
          <div className="rounded-xl border bg-white p-5">
            <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              Preço médio por mês
            </h3>
            <div className="space-y-2">
              {byMonth.map(m => (
                <div key={m.monthOfYear} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-7">{MONTH_NAMES[(m.monthOfYear - 1)]}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${((m._avg.priceCharged ?? 0) / maxMonthAvg) * 100}%` }}
                    >
                      <span className="text-[10px] font-bold text-amber-900">
                        €{(m._avg.priceCharged ?? 0).toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right">{m._count}n</span>
                </div>
              ))}
            </div>
          </div>

          {/* By day of week */}
          <div className="rounded-xl border bg-white p-5">
            <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gray-400" />
              Preço médio por dia da semana
            </h3>
            <div className="space-y-2">
              {byDayOfWeek.map(d => (
                <div key={d.dayOfWeek} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-7">{DAY_NAMES[d.dayOfWeek]}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className={`h-full rounded-full flex items-center justify-end pr-2 ${d.dayOfWeek >= 5 ? 'bg-blue-400' : 'bg-navy-200'}`}
                      style={{ width: `${((d._avg.priceCharged ?? 0) / maxDayAvg) * 100}%`, background: d.dayOfWeek >= 5 ? '#60a5fa' : '#93c5fd' }}
                    >
                      <span className="text-[10px] font-bold text-blue-900">
                        €{(d._avg.priceCharged ?? 0).toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right">{d._count}n</span>
                </div>
              ))}
            </div>
          </div>

          {/* By platform */}
          <div className="rounded-xl border bg-white p-5">
            <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-400" />
              Preço médio por plataforma
            </h3>
            <div className="space-y-3">
              {byPlatform.map(p => (
                <div key={p.platform ?? 'direct'} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                  <span className="text-sm font-medium text-gray-700">{p.platform ?? 'Direct'}</span>
                  <div className="text-right">
                    <div className="text-sm font-bold text-navy-900">€{(p._avg.priceCharged ?? 0).toFixed(0)}/noite</div>
                    <div className="text-xs text-gray-400">{p._count} noites</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Roadmap */}
          <div className="rounded-xl border bg-white p-5">
            <h3 className="font-semibold text-navy-900 mb-4">Roadmap de integração</h3>
            <div className="space-y-3">
              {[
                { phase: '1', label: 'Recolha de dados próprios', status: 'active', note: 'A decorrer — cada reserva gera dados' },
                { phase: '2', label: 'PriceLabs API (Mid/Premium)', status: 'next', note: 'Dados de concorrência + ocupação regional' },
                { phase: '3', label: 'Validação cruzada dados próprios vs API', status: 'future', note: 'Claude analisa discrepâncias e aprende' },
                { phase: '4', label: 'Modelo próprio Costa Tropical', status: 'future', note: 'Alta assertividade, custo só em tokens' },
              ].map(item => (
                <div key={item.phase} className="flex items-start gap-3">
                  <div className={`mt-0.5 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    item.status === 'active' ? 'bg-green-100 text-green-700' :
                    item.status === 'next'   ? 'bg-amber-100 text-amber-700' :
                                               'bg-gray-100 text-gray-400'
                  }`}>{item.phase}</div>
                  <div>
                    <div className="text-sm font-medium text-navy-900">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Notice */}
      <div className="flex items-start gap-3 rounded-xl bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
        <div>
          <strong>Próximo passo:</strong> Activar integração PriceLabs para clientes Mid e Premium —
          os dados desta página alimentarão o modelo de validação cruzada assim que a API estiver ligada.
        </div>
      </div>
    </div>
  )
}
