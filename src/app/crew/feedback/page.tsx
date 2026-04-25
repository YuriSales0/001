"use client"

import { useEffect, useState } from "react"
import {
  Star, AlertTriangle, CheckCircle2, Clock, MessageSquare, FileText, Gavel, X,
  TrendingUp, TrendingDown, Volume2,
} from "lucide-react"
import { showToast } from "@/components/hm/toast"

type Feedback = {
  id: string
  scoreCleanliness: number | null
  scorePropertyState: number | null
  scoreCrewPresentation: number | null
  sentimentOverall: string | null
  analysisConfidence: number | null
  analysisCrossValidated: boolean
  analysisReviewRequired: boolean
  scoreDisputed: boolean
  scoreDisputeReason: string | null
  scoreDisputeResolvedAt: string | null
  scoreDisputeOutcome: string | null
  transcriptExcerpt: string | null
  feedbackCrewPositive: string | null
  feedbackCrewImprovement: string | null
  createdAt: string
  property: { id: string; name: string } | null
  reservation: { guestName: string; checkOut: string } | null
}

type FeedbackDetail = Feedback & {
  transcriptionFull: string | null
  recordingUrl: string | null
  callDurationSeconds: number | null
  scorePropertyStructure: number | null
  scorePropertyAmenities: number | null
  scoreCommunication: number | null
  scoreCheckInExperience: number | null
  scoreCheckOutExperience: number | null
  scorePlatformOverall: number | null
  scoreNps: number | null
}

const OUTCOME_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  UPHELD:     { bg: 'bg-gray-100',    text: 'text-gray-700',    label: 'Upheld' },
  OVERRIDDEN: { bg: 'bg-emerald-50',  text: 'text-emerald-700', label: 'Overridden (in your favor)' },
  ADJUSTED:   { bg: 'bg-blue-50',     text: 'text-blue-700',    label: 'Adjusted' },
}

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-xs text-gray-300">—</span>
  const color = score >= 7 ? 'text-emerald-600' : score >= 5 ? 'text-amber-600' : 'text-red-600'
  return <span className={`text-sm font-bold ${color}`}>{score}/10</span>
}

