/**
 * Lead Triage Agent.
 *
 * Fires automatically when a new Lead arrives (or is re-assigned). Looks at
 * the lead data + source context and produces a structured triage:
 *  - refined score (0-100)
 *  - priority bucket (hot / warm / cold)
 *  - risk flags (suspicious email, low-value, time-sensitive, etc.)
 *  - opening message draft in the lead's likely language
 *  - first-contact suggested action (call / email / wait / skip)
 *
 * Saved to Lead.aiTriage (JSON) so the manager sees it immediately in the
 * CRM detail. Co-pilot also reads this field when building the daily briefing.
 *
 * Cost: ~€0.003 per lead via Haiku. Fire-and-forget — never blocks lead creation.
 */

import { prisma } from './prisma'

export type TriagePriority = 'hot' | 'warm' | 'cold'
export type TriageAction = 'call' | 'email' | 'whatsapp' | 'wait' | 'skip'

export interface LeadTriage {
  score: number             // 0-100 refined score
  priority: TriagePriority
  riskFlags: string[]       // e.g., 'duplicate_email', 'spammy_message', 'price_only_inquiry'
  language: string          // detected language code: 'en', 'pt', 'es', 'de', 'nl', 'fr', 'sv', 'da'
  reasoning: string         // 1-2 sentence why this score/priority
  suggestedAction: TriageAction
  suggestedActionDetail: string  // human-readable: "Email this draft within 24h"
  draftMessage: string | null    // opening message in detected language, or null
  followUpInDays: number | null  // when to follow up if no response
}

const HAIKU_MODEL = 'claude-haiku-4-5-20251001'
const HAIKU_URL = 'https://api.anthropic.com/v1/messages'

const TRIAGE_PROMPT = `You are an AI Lead Triage Agent for HostMasters, a premium short-term rental management company on Costa Tropical, Spain. Target client: international property investor (UK, Germany, Sweden, Netherlands, Norway), 50+ years old, owns a holiday property worth €500k-2M.

Analyse this incoming lead and output a triage decision in STRICT JSON.

LEAD DATA:
{LEAD_JSON}

PRIOR SIGNAL (any existing data on this lead, e.g., previous contacts or score):
{PRIOR_JSON}

OUTPUT SCHEMA (JSON only, no preamble, no markdown):
{
  "score": <integer 0-100 — overall lead quality>,
  "priority": "hot" | "warm" | "cold",
  "riskFlags": [<short string codes — 0-4 items, ex: "incomplete_contact", "spammy_message", "price_only", "low_intent">],
  "language": "<ISO code: en|pt|es|de|nl|fr|sv|da — best guess from name + message + email>",
  "reasoning": "<1-2 sentences why score/priority>",
  "suggestedAction": "call" | "email" | "whatsapp" | "wait" | "skip",
  "suggestedActionDetail": "<concrete next step for the manager, max 100 chars>",
  "draftMessage": <a ready-to-send opening message in the lead's language, warm and professional, 60-150 words, OR null if action is wait/skip>,
  "followUpInDays": <integer 1-14 OR null>
}

SCORING GUIDE:
- 80-100 (hot): clear intent (mentions specific property, asks about commission, has phone), premium signals (premium plan curiosity, multiple properties), responsive source (REFERRAL from partner, direct WhatsApp).
- 50-79 (warm): real interest but vague (asks general questions, no phone), or single property without clear value signal.
- 20-49 (cold): generic inquiry, missing data, low-value source, no message.
- 0-19 (skip): obvious spam, fake email, contradictory data, single test character.

LANGUAGE DETECTION:
- Use email TLD (.de → de, .se → sv, .pt → pt) + name (Hans → de, Karoline → sv, Pedro → pt) + message language.
- Default to 'en' for international/ambiguous cases.

DRAFT MESSAGE STYLE:
- First name if available.
- Acknowledge their inquiry concretely (don't generic-template).
- One specific next step (call, video meeting, info pack).
- Sign off with manager-style warmth (NOT robotic). End with "— [Manager name]" placeholder.
- HostMasters tone: confident, professional, not pushy, premium.
- DO NOT include a subject line. DO NOT use **bold** or markdown. Plain text only.

RISK FLAGS (use only if applicable):
- "incomplete_contact": missing phone OR email
- "spammy_message": message looks copy-pasted, gibberish, or all-caps marketing
- "price_only": asking only about price/commission with no property context
- "low_intent": vague language ("just curious", "maybe next year")
- "duplicate_signal": likely re-submission (mention "DUPLICATE" only if prior data shows it)
- "language_mismatch": lead's apparent language doesn't match available manager
- "competitor": email domain or message references a known competitor

Be concise, structured, and don't invent data.`

