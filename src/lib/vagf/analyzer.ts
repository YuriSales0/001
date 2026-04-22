/**
 * Analyze guest feedback call transcript using Claude.
 * Extracts structured scores, qualitative feedback, sentiment, and tags.
 */

export interface FeedbackAnalysis {
  complete: boolean
  scores: {
    communication: number | null
    propertyState: number | null
    cleanliness: number | null
    platformOverall: number | null
    nps: number | null
  }
  qualitative: {
    firstImpression: string | null
    positive: string | null
    improvement: string | null
    negative: string | null
    recommendation: string | null
  }
  tags: string[]
  sentiment: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'SEVERE_NEGATIVE'
  reviewSmsRequested: boolean
  escalationSuggested: boolean
  escalationReason: string | null
  contactedDuringStay: boolean
  contactResponseScore: number | null
}

const ANALYSIS_PROMPT = `Analyze this guest feedback call transcript and extract structured data.

TRANSCRIPT:
{transcript}

Return ONLY valid JSON with this structure:
{
  "complete": boolean,
  "scores": {
    "communication": number 1-10 or null,
    "propertyState": number 1-10 or null,
    "cleanliness": number 1-10 or null,
    "platformOverall": number 1-10 or null,
    "nps": number 0-10 or null
  },
  "qualitative": {
    "firstImpression": string or null,
    "positive": string or null,
    "improvement": string or null,
    "negative": string or null,
    "recommendation": string or null
  },
  "tags": string[],
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "SEVERE_NEGATIVE",
  "reviewSmsRequested": boolean,
  "escalationSuggested": boolean,
  "escalationReason": string or null,
  "contactedDuringStay": boolean,
  "contactResponseScore": number 1-10 or null
}

Tags from: cleanliness_positive, cleanliness_negative, cleanliness_bathroom_positive, cleanliness_bathroom_negative, cleanliness_kitchen_negative, wifi_issue, checkin_smooth, checkin_problem, noise_complaint, temperature_issue, view_mentioned, host_responsive, host_slow_response, amenity_missing, amenity_broken, decor_praised, location_excellent, value_excellent, value_poor, parking_issue, key_access_smooth, key_access_problem`

export async function analyzeTranscription(transcript: string): Promise<FeedbackAnalysis> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: ANALYSIS_PROMPT.replace('{transcript}', transcript),
      }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error: ${res.status} ${err}`)
  }

  const data = await res.json()
  const text = data.content?.[0]?.text ?? '{}'

  // Extract JSON from response (handle potential markdown wrapping)
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in Claude response')

  return JSON.parse(jsonMatch[0]) as FeedbackAnalysis
}

export function calculateNpsCategory(nps: number | null): 'PROMOTER' | 'PASSIVE' | 'DETRACTOR' | null {
  if (nps === null || nps === undefined) return null
  if (nps >= 9) return 'PROMOTER'
  if (nps >= 7) return 'PASSIVE'
  return 'DETRACTOR'
}
