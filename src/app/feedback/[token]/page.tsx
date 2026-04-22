"use client"

import { use, useEffect, useState } from "react"
import { Star, CheckCircle2, Home, Users, Sparkles, AlertCircle, Send } from "lucide-react"

interface FeedbackData {
  propertyName: string
  propertyCity: string
  guestName: string
  checkOutDate: string
  language: string
}

export default function WebFeedbackPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [data, setData] = useState<FeedbackData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // Scores
  const [scorePropertyStructure, setScorePropertyStructure] = useState<number | null>(null)
  const [scorePropertyAmenities, setScorePropertyAmenities] = useState<number | null>(null)
  const [scoreLocation, setScoreLocation] = useState<number | null>(null)
  const [scoreValueForMoney, setScoreValueForMoney] = useState<number | null>(null)
  const [scorePropertyState, setScorePropertyState] = useState<number | null>(null)
  const [scoreCleanliness, setScoreCleanliness] = useState<number | null>(null)
  const [scoreCommunication, setScoreCommunication] = useState<number | null>(null)
  const [scorePlatformOverall, setScorePlatformOverall] = useState<number | null>(null)
  const [scoreNps, setScoreNps] = useState<number | null>(null)

  // Qualitative
  const [positive, setPositive] = useState('')
  const [improvement, setImprovement] = useState('')
  const [recommendation, setRecommendation] = useState('')
  const [wantsToReview, setWantsToReview] = useState(false)

  useEffect(() => {
    fetch(`/api/feedback/${token}`)
      .then(async r => {
        if (r.ok) {
          setData(await r.json())
        } else if (r.status === 410) {
          setError('This feedback form has already been completed.')
        } else {
          setError('Feedback link not found or expired.')
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Unable to load the feedback form.')
        setLoading(false)
      })
  }, [token])

  const submit = async () => {
    setSubmitting(true)
    const res = await fetch(`/api/feedback/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scorePropertyStructure, scorePropertyAmenities, scoreLocation, scoreValueForMoney,
        scorePropertyState, scoreCleanliness,
        scoreCommunication, scorePlatformOverall, scoreNps,
        positive, improvement, recommendation, wantsToReview,
      }),
    })
    if (res.ok) setSubmitted(true)
    setSubmitting(false)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-sm text-gray-400">Loading…</div>
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-sm rounded-2xl bg-white p-6 text-center shadow-sm border">
          <AlertCircle className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-hm-black">{error}</p>
        </div>
      </div>
    )
  }

  if (submitted || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-sm border">
          <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500 mb-4" />
          <h1 className="text-xl font-serif font-bold text-hm-black">Thank you!</h1>
          <p className="text-sm text-gray-500 mt-2">
            Your feedback has been received. It helps us improve.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="sticky top-0 z-10 bg-white border-b px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <p className="text-[10px] uppercase tracking-wider text-gray-400">HostMasters</p>
          <h1 className="text-lg font-serif font-bold text-hm-black">Feedback — {data.propertyName}</h1>
          <p className="text-xs text-gray-500">
            Hi {data.guestName}, thank you for staying with us.
            A few quick questions take about 2 minutes.
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Property — Owner accountability */}
        <Section icon={Home} color="blue" title="About the property" desc="Structure, amenities, location, value — what the owner provides.">
          <ScoreRow label="Structure (bedrooms, furniture, comfort)" value={scorePropertyStructure} onChange={setScorePropertyStructure} />
          <ScoreRow label="Amenities (WiFi, kitchen, AC)" value={scorePropertyAmenities} onChange={setScorePropertyAmenities} />
          <ScoreRow label="Location" value={scoreLocation} onChange={setScoreLocation} />
          <ScoreRow label="Value for money" value={scoreValueForMoney} onChange={setScoreValueForMoney} />
        </Section>

        {/* Crew — delivery accountability */}
        <Section icon={Users} color="amber" title="How you received it" desc="Cleanliness and condition on arrival.">
          <ScoreRow label="Condition on arrival" value={scorePropertyState} onChange={setScorePropertyState} />
          <ScoreRow label="Cleanliness (bathroom, kitchen, bedroom)" value={scoreCleanliness} onChange={setScoreCleanliness} />
        </Section>

        {/* Platform — HostMasters accountability */}
        <Section icon={Sparkles} color="emerald" title="HostMasters management" desc="Communication, check-in, check-out, support.">
          <ScoreRow label="Communication (info before & during)" value={scoreCommunication} onChange={setScoreCommunication} />
          <ScoreRow label="Overall HostMasters experience" value={scorePlatformOverall} onChange={setScorePlatformOverall} />
          <ScoreRow label="How likely are you to recommend HostMasters? (0-10)" value={scoreNps} onChange={setScoreNps} max={10} />
        </Section>

        {/* Qualitative */}
        <div className="rounded-2xl bg-white border p-5 space-y-3">
          <h3 className="font-semibold text-hm-black">Tell us more</h3>
          <TextArea label="What stood out positively?" value={positive} onChange={setPositive} />
          <TextArea label="What could we improve?" value={improvement} onChange={setImprovement} />
          <TextArea label="What would you tell a friend about staying here?" value={recommendation} onChange={setRecommendation} />
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={wantsToReview} onChange={e => setWantsToReview(e.target.checked)}
              className="mt-0.5 accent-hm-gold" />
            <span>Send me a link to leave a review on Airbnb/Booking.com</span>
          </label>
        </div>

        <button onClick={submit} disabled={submitting}
          className="w-full rounded-xl bg-hm-black text-white py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
          <Send className="h-4 w-4" /> {submitting ? 'Sending…' : 'Send feedback'}
        </button>
      </div>
    </div>
  )
}

function Section({ icon: Icon, color, title, desc, children }: {
  icon: typeof Home
  color: 'blue' | 'amber' | 'emerald'
  title: string
  desc: string
  children: React.ReactNode
}) {
  const bg = color === 'blue' ? 'bg-blue-50 border-blue-200' : color === 'amber' ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'
  const iconColor = color === 'blue' ? 'text-blue-700' : color === 'amber' ? 'text-amber-700' : 'text-emerald-700'
  return (
    <div className={`rounded-2xl border-2 ${bg} p-5 space-y-3`}>
      <div className="flex items-center gap-3">
        <div className={`h-9 w-9 rounded-xl bg-white flex items-center justify-center ${iconColor}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h3 className={`font-bold ${iconColor}`}>{title}</h3>
          <p className="text-xs text-gray-600">{desc}</p>
        </div>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function ScoreRow({ label, value, onChange, max = 10 }: {
  label: string
  value: number | null
  onChange: (v: number) => void
  max?: number
}) {
  return (
    <div className="bg-white rounded-lg p-3 border border-white/50">
      <p className="text-xs text-gray-700 mb-2">{label}</p>
      <div className="flex gap-1 flex-wrap">
        {Array.from({ length: max }, (_, i) => i + (max === 10 ? 1 : 1)).map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`h-8 w-8 rounded-full text-xs font-semibold transition-all ${
              value === n ? 'bg-hm-black text-white scale-110' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  )
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-gray-600 mb-1">{label}</label>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={2}
        className="w-full rounded-lg border px-3 py-2 text-sm" />
    </div>
  )
}
