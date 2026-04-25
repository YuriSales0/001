import { prisma } from '@/lib/prisma'
import type { NotificationType } from '@prisma/client'
import { loadMessagesSync, t as tRaw, type Locale } from '@/i18n'

type NotifyParams = {
  userId: string
  type: NotificationType
  title: string
  body?: string
  link?: string
  /**
   * Set true to bypass batching and always create a new notification row.
   * Defaults to false. Use for high-stakes events that must appear distinctly
   * even when the user already has an unread of the same kind.
   */
  noBatch?: boolean
}

/**
 * Type → priority map. Higher = more urgent.
 * Used by the bell to sort and visually prioritise.
 */
export const NOTIFICATION_PRIORITY: Record<string, number> = {
  // CRITICAL — interventions, alerts, escalations
  AI_ALERT: 100,
  INTERVENTION_OPENED: 95,
  TASK_REJECTED: 90,
  CREW_PAYOUT_FAILED: 90,
  // HIGH — money + replies + first-touch
  COMMISSION_PAID: 80,
  CREW_PAYOUT_PAID: 80,
  PAYOUT_COMPLETED: 80,
  BROADCAST_REPLY: 78,
  TAX_DEADLINE: 75,
  CREW_PAYOUT_READY: 70,
  // MEDIUM — pipeline + ops
  NEW_LEAD: 60,
  CONTRACT_READY: 60,
  TASK_ASSIGNED: 55,
  BROADCAST_RECEIVED: 50,
  BOOKING_RECEIVED: 50,
  PROPERTY_APPROVED: 50,
  PROPERTY_ACTIVE: 50,
  CLIENT_PROPERTY_APPROVED: 45,
  CLIENT_REGISTERED: 45,
  // LOW — informational
  TASK_CONFIRMED: 30,
  TASK_SUBMITTED: 30,
  TASK_APPROVED: 30,
  TASK_REDISTRIBUTED: 30,
  VISIT_COMPLETED: 30,
  RESERVATION_CANCELLED: 30,
  CREW_SCORE_CHANGE: 25,
  CREW_LEVEL_UP: 25,
  CREW_LEVEL_DOWN: 25,
  COMMISSION_STATEMENT: 25,
  INTERVENTION_RESOLVED: 25,
  // LOWEST — chatter
  GENERAL: 10,
}

export function priorityOf(type: string): number {
  return NOTIFICATION_PRIORITY[type] ?? 10
}

// Batching window: events within this duration coalesce into one notification.
const BATCH_WINDOW_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Creates a notification for a user with smart batching.
 *
 * If an unread notification with the same (type, link) already exists for
 * this user and was created within BATCH_WINDOW_MS, we coalesce: bump the
 * count, refresh title/body to reflect the latest event, and keep the
 * original createdAt (the bell sorts by priority then createdAt).
 *
 * Pass { noBatch: true } to force a fresh row (used for one-off, high-impact
 * events that should not collapse into earlier ones).
 *
 * Fire-and-forget safe — never throws.
 */
export async function notify(params: NotifyParams): Promise<void> {
  if (!params.userId || !params.title) return
  try {
    // Validate user exists (notification.userId FK is RESTRICT)
    const exists = await prisma.user.findUnique({ where: { id: params.userId }, select: { id: true } })
    if (!exists) return

    if (!params.noBatch) {
      const since = new Date(Date.now() - BATCH_WINDOW_MS)
      const existing = await prisma.notification.findFirst({
        where: {
          userId: params.userId,
          type: params.type,
          link: params.link ?? null,
          read: false,
          createdAt: { gte: since },
        },
        orderBy: { createdAt: 'desc' },
      })
      if (existing) {
        await prisma.notification.update({
          where: { id: existing.id },
          data: {
            // Refresh display content with the latest event details
            title: params.title,
            body: params.body ?? existing.body,
            count: { increment: 1 },
          },
        })
        return
      }
    }

    await prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body ?? null,
        link: params.link ?? null,
      },
    })
  } catch (err) {
    console.error('notify() failed:', err)
  }
}

/**
 * Translate a string using a user's language preference from DB.
 * Falls back to the raw key if translation not found.
 */
export async function tForUser(userId: string, key: string, replacements?: Record<string, string>): Promise<string> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { language: true } })
    const locale = (user?.language ?? 'en') as Locale
    const msgs = loadMessagesSync(locale)
    let text = tRaw(msgs, key)
    // If translation returned the raw key, fall back to English
    if (text === key && locale !== 'en') {
      const enMsgs = loadMessagesSync('en')
      text = tRaw(enMsgs, key)
    }
    if (replacements) {
      for (const [k, v] of Object.entries(replacements)) {
        text = text.replace(`{${k}}`, v)
      }
    }
    return text
  } catch {
    return key
  }
}

/**
 * Notify multiple users with the same notification.
 * Each user gets their own row (no cross-user batching).
 *
 * Note: this path skips per-user batching for performance; if a recipient
 * already has an unread of the same type, they'll get a second row. For
 * single-user notifications use notify() which batches.
 */
export async function notifyMany(userIds: string[], params: Omit<NotifyParams, 'userId' | 'noBatch'>): Promise<void> {
  if (userIds.length === 0) return
  try {
    await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        type: params.type,
        title: params.title,
        body: params.body ?? null,
        link: params.link ?? null,
      })),
    })
  } catch (err) {
    console.error('notifyMany() failed:', err)
  }
}
