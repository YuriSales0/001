import { cn } from "@/lib/utils"
import { Download, TrendingUp } from "lucide-react"

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

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
]

export function MonthlyReportCard({
  month, year, grossIncome, commission, cleaningFees,
  expenses, netPayout, transferDate, transferStatus, pdfUrl, className,
}: MonthlyReportCardProps) {
  const monthName = isNaN(Number(month))
    ? month
    : MONTHS[Number(month) - 1] ?? month

  return (
    <div className={cn("hm-card overflow-hidden", className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-hm-border flex items-center justify-between">
        <div>
          <h4 className="font-bold text-hm-black text-lg">{monthName} {year}</h4>
          {transferDate && (
            <p className="text-sm font-sans text-hm-slate/70 mt-0.5">
              Transfer:{" "}
              <span className={transferStatus === "sent" ? "text-hm-green font-medium" : "text-hm-slate"}>
                {new Date(transferDate).toLocaleDateString("en-GB")}
                {transferStatus === "sent" ? " — Sent" : " — Scheduled"}
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
          <span>Gross rental income</span>
          <span className="font-medium">{fmtEUR(grossIncome)}</span>
        </div>
        <div className="flex justify-between text-hm-slate/70">
          <span>HostMasters commission</span>
          <span>− {fmtEUR(commission)}</span>
        </div>
        <div className="flex justify-between text-hm-slate/70">
          <span>Cleaning fees</span>
          <span>− {fmtEUR(cleaningFees)}</span>
        </div>
        {expenses > 0 && (
          <div className="flex justify-between text-hm-slate/70">
            <span>Other expenses</span>
            <span>− {fmtEUR(expenses)}</span>
          </div>
        )}
        <div className="pt-3 mt-1 border-t border-hm-border flex justify-between items-center">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-hm-green" />
            <span className="font-bold text-hm-black text-base">Your payment</span>
          </div>
          <span className="text-2xl font-bold text-hm-green">{fmtEUR(netPayout)}</span>
        </div>
      </div>
    </div>
  )
}
