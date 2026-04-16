'use client'

import { useEffect, useState } from 'react'
import { Megaphone, Plus, X, Pencil, Trash2, PlusCircle, QrCode, Copy, Check } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

type Campaign = {
  id: string
  name: string
  channel: string
  type: string
  status: 'PLANNING' | 'ACTIVE' | 'PAUSED' | 'COMPLETED'
  trackingCode: string | null
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
const STATUSES = ['PLANNING','ACTIVE','PAUSED','COMPLETED'] as const
const STATUS_LABELS: Record<string, string> = { PLANNING: 'Planning', ACTIVE: 'Active', PAUSED: 'Paused', COMPLETED: 'Completed' }
const STATUS_COLORS: Record<string, string> = {
  PLANNING:  'bg-gray-100 text-gray-600',
  ACTIVE:    'bg-green-100 text-green-700',
  PAUSED:    'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
}
const CHANNEL_LABELS: Record<string, string> = {
  GOOGLE_ADS: 'Google Ads', META: 'Meta/Instagram', LINKEDIN: 'LinkedIn',
  EMAIL: 'Email', SEO: 'SEO', CONTENT: 'Content',
  EVENT: 'Event', PRINT: 'Print', PARTNERSHIP: 'Partnership',
  SIGNAGE: 'Signage', REFERRAL: 'Referral', OTHER: 'Other',
}

const fmtEUR = (n: number) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

// ─── Create / Edit Modal ─────────────────────────────────────────────────────
function CampaignModal({
  campaign,
  onClose,
  onSaved,
}: {
  campaign: Campaign | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!campaign
  const [name, setName]                   = useState(campaign?.name ?? '')
  const [channel, setChannel]             = useState(campaign?.channel ?? 'META')
  const [type, setType]                   = useState(campaign?.type ?? 'DIGITAL')
  const [status, setStatus]               = useState<string>(campaign?.status ?? 'PLANNING')
  const [budget, setBudget]               = useState(campaign?.budgetAllocated.toString() ?? '')
  const [startDate, setStartDate]         = useState(campaign?.startDate?.slice(0, 10) ?? '')
  const [endDate, setEndDate]             = useState(campaign?.endDate?.slice(0, 10) ?? '')
  const [targetAudience, setTargetAudience] = useState(campaign?.targetAudience ?? '')
  const [description, setDescription]     = useState(campaign?.description ?? '')
  const [saving, setSaving]               = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const body = {
      name, channel, type, status,
      budgetAllocated: parseFloat(budget) || 0,
      startDate: startDate || null,
      endDate:   endDate   || null,
      targetAudience: targetAudience || null,
      description:    description    || null,
    }
    if (isEdit) {
      await fetch(`/api/campaigns/${campaign!.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    } else {
      await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-navy-900">{isEdit ? 'Edit campaign' : 'New campaign'}</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="e.g. Google Ads Spring 2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Channel</label>
              <select value={channel} onChange={e => setChannel(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
                {CHANNELS.map(c => <option key={c} value={c}>{CHANNEL_LABELS[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
                {TYPES.map(t => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
              </select>
            </div>
          </div>
          {isEdit && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Budget (€)</label>
            <input type="number" min="0" step="0.01" value={budget} onChange={e => setBudget(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm" placeholder="0" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Target audience</label>
            <input value={targetAudience} onChange={e => setTargetAudience(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="e.g. Nordic property owners 35–60, Costa Tropical" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              rows={2} className="w-full rounded-md border px-3 py-2 text-sm resize-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border py-2.5 text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Log Spend Modal ─────────────────────────────────────────────────────────
function SpendModal({ campaign, onClose, onSaved }: { campaign: Campaign; onClose: () => void; onSaved: () => void }) {
  const [amount, setAmount]           = useState('')
  const [date, setDate]               = useState(new Date().toISOString().slice(0, 10))
  const [description, setDescription] = useState('')
  const [saving, setSaving]           = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/campaigns/${campaign.id}/spend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: parseFloat(amount), date, description: description || null }),
    })
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-bold text-navy-900">Log spend</h2>
            <p className="text-xs text-gray-500 mt-0.5">{campaign.name}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Amount spent (€) *</label>
            <input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)}
              required className="w-full rounded-md border px-3 py-2 text-sm" placeholder="0.00" autoFocus />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
            <input value={description} onChange={e => setDescription(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="e.g. Google Ads — Apr 1–15" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border py-2.5 text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving || !amount}
              className="flex-1 rounded-lg bg-navy-900 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 disabled:opacity-50">
              {saving ? 'Saving…' : 'Log spend'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── QR Code Modal ───────────────────────────────────────────────────────────
function QrModal({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const url = `${baseUrl}/leads/new?ref=${campaign.trackingCode}`

  const copyUrl = () => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="text-lg font-bold text-navy-900">QR Code</h2>
            <p className="text-xs text-gray-500 mt-0.5">{campaign.name}</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          <div className="rounded-xl border p-3 bg-white shadow-sm">
            <QRCodeSVG value={url} size={200} level="M" includeMargin />
          </div>
          <div className="w-full">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Lead capture URL</p>
            <div className="flex items-center gap-2 rounded-lg border bg-gray-50 px-3 py-2">
              <span className="flex-1 text-xs text-gray-600 truncate font-mono">{url}</span>
              <button
                onClick={copyUrl}
                className="shrink-0 text-gray-400 hover:text-gray-700 transition-colors"
                title="Copy URL"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
          <p className="text-[10px] text-gray-400 text-center">
            Scan to open lead form · Leads são atribuídos a esta campanha automaticamente
          </p>
          <button
            onClick={() => {
              const svg = document.querySelector('#qr-print-area svg') as SVGElement | null
              if (!svg) return
              const blob = new Blob([svg.outerHTML], { type: 'image/svg+xml' })
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = `qr-${campaign.trackingCode}.svg`
              a.click()
            }}
            className="w-full rounded-lg border py-2.5 text-sm font-medium hover:bg-gray-50"
          >
            Download SVG
          </button>
        </div>
        {/* Hidden element for download targeting */}
        <div id="qr-print-area" className="hidden">
          <QRCodeSVG value={url} size={400} level="H" includeMargin />
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function MarketingPage() {
  const [campaigns, setCampaigns]   = useState<Campaign[]>([])
  const [loading, setLoading]       = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing]       = useState<Campaign | null>(null)
  const [spending, setSpending]     = useState<Campaign | null>(null)
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [qrCampaign, setQrCampaign] = useState<Campaign | null>(null)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/campaigns')
    if (res.ok) setCampaigns(await res.json())
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const deleteCampaign = async (id: string) => {
    if (!confirm('Delete this campaign? This cannot be undone.')) return
    setDeleting(id)
    await fetch(`/api/campaigns/${id}`, { method: 'DELETE' })
    setDeleting(null)
    load()
  }

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
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold text-navy-900 flex items-center gap-2">
            <Megaphone className="h-7 w-7 text-navy-900" />
            Marketing
          </h1>
          <p className="text-sm text-gray-600 mt-1">Digital & physical campaigns · CPL per channel</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-1.5 rounded-md bg-navy-900 text-white px-4 py-2 text-sm hover:bg-navy-800"
        >
          <Plus className="h-4 w-4" />
          New campaign
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-gray-500 mb-1">Total budget</div>
          <div className="text-2xl font-bold text-navy-900">{fmtEUR(totals.budget)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-gray-500 mb-1">Spent</div>
          <div className="text-2xl font-bold text-navy-900">{fmtEUR(totals.spent)}</div>
          {totals.budget > 0 && (
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-navy-600 rounded-full"
                style={{ width: `${Math.min(100, (totals.spent / totals.budget) * 100)}%` }}
              />
            </div>
          )}
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-gray-500 mb-1">Attributed leads</div>
          <div className="text-2xl font-bold text-navy-900">{totals.leads}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase text-gray-500 mb-1">Cost per lead</div>
          <div className="text-2xl font-bold text-navy-900">{cpl !== null ? fmtEUR(cpl) : '—'}</div>
        </div>
      </div>

      {/* Campaigns table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Campaign</th>
              <th className="px-4 py-3">Channel</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Budget</th>
              <th className="px-4 py-3 text-right">Spent</th>
              <th className="px-4 py-3 text-right">Leads</th>
              <th className="px-4 py-3 text-right">CPL</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="text-center py-8 text-gray-400">Loading…</td></tr>}
            {!loading && campaigns.length === 0 && (
              <tr>
                <td colSpan={8} className="py-12 text-center">
                  <Megaphone className="h-8 w-8 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No campaigns yet. Create the first one.</p>
                </td>
              </tr>
            )}
            {campaigns.map(c => {
              const leads = c._count?.leadAttributions ?? 0
              const cplC  = leads > 0 && c.budgetSpent > 0 ? c.budgetSpent / leads : null
              const pctSpent = c.budgetAllocated > 0 ? Math.min(100, (c.budgetSpent / c.budgetAllocated) * 100) : 0
              return (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-navy-900">{c.name}</div>
                    {c.targetAudience && <div className="text-xs text-gray-400 truncate max-w-[200px]">{c.targetAudience}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs whitespace-nowrap">
                      {CHANNEL_LABELS[c.channel] ?? c.channel}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                      {STATUS_LABELS[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{fmtEUR(c.budgetAllocated)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="tabular-nums">{fmtEUR(c.budgetSpent)}</div>
                    {c.budgetAllocated > 0 && (
                      <div className="mt-1 h-1 w-16 ml-auto bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-navy-400 rounded-full" style={{ width: `${pctSpent}%` }} />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{leads}</td>
                  <td className="px-4 py-3 text-right text-gray-500 tabular-nums">
                    {cplC !== null ? fmtEUR(cplC) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      {c.trackingCode && (
                        <button
                          onClick={() => setQrCampaign(c)}
                          title="QR Code"
                          className="rounded p-1.5 text-amber-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
                        >
                          <QrCode className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => setSpending(c)}
                        title="Log spend"
                        className="rounded p-1.5 text-gray-400 hover:text-navy-700 hover:bg-gray-100 transition-colors"
                      >
                        <PlusCircle className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setEditing(c)}
                        title="Edit"
                        className="rounded p-1.5 text-gray-400 hover:text-navy-700 hover:bg-gray-100 transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => deleteCampaign(c.id)}
                        disabled={deleting === c.id}
                        title="Delete"
                        className="rounded p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {showCreate  && <CampaignModal campaign={null} onClose={() => setShowCreate(false)} onSaved={load} />}
      {editing     && <CampaignModal campaign={editing} onClose={() => setEditing(null)} onSaved={load} />}
      {spending    && <SpendModal campaign={spending} onClose={() => setSpending(null)} onSaved={load} />}
      {qrCampaign  && <QrModal campaign={qrCampaign} onClose={() => setQrCampaign(null)} />}
    </div>
  )
}
