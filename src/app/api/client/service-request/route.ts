import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { notify } from '@/lib/notifications'
import { ONE_TIME_SERVICES } from '@/lib/platform-catalog'

/**
 * POST /api/client/service-request
 *
 * Client requests a one-time service from the HostMasters catalog.
 * Creates a Lead-style record for the Manager to follow up.
 *
 * Body: { serviceId: string, notes?: string, propertyId?: string }
 */
export async function POST(request: NextRequest) {
  const guard = await requireRole(['CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const body = await request.json().catch(() => ({})) as {
    serviceId?: string
    notes?: string
    propertyId?: string
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
    select: { id: true, name: true, email: true, phone: true, managerId: true },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Create a Lead record (source ONLINE) — Manager picks it up in CRM
  const lead = await prisma.lead.create({
    data: {
      name: user.name ?? user.email,
      email: user.email,
      phone: user.phone,
      source: 'ONLINE',
      status: 'NEW',
      notes: [
        `[ONE-TIME SERVICE REQUEST]`,
        `Service: ${service.title} (€${service.price})`,
        body.propertyId ? `Property: ${body.propertyId}` : '',
        body.notes ? `Client notes: ${body.notes}` : '',
      ].filter(Boolean).join('\n'),
      message: service.title,
      assignedManagerId: user.managerId ?? null,
      convertedUserId: user.id,
      budget: service.price,
    },
  })

  // Notify the Manager (or all Admins if no Manager assigned)
  if (user.managerId) {
    notify({
      userId: user.managerId,
      type: 'NEW_LEAD',
      title: `Service request: ${service.title}`,
      body: `${user.name ?? user.email} wants ${service.title} (€${service.price})`,
      link: '/crm',
    }).catch(() => {})
  } else {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    })
    for (const admin of admins) {
      notify({
        userId: admin.id,
        type: 'NEW_LEAD',
        title: `Unassigned service request: ${service.title}`,
        body: `${user.name ?? user.email} wants ${service.title} (€${service.price})`,
        link: '/crm',
      }).catch(() => {})
    }
  }

  return NextResponse.json({ ok: true, leadId: lead.id, service: service.title, price: service.price })
}
