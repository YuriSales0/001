import { prisma } from './prisma'

export const CHECKLISTS: Record<string, string[]> = {
  CHECK_IN: [
    'Contact guest 2h before arrival',
    'Verify cleanliness of entry areas',
    'Hand over keys or confirm smart lock code',
    'Walkthrough: WiFi, appliances, amenities',
    'Collect guest ID and registration',
    'Explain house rules and emergency contacts',
    'Confirm guest count matches reservation',
  ],
  CHECK_OUT: [
    'Collect keys / confirm smart lock disabled',
    'Inspect general state of the property',
    'Check for damages (photo evidence)',
    'Verify inventory (towels, linens, kitchenware)',
    'Secure doors, windows and outdoor areas',
    'Report any issue to admin immediately',
  ],
  CLEANING: [
    'Strip beds and start laundry',
    'Clean and disinfect bathrooms',
    'Kitchen: dishes, counters, appliances, fridge',
    'Vacuum and mop all rooms',
    'Restock amenities (toiletries, coffee, paper)',
    'Fresh towels and linens',
    'Trash out, check outdoor',
    'Final walkthrough and photos',
  ],
  MAINTENANCE_PREVENTIVE: [
    'Test smoke and CO detectors',
    'Check HVAC filters and operation',
    'Inspect plumbing for leaks',
    'Test all light fixtures',
    'Verify door and window locks',
    'Test WiFi speed and router reboot',
    'Inspect outdoor areas and drainage',
    'Check appliance function (AC, heater, water heater)',
  ],
  MAINTENANCE_CORRECTIVE: [
    'Document reported issue with photos',
    'Identify root cause',
    'Perform repair or engage specialist',
    'Test fix thoroughly',
    'Document result with photos',
    'Notify admin and client when resolved',
  ],
  INSPECTION: [
    'Full walkthrough with checklist',
    'Photograph each room',
    'Note wear and tear',
    'Verify safety equipment',
    'Report findings to admin',
  ],
}

export function buildChecklist(type: string) {
  const items = CHECKLISTS[type] || []
  return items.map(text => ({ text, done: false }))
}

/**
 * Load-balance: returns the CREW user with the fewest open (non-completed) tasks.
 * Returns null if no crew exists — callers must decide fallback behaviour.
 */
export async function pickLeastBusyCrew(): Promise<string | null> {
  if (!prisma) return null
  const crews = await prisma.user.findMany({
    where: { role: 'CREW' },
    select: {
      id: true,
      _count: { select: { tasks: { where: { status: { not: 'COMPLETED' } } } } },
    },
  })
  if (crews.length === 0) return null
  crews.sort((a, b) => a._count.tasks - b._count.tasks)
  return crews[0].id
}
