"use client"

import { useEffect, useState } from "react"
import { FileText, Loader2 } from "lucide-react"
import { useLocale } from "@/i18n/provider"
import { ContractViewer } from "@/components/hm/contract-viewer"

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

export default function ClientContractsPage() {
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

  if (loading) return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 rounded bg-gray-100 w-48" />
      <div className="h-64 rounded-hm bg-gray-100" />
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif font-bold text-hm-black">{t('contracts.contractsTitle')}</h1>
      </div>

      {contracts.length === 0 ? (
        <div className="rounded-hm border p-10 text-center" style={{ background: 'var(--hm-sand)' }}>
          <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500">{t('contracts.contractsEmpty')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {contracts.map(c => (
            <ContractViewer
              key={c.id}
              contract={c}
              onSigned={() => setContracts(prev => prev.map(x => x.id === c.id ? { ...x, signedByUser: true, signedAt: new Date().toISOString() } : x))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
