"use client"

import { useEffect, useState, useCallback } from "react"
import { Star, X, Send, Loader2, AlertTriangle } from "lucide-react"
import { useLocale } from "@/i18n/provider"

interface PendingReservation {
  id: string
  guestName: string
  guestNationality?: string | null
  guestEmail?: string | null
  checkIn: string
  checkOut: string
  amount: number
  platform?: string | null
  property: { id: string; name: string; city: string }
}

interface CompletedReview {
  id: string
  cleaningRating: number
  setupRating: number
  conditionRating: number
  overallRating: string | number
  guestComments?: string | null
  issuesReported?: string | null
  crewMemberId?: string | null
  scoreApplied: boolean
  createdAt: string
  reservation: {
    id: string
    guestName: string
    guestNationality?: string | null
    checkIn: string
    checkOut: string
    platform?: string | null
  }
  property: { id: string; name: string; city: string }
  reviewer: { id: string; name: string | null }
}

const FLAGS: Record<string, string> = {
  GB: "\u{1F1EC}\u{1F1E7}", SE: "\u{1F1F8}\u{1F1EA}", NO: "\u{1F1F3}\u{1F1F4}",
  DK: "\u{1F1E9}\u{1F1F0}", NL: "\u{1F1F3}\u{1F1F1}", DE: "\u{1F1E9}\u{1F1EA}",
  FR: "\u{1F1EB}\u{1F1F7}", ES: "\u{1F1EA}\u{1F1F8}", IT: "\u{1F1EE}\u{1F1F9}",
  PT: "\u{1F1F5}\u{1F1F9}", US: "\u{1F1FA}\u{1F1F8}", BR: "\u{1F1E7}\u{1F1F7}",
}

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

