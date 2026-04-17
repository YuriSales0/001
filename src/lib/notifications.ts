import { prisma } from '@/lib/prisma'
import type { NotificationType } from '@prisma/client'
import { loadMessagesSync, t as tRaw, type Locale } from '@/i18n'

type NotifyParams = {
  userId: string
  type: NotificationType
  title: string
  body?: string
  link?: string
}

/**
 * Creates a notification for a user. Fire-and-forget safe — never throws.
 */
export async function notify(params: NotifyParams): Promise<void> {
  try {
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
 */
export async function notifyMany(userIds: string[], params: Omit<NotifyParams, 'userId'>): Promise<void> {
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
