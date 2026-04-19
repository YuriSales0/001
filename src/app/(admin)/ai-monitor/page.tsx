import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { redirect } from 'next/navigation'
import { SystemMonitor } from '@/components/hm/system-monitor'
import { ShieldCheck, AlertTriangle, Info, Clock, CalendarDays, Wallet, BarChart3 } from 'lucide-react'

export const dynamic = 'force-dynamic'

const CHECKS_BY_SECTION = [
  {
    section: 'Alugueis',
    icon: CalendarDays,
    checks: [
      {
        type: 'RESERVATION_PAST_CHECKIN',
        severity: 'HIGH',
        label: 'Check-in passado com estado UPCOMING',
        desc: 'Reservas com estado UPCOMING cujo check-in já aconteceu — o estado está desactualizado e afecta o dashboard de operações.',
        fix: 'Marcar manualmente como ACTIVE ou COMPLETED conforme o estado real da reserva.',
      },
      {
        type: 'CHECKIN_NO_TASK',
        severity: 'MEDIUM',
        label: 'Check-in em <7 dias sem tarefa',
        desc: 'Reservas com check-in nos próximos 7 dias sem tarefa CHECK_IN criada para a equipa.',
        fix: 'Criar tarefa CHECK_IN no calendário e atribuir ao Crew.',
      },
      {
        type: 'CHECKOUT_NO_TASK',
        severity: 'MEDIUM',
        label: 'Check-out em <7 dias sem tarefa',
        desc: 'Reservas com check-out nos próximos 7 dias sem tarefa CHECK_OUT ou CLEANING criada.',
        fix: 'Criar tarefa CHECK_OUT ou CLEANING no calendário e atribuir ao Crew.',
      },
      {
        type: 'CHECKOUT_NO_CREW_REPORT',
        severity: 'LOW',
        label: 'Check-out sem relatório de Crew',
        desc: 'Reservas concluídas nos últimos 3 dias sem relatório de checkout submetido pelo Crew.',
        fix: 'Solicitar ao Crew que submeta o relatório da reserva.',
      },
      {
        type: 'RESERVATION_ZERO_AMOUNT',
        severity: 'MEDIUM',
        label: 'Reserva com valor €0',
        desc: 'Reservas activas com valor €0 — possível erro de entrada de dados.',
        fix: 'Verificar e corrigir o valor da reserva.',
      },
    ],
  },
  {
    section: 'Payouts',
    icon: Wallet,
    checks: [
      {
        type: 'PAYOUT_NO_INVOICE',
        severity: 'HIGH',
        label: 'Payout pago sem invoice',
        desc: 'Cada payout marcado como PAID deve gerar automaticamente um invoice ao proprietário. Mismatch indica falha na criação.',
        fix: 'Verificar o log de erros do servidor. Criar o invoice manualmente se necessário.',
      },
      {
        type: 'PAYOUT_OVERDUE',
        severity: 'HIGH',
        label: 'Payout agendado em atraso',
        desc: 'Payouts com data scheduledFor já passada sem serem marcados como pagos.',
        fix: 'Processar o pagamento e marcar o payout como PAID, ou reagendar se ainda não processado.',
      },
      {
        type: 'COMMISSION_MISMATCH',
        severity: 'MEDIUM',
        label: 'Taxa de comissão desactualizada',
        desc: 'Payouts agendados com taxa diferente do plano actual do proprietário (pode ter mudado de plano após o payout ser criado).',
        fix: 'Editar o payout e recriar com a taxa correcta antes de marcar como pago.',
      },
      {
        type: 'INVOICE_PAID_NO_PAIDAT',
        severity: 'HIGH',
        label: 'Invoice PAID sem data de pagamento',
        desc: 'Invoices com status=PAID mas sem paidAt ficam invisíveis no dashboard de receita.',
        fix: 'Editar o invoice e definir a data de pagamento manualmente.',
      },
    ],
  },
  {
    section: 'Relatórios',
    icon: BarChart3,
    checks: [
      {
        type: 'REPORT_MISSING',
        severity: 'MEDIUM',
        label: 'Propriedade com actividade sem relatório mensal',
        desc: 'Propriedades com reservas no mês anterior sem relatório mensal gerado para o proprietário.',
        fix: 'Gerar o relatório mensal em My Reports.',
      },
      {
        type: 'REPORT_NOT_SENT',
        severity: 'LOW',
        label: 'Relatório gerado mas não enviado',
        desc: 'Relatórios mensais do mês anterior gerados mas não enviados ao proprietário.',
        fix: 'Aceder a My Reports e enviar os relatórios pendentes.',
      },
      {
        type: 'PROPERTY_STALE',
        severity: 'LOW',
        label: 'Propriedade sem actividade (90 dias)',
        desc: 'Propriedades activas sem nenhuma reserva nos últimos 90 dias — podem estar inactivas ou com listagem desactualizada.',
        fix: 'Verificar com o proprietário se a propriedade está disponível para arrendamento.',
      },
    ],
  },
]

