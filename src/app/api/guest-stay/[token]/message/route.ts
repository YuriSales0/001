import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { queryAgent, buildStayContext } from '@/lib/guest-stay/agent'
import { escalateStayChat } from '@/lib/guest-stay/escalation'

/**
 * POST /api/guest-stay/[token]/message
 * Guest sends a message → AI processes → response saved.
 * If AI decides to escalate, or chat is already escalated, message goes to human queue.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } },
) {
  const chat = await prisma.guestStayChat.findUnique({
    where: { token: params.token },
    include: {
      reservation: { select: { checkOut: true } },
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 20,
        select: { author: true, content: true },
      },
    },
  })
  if (!chat) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Expiry check
  const expiresAt = new Date(chat.reservation.checkOut.getTime() + 24 * 60 * 60 * 1000)
  if (new Date() > expiresAt) {
    return NextResponse.json({ error: 'Chat expired' }, { status: 410 })
  }

  const body = await request.json().catch(() => ({})) as { content?: string }
  const content = (body.content ?? '').trim().slice(0, 2000)
  if (!content) {
    return NextResponse.json({ error: 'Empty message' }, { status: 400 })
  }

  // Persist guest message
  const guestMsg = await prisma.guestStayMessage.create({
    data: { chatId: chat.id, author: 'GUEST', content },
  })

  // Update chat counters
  await prisma.guestStayChat.update({
    where: { id: chat.id },
    data: {
      messageCount: { increment: 1 },
      lastMessageAt: new Date(),
    },
  })

  // If already escalated, don't invoke AI — await human reply
  if (chat.escalationStatus !== 'NONE') {
    return NextResponse.json({
      guestMessage: guestMsg,
      aiMessage: null,
      escalated: true,
    })
  }

  // Query AI agent
  const context = await buildStayContext(chat.id)
  if (!context) {
    return NextResponse.json({ error: 'Failed to build context' }, { status: 500 })
  }

  const history = chat.messages.map(m => ({
    role: (m.author === 'GUEST' ? 'user' : 'assistant') as 'user' | 'assistant',
    content: m.content,
  }))

  try {
    const agentResponse = await queryAgent(context, history, content)

    const aiMsg = await prisma.guestStayMessage.create({
      data: {
        chatId: chat.id,
        author: 'AI',
        content: agentResponse.content,
        aiConfidence: agentResponse.confidence,
        aiTopicTag: agentResponse.topicTag,
      },
    })

    await prisma.guestStayChat.update({
      where: { id: chat.id },
      data: {
        messageCount: { increment: 1 },
        lastMessageAt: new Date(),
      },
    })

    if (agentResponse.shouldEscalate) {
      await escalateStayChat(
        chat.id,
        agentResponse.escalationReason ?? 'AI suggested escalation',
        { emergency: agentResponse.isEmergency, level: 'MANAGER' },
      )
    }

    return NextResponse.json({
      guestMessage: guestMsg,
      aiMessage: aiMsg,
      escalated: agentResponse.shouldEscalate,
    })
  } catch (err) {
    console.error('[StayChat] AI error:', err)
    await escalateStayChat(chat.id, 'AI agent error', { level: 'MANAGER' })
    return NextResponse.json({
      guestMessage: guestMsg,
      aiMessage: null,
      escalated: true,
      error: 'AI unavailable, human notified',
    }, { status: 200 })
  }
}
