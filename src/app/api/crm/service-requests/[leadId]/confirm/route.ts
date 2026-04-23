import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { notify } from '@/lib/notifications'
import { ONE_TIME_SERVICES } from '@/lib/platform-catalog'
import { generateReceiptNumber, vatOnNet } from '@/lib/receipts'

/**
 * POST /api/crm/service-requests/[leadId]/confirm
 *
 * Manager confirms a one-time service request AFTER discussing with the
 * client (and they still want one-time, not a subscription upgrade).
 *
 * Side effects:
 *   1. Create PaymentReceipt (PENDING or PAID-awaiting-checkout)
 *   2. Create Task of the right type, assigned to the right role
 *      (CAPTAIN → Crew Captain, CREW → least-busy Crew, ADMIN → first Admin)
 *   3. Mark Lead status = RETAINED (in-progress / being served)
 *   4. Notify Client + assignee
 *
 * Body: {
 *   finalPrice?: number,   // override base price if Manager adjusted
 *   propertyId?: string,   // which property (required for property-bound services)
 *   scheduledAt?: string,  // ISO date for task dueDate
 *   notes?: string,
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { leadId: string } },
) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const lead = await prisma.lead.findUnique({
    where: { id: params.leadId },
    select: {
      id: true, status: true, message: true, budget: true, assignedManagerId: true,
      convertedUserId: true, notes: true, source: true,
    },
  })
  if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  if (lead.source !== 'SERVICE_REQUEST') {
    return NextResponse.json({ error: 'Not a service request lead' }, { status: 400 })
  }
  if (me.role === 'MANAGER' && lead.assignedManagerId !== me.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Find the catalog service by matching the lead's message (service title)
  const service = ONE_TIME_SERVICES.find(s => s.title === lead.message)
  if (!service) return NextResponse.json({ error: 'Service catalog not found for this lead' }, { status: 400 })

  const body = await request.json().catch(() => ({})) as {
    finalPrice?: number
    propertyId?: string
    scheduledAt?: string
    notes?: string
  }
  if (!lead.convertedUserId) {
    return NextResponse.json({ error: 'Lead has no client attached' }, { status: 400 })
  }

  // Resolve property — explicit param first, then client's first property
  let propertyId = body.propertyId
  if (!propertyId) {
    const firstProperty = await prisma.property.findFirst({
      where: { ownerId: lead.convertedUserId },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    })
    propertyId = firstProperty?.id
  }
  if (!propertyId) {
    return NextResponse.json(
      { error: 'Client has no property. Cannot create task without property context.' },
      { status: 400 },
    )
  }

  const finalPrice = body.finalPrice ?? Number(lead.budget ?? service.price)
  const dueDate = body.scheduledAt ? new Date(body.scheduledAt) : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)

  // ── 1. Create PaymentReceipt ───────────────────────────────
  const vat = vatOnNet(finalPrice)
  const receipt = await prisma.paymentReceipt.create({
    data: {
      receiptNumber: await generateReceiptNumber(),
      type: mapServiceToReceiptType(service.category),
      clientId: lead.convertedUserId,
      createdById: me.id,
      propertyId,
      description: `${service.title}${body.notes ? ` — ${body.notes}` : ''}`,
      grossAmount: vat.net,
      netAmount: vat.net,
      vatRate: vat.rate,
      vatAmount: vat.vat,
      totalAmount: vat.total,
      status: 'PENDING',
      dueDate: service.paymentTiming === 'PREPAID'
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: `One-time service — ${service.paymentTiming}. Lead ${lead.id}.`,
    },
  })

  // ── 2. Resolve assignee by role ────────────────────────────
  let assigneeId: string | null = null
  if (service.assigneeRole === 'CAPTAIN') {
    const captain = await prisma.user.findFirst({
      where: { role: 'CREW', isCaptain: true },
      select: { id: true },
    })
    assigneeId = captain?.id ?? null
  } else if (service.assigneeRole === 'CREW') {
    // Least-busy Crew (fewest open tasks)
    const crews = await prisma.user.findMany({
      where: { role: 'CREW' },
      select: {
        id: true,
        _count: { select: { tasks: { where: { status: { not: 'COMPLETED' } } } } },
      },
    })
    crews.sort((a, b) => a._count.tasks - b._count.tasks)
    assigneeId = crews[0]?.id ?? null
  } else {
    // ADMIN
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    })
    assigneeId = admin?.id ?? null
  }

  // ── 3. Create Task ─────────────────────────────────────────
  const task = await prisma.task.create({
    data: {
      propertyId,
      type: service.taskType,
      title: `${service.title} — ${lead.message}`,
      description: [
        `One-time service requested by client.`,
        body.notes ? `Notes: ${body.notes}` : '',
        `Lead: ${lead.id}`,
        `Receipt: ${receipt.receiptNumber} (€${finalPrice})`,
        `Payment: ${service.paymentTiming}`,
      ].filter(Boolean).join('\n'),
      dueDate,
      status: 'PENDING',
      assigneeId,
    },
  })

  // ── 4. Update Lead ─────────────────────────────────────────
  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      status: 'RETAINED',
      notes: `${lead.notes ?? ''}\n[CONFIRMED ${new Date().toISOString()}] Price €${finalPrice} · Receipt ${receipt.receiptNumber} · Task ${task.id}`,
    },
  })

  // ── 5. Notifications ───────────────────────────────────────
  notify({
    userId: lead.convertedUserId,
    type: 'GENERAL',
    title: `Service confirmed: ${service.title}`,
    body: service.paymentTiming === 'PREPAID'
      ? `Your service is ready. Please pay €${finalPrice} to start. Receipt ${receipt.receiptNumber}.`
      : `Your service is scheduled for ${dueDate.toLocaleDateString()}. Payment €${finalPrice} due after completion.`,
    link: '/client/financials',
  }).catch(() => {})

  if (assigneeId) {
    notify({
      userId: assigneeId,
      type: 'TASK_ASSIGNED',
      title: `New service task: ${service.title}`,
      body: `Due ${dueDate.toLocaleDateString()}. Receipt ${receipt.receiptNumber}.`,
      link: '/tasks',
    }).catch(() => {})
  }

  return NextResponse.json({
    ok: true,
    receiptId: receipt.id,
    receiptNumber: receipt.receiptNumber,
    taskId: task.id,
    assigneeId,
    finalPrice,
  })
}

function mapServiceToReceiptType(cat: string) {
  switch (cat) {
    case 'maintenance': return 'MAINTENANCE_FEE' as const
    case 'guest': return 'WELCOME_KIT' as const
    case 'setup': return 'SETUP_PACKAGE' as const
    default: return 'ADJUSTMENT' as const
  }
}