const SEVERITY_ICON = {
  HIGH:   <AlertTriangle className="h-3.5 w-3.5 text-red-500" />,
  MEDIUM: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
  LOW:    <Info className="h-3.5 w-3.5 text-blue-400" />,
}

const SEVERITY_BADGE: Record<string, string> = {
  HIGH:   'bg-red-100 text-red-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW:    'bg-blue-100 text-blue-700',
}

export default async function AiMonitorPage() {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) redirect('/dashboard')

  const history = await prisma.systemAlert.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const fmt = (d: Date) => d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="h-5 w-5 text-navy-700" />
          <h1 className="text-2xl font-bold text-hm-black">AI Monitor</h1>
        </div>
        <p className="text-sm text-gray-500">
          Verificação automática de consistência da base de dados · Sem ligação Claude API por agora — só lógica de detecção
        </p>
      </div>

      {/* Live checks */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Estado actual</p>
        <SystemMonitor />
      </div>

      {/* Check catalogue — grouped by section */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">O que é verificado</p>
        <div className="space-y-4">
          {CHECKS_BY_SECTION.map(group => {
            const SectionIcon = group.icon
            return (
              <div key={group.section} className="rounded-hm border bg-white overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-b">
                  <SectionIcon className="h-4 w-4 text-gray-500" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{group.section}</span>
                  <span className="ml-auto text-[10px] text-gray-400">{group.checks.length} verificações</span>
                </div>
                <div className="divide-y">
                  {group.checks.map(c => (
                    <div key={c.type} className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">{SEVERITY_ICON[c.severity as keyof typeof SEVERITY_ICON]}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-gray-900">{c.label}</span>
                            <span className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 ${SEVERITY_BADGE[c.severity]}`}>
                              {c.severity}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500">{c.desc}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            <span className="font-medium text-gray-500">Resolução:</span> {c.fix}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Alert history */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Histórico de alertas persistidos
        </p>
        {history.length === 0 ? (
          <div className="rounded-hm border bg-white py-10 text-center text-sm text-gray-400">
            <ShieldCheck className="h-6 w-6 mx-auto mb-2 text-gray-200" />
            Sem alertas guardados. Os alertas serão persistidos quando o cron AI Monitor for activado.
          </div>
        ) : (
          <div className="rounded-hm border bg-white overflow-hidden divide-y">
            {history.map(a => (
              <div key={a.id} className="flex items-start gap-3 px-4 py-3">
                <div className="mt-0.5 shrink-0">
                  {SEVERITY_ICON[a.severity as keyof typeof SEVERITY_ICON] ?? <Info className="h-3.5 w-3.5 text-gray-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{a.message}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />{fmt(a.createdAt)}
                    </span>
                    {a.resolvedAt && (
                      <span className="text-[10px] text-green-600">Resolvido {fmt(a.resolvedAt)}</span>
                    )}
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase rounded px-1.5 py-0.5 shrink-0 ${SEVERITY_BADGE[a.severity] ?? 'bg-gray-100 text-gray-500'}`}>
                  {a.severity}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
