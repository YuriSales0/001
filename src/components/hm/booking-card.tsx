"use client"

import { cn } from "@/lib/utils"
import { CalendarDays, Home, User } from "lucide-react"
import { useLocale } from "@/i18n/provider"

type BookingStatus = "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED"

interface BookingCardProps {
  id: string
  propertyName: string
  guestName: string
  guestNationality?: string
  checkIn: string
  checkOut: string
  nights: number
  grossAmount: number
  status: BookingStatus
  channel?: string
  cleaningStatus?: "pending" | "confirmed" | "done"
  className?: string
}

const STATUS_CONFIG: Record<BookingStatus, { labelKey: string; bg: string; text: string }> = {
  UPCOMING:   { labelKey: "booking.status.upcoming",   bg: "bg-hm-blue/10",   text: "text-hm-blue"   },
  ACTIVE:     { labelKey: "booking.status.active",     bg: "bg-hm-gold/15",   text: "text-hm-gold-dk"},
  COMPLETED:  { labelKey: "booking.status.completed",  bg: "bg-hm-green/10",  text: "text-hm-green"  },
  CANCELLED:  { labelKey: "booking.status.cancelled",  bg: "bg-hm-red/10",    text: "text-hm-red"    },
}

const FLAGS: Record<string, string> = {
  GB:"🇬🇧", SE:"🇸🇪", NO:"🇳🇴", DK:"🇩🇰",
  NL:"🇳🇱", DE:"🇩🇪", FR:"🇫🇷", ES:"🇪🇸", IT:"🇮🇹",
}

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })

export function BookingCard({
  id, propertyName, guestName, guestNationality,
  checkIn, checkOut, nights, grossAmount, status, channel, cleaningStatus, className,
}: BookingCardProps) {
  const { t } = useLocale()
  const cfg = STATUS_CONFIG[status]

  return (
    <div className={cn("hm-card p-4 hover:shadow-md transition-shadow", className)}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {guestNationality && (
            <span className="text-xl">{FLAGS[guestNationality] ?? "🌍"}</span>
          )}
          <div>
            <p className="font-serif font-semibold text-hm-black">{guestName}</p>
            <div className="flex items-center gap-1 text-xs font-sans text-hm-slate/70">
              <Home className="h-3 w-3" />
              {propertyName}
            </div>
          </div>
        </div>
        <span className={cn("text-xs font-sans font-semibold rounded-full px-2.5 py-1", cfg.bg, cfg.text)}>
          {t(cfg.labelKey)}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3 font-sans text-sm text-hm-slate">
        <CalendarDays className="h-4 w-4 text-hm-gold shrink-0" />
        <span>{fmtDate(checkIn)} → {fmtDate(checkOut)}</span>
        <span className="text-hm-slate/50">·</span>
        <span>{nights} {t('booking.nights')}</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {channel && (
            <span className="text-xs font-sans bg-hm-sand text-hm-slate/70 px-2 py-0.5 rounded">
              {channel}
            </span>
          )}
          {cleaningStatus && (
            <span className={cn(
              "text-xs font-sans px-2 py-0.5 rounded",
              cleaningStatus === "done" ? "bg-hm-green/10 text-hm-green" :
              cleaningStatus === "confirmed" ? "bg-hm-blue/10 text-hm-blue" :
              "bg-amber-50 text-amber-700"
            )}>
              {t('booking.cleaning')}: {t(`booking.cleaningStatus.${cleaningStatus}`)}
            </span>
          )}
        </div>
        <span className="font-serif font-bold text-hm-black">{fmtEUR(grossAmount)}</span>
      </div>
    </div>
  )
}
