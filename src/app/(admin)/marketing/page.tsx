'use client'

import { useEffect, useState } from 'react'
import { Megaphone, Plus, X, TrendingUp, Users, Target, BarChart3 } from 'lucide-react'
import { useCurrency } from '@/contexts/currency-context'

type Campaign = {
  id: string
  name: string
  channel: string
  type: string
  status: 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'
  budgetAllocated: number
  budgetSpent: number
  startDate: string | null
  endDate: string | null
  targetAudience: string | null
  description: string | null
  _count?: { leadAttributions: number }
}

const CHANNELS = ['GOOGLE_ADS','META','LINKEDIN','EMAIL','SEO','CONTENT','EVENT','PRINT','PARTNERSHIP','SIGNAGE','REFERRAL','OTHER']
const TYPES    = ['DIGITAL','PHYSICAL','EMAIL','EVENT','PRINT']
const STATUS_LABELS: Record<string, string> = { PLANNING: 'Planeamento', ACTIVE: 'Activa', PAUSED: 'Pausada', COMPLETED: 'Concluída' }
const STATUS_COLORS: Record<string, string> = {
  PLANNING:  'bg-gray-100 text-gray-600',
  ACTIVE:    'bg-green-100 text-green-700',
  PAUSED:    'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
}
const CHANNEL_LABELS: Record<string, string> = {
  GOOGLE_ADS: 'Google Ads', META: 'Meta/Instagram', LINKEDIN: 'LinkedIn',
  EMAIL: 'Email', SEO: 'SEO', CONTENT: 'Content',
  EVENT: 'Evento', PRINT: 'Impresso', PARTNERSHIP: 'Parceria',
  SIGNAGE: 'Sinalética', REFERRAL: 'Referral', OTHER: 'Outro',
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [channel, setChannel] = useState('META')
  const [type, setType] = useState('DIGITAL')
  const [budget, setBudget] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/campaigns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, channel, type,
        budgetAllocated: parseFloat(budget) || 0,
        startDate: startDate || null,
        endDate: endDate || null,
        targetAudience: targetAudience || null,
        description: description || null,
      }),
    })
    setSaving(false)
    onCreated()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-navy-900">Nova campanha</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nome *</label>
            <input value={name} onChange={e => setName(e.target.value)} required className="w-full rounded-md border px-3 py-2 text-sm" placeholder="ex: Google Ads Primavera 2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Canal</label>
              <select value={channel} onChange={e => setChannel(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
                {CHANNELS.map(c => <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Budget (€)</label>
            <input type="number" min="0" step="0.01" value={budget} onChange={e => setBudget(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="0.00" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Início</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Fim</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Público-alvo</label>
            <input value={targetAudience} onChange={e => setTargetAudience(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="ex: Proprietários nórdicos 35-60, imóveis Costa Tropical" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Descrição</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className="w-full rounded-md border px-3 py-2 text-sm resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border py-2.5 text-sm font-medium hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50">
              {saving ? 'A criar…' : 'Criar campanha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function MarketingPage() {
  const { fmt } = useCurrency()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/campaigns')
    if (res.ok) setCampaigns(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const totals = campaigns.reduce(
    (acc, c) => {
      acc.budget += c.budgetAllocated
      acc.spent  += c.budgetSpent
      acc.leads  += c._count?.leadAttributions ?? 0
      return acc
    },
    { budget: 0, spent: 0, leads: 0 },
  )

  const cpl = totals.leads > 0 ? totals.spent / totals.leads : null

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-navy-900" />
            Marketing
          </h1>
          <p className="text-sm text-gray-600 mt-1">Campanhas digitais e físicas · CAC por canal</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-navy-900 text-white px-4 py-2 text-sm hover:bg-navy-800"
        >
          <Plus className="h-4 w-4" />
          Nova campanha
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">Budget total</div>
          <div className="text-2xl font-bold text-navy-900 mt-1">{fmt(totals.budget)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">Gasto</div>
          <div className="text-2xl font-bold text-navy-900 mt-1">{fmt(totals.spent)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">Leads atribuídos</div>
          <div className="text-2xl font-bold text-navy-900 mt-1">{totals.leads}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">Custo por lead</div>
          <div className="text-2xl font-bold text-navy-900 mt-1">{cpl !== null ? fmt(cpl) : '—'}</div>
        </div>
      </div>

      {/* Campaigns table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Campanha</th>
              <th className="px-4 py-3">Canal</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3 text-right">Budget</th>
              <th className="px-4 py-3 text-right">Gasto</th>
              <th className="px-4 py-3 text-right">Leads</th>
              <th className="px-4 py-3 text-right">CPL</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="text-center py-8 text-gray-400">A carregar…</td></tr>}
            {!loading && campaigns.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center">
                  <Megaphone className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Sem campanhas. Cria a primeira.</p>
                </td>
              </tr>
            )}
            {campaigns.map(c => {
              const leads = c._count?.leadAttributions ?? 0
              const cplC = leads > 0 && c.budgetSpent > 0 ? c.budgetSpent / leads : null
              return (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-navy-900">{c.name}</div>
                    {c.targetAudience && <div className="text-xs text-gray-400">{c.targetAudience}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">{CHANNEL_LABELS[c.channel] ?? c.channel}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{fmt(c.budgetAllocated)}</td>
                  <td className="px-4 py-3 text-right">{fmt(c.budgetSpent)}</td>
                  <td className="px-4 py-3 text-right">{leads}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{cplC !== null ? fmt(cplC) : '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={load} />}
    </div>
  )
}
