"use client"

import { useEffect, useState } from "react"
import { useLocale } from "@/i18n/provider"
import { Home, Star, TrendingUp, TrendingDown, Minus, Building2, Quote, MessageCircle } from "lucide-react"

interface FeedbackItem {
  id: string
  createdAt: string
  scorePropertyStructure: number | null
  scorePropertyAmenities: number | null
  scoreLocation: number | null
  scoreValueForMoney: number | null
  scorePropertyState: number | null
  scoreCleanliness: number | null
  scoreNps: number | null
  npsCategory: string | null
  sentimentOverall: string
  feedbackProperty: string | null
  feedbackPropertyPositive: string | null
  feedbackPropertyImprovement: string | null
  feedbackCrew: string | null
  feedbackPlatform: string | null
  feedbackRecommendation: string | null
  categoryTags: string[]
  property: { id: string; name: string; city: string }
  reservation: { guestName: string; checkIn: string; checkOut: string }
}

interface Benchmark {
  propertyStructure: number | null
  propertyAmenities: number | null
  location: number | null
  valueForMoney: number | null
  nps: number | null
  sampleSize: number
}

function scoreColor(n: number | null): string {
  if (n === null) return 'text-gray-300'
  if (n >= 8) return 'text-emerald-600'
  if (n >= 6) return 'text-amber-600'
  return 'text-red-600'
}

