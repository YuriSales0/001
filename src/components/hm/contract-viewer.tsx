"use client"

import { useState } from "react"
import { FileText, CheckCircle2, Loader2 } from "lucide-react"

type Contract = {
  id: string
  title: string
  terms: string
  signedByUser: boolean
  signedAt: string | null
  status: string
}

type Props = {
  contract: Contract
  onSigned?: () => void
}

export function ContractViewer({ contract, onSigned }: Props) {
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(contract.signedByUser)
  const [error, setError] = useState("")

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
        setError(data.error || "Failed to sign contract. Please try again.")
      }
    } catch {
      setError("Network error. Please try again.")
    }
    setSigning(false)
  }

  // Render terms with simple line-break handling
  const renderTerms = (text: string) =>
    text.split("\n").map((line, i) => {
      if (!line.trim()) return <br key={i} />
      // Section headers (all-caps lines or lines starting with a number + dot)
      if (/^\d+\.\s/.test(line))
        return (
          <p key={i} className="font-semibold text-[#0a1628] mt-4 mb-1">
            {line}
          </p>
        )
      if (line === line.toUpperCase() && line.trim().length > 3)
        return (
          <p key={i} className="font-bold text-[#0a1628] mt-5 mb-1 text-sm uppercase tracking-wide">
            {line}
          </p>
        )
      return (
        <p key={i} className="text-sm leading-relaxed text-gray-700">
          {line}
        </p>
      )
    })

  return (
    <div className="rounded-xl border border-[#0a1628]/10 overflow-hidden shadow-sm">
      {/* Navy header */}
      <div
        className="px-6 py-4 flex items-center gap-3"
        style={{ background: "#0a1628" }}
      >
        <FileText className="h-5 w-5 text-[#c9a84c] shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="font-serif font-bold text-white text-lg truncate">
            {contract.title}
          </h3>
          <p className="text-xs text-white/60 font-sans">
            Service Agreement &mdash; HostMasters Costa Tropical
          </p>
        </div>
        {signed && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Signed
          </span>
        )}
      </div>

      {/* Terms body */}
      <div className="px-6 py-5 bg-white max-h-[400px] overflow-y-auto border-b border-gray-100">
        <div className="prose prose-sm max-w-none">{renderTerms(contract.terms)}</div>
      </div>

      {/* Footer: sign action */}
      <div className="px-6 py-4 bg-gray-50 flex items-center justify-between gap-4">
        {error && (
          <p className="text-sm text-red-600 flex-1">{error}</p>
        )}
        {!error && !signed && (
          <p className="text-xs text-gray-500 flex-1">
            By signing, you agree to the terms above.
          </p>
        )}
        {signed ? (
          <div className="flex items-center gap-2 ml-auto">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-700">
              Agreement signed
              {contract.signedAt && (
                <span className="font-normal text-gray-500 ml-1">
                  on{" "}
                  {new Date(contract.signedAt).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </span>
          </div>
        ) : (
          <button
            onClick={sign}
            disabled={signing}
            className="ml-auto inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-[#0a1628] transition-all hover:brightness-110 disabled:opacity-50"
            style={{ background: "#c9a84c" }}
          >
            {signing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Sign Agreement
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
