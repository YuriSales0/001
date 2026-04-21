import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

/**
 * GET /api/admin/phase-metrics?from=2026-04-01&to=2026-07-31
 * Returns all marketing plan KPIs for a specific phase period.
 */
export async function GET(request: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const dateFilter: Record<string, unknown> = {}
  if (from) dateFilter.gte = new Date(from)
  if (to) dateFilter.lte = new Date(to + 'T23:59:59.999Z')
  const hasDate = Object.keys(dateFilter).length > 0
  const createdAtFilter = hasDate ? { createdAt: dateFilter } : {}

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalLeadsInPhase,
    leadsThisMonth,
    totalClientsInPhase,
    activeSubscriptions,
    leadsViaPartner,
    totalManagers,
    totalCrew,
    crewWithScore,
    contractsSigned,
    clientsChurnedThisMonth,
    totalActiveClients,
    leadsBySource,
  ] = await Promise.all([
    // Total leads created in this phase
    prisma.lead.count({ where: createdAtFilter }),
    // Leads this month (for monthly rate)
    prisma.lead.count({ where: { createdAt: { gte: monthStart } } }),
    // Clients registered in this phase
    prisma.user.count({ where: { role: 'CLIENT', ...createdAtFilter } }),
    // Active paid subscriptions (all time — represents current state)
    prisma.user.count({
      where: {
        role: 'CLIENT',
        subscriptionPlan: { notIn: ['STARTER'] },
        NOT: { subscriptionPlan: null },
      },
    }),
    // Leads via partner in this phase
    prisma.lead.count({
      where: {
        ...createdAtFilter,
        partnerId: { not: null },
      } as any,
    }),
    // Operational managers
    prisma.user.count({ where: { role: 'MANAGER' } }),
    // Total crew
    prisma.user.count({ where: { role: 'CREW' } }),
    // Crew with validated score (score >= 50, not suspended)
    prisma.crewScore.count({ where: { currentScore: { gte: 50 } } }),
    // Contracts signed in this phase
    prisma.contract.count({
      where: { signedByUser: true, ...(hasDate ? { signedAt: dateFilter } : {}) },
    }),
    // Clients who became inactive this month (rough churn proxy)
    prisma.user.count({
      where: {
        role: 'CLIENT',
        subscriptionPlan: null,
        updatedAt: { gte: monthStart },
      },
    }),
    // Total active clients right now
    prisma.user.count({
      where: {
        role: 'CLIENT',
        subscriptionPlan: { not: null },
      },
    }),
    // Leads by source in phase
    prisma.lead.groupBy({
      by: ['source'],
      _count: true,
      where: createdAtFilter,
    }),
  ])

  // Calculate phase duration in months
  const phaseStart = from ? new Date(from) : now
  const phaseMonths = Math.max(1, Math.ceil((now.getTime() - phaseStart.getTime()) / (30 * 24 * 60 * 60 * 1000)))

  // Monthly averages
  const leadsPerMonth = phaseMonths > 0 ? Math.round(totalLeadsInPhase / phaseMonths) : leadsThisMonth
  const conversionRate = totalLeadsInPhase > 0 ? (totalClientsInPhase / totalLeadsInPhase) * 100 : 0
  const partnerPct = totalLeadsInPhase > 0 ? (leadsViaPartner / totalLeadsInPhase) * 100 : 0
  const churnRate = totalActiveClients > 0 ? (clientsChurnedThisMonth / totalActiveClients) * 100 : 0

  // MRR estimate (from plan pricing)
  const planPricing: Record<string, number> = { BASIC: 89, MID: 159, PREMIUM: 269 }
  const planCounts = await prisma.user.groupBy({
    by: ['subscriptionPlan'],
    _count: true,
    where: { role: 'CLIENT', subscriptionPlan: { not: null } },
  })
  const mrr = planCounts.reduce((sum, p) => {
    const price = planPricing[p.subscriptionPlan ?? ''] ?? 0
    return sum + price * p._count
  }, 0)

  // CAC estimate (total marketing spend / clients acquired)
  // We don't have real spend data integrated yet, so show placeholder
  const cac = totalClientsInPhase > 0 ? null : null // Will be calculated when GA integrated

  return NextResponse.json({
    leadsPerMonth,
    leadsThisMonth,
    totalLeadsInPhase,
    conversionRate: Math.round(conversionRate * 10) / 10,
    partnerPct: Math.round(partnerPct * 10) / 10,
    churnRate: Math.round(churnRate * 10) / 10,
    mrr,
    cac,
    activeClients: totalActiveClients,
    contractsSigned,
    managers: totalManagers,
    crew: totalCrew,
    crewValidated: crewWithScore,
    activeSubscriptions,
    leadsBySource: leadsBySource.map(s => ({ source: s.source, count: s._count })),
    phaseMonths,
  })
}
