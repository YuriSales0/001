import { NextRequest, NextResponse } from 'next/server'
import { getDueScheduledCalls } from '@/lib/vagf/scheduler'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/cron/vagf-calls
 *
 * Processes scheduled VAGF calls that are due. Triggered by
 * AI Monitor umbrella cron (runs every hour during 10:00-18:00 UTC).
 *
 * For each due call, marks IN_PROGRESS and triggers ElevenLabs
 * outbound call via their API. Results come back via webhook.
 */
export async function POST(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  if (!cronSecret || auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dueCalls = await getDueScheduledCalls(10)

  if (dueCalls.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  const results: Array<{ feedbackId: string; status: string; error?: string }> = []

  for (const feedback of dueCalls) {
    try {
      // Atomically claim the call — updateMany with status=SCHEDULED filter
      // prevents a concurrent cron execution from claiming the same feedback.
      const claim = await prisma.guestFeedback.updateMany({
        where: { id: feedback.id, callStatus: 'SCHEDULED' },
        data: {
          callStatus: 'IN_PROGRESS',
          callAttempts: { increment: 1 },
          callStartedAt: new Date(),
        },
      })
      if (claim.count === 0) {
        // Another cron instance already claimed this — skip
        results.push({ feedbackId: feedback.id, status: 'skipped', error: 'already claimed' })
        continue
      }

      const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY
      if (!elevenlabsApiKey) {
        // ElevenLabs not configured — mark as scheduled for later
        await prisma.guestFeedback.update({
          where: { id: feedback.id },
          data: { callStatus: 'SCHEDULED' },
        })
        results.push({ feedbackId: feedback.id, status: 'skipped', error: 'ELEVENLABS_API_KEY not set' })
        continue
      }

      // Select agent by language
      const agentId = getAgentIdForLanguage(feedback.language)
      if (!agentId) {
        results.push({ feedbackId: feedback.id, status: 'skipped', error: `No agent for language ${feedback.language}` })
        continue
      }

      const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'

      // Initiate outbound call via ElevenLabs
      const callRes = await fetch('https://api.elevenlabs.io/v1/convai/conversation/create-outbound-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': elevenlabsApiKey,
        },
        body: JSON.stringify({
          agent_id: agentId,
          phone_number: feedback.reservation.guestPhone,
          first_message: null, // Agent uses its configured prompt
          dynamic_variables: {
            guest_name: feedback.reservation.guestName,
            property_name: feedback.property.name,
            location: feedback.property.city,
            checkout_date: feedback.reservation.checkOut.toISOString().slice(0, 10),
          },
          webhook_url: `${baseUrl}/api/webhooks/elevenlabs/${feedback.id}`,
        }),
      })

      if (!callRes.ok) {
        const err = await callRes.text()
        throw new Error(`ElevenLabs API error: ${callRes.status} ${err}`)
      }

      const callData = await callRes.json()

      await prisma.guestFeedback.update({
        where: { id: feedback.id },
        data: { elevenlabsCallId: callData.call_id ?? callData.id ?? null },
      })

      results.push({ feedbackId: feedback.id, status: 'initiated' })
    } catch (err) {
      console.error(`[VAGF] Call failed for ${feedback.id}:`, err)

      // Revert to scheduled if retries remain
      if (feedback.callAttempts < 2) {
        await prisma.guestFeedback.update({
          where: { id: feedback.id },
          data: {
            callStatus: 'SCHEDULED',
            callScheduledAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
          },
        })
      } else {
        await prisma.guestFeedback.update({
          where: { id: feedback.id },
          data: { callStatus: 'UNREACHABLE' },
        })
      }

      results.push({
        feedbackId: feedback.id,
        status: 'failed',
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}

function getAgentIdForLanguage(lang: string): string | null {
  const map: Record<string, string | undefined> = {
    en: process.env.ELEVENLABS_AGENT_EN,
    es: process.env.ELEVENLABS_AGENT_ES,
    de: process.env.ELEVENLABS_AGENT_DE,
    sv: process.env.ELEVENLABS_AGENT_SV,
    no: process.env.ELEVENLABS_AGENT_NO,
    nl: process.env.ELEVENLABS_AGENT_NL,
    fr: process.env.ELEVENLABS_AGENT_FR,
    pt: process.env.ELEVENLABS_AGENT_PT,
    da: process.env.ELEVENLABS_AGENT_DA,
  }
  return map[lang] ?? map.en ?? null
}
