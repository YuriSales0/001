import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/session'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/prisma'
import { buildSystemPrompt, ASSISTANT_MODEL } from '@/lib/ai-context'
import type { ChatRole } from '@/lib/ai-context'

export const maxDuration = 30

/**
 * AI Team Assistant — with real-time data context per role.
 *
 * Each request fetches live data from the DB relevant to the user's role
 * and injects it as context. This lets the assistant answer questions
 * like "what tasks do I have next week?" or "how is my property doing?"
 */
export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CREW', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const body = await request.json()
  const { message, history = [] } = body as {
    message: string
    history: { role: 'user' | 'assistant'; content: string }[]
  }

  if (!message?.trim()) {
    return NextResponse.json({ error: 'message required' }, { status: 400 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({
      answer: 'Assistente não configurado ainda. Adiciona ANTHROPIC_API_KEY nas variáveis de ambiente do Vercel.',
      ready: false,
    })
  }

  // ── Fetch live context based on role ──
  const liveContext = await buildLiveContext(me.id, me.role as ChatRole)

  try {
    const client = new Anthropic()

    const stream = await client.messages.stream({
      model: ASSISTANT_MODEL,
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: buildSystemPrompt(me.role as ChatRole),
          cache_control: { type: 'ephemeral' },
        },
        {
          type: 'text',
          text: `\n\n## Dados em tempo real (${new Date().toLocaleDateString('pt-PT')})\n\nUtilizador: ${me.name ?? me.email} (${me.role})\n\n${liveContext}\n\nIMPORTANTE: Responde de forma natural e conversacional. Usa negrito só para números ou valores-chave. Não uses headers markdown (##) nem listas com hífens excessivos. Escreve como se estivesses a falar com um colega.`,
        },
      ],
      messages: [
        ...history.slice(-10).map(h => ({ role: h.role as 'user' | 'assistant', content: h.content })),
        { role: 'user' as const, content: message },
      ],
    })

    const finalMessage = await stream.finalMessage()
    const text = finalMessage.content[0].type === 'text' ? finalMessage.content[0].text : ''
    return NextResponse.json({ answer: text, ready: true })
  } catch (err) {
    console.error('[AI Assistant]', err)
    return NextResponse.json(
      { error: 'Erro ao contactar o assistente. Tenta novamente.' },
      { status: 502 },
    )
  }
}

// ── Live context builders per role ──

async function buildLiveContext(userId: string, role: ChatRole): Promise<string> {
  const now = new Date()

  if (role === 'CREW') return buildCrewContext(userId, now)
  if (role === 'MANAGER') return buildManagerContext(userId, now)
  if (role === 'CLIENT') return buildClientContext(userId, now)
  return buildAdminContext(now)
}

