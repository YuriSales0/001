"use client"

import { useEffect, useState } from "react"
import { FileText } from "lucide-react"
import { useLocale } from "@/i18n/provider"
import { ContractViewer } from "./contract-viewer"

type Contract = {
  id: string
  title: string
  terms: string
  type: string
  status: string
  signedByUser: boolean
  signedAt: string | null
  startDate: string | null
  endDate: string | null
}

export function ProfileContractSection() {
  const { t } = useLocale()
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/contracts')
      .then(r => r.ok ? r.json() : [])
      .then(setContracts)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="rounded-xl border bg-white p-5 animate-pulse h-32" />

  if (contracts.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-6 text-center">
        <FileText className="h-8 w-8 text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">{t('contracts.noContract')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-hm-black flex items-center gap-2">
        <FileText className="h-5 w-5 text-gray-400" />
        {t('contracts.myContract')}
      </h2>
      {contracts.map(c => (
        <ContractViewer
          key={c.id}
          contract={c}
          onSigned={() => setContracts(prev => prev.map(x => x.id === c.id ? { ...x, signedByUser: true, signedAt: new Date().toISOString() } : x))}
        />
      ))}
    </div>
  )
}
