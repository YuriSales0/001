import { prisma } from '@/lib/prisma'
import type { NotificationType } from '@prisma/client'

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
