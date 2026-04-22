import { prisma } from '../prisma'

export interface StayContext {
  guestName: string
  propertyName: string
  propertyCity: string
  propertyAddress: string
  checkIn: Date
  checkOut: Date
  wifiSsid?: string | null
  wifiPassword?: string | null
  doorCode?: string | null
  houseRules?: string[] | null
  amenities?: string[] | null
  language: string
}

export interface AgentResponse {
  content: string
  confidence: number       // 0-1 — how sure the agent is about the answer
  topicTag: string         // classification tag (wifi, checkin, amenity, etc.)
  shouldEscalate: boolean  // true if AI cannot / should not answer
  escalationReason: string | null
}

const SYSTEM_PROMPT = (ctx: StayContext) => `You are the HostMasters Assistant, helping guest ${ctx.guestName} during their stay at ${ctx.propertyName} in ${ctx.propertyCity}, Spain.

CRITICAL RULES:
1. Disclose you are an AI at the first interaction
2. Answer in the guest's language (detected from message; default: ${ctx.language})
3. Use only the property facts provided below — never invent
4. Keep answers short and practical (2-3 sentences typically)
5. Be warm but professional

ESCALATE TO A HUMAN (set shouldEscalate: true) if:
- Guest reports injury, illness, safety concern, emergency
- Guest mentions crime, legal issue, theft
- Guest explicitly asks for human / Manager / Admin
- Guest is extremely frustrated after 2+ turns
- Maintenance issue (broken appliance, water leak, electrical)
- Question about billing, invoice, refund, or legal matters
- Anything you cannot confidently answer with the provided facts

PROPERTY FACTS
Name: ${ctx.propertyName}
Address: ${ctx.propertyAddress}, ${ctx.propertyCity}
Check-in: ${ctx.checkIn.toISOString().slice(0, 10)}
Check-out: ${ctx.checkOut.toISOString().slice(0, 10)}
${ctx.wifiSsid ? `WiFi: ${ctx.wifiSsid} / password: ${ctx.wifiPassword ?? '(ask Manager)'}` : 'WiFi: details not yet available — escalate'}
${ctx.doorCode ? `Door code: ${ctx.doorCode}` : 'Door code: not shared yet — escalate'}
${ctx.houseRules?.length ? `House rules: ${ctx.houseRules.join('; ')}` : ''}
${ctx.amenities?.length ? `Amenities: ${ctx.amenities.join(', ')}` : ''}

TOPIC TAGS (pick one): wifi, doorcode, checkin, checkout, amenity, maintenance, noise, temperature, neighborhood, food, transport, billing, emergency, other

Return ONLY valid JSON:
{
  "content": "your answer to guest in their language",
  "confidence": 0.0-1.0,
  "topicTag": "one-from-list",
  "shouldEscalate": boolean,
  "escalationReason": string or null
}`

export async function queryAgent(
  context: StayContext,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  userMessage: string,
): Promise<AgentResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      content: 'Our AI assistant is temporarily unavailable. Your Manager has been notified and will contact you shortly.',
      confidence: 0,
      topicTag: 'other',
      shouldEscalate: true,
      escalationReason: 'ANTHROPIC_API_KEY not configured',
    }
  }

  const messages = [
    ...conversationHistory,
    { role: 'user' as const, content: userMessage },
  ]

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT(context),
      messages,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('[StayChat] Claude API error:', res.status, err)
    return {
      content: "I am having trouble right now. I'll connect you with a human to help.",
      confidence: 0,
      topicTag: 'other',
      shouldEscalate: true,
      escalationReason: `Claude API error: ${res.status}`,
    }
  }

  const data = await res.json()
  const text = data.content?.[0]?.text ?? '{}'
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return {
      content: text.trim(),
      confidence: 0.5,
      topicTag: 'other',
      shouldEscalate: false,
      escalationReason: null,
    }
  }

  try {
    return JSON.parse(jsonMatch[0]) as AgentResponse
  } catch {
    return {
      content: "Let me connect you with a person to help with this.",
      confidence: 0,
      topicTag: 'other',
      shouldEscalate: true,
      escalationReason: 'Failed to parse AI response',
    }
  }
}

/** Build a StayContext from a chat record. */
export async function buildStayContext(chatId: string): Promise<StayContext | null> {
  const chat = await prisma.guestStayChat.findUnique({
    where: { id: chatId },
    include: {
      reservation: { select: { guestName: true, checkIn: true, checkOut: true } },
      property: true,
    },
  })
  if (!chat) return null

  const prop = chat.property as unknown as Record<string, unknown>
  return {
    guestName: chat.reservation.guestName,
    propertyName: chat.property.name,
    propertyCity: chat.property.city,
    propertyAddress: chat.property.address,
    checkIn: chat.reservation.checkIn,
    checkOut: chat.reservation.checkOut,
    wifiSsid: (prop.wifiSsid as string | null) ?? null,
    wifiPassword: (prop.wifiPassword as string | null) ?? null,
    doorCode: (prop.doorCode as string | null) ?? null,
    houseRules: null, // TODO: wire up HOUSE_RULES from Property
    amenities: null,  // TODO: wire up from Property
    language: chat.language,
  }
}