function SentimentBadge({ s }: { s: string | null }) {
  if (!s) return null
  const map: Record<string, string> = {
    POSITIVE:        'bg-emerald-50 text-emerald-700',
    NEUTRAL:         'bg-gray-50 text-gray-600',
    NEGATIVE:        'bg-amber-50 text-amber-700',
    SEVERE_NEGATIVE: 'bg-red-50 text-red-700',
  }
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${map[s] ?? 'bg-gray-50'}`}>
      {s.replace('_', ' ').toLowerCase()}
    </span>
  )
}

export default function CrewFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [detail, setDetail] = useState<FeedbackDetail | null>(null)
  const [disputeFor, setDisputeFor] = useState<Feedback | null>(null)
  const [disputeReason, setDisputeReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    fetch('/api/crew-feedback')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        setFeedbacks(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const openDetail = async (f: Feedback) => {
    const res = await fetch(`/api/crew-feedback/${f.id}`)
    if (res.ok) setDetail(await res.json())
  }

  const submitDispute = async () => {
    if (!disputeFor || disputeReason.trim().length < 10) return
    setSubmitting(true)
    const res = await fetch('/api/crew-score/dispute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedbackId: disputeFor.id, reason: disputeReason.trim() }),
    })
    setSubmitting(false)
    if (res.ok) {
      showToast('Dispute submitted — Captain will review the call log', 'success')
      setFeedbacks(prev => prev.map(f => f.id === disputeFor.id ? { ...f, scoreDisputed: true, scoreDisputeReason: disputeReason.trim() } : f))
      setDisputeFor(null)
      setDisputeReason('')
    } else {
      const d = await res.json().catch(() => ({}))
      showToast(d.error || 'Failed to submit dispute', 'error')
    }
  }

  if (!mounted || loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-8 w-64 rounded bg-gray-100 animate-pulse" />
        <div className="h-24 rounded-xl bg-gray-100 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-600" />
          <h1 className="text-2xl font-serif font-bold text-hm-black">Guest Feedback</h1>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Every voice feedback that affected your score. Click to review the transcript.
          If a score feels unfair, you can dispute it — Captain will review the call log.
        </p>
      </div>

      {feedbacks.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center">
          <Star className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          <p className="font-semibold text-hm-black">No guest feedback yet</p>
          <p className="text-sm text-gray-500 mt-1">
            Once guests complete their post-stay call, their ratings will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map(f => {
            const isLowConf = f.analysisConfidence !== null && f.analysisConfidence < 0.75
            return (
              <div key={f.id} className="rounded-xl border bg-white p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className="font-semibold text-hm-black">{f.property?.name ?? 'Property'}</span>
                      <span className="text-xs text-gray-500">·</span>
                      <span className="text-xs text-gray-500">{f.reservation?.guestName ?? 'Guest'}</span>
                      <SentimentBadge s={f.sentimentOverall} />
                      {isLowConf && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[10px] font-bold">
                          <AlertTriangle className="h-2.5 w-2.5" /> LOW CONFIDENCE
                        </span>
                      )}
                      {f.analysisCrossValidated && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-semibold">
                          <CheckCircle2 className="h-2.5 w-2.5" /> verified
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-4 max-w-md mt-3">
                      <div>
                        <p className="text-[10px] uppercase text-gray-400 tracking-wider">Cleanliness</p>
                        <ScoreBadge score={f.scoreCleanliness} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-gray-400 tracking-wider">Property state</p>
                        <ScoreBadge score={f.scorePropertyState} />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase text-gray-400 tracking-wider">Presentation</p>
                        <ScoreBadge score={f.scoreCrewPresentation} />
                      </div>
                    </div>
                    {f.feedbackCrewPositive && (
                      <p className="text-sm text-gray-600 mt-3 italic">
                        &ldquo;{f.feedbackCrewPositive.slice(0, 200)}&rdquo;
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <p className="text-xs text-gray-400">{new Date(f.createdAt).toLocaleDateString('en-GB')}</p>
                    <button
                      onClick={() => openDetail(f)}
                      className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <FileText className="h-3.5 w-3.5" /> View call
                    </button>
                    {f.scoreDisputed ? (
                      <div>
                        {f.scoreDisputeResolvedAt && f.scoreDisputeOutcome ? (
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${OUTCOME_BADGE[f.scoreDisputeOutcome]?.bg ?? 'bg-gray-100'} ${OUTCOME_BADGE[f.scoreDisputeOutcome]?.text ?? 'text-gray-700'}`}>
                            {OUTCOME_BADGE[f.scoreDisputeOutcome]?.label ?? f.scoreDisputeOutcome}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[10px] font-semibold">
                            <Clock className="h-2.5 w-2.5" /> In review
                          </span>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setDisputeFor(f)}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 text-red-600 px-3 py-1.5 text-xs font-semibold hover:bg-red-50"
                      >
                        <Gavel className="h-3.5 w-3.5" /> Dispute
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Call transcript modal */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => setDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-bold text-hm-black">
                  Feedback — {detail.reservation?.guestName}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {detail.property?.name} · {new Date(detail.createdAt).toLocaleDateString('en-GB')}
                  {detail.callDurationSeconds && ` · ${Math.round(detail.callDurationSeconds / 60)}min call`}
                </p>
              </div>
              <button onClick={() => setDetail(null)} aria-label="Close" className="text-gray-400 hover:text-gray-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Recording */}
              {detail.recordingUrl && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                    <Volume2 className="h-3.5 w-3.5" /> Audio recording
                  </p>
                  <audio controls className="w-full" src={detail.recordingUrl}>
                    Your browser does not support audio playback.
                  </audio>
                </div>
              )}

              {/* Scores */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">All scores</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <ScoreRow label="Cleanliness" score={detail.scoreCleanliness} highlight />
                  <ScoreRow label="Property state" score={detail.scorePropertyState} highlight />
                  <ScoreRow label="Crew presentation" score={detail.scoreCrewPresentation} highlight />
                  <ScoreRow label="Property structure" score={detail.scorePropertyStructure} />
                  <ScoreRow label="Amenities" score={detail.scorePropertyAmenities} />
                  <ScoreRow label="Communication" score={detail.scoreCommunication} />
                  <ScoreRow label="Check-in" score={detail.scoreCheckInExperience} />
                  <ScoreRow label="Check-out" score={detail.scoreCheckOutExperience} />
                  <ScoreRow label="Overall" score={detail.scorePlatformOverall} />
                </div>
                {detail.analysisConfidence !== null && (
                  <p className="text-[11px] text-gray-500 mt-3">
                    AI confidence: <strong>{(detail.analysisConfidence * 100).toFixed(0)}%</strong>
                    {detail.analysisCrossValidated && ' · cross-validated by two AI models'}
                  </p>
                )}
              </div>

              {/* Transcript */}
              {detail.transcriptionFull && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5" /> Call transcript
                  </p>
                  <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto font-mono text-xs">
                    {detail.transcriptionFull}
                  </div>
                </div>
              )}

              {/* Dispute status */}
              {detail.scoreDisputed && (
                <div className="rounded-lg border-2 border-amber-200 bg-amber-50/50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-1">Dispute submitted</p>
                  <p className="text-sm text-amber-900">{detail.scoreDisputeReason}</p>
                  {detail.scoreDisputeResolvedAt && detail.scoreDisputeOutcome && (
                    <p className="text-xs text-amber-700 mt-2">
                      Resolved on {new Date(detail.scoreDisputeResolvedAt).toLocaleDateString('en-GB')}:
                      <strong> {OUTCOME_BADGE[detail.scoreDisputeOutcome]?.label}</strong>
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="px-6 py-3 border-t flex justify-between gap-3">
              <button onClick={() => setDetail(null)} className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
                Close
              </button>
              {!detail.scoreDisputed && (
                <button
                  onClick={() => { setDisputeFor(detail); setDetail(null) }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-bold hover:bg-red-700"
                >
                  <Gavel className="h-4 w-4" /> Dispute this score
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dispute modal */}
      {disputeFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => !submitting && setDisputeFor(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b">
              <h2 className="font-serif text-xl font-bold text-hm-black flex items-center gap-2">
                <Gavel className="h-5 w-5 text-red-600" /> Dispute score
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Your dispute will be sent to Captain + Admin. They will review the call log and decide.
                The score stays applied until the dispute is resolved.
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div className="rounded-lg bg-gray-50 p-3 text-sm">
                <p className="font-semibold text-hm-black">{disputeFor.property?.name}</p>
                <p className="text-xs text-gray-500">
                  Guest: {disputeFor.reservation?.guestName} · Cleanliness: {disputeFor.scoreCleanliness ?? '—'}/10
                </p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-hm-black mb-1">
                  Why do you dispute this score? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={disputeReason}
                  onChange={e => setDisputeReason(e.target.value)}
                  rows={5}
                  maxLength={1000}
                  placeholder="Explain why the score is unfair. Be specific — mention what the guest said vs what actually happened. Captain will read this alongside the transcript."
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  {disputeReason.length}/1000 — minimum 10 characters
                </p>
              </div>
            </div>
            <div className="px-6 py-3 border-t flex justify-end gap-2">
              <button
                onClick={() => { setDisputeFor(null); setDisputeReason('') }}
                disabled={submitting}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={submitDispute}
                disabled={submitting || disputeReason.trim().length < 10}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 text-white px-4 py-2 text-sm font-bold hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit dispute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ScoreRow({ label, score, highlight }: { label: string; score: number | null; highlight?: boolean }) {
  return (
    <div className={`rounded-lg p-2 ${highlight ? 'bg-amber-50/50 border border-amber-200' : 'bg-gray-50'}`}>
      <p className="text-[9px] uppercase tracking-wider text-gray-500">{label}</p>
      <ScoreBadge score={score} />
    </div>
  )
}