function StarSelector({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          className="p-0.5 transition-colors disabled:cursor-not-allowed"
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => !disabled && setHover(0)}
          onClick={() => !disabled && onChange(star)}
        >
          <Star
            className={`h-6 w-6 ${
              star <= (hover || value)
                ? "fill-amber-400 text-amber-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  )
}

export default function ReviewsPage() {
  const { t } = useLocale()
  const [tab, setTab] = useState<"pending" | "completed">("pending")
  const [pending, setPending] = useState<PendingReservation[]>([])
  const [completed, setCompleted] = useState<CompletedReview[]>([])
  const [loading, setLoading] = useState(true)
  const [reviewTarget, setReviewTarget] = useState<PendingReservation | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [pendingRes, completedRes] = await Promise.all([
        fetch("/api/reviews/pending"),
        fetch("/api/reviews"),
      ])
      if (pendingRes.ok) setPending(await pendingRes.json())
      if (completedRes.ok) setCompleted(await completedRes.json())
    } catch (err) {
      console.error("Failed to load reviews:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-gray-900">{t("manager.reviews.title")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("manager.reviews.subtitle")}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "pending"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setTab("pending")}
        >
          {t("manager.reviews.pending")}
          {pending.length > 0 && (
            <span className="ml-2 rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-semibold">
              {pending.length}
            </span>
          )}
        </button>
        <button
          className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === "completed"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
          onClick={() => setTab("completed")}
        >
          {t("manager.reviews.completed")}
          {completed.length > 0 && (
            <span className="ml-2 rounded-full bg-gray-100 text-gray-600 px-2 py-0.5 text-xs font-semibold">
              {completed.length}
            </span>
          )}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : tab === "pending" ? (
        /* ── Pending Tab ── */
        pending.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Star className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">{t("manager.reviews.noReviewsPending")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between rounded-lg border bg-white p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {r.guestNationality && (
                    <span className="text-lg">{FLAGS[r.guestNationality] ?? "\u{1F30D}"}</span>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{r.guestName}</p>
                    <p className="text-sm text-gray-500 truncate">
                      {r.property.name} &middot; {fmtDate(r.checkIn)} &ndash; {fmtDate(r.checkOut)}
                    </p>
                    {r.platform && (
                      <span className="inline-block mt-1 rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600">
                        {r.platform}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setReviewTarget(r)}
                  className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  {t("manager.reviews.reviewStay")}
                </button>
              </div>
            ))}
          </div>
        )
      ) : (
        /* ── Completed Tab ── */
        completed.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Star className="h-10 w-10 mx-auto mb-3 text-gray-300" />
            <p className="font-medium">{t("manager.reviews.noReviewsCompleted")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {completed.map((rev) => (
              <div
                key={rev.id}
                className="rounded-lg border bg-white p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {rev.reservation.guestNationality && (
                        <span className="text-lg">{FLAGS[rev.reservation.guestNationality] ?? "\u{1F30D}"}</span>
                      )}
                      <p className="font-medium text-gray-900">{rev.reservation.guestName}</p>
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {rev.property.name} &middot; {fmtDate(rev.reservation.checkIn)} &ndash; {fmtDate(rev.reservation.checkOut)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5">
                      <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                      <span className="text-lg font-bold text-gray-900">
                        {Number(rev.overallRating).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{fmtDate(rev.createdAt)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t("manager.reviews.cleaningRating")} (3x)</p>
                    <StarDisplay rating={rev.cleaningRating} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t("manager.reviews.setupRating")} (2x)</p>
                    <StarDisplay rating={rev.setupRating} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">{t("manager.reviews.conditionRating")} (1x)</p>
                    <StarDisplay rating={rev.conditionRating} />
                  </div>
                </div>

                {rev.guestComments && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                    {rev.guestComments}
                  </p>
                )}

                {rev.issuesReported && (
                  <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 rounded p-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>{rev.issuesReported}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* ── Review Modal ── */}
      {reviewTarget && (
        <ReviewModal
          reservation={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSubmitted={() => {
            setReviewTarget(null)
            fetchData()
          }}
        />
      )}
    </div>
  )
}

/* ── Review Modal Component ── */
function ReviewModal({
  reservation,
  onClose,
  onSubmitted,
}: {
  reservation: PendingReservation
  onClose: () => void
  onSubmitted: () => void
}) {
  const { t } = useLocale()
  const [cleaningRating, setCleaningRating] = useState(0)
  const [setupRating, setSetupRating] = useState(0)
  const [conditionRating, setConditionRating] = useState(0)
  const [guestComments, setGuestComments] = useState("")
  const [issuesReported, setIssuesReported] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  const allRated = cleaningRating > 0 && setupRating > 0 && conditionRating > 0
  const overallRating = allRated
    ? ((cleaningRating * 3 + setupRating * 2 + conditionRating * 1) / 6).toFixed(2)
    : null

  const handleSubmit = async () => {
    if (!allRated) return
    setSubmitting(true)
    setError("")

    try {
      const res = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reservationId: reservation.id,
          cleaningRating,
          setupRating,
          conditionRating,
          guestComments: guestComments.trim() || undefined,
          issuesReported: issuesReported.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Failed to submit review")
        return
      }

      onSubmitted()
    } catch {
      setError("Network error")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl mx-4">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-lg font-bold text-gray-900">{t("manager.reviews.reviewStay")}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Guest Info */}
          <div className="rounded-lg bg-gray-50 p-3 space-y-1">
            <div className="flex items-center gap-2">
              {reservation.guestNationality && (
                <span className="text-lg">{FLAGS[reservation.guestNationality] ?? "\u{1F30D}"}</span>
              )}
              <p className="font-semibold text-gray-900">{reservation.guestName}</p>
            </div>
            <p className="text-sm text-gray-600">
              {reservation.property.name}
            </p>
            <p className="text-sm text-gray-500">
              {fmtDate(reservation.checkIn)} &ndash; {fmtDate(reservation.checkOut)}
            </p>
            {reservation.platform && (
              <span className="inline-block rounded bg-white border px-1.5 py-0.5 text-[11px] font-medium text-gray-600">
                {reservation.platform}
              </span>
            )}
          </div>

          {/* Cleaning Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t("manager.reviews.cleaningRating")}
              <span className="ml-1 text-xs text-gray-400 font-normal">({t("manager.reviews.weight")} 3x)</span>
            </label>
            <StarSelector value={cleaningRating} onChange={setCleaningRating} disabled={submitting} />
          </div>

          {/* Setup Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t("manager.reviews.setupRating")}
              <span className="ml-1 text-xs text-gray-400 font-normal">({t("manager.reviews.weight")} 2x)</span>
            </label>
            <StarSelector value={setupRating} onChange={setSetupRating} disabled={submitting} />
          </div>

          {/* Condition Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t("manager.reviews.conditionRating")}
              <span className="ml-1 text-xs text-gray-400 font-normal">({t("manager.reviews.weight")} 1x)</span>
            </label>
            <StarSelector value={conditionRating} onChange={setConditionRating} disabled={submitting} />
          </div>

          {/* Overall Score Display */}
          {overallRating && (
            <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3">
              <Star className="h-5 w-5 fill-blue-500 text-blue-500" />
              <span className="text-sm font-medium text-blue-900">
                {t("manager.reviews.overallScore")}: {overallRating}
              </span>
              <span className="text-xs text-blue-600 ml-auto">
                {Number(overallRating) >= 4.0
                  ? "+20 crew score"
                  : Number(overallRating) <= 2.5
                  ? "-40 crew score"
                  : "neutral"}
              </span>
            </div>
          )}

          {/* Guest Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t("manager.reviews.guestComments")}
            </label>
            <textarea
              value={guestComments}
              onChange={(e) => setGuestComments(e.target.value)}
              disabled={submitting}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              placeholder={t("manager.reviews.guestCommentsPlaceholder")}
            />
          </div>

          {/* Issues Reported */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t("manager.reviews.issuesReported")}
            </label>
            <textarea
              value={issuesReported}
              onChange={(e) => setIssuesReported(e.target.value)}
              disabled={submitting}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
              placeholder={t("manager.reviews.issuesPlaceholder")}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!allRated || submitting}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("manager.reviews.submitting")}
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {t("manager.reviews.submit")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
