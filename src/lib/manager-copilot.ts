/**
 * Manager AI Co-pilot.
 *
 * Aggregates the manager's context (clients, leads, tasks, recent activity)
 * and asks Claude Haiku to produce a prioritised list of action items the
 * manager should tackle today, plus optional draft messages to send.
 *
 * Used to make 1 human Manager + AI Co-pilot ≈ 2-3 traditional Managers.
 * Output is hidden from owners — internal productivity layer only.
 */

import { prisma } from './prisma'

export type ActionItemType = 'lead' | 'client' | 'task' | 'opportunity'
export type ActionItemPriority = 'high' | 'medium' | 'low'

export interface ActionItem {
  id: string                  // stable hash — frontend uses for dismiss state
  type: ActionItemType
  priority: ActionItemPriority
  title: string
  context: string             // why this is on the list
  suggestedAction: string     // what the manager should do
  draftMessage?: string | null // optional pre-written message
  linkedHref?: string | null  // deep link in manager portal
}

export interface ManagerBriefing {
  generatedAt: string         // ISO timestamp
  managerName: string
  itemCount: number
  items: ActionItem[]
}

interface ContextSnapshot {
  manager: { id: string; name: string; zone: string | null; language: string }
  clients: Array<{
    id: string
    name: string | null
    plan: string | null
    propertyCount: number
    lastActivityDays: number | null
    avgRecentNps: number | null
    openTaskCount: number
    upcomingCheckIns: number
  }>
  leads: Array<{
    id: string
    name: string
    status: string
    score: number | null
    daysSinceContact: number
    source: string
  }>
  riskyTasks: Array<{
    id: string
    propertyName: string
    type: string
    status: string
    daysOverdue: number
  }>
}

const HAIKU_MODEL = 'claude-haiku-4-5-20251001'
const HAIKU_URL = 'https://api.anthropic.com/v1/messages'

/**
 * Pull a snapshot of the manager's working context from the DB.
 * Lean queries — designed to run in <500ms even for managers with 50+ clients.
 */
