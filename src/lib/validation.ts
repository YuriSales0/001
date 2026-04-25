/**
 * Shared input validation helpers for API routes.
 *
 * Usage:
 *   const name = vStr(body.name, 'name', { required: true, max: 200 })
 *   const amount = vNum(body.amount, 'amount', { min: 0 })
 *   const email = vEmail(body.email)
 *   const plan = vEnum(body.plan, ['STARTER', 'BASIC', 'MID', 'PREMIUM'])
 */

export function vStr(
  val: unknown,
  _field: string,
  opts: { required?: boolean; min?: number; max?: number } = {},
): string | null {
  if (val === null || val === undefined || val === '') {
    return opts.required ? null : null
  }
  if (typeof val !== 'string') return null
  const trimmed = val.trim()
  if (opts.required && trimmed.length === 0) return null
  if (opts.min && trimmed.length < opts.min) return null
  if (opts.max && trimmed.length > opts.max) return trimmed.slice(0, opts.max)
  return trimmed
}

export function vNum(
  val: unknown,
  _field: string,
  opts: { min?: number; max?: number; integer?: boolean } = {},
): number | null {
  if (val === null || val === undefined) return null
  const n = typeof val === 'number' ? val : Number(val)
  if (!Number.isFinite(n)) return null
  if (opts.integer && !Number.isInteger(n)) return null
  if (opts.min !== undefined && n < opts.min) return null
  if (opts.max !== undefined && n > opts.max) return null
  return n
}

export function vEmail(val: unknown): string | null {
  if (typeof val !== 'string') return null
  const trimmed = val.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null
  if (trimmed.length > 320) return null
  return trimmed
}

export function vEnum<T extends string>(val: unknown, allowed: readonly T[]): T | null {
  if (typeof val !== 'string') return null
  const upper = val.toUpperCase() as T
  const lower = val.toLowerCase() as T
  if (allowed.includes(val as T)) return val as T
  if (allowed.includes(upper)) return upper
  if (allowed.includes(lower)) return lower
  return null
}

export function vDate(
  val: unknown,
  opts: { notBefore?: Date; notAfter?: Date } = {},
): Date | null {
  if (!val) return null
  const d = val instanceof Date ? val : new Date(String(val))
  if (isNaN(d.getTime())) return null
  if (opts.notBefore && d < opts.notBefore) return null
  if (opts.notAfter && d > opts.notAfter) return null
  return d
}

export function sanitize(val: unknown, maxLen = 500): string {
  if (typeof val !== 'string') return ''
  return val
    .replace(/[<>&"']/g, '')
    .trim()
    .slice(0, maxLen)
}
