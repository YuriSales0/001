"use client"

import { cn } from "@/lib/utils"
import { Download, CheckCircle2 } from "lucide-react"
import { useLocale } from "@/i18n/provider"

interface Booking {
  dates: string
  guestInfo: string
  grossAmount: number
}

interface FinancialStatementProps {
  propertyName: string
  ownerName: string
  plan: string
  month: string
  year: number
  bookings: Booking[]
  grossIncome: number
  commission: number
  commissionRate: number
  cleaningFees: number
  expenses: number
  netPayout: number
  sepaDate: string
  sepaStatus: "pending" | "sent"
  lastInspection?: string
  condition?: string
  pdfUrl?: string
  className?: string
}

const fmtEUR = (n: number) =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)

const MONTH_KEYS = [
  "finance.report.months.january","finance.report.months.february","finance.report.months.march",
  "finance.report.months.april","finance.report.months.may","finance.report.months.june",
  "finance.report.months.july","finance.report.months.august","finance.report.months.september",
  "finance.report.months.october","finance.report.months.november","finance.report.months.december"
]

export function FinancialStatement({
  propertyName, ownerName, plan, month, year, bookings,
  grossIncome, commission, commissionRate, cleaningFees, expenses,
  netPayout, sepaDate, sepaStatus, lastInspection, condition, pdfUrl, className,
}: FinancialStatementProps) {
  const { t } = useLocale()
  const monthName = isNaN(Number(month)) ? month : (t(MONTH_KEYS[Number(month) - 1]) ?? month)

  return (
    <div className={cn("hm-card overflow-hidden", className)}>
      {/* Statement header */}
      <div className="px-6 py-5 border-b border-hm-border bg-hm-black text-hm-ivory">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs font-sans uppercase tracking-widest text-hm-gold mb-1">
              {t('finance.statement.monthlyStatement')}
            </div>
            <h3 className="text-xl font-serif font-bold">{propertyName}</h3>
            <p className="text-hm-ivory/70 font-sans text-sm mt-0.5">
              {ownerName} · {monthName} {year}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs font-sans text-hm-ivory/60 mb-1">{plan} Plan</div>
            {pdfUrl && (
              <a
                href={pdfUrl}
                className="inline-flex items-center gap-1.5 text-xs font-sans text-hm-gold hover:text-hm-gold/80 border border-hm-gold/40 rounded-lg px-3 py-1.5 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                {t('finance.statement.downloadPdf')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Bookings table */}
      {bookings.length > 0 && (
        <div className="px-6 py-4 border-b border-hm-border">
          <h4 className="text-xs font-sans uppercase tracking-widest text-hm-slate/60 mb-3">
            {t('finance.statement.bookingsThisMonth')}
          </h4>
          <div className="space-y-2">
            {bookings.map((b, i) => (
              <div key={i} className="flex items-center justify-between font-sans text-sm">
                <div>
                  <span className="text-hm-black font-medium">{b.guestInfo}</span>
                  <span className="text-hm-slate/60 ml-2">{b.dates}</span>
                </div>
                <span className="text-hm-black font-medium">{fmtEUR(b.grossAmount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Financial breakdown */}
      <div className="px-6 py-4 space-y-3 font-sans text-[15px]">
        <div className="flex justify-between text-hm-slate">
          <span>{t('finance.statement.grossRentalIncome')}</span>
          <span className="font-medium">{fmtEUR(grossIncome)}</span>
        </div>
        <div className="flex justify-between text-hm-slate/70">
          <span>{t('finance.statement.hmCommission')} ({commissionRate}%)</span>
          <span className="text-hm-red/80">− {fmtEUR(commission)}</span>
        </div>
        <div className="flex justify-between text-hm-slate/70">
          <span>{t('finance.statement.cleaningFees')}</span>
          <span className="text-hm-red/80">− {fmtEUR(cleaningFees)}</span>
        </div>
        {expenses > 0 && (
          <div className="flex justify-between text-hm-slate/70">
            <span>{t('finance.statement.otherExpenses')}</span>
            <span className="text-hm-red/80">− {fmtEUR(expenses)}</span>
          </div>
        )}
      </div>

      {/* Net payout — hero */}
      <div className="mx-6 mb-4 rounded-hm bg-hm-green/10 border border-hm-green/30 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-sans uppercase tracking-widest text-hm-green/70 mb-1">
              {t('finance.statement.yourNetPayment')}
            </div>
            <div className="text-4xl font-serif font-bold text-hm-green">
              {fmtEUR(netPayout)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-sans text-hm-slate/60 mb-1">{t('finance.statement.sepaTransfer')}</div>
            <div className="flex items-center gap-1.5 font-sans text-sm">
              {sepaStatus === "sent" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-hm-green" />
                  <span className="text-hm-green font-medium">{t('finance.statement.sent')}</span>
                </>
              ) : (
                <span className="text-hm-slate">
                  {t('finance.statement.scheduled')} {new Date(sepaDate).toLocaleDateString("en-GB")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Property condition footer */}
      {(lastInspection || condition) && (
        <div className="px-6 pb-4 font-sans text-sm text-hm-slate/70 border-t border-hm-border pt-4">
          {condition && <p>{t('finance.statement.propertyCondition')}: <strong className="text-hm-green">{condition}</strong></p>}
          {lastInspection && (
            <p>{t('finance.statement.lastInspection')}: {new Date(lastInspection).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}</p>
          )}
        </div>
      )}
    </div>
  )
}
