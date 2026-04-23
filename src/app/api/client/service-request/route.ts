import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { notify } from '@/lib/notifications'
import { ONE_TIME_SERVICES } from '@/lib/platform-catalog'

/**
 * POST /api/client/service-request
 *
 * Client requests a one-time service from the HostMasters catalog.
 *
 * Flow:
 *   1. Create Lead (source=SERVICE_REQUEST) with service + property context
 *   2. Auto-assign Manager (client's manager → zone match → least-busy)
 *   3. Notify the assigned Manager + ALL admins (oversight)
 *   4. Manager follows up to confirm one-time vs subscription upgrade
 *
 * Body: { serviceId: string, propertyId?: string, notes?: string }
 */
export async function POST(request: NextRequest) {
  const guard = await requireRole(['CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const body = await request.json().catch(() => ({})) as {
    serviceId?: string
    propertyId?: string
    notes?: string
  }

  if (!body.serviceId) {
    return NextResponse.json({ error: 'serviceId required' }, { status: 400 })
  }

  const service = ONE_TIME_SERVICES.find(s => s.id === body.serviceId)
  if (!service) {
    return NextResponse.json({ error: 'Unknown service' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({
    where: { id: me.id },
    select: {
      id: true, name: true, email: true, phone: true, managerId: true,
      properties: {
        where: body.propertyId ? { id: body.propertyId } : {},
        select: { id: true, city: true, name: true },
        take: 1,
      },
    },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const property = user.properties[0]

  // ── Auto-assign Manager ──────────────────────────────────────
  // Priority: existing managerId → zone match → least busy Manager
  let managerId = user.managerId ?? null
  if (!managerId && property?.city) {
    const zoneManager = await prisma.user.findFirst({
      where: { role: 'MANAGER', managerZone: { contains: property.city, mode: 'insensitive' } },
      select: { id: true },
    })
    managerId = zoneManager?.id ?? null
  }
  if (!managerId) {
    // Fallback: least-busy Manager (by number of assigned clients)
    const managers = await prisma.user.findMany({
      where: { role: 'MANAGER' },
      select: { id: true, _count: { select: { clients: true } } },
    })
    managers.sort((a, b) => a._count.clients - b._count.clients)
    managerId = managers[0]?.id ?? null
  }
  const autoAssigned = !user.managerId && !!managerId

  // ── Create Lead (CRM pipeline) ───────────────────────────────
  const lead = await prisma.lead.create({
    data: {
      name: user.name ?? user.email,
      email: user.email,
      phone: user.phone,
      source: 'SERVICE_REQUEST',
      status: 'NEW',
      notes: [
        `[ONE-TIME SERVICE REQUEST]`,
        `Service: ${service.title} (base €${service.price})`,
        property ? `Property: ${property.name} (${property.city})` : 'No property specified',
        `Payment: ${service.paymentTiming}`,
        `Executor: ${service.assigneeRole}`,
        autoAssigned ? `[AUTO-ASSIGNED to Manager via zone/load-balance]` : '',
        body.notes ? `Client notes: ${body.notes}` : '',
      ].filter(Boolean).join('\n'),
      message: service.title,
      assignedManagerId: managerId,
      convertedUserId: user.id,
      budget: service.price,
    },
  })

  // ── Notifications ────────────────────────────────────────────
  // ALWAYS notify all Admins for oversight (not only if no Manager)
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  })
  for (const admin of admins) {
    notify({
      userId: admin.id,
      type: 'NEW_LEAD',
      title: `Service request: ${service.title}`,
      body: `${user.name ?? user.email} wants ${service.title} (€${service.price})${property ? ` for ${property.name}` : ''}`,
      link: `/crm?leadId=${lead.id}`,
    }).catch(() => {})
  }

  // Notify the assigned Manager (skip if Manager is also an Admin to dedup)
  if (managerId && !admins.find(a => a.id === managerId)) {
    notify({
      userId: managerId,
      type: 'NEW_LEAD',
      title: autoAssigned
        ? `[Auto-assigned] ${service.title}`
        : `Service request: ${service.title}`,
      body: `${user.name ?? user.email} wants ${service.title} (€${service.price})${property ? ` for ${property.name}` : ''}`,
      link: `/crm?leadId=${lead.id}`,
    }).catch(() => {})
  }

  return NextResponse.json({
    ok: true,
    leadId: lead.id,
    service: service.title,
    price: service.price,
    paymentTiming: service.paymentTiming,
    autoAssignedManager: autoAssigned,
  })
}
