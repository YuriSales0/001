'use client'

import { useEffect, useState } from 'react'
import { Building2, MapPin, Check, AlertCircle, Plus, X, Clock, CheckCircle2, Settings, FileText } from 'lucide-react'
import { HOUSE_RULES, HOUSE_RULE_CATEGORIES, getRulesByCategory, ruleLabel, categoryLabel, type HouseRuleCategory } from '@/lib/house-rules'
import { ContractViewer } from '@/components/hm/contract-viewer'
import { useLocale } from '@/i18n/provider'

type Contract = {
  id: string
  title: string
  terms: string
  signedByUser: boolean
  signedAt: string | null
  status: string
}

type Property = {
  id: string
  name: string
  address: string
  city: string
  postalCode: string | null
  status: string
  airbnbConnected: boolean
  bookingConnected: boolean
}


function HouseRulesSelector({ selected, onChange }: { selected: string[]; onChange: (rules: string[]) => void }) {
  const { locale, t } = useLocale()
  const rulesByCategory = getRulesByCategory()

  const toggle = (key: string) => {
    onChange(selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key])
  }

  return (
    <div className="space-y-6">
      {HOUSE_RULE_CATEGORIES.map(cat => {
        const rules = rulesByCategory.get(cat.key) ?? []
        const selectedInCat = rules.filter(r => selected.includes(r.key)).length
        return (
          <div key={cat.key}>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-gray-900">{categoryLabel(cat, locale)}</h4>
              <span className="text-xs text-gray-400">{selectedInCat}/{rules.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {rules.map(rule => (
                <label key={rule.key} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={selected.includes(rule.key)}
                    onChange={() => toggle(rule.key)}
                    className="accent-[#B08A3E]"
                  />
                  <span>{rule.icon}</span>
                  <span className="text-gray-700">{ruleLabel(rule, locale)}</span>
                </label>
              ))}
            </div>
          </div>
        )
      })}
      <p className="text-xs text-gray-400">{selected.length} {t('client.properties.rulesSelectedCount')}</p>
    </div>
  )
}

