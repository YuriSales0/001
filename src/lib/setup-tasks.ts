import { prisma } from './prisma'

/**
 * Provision setup tasks when a property enters PENDING_APPROVAL.
 * Creates two tasks:
 *
 * 1. SETUP_FIELD_INSPECTION (due in 5 days) — assigned to the first
 *    available Captain. Checklist: photograph fuse box, locate water
 *    shutoff, test appliances simultaneously, capture property quirks.
 *
 * 2. SETUP_AI_CONTEXT (due in 11 days) — assigned to the owner's
 *    Manager. Coordinates with Owner (WiFi, parking) and Captain
 *    (field data collected above) to populate the AI context.
 *
 * Idempotent: skips if setup tasks already exist for this property.
 */
export async function provisionSetupTasks(propertyId: string) {
  const property = await prisma.property.findUnique({
    where: { id: propertyId },
    include: {
      owner: { select: { id: true, name: true, managerId: true } },
    },
  })
  if (!property) return null

  // Check if already provisioned
  const existing = await prisma.task.findFirst({
    where: {
      propertyId,
      type: { in: ['SETUP_AI_CONTEXT', 'SETUP_FIELD_INSPECTION'] },
    },
    select: { id: true },
  })
  if (existing) return { alreadyProvisioned: true }

  const now = new Date()
  const fieldDue = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000)
  const contextDue = new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000)

  // Find first Captain
  const captain = await prisma.user.findFirst({
    where: { role: 'CREW', isCaptain: true },
    select: { id: true },
  })

  // Manager from owner — fallback to first Admin if owner has no manager
  // (prevents AI context task hanging unassigned forever)
  let managerId: string | null = property.owner.managerId
  if (!managerId) {
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true },
    })
    managerId = admin?.id ?? null
    if (!managerId) {
      console.error(`[Setup] No Manager or Admin to assign AI context task for property ${propertyId}`)
    }
  }

  const created: Array<{ id: string; type: string; assignee: string | null }> = []

  // Field inspection task (Captain)
  const fieldTask = await prisma.task.create({
    data: {
      propertyId,
      type: 'SETUP_FIELD_INSPECTION',
      title: `Field inspection for setup — ${property.name}`,
      description: [
        'Capture during the on-site visit:',
        '• Photograph the fuse box / breaker panel location',
        '• Locate and test main water shutoff valve',
        '• Test running multiple appliances simultaneously (AC + oven + washer)',
        '• List any property-specific quirks (noisy pipes, slow hot water, etc.)',
        '• Smart lock / door code working & documented',
        'Update property AI context when done (coverage meter in Setup page).',
      ].join('\n'),
      dueDate: fieldDue,
      status: 'PENDING',
      assigneeId: captain?.id,
    },
  })
  created.push({ id: fieldTask.id, type: 'SETUP_FIELD_INSPECTION', assignee: captain?.id ?? null })

  // AI context completion task (Manager)
  const ctxTask = await prisma.task.create({
    data: {
      propertyId,
      type: 'SETUP_AI_CONTEXT',
      title: `Complete AI Assistant context — ${property.name}`,
      description: [
        'Populate the AI Assistant context (coverage ≥ 80% required):',
        '• WiFi SSID + password (ask owner)',
        '• Parking instructions (ask owner)',
        '• Check-in / check-out instructions (coordinate with owner)',
        '• Emergency WhatsApp number (your own or property contact)',
        '• Field data from Captain inspection: breaker, water, appliances, quirks',
        '• Link to digital house manual (optional)',
        '',
        'Open the property in /setup → "AI Assistant context" tab.',
        'Coverage must reach ≥ 80% before property activation.',
      ].join('\n'),
      dueDate: contextDue,
      status: 'PENDING',
      assigneeId: managerId,
    },
  })
  created.push({ id: ctxTask.id, type: 'SETUP_AI_CONTEXT', assignee: managerId })

  return { created }
}
