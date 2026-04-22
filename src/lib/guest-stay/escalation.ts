import { prisma } from '../prisma'
import { notify } from '../notifications'

/**
 * Escalate a stay chat to Manager (first step) or Admin (second step).
 * Always notifies Admin when a chat is escalated, even to Manager.
 */
export async function escalateStayChat(
  chatId: string,
  reason: string,
  level: 'MANAGER' | 'ADMIN' = 'MANAGER',
) {
  const chat = await prisma.guestStayChat.findUnique({
    where: { id: chatId },
    include: {
      property: { select: { name: true, ownerId: true } },
      client: { select: { managerId: true } },
      reservation: { select: { guestName: true } },
    },
  })
  if (!chat) return null

  // Find target user
  let targetUserId: string | null = null
  let status: 'PENDING_MANAGER' | 'PENDING_ADMIN' = 'PENDING_MANAGER'

  if (level === 'MANAGER' && chat.client.managerId) {
    targetUserId = chat.client.managerId
    status = 'PENDING_MANAGER'
  } else {
    // Fallback to first admin
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
    targetUserId = admin?.id ?? null
    status = 'PENDING_ADMIN'
  }

  await prisma.guestStayChat.update({
    where: { id: chatId },
    data: {
      escalationStatus: status,
      escalatedAt: new Date(),
      escalatedToUserId: targetUserId,
    },
  })

  await prisma.guestStayMessage.create({
    data: {
      chatId,
      author: 'SYSTEM',
      content: `Chat escalated to ${level.toLowerCase()} — reason: ${reason}`,
    },
  })

  // Notify target
  if (targetUserId) {
    notify({
      userId: targetUserId,
      type: 'AI_ALERT',
      title: `Guest chat escalated — ${chat.property.name}`,
      body: `${chat.reservation.guestName}: ${reason}`,
      link: `/stays/${chatId}`,
    }).catch(() => {})
  }

  // ALWAYS notify Admin even when escalation is to Manager
  if (status === 'PENDING_MANAGER') {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { id: true },
    })
    for (const admin of admins) {
      notify({
        userId: admin.id,
        type: 'AI_ALERT',
        title: `Guest chat escalated to Manager — ${chat.property.name}`,
        body: `${chat.reservation.guestName}: ${reason}`,
        link: `/stays/${chatId}`,
      }).catch(() => {})
    }
  }

  return { status, targetUserId }
}
