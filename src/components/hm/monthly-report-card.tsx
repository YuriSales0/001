"use client"

import { cn } from "@/lib/utils"
import { Download, TrendingUp } from "lucide-react"
import { useLocale } from "@/i18n/provider"

interface MonthlyReportCardProps {
  month: string
  year: number
  grossIncome: number
  commission: number
  cleaningFees: number
  expenses: number
  netPayout: number
  transferDate?: string
  transferStatus?: "pending" | "sent"
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

export function MonthlyReportCard({
  month, year, grossIncome, commission, cleaningFees,
  expenses, netPayout, transferDate, transferStatus, pdfUrl, className,
}: MonthlyReportCardProps) {
  const { t } = useLocale()
  const monthName = isNaN(Number(month))
    ? month
    : t(MONTH_KEYS[Number(month) - 1]) ?? month

  return (
    <div className={cn("hm-card overflow-hidden", className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-hm-border flex items-center justify-between">
        <div>
          <h4 className="font-bold text-hm-black text-lg">{monthName} {year}</h4>
          {transferDate && (
            <p className="text-sm font-sans text-hm-slate/70 mt-0.5">
              {t('finance.report.transfer')}:{" "}
              <span className={transferStatus === "sent" ? "text-hm-green font-medium" : "text-hm-slate"}>
                {new Date(transferDate).toLocaleDateString("en-GB")}
                {transferStatus === "sent" ? ` — ${t('finance.report.sent')}` : ` — ${t('finance.report.scheduled')}`}
              </span>
            </p>
          )}
        </div>
        {pdfUrl && (
          <a
            href={pdfUrl}
            className="flex items-center gap-1.5 rounded-lg border border-hm-border bg-hm-ivory px-3 py-2 text-sm font-sans text-hm-slate hover:border-hm-gold/50 hover:text-hm-gold-dk transition-colors"
          >
            <Download className="h-4 w-4" />
            PDF
          </a>
        )}
      </div>

      {/* Breakdown */}
      <div className="px-6 py-4 space-y-2 font-sans text-sm">
        <div className="flex justify-between text-hm-slate">
          <span>{t('finance.report.grossRentalIncome')}</span>
          <span className="font-medium">{fmtEUR(grossIncome)}</span>
        </div>
        <div className="flex justify-between text-hm-slate/70">
          <span>{t('finance.report.hmCommission')}</span>
          <span>− {fmtEUR(commission)}</span>
        </div>
        <div className="flex justify-between text-hm-slate/70">
          <span>{t('finance.report.cleaningFees')}</span>
          <span>− {fmtEUR(cleaningFees)}</span>
        </div>
        {expenses > 0 && (
          <div className="flex justify-between text-hm-slate/70">
            <span>{t('finance.report.otherExpenses')}</span>
            <span>− {fmtEUR(expenses)}</span>
          </div>
        )}
        <div className="pt-3 mt-1 border-t border-hm-border flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-hm-green" />
            <span className="font-bold text-hm-black text-base">{t('finance.report.yourPayment')}</span>
          </div>
          <span className="text-2xl font-bold text-hm-green">{fmtEUR(netPayout)}</span>
        </div>
      </div>
    </div>
  )
}
