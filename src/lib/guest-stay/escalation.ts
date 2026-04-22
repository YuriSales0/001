import { prisma } from '../prisma'
import { notify } from '../notifications'

/**
 * Escalate a stay chat. Behaviour depends on severity:
 *
 *   Normal escalation:
 *     - Route to Manager (fallback to Admin if no Manager)
 *     - Admin always notified in parallel
 *
 *   Emergency escalation:
 *     - Same as above, PLUS:
 *     - System reply with Manager's emergency WhatsApp link
 *     - If reply not resolved in reasonable time, an urgent Maintenance
 *       task may be auto-created (future enhancement)
 *     - Admin receives CRITICAL severity alert
 */
export async function escalateStayChat(
  chatId: string,
  reason: string,
  options: { emergency?: boolean; level?: 'MANAGER' | 'ADMIN' } = {},
) {
  const isEmergency = !!options.emergency
  const preferredLevel = options.level ?? 'MANAGER'

  const chat = await prisma.guestStayChat.findUnique({
    where: { id: chatId },
    include: {
      property: { select: { id: true, name: true, ownerId: true, emergencyWhatsapp: true } },
      client: { select: { id: true, name: true, managerId: true, manager: { select: { id: true, name: true, phone: true } } } },
      reservation: { select: { guestName: true, guestPhone: true } },
    },
  })
  if (!chat) return null

  // Determine target
  let targetUserId: string | null = null
  let status: 'PENDING_MANAGER' | 'PENDING_ADMIN' = 'PENDING_MANAGER'

  if (preferredLevel === 'MANAGER' && chat.client.managerId) {
    targetUserId = chat.client.managerId
    status = 'PENDING_MANAGER'
  } else {
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

  // SYSTEM message
  await prisma.guestStayMessage.create({
    data: {
      chatId,
      author: 'SYSTEM',
      content: isEmergency
        ? `🚨 EMERGENCY escalation — ${reason}. Manager notified via WhatsApp. Admin alerted.`
        : `Escalated to ${preferredLevel.toLowerCase()} — ${reason}`,
    },
  })

  // Emergency: also append AI message with Manager WhatsApp + 112
  if (isEmergency) {
    const waNumber = chat.property.emergencyWhatsapp ?? chat.client.manager?.phone
    const waLink = waNumber
      ? `https://wa.me/${waNumber.replace(/[^0-9]/g, '')}`
      : null

    const emergencyGuestMessage = [
      '⚠️ For an emergency, please call 112 (EU emergency) right now.',
      waLink ? `You can also message your Manager directly on WhatsApp: ${waLink}` : null,
      'HostMasters has been notified and will follow up immediately.',
    ].filter(Boolean).join('\n')

    await prisma.guestStayMessage.create({
      data: {
        chatId,
        author: 'AI',
        content: emergencyGuestMessage,
        aiTopicTag: 'emergency',
      },
    })
  }

  // Notify target (Manager or first Admin)
  if (targetUserId) {
    notify({
      userId: targetUserId,
      type: 'AI_ALERT',
      title: isEmergency
        ? `🚨 EMERGENCY — ${chat.property.name}`
        : `Guest chat escalated — ${chat.property.name}`,
      body: `${chat.reservation.guestName}${chat.reservation.guestPhone ? ` (${chat.reservation.guestPhone})` : ''}: ${reason}`,
      link: `/stays/${chatId}`,
    }).catch(() => {})
  }

  // ALWAYS notify ALL admins
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true },
  })
  for (const admin of admins) {
    notify({
      userId: admin.id,
      type: 'AI_ALERT',
      title: isEmergency
        ? `🚨 EMERGENCY — ${chat.property.name}`
        : `Guest chat escalated to Manager — ${chat.property.name}`,
      body: `${chat.reservation.guestName}: ${reason}`,
      link: `/stays/${chatId}`,
    }).catch(() => {})
  }

  // For emergency: auto-create an urgent maintenance task to HostMasters
  if (isEmergency) {
    try {
      await createUrgentServiceCall(chatId, reason)
    } catch (err) {
      console.error('[StayChat] Failed to create urgent service call:', err)
    }
  }

  return { status, targetUserId, isEmergency }
}

/**
 * Create an urgent Task assigned to the Captain / first available CREW
 * so field staff can dispatch immediately.
 */
async function createUrgentServiceCall(chatId: string, reason: string) {
  const chat = await prisma.guestStayChat.findUnique({
    where: { id: chatId },
    include: {
      property: { select: { id: true, name: true } },
      reservation: { select: { guestName: true, checkOut: true } },
    },
  })
  if (!chat) return

  // Assign to first Captain available
  const captain = await prisma.user.findFirst({
    where: { role: 'CREW', isCaptain: true },
    select: { id: true },
  })

  await prisma.task.create({
    data: {
      propertyId: chat.property.id,
      type: 'MAINTENANCE_CORRECTIVE',
      title: `🚨 URGENT — ${chat.property.name}: guest emergency`,
      description: `Guest ${chat.reservation.guestName} reported: ${reason}\n\nStay chat: /stays/${chat.id}`,
      dueDate: new Date(),
      status: 'PENDING',
      assigneeId: captain?.id,
    },
  })
}
