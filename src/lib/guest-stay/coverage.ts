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
  // CRITICAL fields (6) — these must be filled for the AI to handle
  // 90%+ of guest questions. Used as the coverage baseline.
  const critical = [
    !!p.wifiSsid,
    !!p.wifiPassword,
    !!(p.doorCode || p.smartLockPassword),
    !!p.checkInInstructions,
    !!p.checkOutInstructions,
    !!p.emergencyWhatsapp,
  ]
  // BONUS fields (4) — boost coverage past 100% baseline when filled.
  // Not required for a healthy property.
  const bonus = [
    !!p.appliancesInfo,
    !!p.breakerLocation,
    !!p.waterShutoffLocation,
  ]
  const filledCritical = critical.filter(Boolean).length
  const filledBonus = bonus.filter(Boolean).length
  // Coverage: 6 critical fields = 100%. Bonus fields push beyond,
  // capped at 100% for display. Keeps the ≥80% threshold meaningful.
  const basePct = (filledCritical / critical.length) * 100
  const bonusPct = (filledBonus / bonus.length) * 10 // up to +10%
  const pct = Math.min(100, Math.round(basePct + bonusPct))
  return { filled: filledCritical + filledBonus, total: critical.length + bonus.length, pct }
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
