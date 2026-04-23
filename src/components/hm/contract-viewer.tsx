"use client"

import { useState } from "react"
import { FileText, CheckCircle2, Loader2, Printer, Clock, AlertTriangle } from "lucide-react"
import { useLocale } from "@/i18n/provider"
import { intlLocale, type Locale } from "@/i18n"

type Contract = {
  id: string
  title: string
  terms: string
  type?: string
  status?: string
  signedByUser: boolean
  signedAt: string | null
  startDate?: string | null
  endDate?: string | null
}

type Props = {
  contract: Contract
  onSigned?: () => void
  compact?: boolean
}

const STATUS_STYLE: Record<string, { bg: string; text: string; icon: typeof CheckCircle2 }> = {
  DRAFT:      { bg: 'bg-gray-100', text: 'text-gray-600', icon: Clock },
  ACTIVE:     { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
  EXPIRED:    { bg: 'bg-amber-100', text: 'text-amber-700', icon: AlertTriangle },
  TERMINATED: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle },
}

export function ContractViewer({ contract, onSigned, compact }: Props) {
  const { t, locale } = useLocale()
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(contract.signedByUser)
  const [error, setError] = useState("")

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString(intlLocale(locale as Locale), {
      day: '2-digit', month: 'long', year: 'numeric',
    })

  const sign = async () => {
    setSigning(true)
    setError("")
    try {
      const res = await fetch(`/api/contracts/${contract.id}/sign`, { method: "POST" })
      if (res.ok) {
        setSigned(true)
        onSigned?.()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error || t('contracts.signError'))
      }
    } catch {
      setError(t('contracts.networkError'))
    }
    setSigning(false)
  }

  const handlePrint = () => {
    const w = window.open('', '_blank')
    if (!w) return
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
    const safeTitle = esc(contract.title)
    const safeTerms = esc(contract.terms).replace(/\n/g, '<br/>')
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
      <title>${safeTitle}</title>
      <style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:0 20px;color:#1a1a1a;line-height:1.7}
      h1{font-size:22px;border-bottom:2px solid #B08A3E;padding-bottom:8px;color:#0B1E3A}
      .meta{font-size:13px;color:#666;margin-bottom:24px}
      .signed{margin-top:32px;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px}
      @media print{body{max-height:none !important;overflow:visible !important}}
      </style></head><body>
      <h1>${safeTitle}</h1>
      <div class="meta">${esc(t('contracts.serviceAgreement'))}</div>
      <div>${safeTerms}</div>
      ${signed ? `<div class="signed"><strong>${esc(t('contracts.agreementSigned'))}</strong> ${contract.signedAt ? `${esc(t('contracts.on'))} ${esc(fmtDate(contract.signedAt))}` : ''}</div>` : ''}
      </body></html>`)
    w.document.close()
    w.print()
  }

  const renderTerms = (text: string) =>
    text.split("\n").map((line, i) => {
      if (!line.trim()) return <br key={i} />
      if (/^#{1,3}\s/.test(line))
        return <p key={i} className="font-bold mt-5 mb-1 text-sm" style={{ color: 'var(--hm-black)' }}>{line.replace(/^#{1,3}\s/, '')}</p>
      if (/^\d+\.\s/.test(line))
        return <p key={i} className="font-semibold mt-4 mb-1" style={{ color: 'var(--hm-black)' }}>{line}</p>
      if (line === line.toUpperCase() && line.trim().length > 3)
        return <p key={i} className="font-bold mt-5 mb-1 text-sm uppercase tracking-wide" style={{ color: 'var(--hm-black)' }}>{line}</p>
      return <p key={i} className="text-sm leading-relaxed text-gray-700">{line}</p>
    })

  const statusKey = (contract.status ?? 'ACTIVE').toUpperCase()
  const statusMeta = STATUS_STYLE[statusKey] ?? STATUS_STYLE.ACTIVE
  const StatusIcon = statusMeta.icon

  return (
    <div className="rounded-xl border overflow-hidden shadow-sm" style={{ borderColor: 'rgba(11,30,58,0.1)' }}>
      {/* Header */}
      <div className="px-6 py-4 flex items-center gap-3" style={{ background: 'var(--hm-black)' }}>
        <FileText className="h-5 w-5 shrink-0" style={{ color: 'var(--hm-gold)' }} />
        <div className="flex-1 min-w-0">
          <h3 className="font-serif font-bold text-white text-lg truncate">{contract.title}</h3>
          <p className="text-xs text-white/60 font-sans">{t('contracts.serviceAgreement')}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {signed && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t('contracts.signed')}
            </span>
          )}
          {!signed && (
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.bg} ${statusMeta.text}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {t(`contracts.${statusKey.toLowerCase()}`)}
            </span>
          )}
        </div>
      </div>

      {/* Metadata bar */}
      {(contract.startDate || contract.type) && (
        <div className="px-6 py-2 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-4 text-xs text-gray-500">
          {contract.type && <span>{t('contracts.type')}: <strong className="text-gray-700">{contract.type.replace(/_/g, ' ')}</strong></span>}
          {contract.startDate && <span>{t('contracts.startDate')}: <strong className="text-gray-700">{fmtDate(contract.startDate)}</strong></span>}
          <span>{t('contracts.endDate')}: <strong className="text-gray-700">{contract.endDate ? fmtDate(contract.endDate) : t('contracts.noEndDate')}</strong></span>
        </div>
      )}

      {/* Terms */}
      {!compact && (
        <div className="px-6 py-5 bg-white max-h-[400px] overflow-y-auto border-b border-gray-100">
          <div className="prose prose-sm max-w-none">{renderTerms(contract.terms)}</div>
        </div>
      )}

      {/* Footer */}
      <div className="px-6 py-4 bg-gray-50 flex items-center justify-between gap-4">
        <div className="flex-1">
          {error && <p className="text-sm text-red-600">{error}</p>}
          {!error && !signed && <p className="text-xs text-gray-500">{t('contracts.bySigningAgree')}</p>}
          {signed && contract.signedAt && (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-700">
                {t('contracts.agreementSigned')} {t('contracts.on')} {fmtDate(contract.signedAt)}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Printer className="h-3.5 w-3.5" /> {t('contracts.print')}
          </button>
          {!signed && (
            <button
              onClick={sign}
              disabled={signing}
              className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold transition-all hover:brightness-110 disabled:opacity-50"
              style={{ background: 'var(--hm-gold)', color: 'var(--hm-black)' }}
            >
              {signing ? <><Loader2 className="h-4 w-4 animate-spin" /> {t('contracts.signing')}</> : <><FileText className="h-4 w-4" /> {t('contracts.signAgreement')}</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
