/**
 * Consistent status badge colors across the entire platform.
 * Use these in ALL pages to maintain visual consistency.
 */

export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  // General
  ACTIVE:         { bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200' },
  PENDING:        { bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200' },
  COMPLETED:      { bg: 'bg-green-50',    text: 'text-green-700',   border: 'border-green-200' },
  IN_PROGRESS:    { bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200' },
  CANCELLED:      { bg: 'bg-gray-50',     text: 'text-gray-500',    border: 'border-gray-200' },
  FAILED:         { bg: 'bg-red-50',      text: 'text-red-700',     border: 'border-red-200' },

  // Payments
  PAID:           { bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200' },
  SCHEDULED:      { bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200' },
  OVERDUE:        { bg: 'bg-red-50',      text: 'text-red-600',     border: 'border-red-200' },

  // Invoices
  DRAFT:          { bg: 'bg-gray-50',     text: 'text-gray-600',    border: 'border-gray-200' },
  REFUNDED:       { bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200' },

  // Tasks
  NOTIFIED:       { bg: 'bg-indigo-50',   text: 'text-indigo-700',  border: 'border-indigo-200' },
  CONFIRMED:      { bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200' },
  SUBMITTED:      { bg: 'bg-violet-50',   text: 'text-violet-700',  border: 'border-violet-200' },
  APPROVED:       { bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200' },
  REJECTED:       { bg: 'bg-red-50',      text: 'text-red-600',     border: 'border-red-200' },
  REDISTRIBUTED:  { bg: 'bg-orange-50',   text: 'text-orange-700',  border: 'border-orange-200' },

  // Reservations
  UPCOMING:       { bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200' },
  AWAITING_REPORT:{ bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200' },

  // Properties
  PENDING_CLIENT:   { bg: 'bg-violet-50',   text: 'text-violet-700',  border: 'border-violet-200' },
  PENDING_APPROVAL: { bg: 'bg-amber-50',    text: 'text-amber-700',   border: 'border-amber-200' },
  CONTRACT_PENDING: { bg: 'bg-orange-50',   text: 'text-orange-700',  border: 'border-orange-200' },
  MAINTENANCE:      { bg: 'bg-yellow-50',   text: 'text-yellow-700',  border: 'border-yellow-200' },

  // Contracts
  EXPIRED:        { bg: 'bg-gray-50',     text: 'text-gray-500',    border: 'border-gray-200' },
  TERMINATED:     { bg: 'bg-red-50',      text: 'text-red-600',     border: 'border-red-200' },

  // Crew Score Levels
  SUSPENDED:      { bg: 'bg-red-50',      text: 'text-red-600',     border: 'border-red-200' },
  BASIC:          { bg: 'bg-gray-50',     text: 'text-gray-600',    border: 'border-gray-200' },
  VERIFIED:       { bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-200' },
  EXPERT:         { bg: 'bg-purple-50',   text: 'text-purple-700',  border: 'border-purple-200' },
  ELITE:          { bg: 'bg-amber-50',    text: 'text-amber-800',   border: 'border-amber-300' },
}

export function statusBadgeClass(status: string): string {
  const colors = STATUS_COLORS[status] ?? STATUS_COLORS.PENDING
  return `${colors.bg} ${colors.text} ${colors.border}`
}
