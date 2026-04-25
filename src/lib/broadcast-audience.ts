/**
 * Broadcast audience filter helpers.
 *
 * Lives outside the route file because Next.js typed-routes rejects
 * arbitrary exports from route.ts files.
 */

const SUPPORTED_LOCALES = ['en', 'pt', 'es', 'de', 'nl', 'fr', 'sv', 'da'] as const
const VALID_PLANS = ['STARTER', 'BASIC', 'MID', 'PREMIUM'] as const

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
      if (!audienceValue || !(VALID_PLANS as readonly string[]).includes(audienceValue)) return null
      return { ...base, subscriptionPlan: audienceValue }
    case 'BY_LANGUAGE':
      // M14: validate against supported locales
      if (!audienceValue || !(SUPPORTED_LOCALES as readonly string[]).includes(audienceValue)) return null
      // M3: language filter applies to ALL clients (not just paid). If admin
      // wants only paid speakers, they can use BY_PLAN per-plan instead.
      return { ...base, language: audienceValue }
    default:
      return null
  }
}
