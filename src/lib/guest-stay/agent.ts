import { prisma } from '../prisma'
import { regionalContextBlock } from './regional-context'

export interface StayContext {
  guestName: string
  propertyName: string
  propertyCity: string
  propertyAddress: string
  checkIn: Date
  checkOut: Date
  language: string
  // AI context fields (populated during property setup)
  wifiSsid?: string | null
  wifiPassword?: string | null
  doorCode?: string | null
  smartLockPassword?: string | null
  parkingInstructions?: string | null
  checkInInstructions?: string | null
  checkOutInstructions?: string | null
  appliancesInfo?: string | null
  breakerLocation?: string | null
  waterShutoffLocation?: string | null
  propertyQuirks?: string[] | null
  guestGuideUrl?: string | null
  houseRules?: string[] | null
}

export interface AgentResponse {
  content: string
  confidence: number
  topicTag: string
  shouldEscalate: boolean
  escalationReason: string | null
  isEmergency: boolean
}

const SYSTEM_PROMPT = (ctx: StayContext) => `You are the HostMasters Assistant, helping guest ${ctx.guestName} during their stay at ${ctx.propertyName} in ${ctx.propertyCity}, Spain (Costa Tropical).

CRITICAL RULES:
1. Respond in the guest's language (default: ${ctx.language})
2. Use ONLY the facts provided — never invent
3. Keep answers short and practical (2-3 sentences typically)
4. Be warm but professional

ESCALATE (set shouldEscalate: true) if:
- Maintenance problem (broken appliance, leak, no water/power)
- Question you cannot confidently answer from the facts
- Guest frustration after 2+ unsuccessful turns
- Billing, legal, refund matters

EMERGENCY (set shouldEscalate: true AND isEmergency: true) if:
- Injury, illness, medical need
- Fire, gas leak, flood, electrical hazard
- Crime, theft, intrusion
- Safety concern for children or vulnerable people
- Guest explicitly says "emergency" or equivalent
When emergency detected, ALWAYS also tell the guest to call 112 (EU emergency).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROPERTY FACTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${ctx.propertyName}
Address: ${ctx.propertyAddress}, ${ctx.propertyCity}
Check-in: ${ctx.checkIn.toISOString().slice(0, 10)}
Check-out: ${ctx.checkOut.toISOString().slice(0, 10)}

WiFi: ${ctx.wifiSsid ? `${ctx.wifiSsid} / password: ${ctx.wifiPassword ?? '(ask Manager via escalation)'}` : 'not configured — escalate'}
Door / smart lock code: ${ctx.smartLockPassword ?? ctx.doorCode ?? 'not shared yet — escalate'}

${ctx.checkInInstructions ? `Check-in instructions:\n${ctx.checkInInstructions}\n` : ''}
${ctx.checkOutInstructions ? `Check-out instructions:\n${ctx.checkOutInstructions}\n` : ''}
${ctx.parkingInstructions ? `Parking:\n${ctx.parkingInstructions}\n` : ''}
${ctx.appliancesInfo ? `Appliances notes (IMPORTANT):\n${ctx.appliancesInfo}\n` : ''}
${ctx.breakerLocation ? `Fuse box / breaker: ${ctx.breakerLocation}\n` : ''}
${ctx.waterShutoffLocation ? `Main water shutoff: ${ctx.waterShutoffLocation}\n` : ''}
${ctx.propertyQuirks?.length ? `Property-specific quirks:\n${ctx.propertyQuirks.map(q => `• ${q}`).join('\n')}\n` : ''}
${ctx.houseRules?.length ? `House rules: ${ctx.houseRules.join('; ')}\n` : ''}
${ctx.guestGuideUrl ? `Full digital house manual: ${ctx.guestGuideUrl}\n` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${regionalContextBlock(ctx.propertyCity)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOPIC TAGS (pick one): wifi, doorcode, checkin, checkout, amenity, appliance, maintenance, emergency, noise, temperature, parking, neighborhood, food, transport, trail, market, tour, beach, billing, other

Return ONLY valid JSON:
{
  "content": "answer in guest's language",
  "confidence": 0.0-1.0,
  "topicTag": "one-from-list",
  "shouldEscalate": boolean,
  "escalationReason": string or null,
  "isEmergency": boolean
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
      isEmergency: false,
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
      model: process.env.STAY_CHAT_MODEL || 'claude-haiku-4-5-20251001',
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
      isEmergency: false,
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
      isEmergency: false,
    }
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as AgentResponse
    // Safety: if emergency is true, always escalate
    if (parsed.isEmergency) parsed.shouldEscalate = true
    return parsed
  } catch {
    return {
      content: "Let me connect you with a person to help with this.",
      confidence: 0,
      topicTag: 'other',
      shouldEscalate: true,
      escalationReason: 'Failed to parse AI response',
      isEmergency: false,
    }
  }
}

export async function buildStayContext(chatId: string): Promise<StayContext | null> {
  const chat = await prisma.guestStayChat.findUnique({
    where: { id: chatId },
    include: {
      reservation: { select: { guestName: true, checkIn: true, checkOut: true } },
      property: true,
    },
  })
  if (!chat) return null

  const p = chat.property as unknown as Record<string, unknown>
  return {
    guestName: chat.reservation.guestName,
    propertyName: chat.property.name,
    propertyCity: chat.property.city,
    propertyAddress: chat.property.address,
    checkIn: chat.reservation.checkIn,
    checkOut: chat.reservation.checkOut,
    language: chat.language,
    wifiSsid: (p.wifiSsid as string | null) ?? null,
    wifiPassword: (p.wifiPassword as string | null) ?? null,
    doorCode: (p.doorCode as string | null) ?? null,
    smartLockPassword: (p.smartLockPassword as string | null) ?? null,
    parkingInstructions: (p.parkingInstructions as string | null) ?? null,
    checkInInstructions: (p.checkInInstructions as string | null) ?? null,
    checkOutInstructions: (p.checkOutInstructions as string | null) ?? null,
    appliancesInfo: (p.appliancesInfo as string | null) ?? null,
    breakerLocation: (p.breakerLocation as string | null) ?? null,
    waterShutoffLocation: (p.waterShutoffLocation as string | null) ?? null,
    propertyQuirks: (p.propertyQuirks as string[] | null) ?? null,
    guestGuideUrl: (p.guestGuideUrl as string | null) ?? null,
    houseRules: (p.houseRules as string[] | null) ?? null,
  }
}
