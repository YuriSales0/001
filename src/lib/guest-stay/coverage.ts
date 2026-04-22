import { prisma } from '../prisma'

/**
 * Calculate AI Assistant context coverage (0-100%) for a property.
 * Used to:
 *   - Display progress in setup UI (see ai-context-config.tsx)
 *   - Flag properties via AI Monitor if ACTIVE without coverage ≥80%
 *   - Gate property approval (future: could block PENDING_APPROVAL→ACTIVE)
 */
export function coverageFromProperty(p: {
  wifiSsid?: string | null
  wifiPassword?: string | null
  doorCode?: string | null
  smartLockPassword?: string | null
  checkInInstructions?: string | null
  checkOutInstructions?: string | null
  emergencyWhatsapp?: string | null
  appliancesInfo?: string | null
  breakerLocation?: string | null
  waterShutoffLocation?: string | null
}): { filled: number; total: number; pct: number } {
  const checks = [
    !!p.wifiSsid,
    !!p.wifiPassword,
    !!(p.doorCode || p.smartLockPassword),
    !!p.checkInInstructions,
    !!p.checkOutInstructions,
    !!p.emergencyWhatsapp,
    !!p.appliancesInfo,
    !!p.breakerLocation,
    !!p.waterShutoffLocation,
  ]
  const filled = checks.filter(Boolean).length
  const total = checks.length
  return { filled, total, pct: Math.round((filled / total) * 100) }
}

export async function getCoverageForProperty(propertyId: string) {
  const p = await prisma.property.findUnique({
    where: { id: propertyId },
    select: {
      wifiSsid: true, wifiPassword: true, doorCode: true, smartLockPassword: true,
      checkInInstructions: true, checkOutInstructions: true, emergencyWhatsapp: true,
      appliancesInfo: true, breakerLocation: true, waterShutoffLocation: true,
    },
  })
  if (!p) return null
  return coverageFromProperty(p)
}