export default function ClientProperties() {
  const { t } = useLocale()

  const STATUS_BADGE: Record<string, { cls: string; label: string }> = {
    PENDING_CLIENT:    { cls: 'bg-violet-100 text-violet-700', label: t('client.properties.statusPendingClient') },
    PENDING_APPROVAL:  { cls: 'bg-amber-100 text-amber-700',  label: t('client.properties.statusPendingApproval') },
    CONTRACT_PENDING:  { cls: 'bg-blue-100 text-blue-700',    label: t('client.properties.statusContractPending') },
    ACTIVE:            { cls: 'bg-green-100 text-green-700',  label: t('client.properties.statusActive') },
    INACTIVE:          { cls: 'bg-gray-100 text-gray-500',    label: t('client.properties.statusInactive') },
    MAINTENANCE:       { cls: 'bg-orange-100 text-orange-600',label: t('client.properties.statusMaintenance') },
  }

  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', city: '', postalCode: '', houseRules: [] as string[] })
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')
  const [addSuccess, setAddSuccess] = useState(false)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [contracts, setContracts] = useState<Record<string, Contract>>({})
  const [loadingContracts, setLoadingContracts] = useState<Record<string, boolean>>({})

  const load = () =>
    fetch('/api/properties')
      .then(r => r.ok ? r.json() : [])
      .then((d: Property[]) => { setProperties(d); setLoading(false); return d })
      .then((d: Property[]) => {
        // Fetch contracts for CONTRACT_PENDING properties
        d.filter(p => p.status === 'CONTRACT_PENDING').forEach(p => fetchContract(p.id))
      })

  const fetchContract = async (propertyId: string) => {
    setLoadingContracts(prev => ({ ...prev, [propertyId]: true }))
    try {
      const res = await fetch(`/api/contracts?type=CLIENT_SERVICE&propertyId=${propertyId}`)
      if (res.ok) {
        const list: Contract[] = await res.json()
        const unsigned = list.find(c => !c.signedByUser) ?? list[0]
        if (unsigned) setContracts(prev => ({ ...prev, [propertyId]: unsigned }))
      }
    } finally {
      setLoadingContracts(prev => ({ ...prev, [propertyId]: false }))
    }
  }

  useEffect(() => { load() }, [])

  const pendingClient = properties.filter(p => p.status === 'PENDING_CLIENT')
  const pendingApproval = properties.filter(p => p.status === 'PENDING_APPROVAL')
  const contractPending = properties.filter(p => p.status === 'CONTRACT_PENDING')

  const confirmProperty = async (id: string) => {
    setConfirming(id)
    const res = await fetch(`/api/properties/${id}/client-confirm`, { method: 'POST' })
    if (res.ok) await load()
    setConfirming(null)
  }

  const submitRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddError('')
    if (!form.name || !form.address || !form.city) {
      setAddError(t('client.properties.fillRequired'))
      return
    }
    setAddLoading(true)
    const res = await fetch('/api/properties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name, address: form.address, city: form.city, postalCode: form.postalCode || undefined, houseRules: form.houseRules }),
    })
    if (!res.ok) {
      const err = await res.json()
      setAddError(err.error || t('client.properties.submitError'))
    } else {
      setAddSuccess(true)
      setForm({ name: '', address: '', city: '', postalCode: '', houseRules: [] })
      await load()
      setTimeout(() => { setShowAdd(false); setAddSuccess(false) }, 2000)
    }
    setAddLoading(false)
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">{t('client.properties.loading')}</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{t('client.properties.title')}</h1>
          <p className="text-sm text-gray-500">{t('client.properties.subtitle')}</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-navy-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-navy-800"
        >
          <Plus className="h-4 w-4" /> {t('client.properties.addProperty')}
        </button>
      </div>

      {/* Banner: needs client confirmation */}
      {pendingClient.length > 0 && (
        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4 flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
          <div className="text-sm text-violet-800">
            <p className="font-semibold mb-0.5">
              {pendingClient.length === 1
                ? t('client.properties.pendingClientBanner1')
                : t('client.properties.pendingClientBannerN').replace('{n}', String(pendingClient.length))}
            </p>
            <p className="text-xs">{t('client.properties.pendingClientBannerDesc')}</p>
          </div>
        </div>
      )}

      {/* Banner: contract pending — needs signature */}
      {contractPending.length > 0 && (
        <div className="rounded-xl border-2 border-blue-300 bg-blue-50 p-4 flex items-start gap-3">
          <FileText className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-0.5">
              {contractPending.length === 1
                ? t('client.properties.contractBanner1')
                : t('client.properties.contractBannerN').replace('{n}', String(contractPending.length))}
            </p>
            <p className="text-xs">{t('client.properties.contractBannerDesc')}</p>
          </div>
        </div>
      )}

      {/* Banner: pending OTA setup by admin */}
      {pendingApproval.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <Settings className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-0.5">
              {pendingApproval.length === 1
                ? t('client.properties.pendingApprovalBanner1')
                : t('client.properties.pendingApprovalBannerN').replace('{n}', String(pendingApproval.length))}
            </p>
            <p className="text-xs">{t('client.properties.pendingApprovalBannerDesc')}</p>
          </div>
        </div>
      )}

      {properties.length === 0 && (
        <div className="rounded-xl border bg-white p-10 text-center">
          <Building2 className="h-12 w-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-3">{t('client.properties.noProperties')}</p>
          <button onClick={() => setShowAdd(true)} className="rounded-lg bg-navy-900 text-white px-4 py-2 text-sm font-semibold hover:bg-navy-800">
            {t('client.properties.requestFirst')}
          </button>
        </div>
      )}

      <div className="space-y-4">
        {properties.map(p => {
          const badge = STATUS_BADGE[p.status] ?? { cls: 'bg-gray-100 text-gray-600', label: p.status }
          const isPendingClient = p.status === 'PENDING_CLIENT'
          const isPendingApproval = p.status === 'PENDING_APPROVAL'
          const isContractPending = p.status === 'CONTRACT_PENDING'
          const contract = contracts[p.id]

          return (
            <div key={p.id} className={`rounded-xl border bg-white p-5 ${
              isPendingClient ? 'border-violet-200'
                : isPendingApproval ? 'border-amber-200'
                : isContractPending ? 'border-blue-300 border-2'
                : ''
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="text-base font-bold text-navy-900">{p.name}</h3>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>{badge.label}</span>
                  </div>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <MapPin className="h-4 w-4 shrink-0" /> {p.address}, {p.city}
                  </p>

                  {p.status === 'ACTIVE' && (
                    <div className="flex items-center gap-4 mt-3">
                      <span className={`inline-flex items-center gap-1 text-xs ${p.airbnbConnected ? 'text-green-600' : 'text-gray-400'}`}>
                        {p.airbnbConnected ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                        Airbnb {p.airbnbConnected ? t('client.properties.connected') : t('client.properties.notConnected')}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-xs ${p.bookingConnected ? 'text-green-600' : 'text-gray-400'}`}>
                        {p.bookingConnected ? <Check className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                        Booking.com {p.bookingConnected ? t('client.properties.connected') : t('client.properties.notConnected')}
                      </span>
                    </div>
                  )}

                  {isPendingClient && (
                    <p className="text-xs text-violet-600 mt-2">
                      {t('client.properties.addedByManager')}
                    </p>
                  )}
                  {isPendingApproval && (
                    <p className="text-xs text-amber-600 mt-2">
                      {t('client.properties.confirmedSetup')}
                    </p>
                  )}
                </div>

                {/* Confirm button for PENDING_CLIENT */}
                {isPendingClient && (
                  <button
                    onClick={() => confirmProperty(p.id)}
                    disabled={confirming === p.id}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-violet-600 text-white px-3 py-2 text-sm font-semibold hover:bg-violet-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {confirming === p.id ? t('client.properties.confirming') : t('client.properties.confirm')}
                  </button>
                )}
              </div>

              {/* Contract signing for CONTRACT_PENDING */}
              {isContractPending && (
                <div className="mt-4">
                  {loadingContracts[p.id] ? (
                    <div className="text-sm text-gray-400 py-4 text-center">{t('client.properties.loadingContract')}</div>
                  ) : contract ? (
                    <ContractViewer
                      contract={contract}
                      onSigned={() => load()}
                    />
                  ) : (
                    <div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
                      {t('client.properties.contractBeingPrepared')}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Solicitar Propriedade modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-base font-bold text-navy-900">{t('client.properties.requestPropertyTitle')}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{t('client.properties.requestPropertyDesc')}</p>
              </div>
              <button onClick={() => setShowAdd(false)} className="rounded-md p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={submitRequest} className="p-5 space-y-4">
              {addError && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{addError}</div>}
              {addSuccess && (
                <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 flex items-center gap-2">
                  <Check className="h-4 w-4" /> {t('client.properties.requestSubmitted')}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t('client.properties.propertyName')} *</label>
                <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder={t('client.properties.propertyNamePlaceholder')}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">{t('client.properties.addressField')} *</label>
                <input type="text" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder={t('client.properties.addressPlaceholder')}
                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{t('client.properties.city')} *</label>
                  <input type="text" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                    placeholder="Lisboa"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">{t('client.properties.postalCode')}</label>
                  <input type="text" value={form.postalCode} onChange={e => setForm(f => ({ ...f, postalCode: e.target.value }))}
                    placeholder="1000-001"
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-navy-900" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-2">{t('client.properties.houseRules')}</label>
                <HouseRulesSelector
                  selected={form.houseRules}
                  onChange={rules => setForm(f => ({ ...f, houseRules: rules }))}
                />
              </div>

              <div className="rounded-lg bg-gray-50 border p-3 text-xs text-gray-500">
                {t('client.properties.afterSubmit')}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setShowAdd(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">{t('common.cancel')}</button>
                <button type="submit" disabled={addLoading}
                  className="rounded-lg bg-navy-900 text-white px-4 py-2 text-sm font-semibold hover:bg-navy-800 disabled:opacity-50">
                  {addLoading ? t('client.properties.submitting') : t('client.properties.submitRequest')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
