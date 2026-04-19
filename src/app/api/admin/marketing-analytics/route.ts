import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const dateFilter: { createdAt?: { gte?: Date; lte?: Date } } = {}
  if (from) {
    dateFilter.createdAt = { ...dateFilter.createdAt, gte: new Date(from) }
  }
  if (to) {
    dateFilter.createdAt = { ...dateFilter.createdAt, lte: new Date(to + 'T23:59:59.999Z') }
  }

  const [
    totalLeads,
    totalClients,
    activeSubscriptions,
    leadsBySource,
    leadsByStatus,
    planDistribution,
    recentLeads,
    convertedLeads,
    propertiesActive,
  ] = await Promise.all([
    // Total leads (with date filter)
    prisma.lead.count({ where: dateFilter }),
    // Total clients (registered users with role CLIENT)
    prisma.user.count({
      where: {
        role: 'CLIENT',
        ...(dateFilter.createdAt ? { createdAt: dateFilter.createdAt } : {}),
      },
    }),
    // Active subscriptions (not null and not STARTER)
    prisma.user.count({
      where: {
        role: 'CLIENT',
        subscriptionPlan: { notIn: ['STARTER'] },
        NOT: { subscriptionPlan: null },
      },
    }),
    // Leads grouped by source
    prisma.lead.groupBy({
      by: ['source'],
      _count: true,
      where: dateFilter,
    }),
    // Leads grouped by status
    prisma.lead.groupBy({
      by: ['status'],
      _count: true,
      where: dateFilter,
    }),
    // Users grouped by subscription plan
    prisma.user.groupBy({
      by: ['subscriptionPlan'],
      _count: true,
      where: { role: 'CLIENT' },
    }),
    // Recent 10 leads
    prisma.lead.findMany({
      where: dateFilter,
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        source: true,
        status: true,
        createdAt: true,
      },
    }),
    // Leads that have been converted (have convertedUserId)
    prisma.lead.count({
      where: {
        ...dateFilter,
        status: 'CONVERTED',
      },
    }),
    // Properties with ACTIVE status (contract signed)
    prisma.property.count({
      where: { status: 'ACTIVE' },
    }),
  ])

  // Funnel: Contacted = leads with status past NEW
  const contactedStatuses = ['CONTACTED', 'QUALIFIED', 'CONVERTED', 'RETAINED']
  const contacted = leadsByStatus
    .filter(s => contactedStatuses.includes(s.status))
    .reduce((sum, s) => sum + s._count, 0)

  return NextResponse.json({
    totalLeads,
    totalClients,
    activeSubscriptions,
    conversionRate: totalLeads > 0 ? ((totalClients / totalLeads) * 100) : 0,
    funnel: {
      leads: totalLeads,
      contacted,
      registered: totalClients,
      contractSigned: propertiesActive,
    },
    leadsBySource: leadsBySource.map(s => ({
      source: s.source,
      count: s._count,
    })),
    planDistribution: planDistribution.map(p => ({
      plan: p.subscriptionPlan ?? 'NONE',
      count: p._count,
    })),
    recentLeads,
    convertedLeads,
  })
}