export async function buildManagerContext(managerId: string): Promise<ContextSnapshot> {
  const manager = await prisma.user.findUnique({
    where: { id: managerId },
    select: { id: true, name: true, managerZone: true, language: true },
  })
  if (!manager) throw new Error('Manager not found')

  const now = Date.now()
  const D = (ms: number) => new Date(now - ms)

  // Clients of this manager
  const clientRows = await prisma.user.findMany({
    where: { managerId },
    select: {
      id: true,
      name: true,
      subscriptionPlan: true,
      properties: {
        select: {
          id: true,
          name: true,
          updatedAt: true,
          tasks: {
            where: { status: { in: ['PENDING', 'NOTIFIED', 'CONFIRMED', 'IN_PROGRESS', 'REJECTED'] } },
            select: { id: true, status: true, updatedAt: true },
          },
          reservations: {
            where: { checkIn: { gte: new Date(), lte: D(-7 * 86_400_000) } }, // next 7 days
            select: { id: true },
          },
        },
      },
    },
    take: 50,
  })

  // Aggregate per-client
  const clientIds = clientRows.map(c => c.id)
  const recentFeedback = clientIds.length > 0
    ? await prisma.guestFeedback.findMany({
        where: {
          property: { ownerId: { in: clientIds } },
          createdAt: { gte: D(30 * 86_400_000) },
          scoreNps: { not: null },
        },
        select: { property: { select: { ownerId: true } }, scoreNps: true },
        take: 200,
      })
    : []

  const npsByClient = new Map<string, number[]>()
  for (const f of recentFeedback) {
    const oid = f.property?.ownerId
    if (!oid || f.scoreNps == null) continue
    if (!npsByClient.has(oid)) npsByClient.set(oid, [])
    npsByClient.get(oid)!.push(f.scoreNps)
  }

  const clients = clientRows.map(c => {
    const lastUpdate = c.properties.reduce<Date | null>((latest, p) => {
      const d = p.updatedAt
      return !latest || d > latest ? d : latest
    }, null)
    const nps = npsByClient.get(c.id) ?? []
    const avgNps = nps.length > 0 ? nps.reduce((s, n) => s + n, 0) / nps.length : null
    const openTasks = c.properties.reduce((s, p) => s + p.tasks.length, 0)
    const upcomingCheckIns = c.properties.reduce((s, p) => s + p.reservations.length, 0)
    return {
      id: c.id,
      name: c.name,
      plan: c.subscriptionPlan,
      propertyCount: c.properties.length,
      lastActivityDays: lastUpdate ? Math.round((now - lastUpdate.getTime()) / 86_400_000) : null,
      avgRecentNps: avgNps,
      openTaskCount: openTasks,
      upcomingCheckIns,
    }
  })

  // Leads assigned to this manager
  const leads = await prisma.lead.findMany({
    where: {
      assignedManagerId: managerId,
      status: { in: ['NEW', 'CONTACTED', 'QUALIFIED'] },
    },
    select: {
      id: true,
      name: true,
      status: true,
      score: true,
      source: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
    take: 30,
  })

  // Risky tasks across manager's clients
  const riskyTasksRows = clientIds.length > 0
    ? await prisma.task.findMany({
        where: {
          property: { ownerId: { in: clientIds } },
          status: { in: ['PENDING', 'NOTIFIED', 'REJECTED'] },
          createdAt: { lte: D(2 * 86_400_000) }, // 2+ days old
        },
        select: {
          id: true,
          type: true,
          status: true,
          createdAt: true,
          property: { select: { name: true } },
        },
        take: 20,
      })
    : []

  return {
    manager: {
      id: manager.id,
      name: manager.name ?? 'Manager',
      zone: manager.managerZone ?? null,
      language: manager.language ?? 'en',
    },
    clients,
    leads: leads.map(l => ({
      id: l.id,
      name: l.name,
      status: l.status,
      score: l.score,
      source: l.source,
      daysSinceContact: Math.round((now - l.updatedAt.getTime()) / 86_400_000),
    })),
    riskyTasks: riskyTasksRows.map(t => ({
      id: t.id,
      propertyName: t.property?.name ?? 'Unknown',
      type: t.type,
      status: t.status,
      daysOverdue: Math.round((now - t.createdAt.getTime()) / 86_400_000),
    })),
  }
}

const BRIEFING_PROMPT = `You are an AI Co-pilot for a property-management company Manager. Your job is to look at the Manager's current workload and surface the highest-leverage actions they should take TODAY.

Output STRICT JSON only — no preamble, no markdown fences. Schema:
{
  "items": [
    {
      "id": "<short stable string, e.g. lead-<id> or client-<id> or task-<id>>",
      "type": "lead" | "client" | "task" | "opportunity",
      "priority": "high" | "medium" | "low",
      "title": "<short, action-oriented, max 80 chars>",
      "context": "<1-2 sentences: why this matters now>",
      "suggestedAction": "<concrete next step, max 120 chars>",
      "draftMessage": <string with a ready-to-send draft (in the manager's language) OR null>,
      "linkedHref": <relative path in the manager portal e.g. /crm or /manager/clients OR null>
    }
  ]
}

Rules:
- 5-10 items maximum. Be ruthless about what truly matters today.
- High priority: warm leads going cold (3+ days), client risks (low NPS, churn signals, overdue critical tasks), strategic opportunities.
- Medium: routine follow-ups, monthly check-ins, upsell opportunities.
- Low: nice-to-do, future planning.
- Manager language: respond in the SAME language as 'manager.language'. Drafts must be in that language too.
- Drafts only for items where the action IS sending a message. Otherwise null.
- linkedHref examples: /crm (leads), /manager/clients (clients overview), /tasks (tasks).
- Ground every item in the context provided. Do NOT invent clients, leads, or tasks not present in the input.

Manager context:
{CONTEXT}
`

/**
 * Generate a fresh briefing for the manager via Haiku.
 * Caller is responsible for caching (we don't dedup here — it's cheap).
 */
export async function generateBriefing(managerId: string): Promise<ManagerBriefing> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return {
      generatedAt: new Date().toISOString(),
      managerName: 'Manager',
      itemCount: 0,
      items: [{
        id: 'no-api-key',
        type: 'opportunity',
        priority: 'low',
        title: 'AI Co-pilot offline — ANTHROPIC_API_KEY not set',
        context: 'The co-pilot needs an Anthropic API key to generate briefings.',
        suggestedAction: 'Configure ANTHROPIC_API_KEY in production env.',
        draftMessage: null,
        linkedHref: null,
      }],
    }
  }

  const ctx = await buildManagerContext(managerId)

  // Empty context → no items, no Claude call
  if (ctx.clients.length === 0 && ctx.leads.length === 0 && ctx.riskyTasks.length === 0) {
    return {
      generatedAt: new Date().toISOString(),
      managerName: ctx.manager.name,
      itemCount: 0,
      items: [],
    }
  }

  const prompt = BRIEFING_PROMPT.replace('{CONTEXT}', JSON.stringify(ctx, null, 2))

  const res = await fetch(HAIKU_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: HAIKU_MODEL,
      max_tokens: 2500,
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Haiku briefing failed (${res.status}): ${body.slice(0, 200)}`)
  }

  const data = await res.json() as { content: Array<{ type: string; text: string }> }
  const text = data.content?.find(c => c.type === 'text')?.text ?? ''
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end < 0) {
    throw new Error('No JSON in briefing response')
  }

  const parsed = JSON.parse(text.slice(start, end + 1)) as { items?: ActionItem[] }
  const items = Array.isArray(parsed.items) ? parsed.items.slice(0, 10) : []

  return {
    generatedAt: new Date().toISOString(),
    managerName: ctx.manager.name,
    itemCount: items.length,
    items,
  }
}