async function buildCrewContext(userId: string, now: Date): Promise<string> {
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // Monday
  weekStart.setHours(0, 0, 0, 0)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)

  const nextWeekStart = new Date(weekEnd)
  nextWeekStart.setDate(nextWeekStart.getDate() + 1)
  const nextWeekEnd = new Date(nextWeekStart)
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 6)

  const [thisWeekTasks, nextWeekTasks, pendingTasks] = await Promise.all([
    prisma.task.findMany({
      where: { assigneeId: userId, dueDate: { gte: weekStart, lte: weekEnd } },
      include: { property: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.task.findMany({
      where: { assigneeId: userId, dueDate: { gte: nextWeekStart, lte: nextWeekEnd } },
      include: { property: { select: { name: true } } },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.task.count({ where: { assigneeId: userId, status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
  ])

  const fmtTask = (t: typeof thisWeekTasks[0]) =>
    `${t.dueDate.toLocaleDateString('pt-PT', { weekday: 'short', day: 'numeric' })} — ${t.type} em ${t.property.name} (${t.status})`

  return `Tarefas pendentes no total: ${pendingTasks}

Tarefas esta semana (${thisWeekTasks.length}):
${thisWeekTasks.length > 0 ? thisWeekTasks.map(fmtTask).join('\n') : 'Nenhuma tarefa esta semana.'}

Tarefas próxima semana (${nextWeekTasks.length}):
${nextWeekTasks.length > 0 ? nextWeekTasks.map(fmtTask).join('\n') : 'Nenhuma tarefa na próxima semana.'}

Comparação: ${nextWeekTasks.length > thisWeekTasks.length ? `Próxima semana tem mais ${nextWeekTasks.length - thisWeekTasks.length} tarefa(s).` : nextWeekTasks.length < thisWeekTasks.length ? `Próxima semana tem menos ${thisWeekTasks.length - nextWeekTasks.length} tarefa(s).` : 'Mesma carga de trabalho.'}`
}

async function buildManagerContext(userId: string, now: Date): Promise<string> {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [clients, pendingPayouts, monthReservations] = await Promise.all([
    prisma.user.count({ where: { managerId: userId, role: 'CLIENT' } }),
    prisma.payout.findMany({
      where: {
        status: 'SCHEDULED',
        property: { owner: { managerId: userId } },
      },
      select: { netAmount: true, scheduledFor: true, property: { select: { name: true, owner: { select: { name: true } } } } },
      orderBy: { scheduledFor: 'asc' },
      take: 10,
    }),
    prisma.reservation.count({
      where: {
        checkIn: { gte: monthStart },
        status: { not: 'CANCELLED' },
        property: { owner: { managerId: userId } },
      },
    }),
  ])

  const totalPending = pendingPayouts.reduce((s, p) => s + p.netAmount, 0)
  const fmtPayout = (p: typeof pendingPayouts[0]) =>
    `${p.property.name} (${p.property.owner?.name ?? '?'}) — €${p.netAmount.toFixed(0)} agendado ${p.scheduledFor.toLocaleDateString('pt-PT')}`

  return `Clientes na carteira: ${clients}
Reservas este mês: ${monthReservations}
Payouts pendentes: ${pendingPayouts.length} (total €${totalPending.toFixed(0)})

${pendingPayouts.length > 0 ? `Próximos payouts:\n${pendingPayouts.map(fmtPayout).join('\n')}` : ''}`
}

async function buildClientContext(userId: string, now: Date): Promise<string> {
  const ninetyDaysAgo = new Date(now)
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const [properties, recentReservations, paidPayouts, scheduledPayouts] = await Promise.all([
    prisma.property.findMany({
      where: { ownerId: userId },
      select: { id: true, name: true, status: true },
    }),
    prisma.reservation.findMany({
      where: {
        property: { ownerId: userId },
        checkIn: { gte: ninetyDaysAgo },
        status: { not: 'CANCELLED' },
      },
      select: { amount: true, checkIn: true, checkOut: true, guestName: true, platform: true, property: { select: { name: true } } },
      orderBy: { checkIn: 'desc' },
      take: 10,
    }),
    prisma.payout.aggregate({
      where: { property: { ownerId: userId }, status: 'PAID', paidAt: { gte: ninetyDaysAgo } },
      _sum: { netAmount: true, grossAmount: true, commission: true },
      _count: true,
    }),
    prisma.payout.aggregate({
      where: { property: { ownerId: userId }, status: 'SCHEDULED' },
      _sum: { netAmount: true },
      _count: true,
    }),
  ])

  const totalNights = recentReservations.reduce((s, r) => {
    const nights = Math.max(1, Math.ceil((r.checkOut.getTime() - r.checkIn.getTime()) / 86400000))
    return s + nights
  }, 0)
  const occupancy = properties.length > 0 ? Math.min(100, (totalNights / (90 * properties.length)) * 100) : 0

  // Compare with platform average (all properties)
  const allPaidPayouts = await prisma.payout.aggregate({
    where: { status: 'PAID', paidAt: { gte: ninetyDaysAgo } },
    _sum: { grossAmount: true },
    _count: true,
  })
  const allProperties = await prisma.property.count({ where: { status: 'ACTIVE' } })
  const platformAvgRevenue = allProperties > 0 && allPaidPayouts._sum.grossAmount
    ? allPaidPayouts._sum.grossAmount / allProperties
    : 0
  const ownerRevenue = paidPayouts._sum.grossAmount ?? 0
  const ownerAvgRevenue = properties.length > 0 ? ownerRevenue / properties.length : 0

  return `Propriedades: ${properties.map(p => `${p.name} (${p.status})`).join(', ') || 'Nenhuma'}

Últimos 90 dias:
Receita bruta: €${(paidPayouts._sum.grossAmount ?? 0).toFixed(0)}
Comissão HM: €${(paidPayouts._sum.commission ?? 0).toFixed(0)}
Recebido líquido: €${(paidPayouts._sum.netAmount ?? 0).toFixed(0)}
Reservas: ${recentReservations.length} (${totalNights} noites)
Ocupação estimada: ${occupancy.toFixed(0)}%

A receber (agendado): €${(scheduledPayouts._sum.netAmount ?? 0).toFixed(0)} (${scheduledPayouts._count} payouts)

Performance vs. plataforma:
Receita média por propriedade (tua): €${ownerAvgRevenue.toFixed(0)}
Receita média por propriedade (plataforma): €${platformAvgRevenue.toFixed(0)}
Posição: ${ownerAvgRevenue > platformAvgRevenue ? `Acima da média (+${((ownerAvgRevenue / Math.max(platformAvgRevenue, 1) - 1) * 100).toFixed(0)}%)` : ownerAvgRevenue < platformAvgRevenue && platformAvgRevenue > 0 ? `Abaixo da média (${((ownerAvgRevenue / platformAvgRevenue - 1) * 100).toFixed(0)}%)` : 'Na média'}

${recentReservations.length > 0 ? `Últimas reservas:\n${recentReservations.slice(0, 5).map(r => `${r.property.name} — ${r.guestName} (${r.checkIn.toLocaleDateString('pt-PT')} a ${r.checkOut.toLocaleDateString('pt-PT')}) €${r.amount.toFixed(0)} via ${r.platform ?? 'Directo'}`).join('\n')}` : ''}`
}

async function buildAdminContext(now: Date): Promise<string> {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const ninetyDaysAgo = new Date(now)
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const [
    activeProps,
    totalClients,
    monthReservations,
    paidThisMonth,
    scheduledPayouts,
    openAlerts,
    competitors,
  ] = await Promise.all([
    prisma.property.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { role: 'CLIENT' } }),
    prisma.reservation.count({ where: { checkIn: { gte: monthStart }, status: { not: 'CANCELLED' } } }),
    prisma.payout.aggregate({
      where: { status: 'PAID', paidAt: { gte: monthStart } },
      _sum: { grossAmount: true, commission: true },
    }),
    prisma.payout.aggregate({
      where: { status: 'SCHEDULED' },
      _sum: { netAmount: true },
      _count: true,
    }),
    prisma.systemAlert.count({ where: { resolvedAt: null } }),
    prisma.competitorListing.count({ where: { isActive: true } }),
  ])

  return `Propriedades activas: ${activeProps}
Clientes (owners): ${totalClients}
Reservas este mês: ${monthReservations}
Receita bruta este mês: €${(paidThisMonth._sum.grossAmount ?? 0).toFixed(0)}
Comissão HM este mês: €${(paidThisMonth._sum.commission ?? 0).toFixed(0)}
Payouts pendentes: ${scheduledPayouts._count} (€${(scheduledPayouts._sum.netAmount ?? 0).toFixed(0)})
Alertas abertos (AI Monitor): ${openAlerts}
Competitors scraped: ${competitors}`
}
