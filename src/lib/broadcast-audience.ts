/**
 * Broadcast audience filter helpers.
 *
 * Lives outside the route file because Next.js typed-routes rejects
 * arbitrary exports from route.ts files.
 */

export function buildAudienceWhere(
  audienceType: string | undefined,
  audienceValue: string | null | undefined,
): Record<string, unknown> | null {
  const base: Record<string, unknown> = { role: 'CLIENT' }

  switch (audienceType) {
    case 'ALL_PAID':
      // Anyone with a paid plan (BASIC, MID, PREMIUM)
      return { ...base, subscriptionPlan: { in: ['BASIC', 'MID', 'PREMIUM'] } }
    case 'ALL_CLIENTS':
      return base
    case 'BY_PLAN':
      if (!audienceValue || !['STARTER', 'BASIC', 'MID', 'PREMIUM'].includes(audienceValue)) return null
      return { ...base, subscriptionPlan: audienceValue }
    case 'BY_LANGUAGE':
      if (!audienceValue) return null
      return { ...base, language: audienceValue, subscriptionPlan: { in: ['BASIC', 'MID', 'PREMIUM'] } }
    default:
      return null
  }
}
