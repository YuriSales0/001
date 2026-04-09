import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { PLAN_COMMISSION } from '@/lib/finance'

export type MonitorSection = 'reservations' | 'payouts' | 'reports'

export type MonitorResult = {
  type: string
  section: MonitorSection
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
  message: string
  count: number
  action: { label: string; href: string }
}

export async function GET() {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const issues: MonitorResult[] = []
  const now = new Date()

  // ════════════════════════════════════════════════════════════════
  // SECÇÃO: ALUGUEIS
  // ════════════════════════════════════════════════════════════════

  // R1 — Reservas UPCOMING com checkIn já no passado (estado desactualizado)
  const overdueCheckins = await prisma.reservation.count({
    where: { status: 'UPCOMING', checkIn: { lt: now } },
  })
  if (overdueCheckins > 0) {
    issues.push({
      type: 'RESERVATION_PAST_CHECKIN',
      section: 'reservations',
      severity: 'HIGH',
      message: `${overdueCheckins} reserva${overdueCheckins > 1 ? 's' : ''} com estado UPCOMING mas check-in já passou — devem ser marcadas ACTIVE ou COMPLETED`,
      count: overdueCheckins,
      action: { label: 'Ver reservas', href: '/reservations' },
    })
  }

  // R2 — Reservas com check-in nos próximos 7 dias sem tarefa CHECK_IN
  const in7Days = new Date(now)
  in7Days.setDate(in7Days.getDate() + 7)

  const upcomingCheckIns = await prisma.reservation.findMany({
    where: { checkIn: { gte: now, lte: in7Days }, status: { in: ['UPCOMING', 'ACTIVE'] } },
    select: { id: true, propertyId: true },
  })
  if (upcomingCheckIns.length > 0) {
    const propIds = Array.from(new Set(upcomingCheckIns.map(r => r.propertyId)))
    const existingTasks = await prisma.task.findMany({
      where: { type: 'CHECK_IN', propertyId: { in: propIds }, dueDate: { gte: now, lte: in7Days }, status: { not: 'COMPLETED' } },
      select: { propertyId: true },
    })
    const covered = new Set(existingTasks.map(t => t.propertyId))
    const missing = upcomingCheckIns.filter(r => !covered.has(r.propertyId)).length
    if (missing > 0) {
      issues.push({
        type: 'CHECKIN_NO_TASK',
        section: 'reservations',
        severity: 'MEDIUM',
        message: `${missing} reserva${missing > 1 ? 's' : ''} com check-in em <7 dias sem tarefa CHECK_IN atribuída ao Crew`,
        count: missing,
        action: { label: 'Ver calendário', href: '/calendar' },
      })
    }
  }

  // R3 — Reservas com check-out nos próximos 7 dias sem tarefa CHECK_OUT
  const upcomingCheckOuts = await prisma.reservation.findMany({
    where: { checkOut: { gte: now, lte: in7Days }, status: { in: ['UPCOMING', 'ACTIVE'] } },
    select: { id: true, propertyId: true },
  })
  if (upcomingCheckOuts.length > 0) {
    const propIds = Array.from(new Set(upcomingCheckOuts.map(r => r.propertyId)))
    const existingTasks = await prisma.task.findMany({
      where: { type: 'CHECK_OUT', propertyId: { in: propIds }, dueDate: { gte: now, lte: in7Days }, status: { not: 'COMPLETED' } },
      select: { propertyId: true },
    })
    const covered = new Set(existingTasks.map(t => t.propertyId))
    const missing = upcomingCheckOuts.filter(r => !covered.has(r.propertyId)).length
    if (missing > 0) {
      issues.push({
        type: 'CHECKOUT_NO_TASK',
        section: 'reservations',
        severity: 'MEDIUM',
        message: `${missing} reserva${missing > 1 ? 's' : ''} com check-out em <7 dias sem tarefa CHECK_OUT ou CLEANING atribuída`,
        count: missing,
        action: { label: 'Ver calendário', href: '/calendar' },
      })
    }
  }

  // R4 — Reservas concluídas nos últimos 3 dias sem relatório de crew
  const threeDaysAgo = new Date(now)
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

  const recentCheckouts = await prisma.reservation.count({
    where: {
      checkOut: { gte: threeDaysAgo, lt: now },
      status: 'COMPLETED',
      crewReport: null,
    },
  })
  if (recentCheckouts > 0) {
    issues.push({
      type: 'CHECKOUT_NO_CREW_REPORT',
      section: 'reservations',
      severity: 'LOW',
      message: `${recentCheckouts} reserva${recentCheckouts > 1 ? 's' : ''} concluída${recentCheckouts > 1 ? 's' : ''} nos últimos 3 dias sem relatório de checkout do Crew`,
      count: recentCheckouts,
      action: { label: 'Ver reservas', href: '/reservations' },
    })
  }

  // R5 — Reservas com valor €0 (possível erro de entrada)
  const zeroAmountReservations = await prisma.reservation.count({
    where: { amount: 0, status: { not: 'CANCELLED' } },
  })
  if (zeroAmountReservations > 0) {
    issues.push({
      type: 'RESERVATION_ZERO_AMOUNT',
      section: 'reservations',
      severity: 'MEDIUM',
      message: `${zeroAmountReservations} reserva${zeroAmountReservations > 1 ? 's' : ''} activa${zeroAmountReservations > 1 ? 's' : ''} com valor €0 — verificar se foi erro de entrada`,
      count: zeroAmountReservations,
      action: { label: 'Ver reservas', href: '/reservations' },
    })
  }

  // ════════════════════════════════════════════════════════════════
  // SECÇÃO: PAYOUTS
  // ════════════════════════════════════════════════════════════════

  // P1 — Payouts PAID sem invoice auto-gerado (mismatch de contagem)
  const paidPayoutsCount = await prisma.payout.count({ where: { status: 'PAID' } })
  const autoInvoicesCount = await prisma.invoice.count({ where: { isAutoGenerated: true, status: 'PAID' } })
  const missingInvoices = Math.max(0, paidPayoutsCount - autoInvoicesCount)
  if (missingInvoices > 0) {
    issues.push({
      type: 'PAYOUT_NO_INVOICE',
      section: 'payouts',
      severity: 'HIGH',
      message: `${missingInvoices} payout${missingInvoices > 1 ? 's' : ''} pago${missingInvoices > 1 ? 's' : ''} sem invoice auto-gerado correspondente — possível falha no sistema`,
      count: missingInvoices,
      action: { label: 'Ver payouts', href: '/payouts' },
    })
  }

  // P2 — Payouts SCHEDULED em atraso (scheduledFor < hoje)
  const overduePayouts = await prisma.payout.count({
    where: { status: 'SCHEDULED', scheduledFor: { lt: now } },
  })
  if (overduePayouts > 0) {
    issues.push({
      type: 'PAYOUT_OVERDUE',
      section: 'payouts',
      severity: 'HIGH',
      message: `${overduePayouts} payout${overduePayouts > 1 ? 's' : ''} em atraso — data agendada já passou sem ser marcado como pago`,
      count: overduePayouts,
      action: { label: 'Ver payouts', href: '/payouts' },
    })
  }

  // P3 — Taxa de comissão desactualizada em payouts SCHEDULED
  const scheduledPayouts = await prisma.payout.findMany({
    where: { status: 'SCHEDULED' },
    select: { commissionRate: true, property: { select: { owner: { select: { subscriptionPlan: true } } } } },
  })
  const mismatchedRates = scheduledPayouts.filter(p => {
    const plan = p.property?.owner?.subscriptionPlan
    if (!plan) return false
    return Math.abs(p.commissionRate - (PLAN_COMMISSION[plan] ?? 0) * 100) > 0.1
  }).length
  if (mismatchedRates > 0) {
    issues.push({
      type: 'COMMISSION_MISMATCH',
      section: 'payouts',
      severity: 'MEDIUM',
      message: `${mismatchedRates} payout${mismatchedRates > 1 ? 's' : ''} agendado${mismatchedRates > 1 ? 's' : ''} com taxa diferente do plano actual do proprietário`,
      count: mismatchedRates,
      action: { label: 'Ver payouts', href: '/payouts' },
    })
  }

  // P4 — Invoices PAID sem paidAt (invisíveis no dashboard de receita)
  const invoicesNoPaidAt = await prisma.invoice.count({ where: { status: 'PAID', paidAt: null } })
  if (invoicesNoPaidAt > 0) {
    issues.push({
      type: 'INVOICE_PAID_NO_PAIDAT',
      section: 'payouts',
      severity: 'HIGH',
      message: `${invoicesNoPaidAt} invoice${invoicesNoPaidAt > 1 ? 's' : ''} marcado${invoicesNoPaidAt > 1 ? 's' : ''} PAID sem data de pagamento — não aparecem nas métricas do dashboard`,
      count: invoicesNoPaidAt,
      action: { label: 'Ver invoices', href: '/manager/invoices' },
    })
  }

  // ════════════════════════════════════════════════════════════════
  // SECÇÃO: RELATÓRIOS
  // ════════════════════════════════════════════════════════════════

  // Rep1 — Propriedades ACTIVE sem relatório do mês anterior
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth = lastMonthStart.getMonth() + 1 // 1-12
  const lastMonthYear = lastMonthStart.getFullYear()

  const activeProperties = await prisma.property.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      monthlyReports: {
        where: { month: lastMonth, year: lastMonthYear },
        select: { id: true, sentAt: true },
      },
      reservations: {
        where: { checkIn: { gte: lastMonthStart, lt: new Date(now.getFullYear(), now.getMonth(), 1) } },
        select: { id: true },
      },
    },
  })

  const propsWithActivityNoReport = activeProperties.filter(
    p => p.reservations.length > 0 && p.monthlyReports.length === 0
  ).length
  if (propsWithActivityNoReport > 0) {
    issues.push({
      type: 'REPORT_MISSING',
      section: 'reports',
      severity: 'MEDIUM',
      message: `${propsWithActivityNoReport} propriedade${propsWithActivityNoReport > 1 ? 's' : ''} com reservas em ${lastMonthStart.toLocaleString('pt-PT', { month: 'long' })} sem relatório mensal gerado`,
      count: propsWithActivityNoReport,
      action: { label: 'Ver relatórios', href: '/my-reports' },
    })
  }

  // Rep2 — Relatórios gerados mas não enviados ao proprietário
  const reportsNotSent = await prisma.monthlyReport.count({
    where: { sentAt: null, month: lastMonth, year: lastMonthYear },
  })
  if (reportsNotSent > 0) {
    issues.push({
      type: 'REPORT_NOT_SENT',
      section: 'reports',
      severity: 'LOW',
      message: `${reportsNotSent} relatório${reportsNotSent > 1 ? 's' : ''} de ${lastMonthStart.toLocaleString('pt-PT', { month: 'long' })} gerado${reportsNotSent > 1 ? 's' : ''} mas não enviado${reportsNotSent > 1 ? 's' : ''} ao proprietário`,
      count: reportsNotSent,
      action: { label: 'Ver relatórios', href: '/my-reports' },
    })
  }

  // Rep3 — Propriedades ACTIVE sem actividade há 90 dias
  const ninetyDaysAgo = new Date(now)
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
  const staleProperties = await prisma.property.count({
    where: { status: 'ACTIVE', reservations: { none: { checkIn: { gte: ninetyDaysAgo } } } },
  })
  if (staleProperties > 0) {
    issues.push({
      type: 'PROPERTY_STALE',
      section: 'reports',
      severity: 'LOW',
      message: `${staleProperties} propriedade${staleProperties > 1 ? 's' : ''} activa${staleProperties > 1 ? 's' : ''} sem reservas há 90+ dias — rever estado ou listagem`,
      count: staleProperties,
      action: { label: 'Ver propriedades', href: '/my-properties' },
    })
  }

  // Agrupar por secção para facilitar consumo no UI
  const bySection = {
    reservations: issues.filter(i => i.section === 'reservations'),
    payouts:      issues.filter(i => i.section === 'payouts'),
    reports:      issues.filter(i => i.section === 'reports'),
  }

  return NextResponse.json({ issues, bySection, checkedAt: now.toISOString() })
}
