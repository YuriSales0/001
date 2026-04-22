/**
 * Analyze guest feedback call transcript using Claude.
 * Extracts structured scores, qualitative feedback, sentiment, and tags
 * grouped by accountability dimension: PROPERTY / CREW / PLATFORM.
 */

export interface FeedbackAnalysis {
  complete: boolean
  scores: {
    // PROPERTY (owner accountability)
    propertyStructure: number | null
    propertyAmenities: number | null
    location: number | null
    valueForMoney: number | null
    // CREW (delivery accountability)
    propertyState: number | null
    cleanliness: number | null
    crewPresentation: number | null
    // PLATFORM (HostMasters accountability)
    communication: number | null
    checkInExperience: number | null
    checkOutExperience: number | null
    platformOverall: number | null
    nps: number | null
  }
  qualitative: {
    firstImpression: string | null
    property: string | null
    propertyPositive: string | null
    propertyImprovement: string | null
    crew: string | null
    crewPositive: string | null
    crewImprovement: string | null
    platform: string | null
    platformPositive: string | null
    platformImprovement: string | null
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

const ANALYSIS_PROMPT = `Analyze this guest feedback call transcript. Extract scores and qualitative
feedback grouped by THREE accountability dimensions:

1. PROPERTY — owner's responsibility (building, furniture, amenities, location, value)
2. CREW — turnover team's responsibility (cleanliness, state on arrival, welcome)
3. PLATFORM — HostMasters' responsibility (communication, check-in/out, info, support)

TRANSCRIPT:
{transcript}

Return ONLY valid JSON with this EXACT structure:
{
  "complete": boolean,
  "scores": {
    "propertyStructure": number 1-10 or null,
    "propertyAmenities": number 1-10 or null,
    "location": number 1-10 or null,
    "valueForMoney": number 1-10 or null,
    "propertyState": number 1-10 or null,
    "cleanliness": number 1-10 or null,
    "crewPresentation": number 1-10 or null,
    "communication": number 1-10 or null,
    "checkInExperience": number 1-10 or null,
    "checkOutExperience": number 1-10 or null,
    "platformOverall": number 1-10 or null,
    "nps": number 0-10 or null
  },
  "qualitative": {
    "firstImpression": "one word from guest or null",
    "property": "summary about property itself (structure/amenities) or null",
    "propertyPositive": "specific positives about property or null",
    "propertyImprovement": "what guest would change about property or null",
    "crew": "summary about how property was received or null",
    "crewPositive": "specific crew positives or null",
    "crewImprovement": "what to improve in delivery or null",
    "platform": "summary about HostMasters management or null",
    "platformPositive": "specific platform positives or null",
    "platformImprovement": "what HM could improve or null",
    "recommendation": "what guest would tell a friend or null"
  },
  "tags": [string array from: property_structure_excellent, property_structure_poor, amenity_wifi_issue, amenity_ac_issue, amenity_kitchen_missing, amenity_broken, location_excellent, location_noisy, value_excellent, value_poor, cleanliness_excellent, cleanliness_bathroom_negative, cleanliness_kitchen_negative, cleanliness_bedroom_negative, state_on_arrival_excellent, state_on_arrival_poor, checkin_smooth, checkin_problem, checkout_smooth, checkout_problem, communication_excellent, communication_slow, host_responsive, host_unreachable, decor_praised, bed_comfort_issue, noise_complaint, temperature_issue, key_access_smooth, key_access_problem, parking_issue],
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE" | "SEVERE_NEGATIVE",
  "reviewSmsRequested": boolean,
  "escalationSuggested": boolean,
  "escalationReason": string or null,
  "contactedDuringStay": boolean,
  "contactResponseScore": number 1-10 or null
}

IMPORTANT:
- Only include scores explicitly stated or clearly implied by guest
- Use null when guest didn't address that dimension
- Tags must only be from the predefined list
- Escalate if guest mentions injury/safety/crime/emergency`

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
      model: process.env.VAGF_ANALYSIS_MODEL || 'claude-sonnet-4-6',
      max_tokens: 3000,
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

  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('No JSON found in Claude response')
  }

  try {
    return JSON.parse(jsonMatch[0]) as FeedbackAnalysis
  } catch (err) {
    console.error('[VAGF] Failed to parse Claude response as JSON:', err)
    console.error('[VAGF] Raw response:', text.slice(0, 500))
    throw new Error(`Claude returned invalid JSON: ${err instanceof Error ? err.message : 'unknown'}`)
  }
}

export function calculateNpsCategory(nps: number | null): 'PROMOTER' | 'PASSIVE' | 'DETRACTOR' | null {
  if (nps === null || nps === undefined) return null
  if (nps >= 9) return 'PROMOTER'
  if (nps >= 7) return 'PASSIVE'
  return 'DETRACTOR'
}

/** Compute dimension averages from a feedback record. */
export function dimensionAverages(f: {
  scorePropertyStructure?: number | null
  scorePropertyAmenities?: number | null
  scoreLocation?: number | null
  scoreValueForMoney?: number | null
  scorePropertyState?: number | null
  scoreCleanliness?: number | null
  scoreCrewPresentation?: number | null
  scoreCommunication?: number | null
  scoreCheckInExperience?: number | null
  scoreCheckOutExperience?: number | null
  scorePlatformOverall?: number | null
}) {
  const avg = (arr: (number | null | undefined)[]) => {
    const nums = arr.filter((v): v is number => typeof v === 'number')
    return nums.length ? +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : null
  }

  return {
    property: avg([
      f.scorePropertyStructure, f.scorePropertyAmenities,
      f.scoreLocation, f.scoreValueForMoney,
    ]),
    crew: avg([
      f.scorePropertyState, f.scoreCleanliness, f.scoreCrewPresentation,
    ]),
    platform: avg([
      f.scoreCommunication, f.scoreCheckInExperience,
      f.scoreCheckOutExperience, f.scorePlatformOverall,
    ]),
  }
}
