import { cn } from "@/lib/utils"
import { MapPin, CheckCircle2, AlertTriangle } from "lucide-react"
import { PlanBadge } from "./plan-badge"

interface PropertyCardProps {
  name: string
  address: string
  plan: string
  netEarnings?: number
  occupancyPct?: number
  nextBooking?: {
    checkIn: string
    checkOut: string
    guestCountry?: string
  }
  condition?: "good" | "attention"
  lastInspection?: string
  className?: string
}

const countryFlags: Record<string, string> = {
  GB: "🇬🇧", SE: "🇸🇪", NO: "🇳🇴", DK: "🇩🇰",
  NL: "🇳🇱", DE: "🇩🇪", FR: "🇫🇷", ES: "🇪🇸",
  US: "🇺🇸", AU: "🇦🇺", FI: "🇫🇮", BE: "🇧🇪",
}

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

export function PropertyCard({
  name, address, plan, netEarnings, occupancyPct,
  nextBooking, condition = "good", lastInspection, className,
}: PropertyCardProps) {
  return (
    <div className={cn("hm-card p-6", className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="text-xl font-bold text-hm-black">{name}</h3>
          <div className="flex items-center gap-1 mt-1 text-hm-slate/70 text-sm font-sans">
            <MapPin className="h-3.5 w-3.5" />
            {address}
          </div>
        </div>
        <PlanBadge plan={plan} size="sm" />
      </div>

      {/* Earnings */}
      {netEarnings !== undefined && (
        <div className="mb-5 p-4 rounded-lg bg-hm-ivory border border-hm-border">
          <div className="text-xs font-sans uppercase tracking-widest text-hm-slate/60 mb-1">
            This month — net to you
          </div>
          <div className="text-4xl font-bold text-hm-black">{fmtEUR(netEarnings)}</div>
          {occupancyPct !== undefined && (
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full bg-hm-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-hm-gold"
                  style={{ width: `${occupancyPct}%` }}
                />
              </div>
              <span className="text-sm font-sans text-hm-slate/70">{occupancyPct}% occupied</span>
            </div>
          )}
        </div>
      )}

      {/* Next booking */}
      {nextBooking && (
        <div className="mb-4">
          <div className="text-xs font-sans uppercase tracking-widest text-hm-slate/60 mb-1.5">
            Next guest
          </div>
          <div className="flex items-center gap-2 font-sans text-sm">
            {nextBooking.guestCountry && (
              <span className="text-lg">{countryFlags[nextBooking.guestCountry] ?? "🌍"}</span>
            )}
            <span className="text-hm-slate">
              {fmtDate(nextBooking.checkIn)} → {fmtDate(nextBooking.checkOut)}
            </span>
          </div>
        </div>
      )}

      {/* Condition */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {condition === "good" ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-hm-green" />
              <span className="text-sm font-sans text-hm-green font-medium">All good</span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-sans text-amber-700 font-medium">Attention needed</span>
            </>
          )}
        </div>
        {lastInspection && (
          <span className="text-xs font-sans text-hm-slate/60">
            Inspected {fmtDate(lastInspection)}
          </span>
        )}
      </div>
    </div>
  )
}