interface LeadInput {
  id: string
  name: string
  email?: string | null
  phone?: string | null
  source: string
  message?: string | null
  notes?: string | null
  budget?: number | null
  propertyType?: string | null
  partnerId?: string | null
}

interface PriorSignal {
  existingScore?: number | null
  bantData?: Record<string, unknown> | null
  previouslyContacted?: boolean
  partnerReferral?: boolean
  campaignName?: string | null
}

/**
 * Run the triage agent. Pure function — does not write to DB.
 * Returns null if Anthropic API key is missing or response is malformed.
 */
export async function runLeadTriage(
  lead: LeadInput,
  prior: PriorSignal = {},
): Promise<LeadTriage | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return null

  const prompt = TRIAGE_PROMPT
    .replace('{LEAD_JSON}', JSON.stringify(lead, null, 2))
    .replace('{PRIOR_JSON}', JSON.stringify(prior, null, 2))

  const res = await fetch(HAIKU_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: HAIKU_MODEL,
      max_tokens: 1500,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    console.error('Lead triage HTTP error:', res.status, await res.text().catch(() => ''))
    return null
  }

  try {
    const data = await res.json() as { content: Array<{ type: string; text: string }> }
    const text = data.content?.find(c => c.type === 'text')?.text ?? ''
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start < 0 || end < 0) return null
    const parsed = JSON.parse(text.slice(start, end + 1)) as Partial<LeadTriage>

    if (typeof parsed.score !== 'number'
      || !['hot', 'warm', 'cold'].includes(parsed.priority as string)
      || typeof parsed.language !== 'string'
      || !['call', 'email', 'whatsapp', 'wait', 'skip'].includes(parsed.suggestedAction as string)
    ) {
      return null
    }

    return {
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      priority: parsed.priority as TriagePriority,
      riskFlags: Array.isArray(parsed.riskFlags) ? parsed.riskFlags.slice(0, 6) : [],
      language: parsed.language.slice(0, 2),
      reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning.slice(0, 300) : '',
      suggestedAction: parsed.suggestedAction as TriageAction,
      suggestedActionDetail: typeof parsed.suggestedActionDetail === 'string' ? parsed.suggestedActionDetail.slice(0, 200) : '',
      draftMessage: typeof parsed.draftMessage === 'string' ? parsed.draftMessage.slice(0, 2000) : null,
      followUpInDays: typeof parsed.followUpInDays === 'number' ? Math.max(1, Math.min(30, Math.round(parsed.followUpInDays))) : null,
    }
  } catch (e) {
    console.error('Lead triage parse error:', e)
    return null
  }
}

/**
 * Run triage on a Lead by id and persist the result. Fire-and-forget safe —
 * never throws. Use this from POST /api/leads handlers.
 */
export async function triageAndPersist(leadId: string): Promise<LeadTriage | null> {
  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: {
        attributions: {
          include: { campaign: { select: { name: true } } },
          take: 1,
        },
      },
    })
    if (!lead) return null

    const prior: PriorSignal = {
      existingScore: lead.score,
      bantData: (lead.bantData as Record<string, unknown> | null) ?? null,
      previouslyContacted: lead.status !== 'NEW',
      partnerReferral: !!lead.partnerId,
      campaignName: lead.attributions[0]?.campaign?.name ?? null,
    }

    const triage = await runLeadTriage(
      {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        source: lead.source,
        message: lead.message,
        notes: lead.notes,
        budget: lead.budget,
        propertyType: lead.propertyType,
        partnerId: lead.partnerId,
      },
      prior,
    )

    if (!triage) return null

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        // Mirror refined score onto the existing column for backward compat
        score: triage.score,
        aiTriage: JSON.parse(JSON.stringify(triage)),
        aiTriagedAt: new Date(),
      },
    }).catch(err => {
      console.error('Failed to persist triage:', err)
    })

    return triage
  } catch (e) {
    console.error('Lead triage failed:', e)
    return null
  }
}