function avg(values: (number | null)[]): number | null {
  const nums = values.filter((v): v is number => v !== null)
  return nums.length ? +(nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : null
}

function DeltaVsBenchmark({ mine, bench }: { mine: number | null; bench: number | null }) {
  if (mine === null || bench === null) return null
  const delta = +(mine - bench).toFixed(1)
  if (Math.abs(delta) < 0.3) {
    return <span className="text-[10px] text-gray-500 flex items-center gap-1"><Minus className="h-2.5 w-2.5" /> vs platform</span>
  }
  return (
    <span className={`text-[10px] flex items-center gap-1 font-medium ${delta > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
      {delta > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {delta > 0 ? '+' : ''}{delta} vs platform
    </span>
  )
}

export default function ClientFeedbackPage() {
  const { t } = useLocale()
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [benchmark, setBenchmark] = useState<Benchmark | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedProperty, setSelectedProperty] = useState<string>('all')

  useEffect(() => {
    fetch('/api/client/feedback')
      .then(r => r.json())
      .then(data => {
        setItems(data.items ?? [])
        setBenchmark(data.benchmark ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const properties = Array.from(new Map(items.map(i => [i.property.id, i.property])).values())
  const filtered = selectedProperty === 'all' ? items : items.filter(i => i.property.id === selectedProperty)

  const mine = {
    structure: avg(filtered.map(f => f.scorePropertyStructure)),
    amenities: avg(filtered.map(f => f.scorePropertyAmenities)),
    location: avg(filtered.map(f => f.scoreLocation)),
    value:    avg(filtered.map(f => f.scoreValueForMoney)),
    nps:      avg(filtered.map(f => f.scoreNps)),
  }

  const promoters  = filtered.filter(f => f.npsCategory === 'PROMOTER').length
  const detractors = filtered.filter(f => f.npsCategory === 'DETRACTOR').length
  const npsScore = filtered.length > 0
    ? Math.round((promoters - detractors) / filtered.length * 100)
    : null

  // Collect all improvement suggestions
  const improvements = filtered
    .map(f => f.feedbackPropertyImprovement)
    .filter((v): v is string => !!v)
    .slice(0, 10)

  const positives = filtered
    .map(f => f.feedbackPropertyPositive)
    .filter((v): v is string => !!v)
    .slice(0, 10)

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-48 rounded bg-gray-100 animate-pulse" />
        <div className="h-40 rounded-xl bg-gray-100 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-serif font-bold text-hm-black">
            {t('client.feedback.title') || 'My Property Feedback'}
          </h1>
          <p className="text-sm text-gray-500">
            {t('client.feedback.subtitle') || 'What guests say about your property after each stay.'}
          </p>
        </div>
        {properties.length > 1 && (
          <select value={selectedProperty} onChange={e => setSelectedProperty(e.target.value)}
            className="rounded-lg border bg-white px-3 py-2 text-sm">
            <option value="all">All properties</option>
            {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-12 text-center">
          <MessageCircle className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-hm-black">No guest feedback yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Feedback is collected by voice call 24-48h after each checkout.
          </p>
        </div>
      ) : (
        <>
          {/* Property scorecard */}
          <div className="rounded-2xl border-2 border-blue-200 bg-blue-50 p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center text-blue-700">
                  <Home className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-700 text-lg">Your Property</h3>
                  <p className="text-xs text-gray-600">Structure, amenities, location, value — what YOU provide to the guest.</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold ${scoreColor(avg([mine.structure, mine.amenities, mine.location, mine.value]))}`}>
                  {avg([mine.structure, mine.amenities, mine.location, mine.value])?.toFixed(1) ?? '—'}
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Property Score</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <PropertyScoreCard label="Structure" value={mine.structure} benchmark={benchmark?.propertyStructure ?? null} />
              <PropertyScoreCard label="Amenities" value={mine.amenities} benchmark={benchmark?.propertyAmenities ?? null} helperText="WiFi, AC, kitchen" />
              <PropertyScoreCard label="Location" value={mine.location} benchmark={benchmark?.location ?? null} />
              <PropertyScoreCard label="Value" value={mine.value} benchmark={benchmark?.valueForMoney ?? null} helperText="vs price" />
            </div>
          </div>

          {/* NPS + engagement */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Your NPS</p>
              <p className={`text-2xl font-bold mt-1 ${npsScore === null ? 'text-gray-300' : npsScore > 50 ? 'text-emerald-600' : npsScore > 0 ? 'text-amber-600' : 'text-red-600'}`}>
                {npsScore !== null ? (npsScore > 0 ? `+${npsScore}` : npsScore) : '—'}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">{filtered.length} ratings</p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Promoters</p>
              <p className="text-2xl font-bold mt-1 text-emerald-600">{promoters}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">guests rated 9-10</p>
            </div>
            <div className="rounded-xl border bg-white p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Detractors</p>
              <p className="text-2xl font-bold mt-1 text-red-600">{detractors}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">guests rated 0-6</p>
            </div>
          </div>

          {/* Positive + improvement columns */}
          {(positives.length > 0 || improvements.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {positives.length > 0 && (
                <div className="rounded-xl border bg-white p-5">
                  <h3 className="font-semibold text-emerald-700 mb-3 flex items-center gap-2">
                    <Star className="h-4 w-4" fill="currentColor" /> Guests loved
                  </h3>
                  <ul className="space-y-2">
                    {positives.map((p, i) => (
                      <li key={i} className="text-sm text-gray-700 flex gap-2">
                        <Quote className="h-3 w-3 text-emerald-400 shrink-0 mt-1" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {improvements.length > 0 && (
                <div className="rounded-xl border bg-white p-5">
                  <h3 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" /> Suggestions to improve
                  </h3>
                  <ul className="space-y-2">
                    {improvements.map((p, i) => (
                      <li key={i} className="text-sm text-gray-700 flex gap-2">
                        <Quote className="h-3 w-3 text-amber-400 shrink-0 mt-1" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Recent feedback list */}
          <div className="rounded-xl border bg-white">
            <div className="px-5 py-4 border-b">
              <h3 className="font-semibold text-hm-black">Recent guest feedback</h3>
              <p className="text-xs text-gray-500 mt-0.5">Delivery (crew) and HostMasters platform feedback shown for context</p>
            </div>
            <div className="divide-y">
              {filtered.map(f => (
                <div key={f.id} className="p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-semibold text-hm-black text-sm">
                        {f.reservation.guestName} · {f.property.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(f.reservation.checkOut).toLocaleDateString()}
                        {f.scoreNps !== null && ` · NPS ${f.scoreNps}/10`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className={`h-3.5 w-3.5 ${
                          f.scoreNps !== null && i * 2 <= f.scoreNps ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                        }`} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm">
                    {f.feedbackProperty && (
                      <div className="rounded-lg bg-blue-50 px-3 py-2 text-gray-700">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Property</span>
                        <p className="mt-0.5">{f.feedbackProperty}</p>
                      </div>
                    )}
                    {f.feedbackCrew && (
                      <div className="rounded-lg bg-amber-50 px-3 py-2 text-gray-700">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">How received</span>
                        <p className="mt-0.5">{f.feedbackCrew}</p>
                      </div>
                    )}
                    {f.feedbackPlatform && (
                      <div className="rounded-lg bg-emerald-50 px-3 py-2 text-gray-700">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">HostMasters</span>
                        <p className="mt-0.5">{f.feedbackPlatform}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function PropertyScoreCard({ label, value, benchmark, helperText }: {
  label: string
  value: number | null
  benchmark: number | null
  helperText?: string
}) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${scoreColor(value)}`}>
        {value !== null ? value.toFixed(1) : '—'}
      </p>
      {helperText && <p className="text-[10px] text-gray-400 mt-0.5">{helperText}</p>}
      {value !== null && benchmark !== null && (
        <div className="mt-1">
          <DeltaVsBenchmark mine={value} bench={benchmark} />
        </div>
      )}
    </div>
  )
}
