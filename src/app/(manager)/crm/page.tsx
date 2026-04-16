"use client"

import { useEffect, useState, useRef } from "react"
import {
  Plus, X, Phone, Mail, Search, Clock, Copy, Check,
  Webhook, Code2, QrCode, MessageSquare, Zap, ChevronDown,
} from "lucide-react"

type LeadStage =
  | "NEW_LEAD" | "FIRST_CONTACT" | "CALL_SCHEDULED" | "QUALIFIED"
  | "PROPOSAL_SENT" | "CONTRACT_SIGNED" | "ACTIVE_OWNER"

type BantAnswers = {
  location?: string
  availability?: string
  authority?: string
  property?: string
  timeline?: string
}

type Lead = {
  id: string
  name: string
  email: string | null
  phone: string | null
  nationality?: string
  source: string
  status: LeadStage
  notes: string | null
  budget: number | null
  propertyType: string | null
  propertyAddress?: string
  language?: "EN" | "DE"
  followUpDate: string | null
  assignedManager: { id: string; name: string | null } | null
  score: number | null
  bantData: BantAnswers | null
  createdAt: string
  updatedAt?: string
  leadAttributions: { campaign: { id: string; name: string; channel: string } }[]
}

// ── BANT Scoring engine ──────────────────────────────────────────────────────

const BANT_QUESTIONS: {
  id: keyof BantAnswers
  label: string
  icon: string
  options: { value: string; label: string; pts: number }[]
}[] = [
  {
    id: "location",
    label: "Property location",
    icon: "📍",
    options: [
      { value: "in_zone",  label: "Costa Tropical — Motril to Nerja", pts: 20 },
      { value: "nearby",   label: "Málaga province, nearby area",     pts: 8  },
      { value: "unknown",  label: "Location not confirmed yet",        pts: 4  },
      { value: "outside",  label: "Outside our operating zone",        pts: 0  },
    ],
  },
  {
    id: "availability",
    label: "Annual availability",
    icon: "📅",
    options: [
      { value: "8plus",  label: "8+ months/year available",   pts: 20 },
      { value: "5to7",   label: "5–7 months/year",            pts: 14 },
      { value: "3to4",   label: "3–4 months/year",            pts: 8  },
      { value: "under3", label: "Less than 3 months/year",    pts: 2  },
    ],
  },
  {
    id: "authority",
    label: "Decision authority",
    icon: "👤",
    options: [
      { value: "sole_owner", label: "Direct sole owner",        pts: 20 },
      { value: "co_owner",   label: "Co-owner (joint decision)", pts: 14 },
      { value: "poa",        label: "Power of attorney",         pts: 10 },
      { value: "other",      label: "Tenant / third party",      pts: 0  },
    ],
  },
  {
    id: "property",
    label: "Property size",
    icon: "🏠",
    options: [
      { value: "3plus",  label: "3+ bedrooms (villa / large apt)", pts: 20 },
      { value: "2bed",   label: "2 bedrooms",                      pts: 15 },
      { value: "1bed",   label: "1 bedroom",                       pts: 8  },
      { value: "studio", label: "Studio / 0 bedrooms",             pts: 4  },
    ],
  },
  {
    id: "timeline",
    label: "Start timeline",
    icon: "⏱️",
    options: [
      { value: "now",    label: "Ready now — within 1 month",  pts: 20 },
      { value: "soon",   label: "1–3 months",                  pts: 14 },
      { value: "medium", label: "3–6 months",                  pts: 8  },
      { value: "long",   label: "6+ months or unsure",         pts: 3  },
    ],
  },
]

function calcScore(bant: BantAnswers): number {
  return BANT_QUESTIONS.reduce((sum, q) => {
    const ans = bant[q.id]
    const opt = q.options.find(o => o.value === ans)
    return sum + (opt?.pts ?? 0)
  }, 0)
}

function scoreBand(score: number): { label: string; color: string; bg: string; dot: string } {
  if (score >= 80) return { label: "Hot",  color: "text-red-700",    bg: "bg-red-50 border-red-200",    dot: "bg-red-500"    }
  if (score >= 60) return { label: "Warm", color: "text-orange-700", bg: "bg-orange-50 border-orange-200", dot: "bg-orange-400" }
  if (score >= 40) return { label: "Cool", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-200", dot: "bg-yellow-400" }
  return               { label: "Cold", color: "text-gray-500",    bg: "bg-gray-100 border-gray-200",   dot: "bg-gray-400"   }
}

function ScorePill({ score }: { score: number | null }) {
  if (score === null) return null
  const band = scoreBand(score)
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${band.bg} ${band.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${band.dot}`} />
      {score} · {band.label}
    </span>
  )
}

const STAGES: { id: LeadStage; label: string; color: string; header: string }[] = [
  { id: "NEW_LEAD",        label: "New Lead",        color: "border-gray-300",       header: "bg-gray-50" },
  { id: "FIRST_CONTACT",  label: "First Contact",   color: "border-blue-200",       header: "bg-blue-50" },
  { id: "CALL_SCHEDULED", label: "Call Scheduled",  color: "border-amber-200",      header: "bg-amber-50" },
  { id: "QUALIFIED",      label: "Qualified",       color: "border-gold-200",       header: "bg-yellow-50" },
  { id: "PROPOSAL_SENT",  label: "Proposal Sent",   color: "border-purple-200",     header: "bg-purple-50" },
  { id: "CONTRACT_SIGNED",label: "Contract Signed", color: "border-green-200",      header: "bg-green-50" },
  { id: "ACTIVE_OWNER",   label: "Active Owner",    color: "border-navy-200",       header: "bg-navy-50" },
]

const SOURCE_LABEL: Record<string, string> = {
  CADASTRO: "Registration", NEWSLETTER: "Newsletter", ONLINE: "Online",
  PHONE: "Phone", WHATSAPP: "WhatsApp", WEBSITE: "Website",
  EMAIL: "Email", REFERRAL: "Referral", OTHER: "Other",
}

const FLAGS: Record<string, string> = {
  GB:"🇬🇧", SE:"🇸🇪", NO:"🇳🇴", DK:"🇩🇰",
  NL:"🇳🇱", DE:"🇩🇪", FR:"🇫🇷", ES:"🇪🇸", FI:"🇫🇮",
}

const STATUS_TO_STAGE: Record<string, LeadStage> = {
  NEW: "NEW_LEAD", CONTACTED: "FIRST_CONTACT", QUALIFIED: "QUALIFIED",
  CONVERTED: "ACTIVE_OWNER", RETAINED: "ACTIVE_OWNER", LOST: "NEW_LEAD",
  REMARKETING: "NEW_LEAD",
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })

function daysAgo(s: string) {
  return Math.floor((Date.now() - new Date(s).getTime()) / 86_400_000)
}

export default function CRMPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQ, setSearchQ] = useState("")
  const [langFilter, setLangFilter] = useState<"ALL" | "EN" | "DE">("ALL")
  const [addOpen, setAddOpen] = useState(false)
  const [intOpen, setIntOpen] = useState(false)
  const dragRef = useRef<string | null>(null)
  const [draggingOver, setDraggingOver] = useState<LeadStage | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [campaigns, setCampaigns] = useState<{ id: string; name: string; channel: string }[]>([])
  const [attributing, setAttributing] = useState(false)
  const [attrCampaignId, setAttrCampaignId] = useState("")

  // Add lead form state
  const [form, setForm] = useState({
    name: "", email: "", phone: "", source: "WEBSITE", notes: "", language: "EN"
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    type ApiLead = Omit<Lead, "status" | "language" | "bantData" | "leadAttributions"> & {
      status: string
      language?: string
      nationality?: string | null
      bantData?: unknown
      leadAttributions?: Lead["leadAttributions"]
    }
    fetch("/api/leads")
      .then(r => r.ok ? r.json() : [])
      .then((data: ApiLead[]) => {
        const mapped: Lead[] = data.map(l => ({
          ...l,
          status: (STATUS_TO_STAGE[l.status] ?? "NEW_LEAD") as LeadStage,
          language: (l.language?.toUpperCase() === "DE" ? "DE" : "EN") as "EN" | "DE",
          nationality: l.nationality ?? undefined,
          score: l.score ?? null,
          bantData: (l.bantData as BantAnswers) ?? null,
          leadAttributions: l.leadAttributions ?? [],
        }))
        setLeads(mapped)
      })
      .finally(() => setLoading(false))
    fetch("/api/campaigns")
      .then(r => r.ok ? r.json() : [])
      .then(setCampaigns)
  }, [])

  const updateStage = async (leadId: string, stage: LeadStage) => {
    const reverseMap: Record<LeadStage, string> = {
      NEW_LEAD: "NEW", FIRST_CONTACT: "CONTACTED", CALL_SCHEDULED: "CONTACTED",
      QUALIFIED: "QUALIFIED", PROPOSAL_SENT: "QUALIFIED",
      CONTRACT_SIGNED: "CONVERTED", ACTIVE_OWNER: "RETAINED",
    }
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: stage } : l))
    await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: reverseMap[stage] }),
    })
  }

  const addAttribution = async (leadId: string, campaignId: string) => {
    const res = await fetch(`/api/leads/${leadId}/attribution`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId }),
    })
    if (!res.ok) return
    const attr = await res.json()
    const update = (l: Lead) => l.id === leadId
      ? { ...l, leadAttributions: [...l.leadAttributions.filter(a => a.campaign.id !== campaignId), { campaign: attr.campaign }] }
      : l
    setLeads(prev => prev.map(update))
    setSelectedLead(l => l ? update(l) : l)
    setAttrCampaignId("")
    setAttributing(false)
  }

  const removeAttribution = async (leadId: string, campaignId: string) => {
    await fetch(`/api/leads/${leadId}/attribution?campaignId=${campaignId}`, { method: "DELETE" })
    const update = (l: Lead) => l.id === leadId
      ? { ...l, leadAttributions: l.leadAttributions.filter(a => a.campaign.id !== campaignId) }
      : l
    setLeads(prev => prev.map(update))
    setSelectedLead(l => l ? update(l) : l)
  }

  const saveLead = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        source: form.source,
        notes: form.notes || undefined,
        language: form.language,
      }),
    })
    if (res.ok) {
      const newLead = await res.json()
      setLeads(prev => [{
        ...newLead,
        status: "NEW_LEAD" as LeadStage,
        language: (newLead.language?.toUpperCase() === "DE" ? "DE" : "EN") as "EN" | "DE",
      }, ...prev])
      setForm({ name: "", email: "", phone: "", source: "WEBSITE", notes: "", language: "EN" })
      setAddOpen(false)
    }
    setSaving(false)
  }

  const filtered = leads.filter(l => {
    const q = searchQ.toLowerCase()
    if (q && !l.name.toLowerCase().includes(q) && !l.email?.toLowerCase().includes(q)) return false
    if (langFilter !== "ALL" && l.language !== langFilter) return false
    return true
  })

  const byStage = (stage: LeadStage) => filtered.filter(l => l.status === stage)

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Page header */}
      <div className="px-6 py-4 border-b bg-white flex items-center justify-between gap-4 flex-wrap shrink-0">
        <div>
          <h1 className="text-xl font-bold text-navy-900">CRM Pipeline</h1>
          <p className="text-xs text-gray-500 mt-0.5">{leads.length} total leads</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search leads…"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              className="pl-8 pr-3 py-2 text-sm border rounded-lg w-48 focus:outline-none focus:ring-1 focus:ring-navy-400"
            />
          </div>

          {/* Language filter */}
          <div className="flex rounded-lg border overflow-hidden text-sm">
            {(["ALL", "EN", "DE"] as const).map(lang => (
              <button
                key={lang}
                onClick={() => setLangFilter(lang)}
                className={`px-3 py-2 font-medium transition-colors ${
                  langFilter === lang
                    ? "bg-navy-900 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                {lang === "ALL" ? "All" : lang === "EN" ? "🇬🇧 EN" : "🇩🇪 DE"}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIntOpen(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Zap className="h-4 w-4 text-amber-500" />
            Integrations
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-navy-900 text-white px-4 py-2 text-sm font-semibold hover:bg-navy-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add lead
          </button>
        </div>
      </div>

      {/* Integrations modal */}
      {intOpen && <IntegrationsModal onClose={() => setIntOpen(false)} />}

      {/* Add lead modal */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl p-6 m-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-navy-900">New Lead</h2>
              <button onClick={() => setAddOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Full name *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-navy-400"
                  placeholder="John Smith"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-navy-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-navy-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Source</label>
                  <select
                    value={form.source}
                    onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-navy-400"
                  >
                    {Object.entries(SOURCE_LABEL).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Language</label>
                  <select
                    value={form.language}
                    onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-navy-400"
                  >
                    <option value="EN">🇬🇧 English</option>
                    <option value="DE">🇩🇪 Deutsch</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-navy-400"
                  placeholder="Initial notes…"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setAddOpen(false)}
                className="px-4 py-2 rounded-lg border text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveLead}
                disabled={saving || !form.name.trim()}
                className="px-4 py-2 rounded-lg bg-navy-900 text-white text-sm font-semibold hover:bg-navy-800 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save lead"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lead detail panel */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30">
          <div className="w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {selectedLead.nationality && (
                  <span className="text-xl">{FLAGS[selectedLead.nationality] ?? "🌍"}</span>
                )}
                <h2 className="font-bold text-navy-900">{selectedLead.name}</h2>
                {selectedLead.language && (
                  <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${
                    selectedLead.language === "EN" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                  }`}>
                    {selectedLead.language}
                  </span>
                )}
              </div>
              <button onClick={() => setSelectedLead(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Contact */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Contact</h3>
                <div className="space-y-2">
                  {selectedLead.email && (
                    <a href={`mailto:${selectedLead.email}`} className="flex items-center gap-2 text-sm text-navy-700 hover:underline">
                      <Mail className="h-4 w-4 text-gray-400" />
                      {selectedLead.email}
                    </a>
                  )}
                  {selectedLead.phone && (
                    <a href={`tel:${selectedLead.phone}`} className="flex items-center gap-2 text-sm text-navy-700 hover:underline">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {selectedLead.phone}
                    </a>
                  )}
                </div>
              </div>

              {/* Stage */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Move to stage</h3>
                <div className="grid grid-cols-2 gap-1.5">
                  {STAGES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => {
                        updateStage(selectedLead.id, s.id)
                        setSelectedLead(l => l ? { ...l, status: s.id } : l)
                      }}
                      className={`rounded-lg border px-3 py-2 text-xs font-medium text-left transition-colors ${
                        selectedLead.status === s.id
                          ? "bg-navy-900 text-white border-navy-900"
                          : "border-gray-200 text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* BANT Qualification */}
              <BantPanel lead={selectedLead} onUpdate={updated => {
                setLeads(prev => prev.map(l => l.id === updated.id ? { ...l, ...updated } : l))
                setSelectedLead(l => l ? { ...l, ...updated } : l)
              }} />

              {/* Notes */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Notes</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedLead.notes || <span className="text-gray-400 italic">No notes yet</span>}
                </p>
              </div>

              {/* Campaign attribution */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Campaign attribution</h3>
                <div className="space-y-1.5">
                  {selectedLead.leadAttributions.length === 0 && !attributing && (
                    <p className="text-xs text-gray-400 italic">No campaign attributed yet.</p>
                  )}
                  {selectedLead.leadAttributions.map(a => (
                    <div key={a.campaign.id} className="flex items-center justify-between rounded-lg bg-gray-50 border px-3 py-2">
                      <span className="text-xs font-medium text-navy-900">{a.campaign.name}</span>
                      <button
                        onClick={() => removeAttribution(selectedLead.id, a.campaign.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors ml-2"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {attributing ? (
                    <div className="flex gap-2">
                      <select
                        value={attrCampaignId}
                        onChange={e => setAttrCampaignId(e.target.value)}
                        className="flex-1 rounded-lg border px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-navy-300"
                      >
                        <option value="">Select campaign…</option>
                        {campaigns
                          .filter(c => !selectedLead.leadAttributions.some(a => a.campaign.id === c.id))
                          .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                        }
                      </select>
                      <button
                        onClick={() => attrCampaignId && addAttribution(selectedLead.id, attrCampaignId)}
                        disabled={!attrCampaignId}
                        className="rounded-lg bg-navy-900 text-white px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                      >
                        Add
                      </button>
                      <button onClick={() => setAttributing(false)} className="text-gray-400 hover:text-gray-600 px-1">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    campaigns.length > 0 && (
                      <button
                        onClick={() => setAttributing(true)}
                        className="text-xs text-navy-600 hover:underline"
                      >
                        + Attribute to campaign
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Source + dates */}
              <div className="text-xs text-gray-400 space-y-1 pt-2 border-t">
                <div>Source: {SOURCE_LABEL[selectedLead.source] ?? selectedLead.source}</div>
                <div>Added: {fmtDate(selectedLead.createdAt)}</div>
                {selectedLead.followUpDate && (
                  <div>Follow-up: {fmtDate(selectedLead.followUpDate)}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Kanban board */}
      <div className="flex-1 overflow-x-auto">
        <div className="flex gap-3 p-4 h-full" style={{ minWidth: 'max-content' }}>
          {STAGES.map(stage => {
            const stageLeads = byStage(stage.id)
            const isDragTarget = draggingOver === stage.id
            return (
              <div
                key={stage.id}
                className={`flex flex-col w-60 rounded-xl border-2 bg-white flex-shrink-0 transition-all ${stage.color} ${
                  isDragTarget ? "ring-2 ring-gold-400 ring-offset-1 scale-[1.01]" : ""
                }`}
                onDragOver={e => { e.preventDefault(); setDraggingOver(stage.id) }}
                onDragLeave={() => setDraggingOver(null)}
                onDrop={() => {
                  const id = dragRef.current
                  if (id) updateStage(id, stage.id)
                  dragRef.current = null
                  setDraggingOver(null)
                }}
              >
                {/* Column header */}
                <div className={`px-3 py-2.5 rounded-t-xl border-b ${stage.header} flex items-center justify-between`}>
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-600">
                    {stage.label}
                  </span>
                  <span className="text-xs font-bold bg-white text-gray-500 rounded-full px-2 py-0.5 border">
                    {stageLeads.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                  {loading && (
                    <div className="space-y-2 pt-1">
                      <div className="h-20 rounded-lg bg-gray-100 animate-pulse" />
                      <div className="h-16 rounded-lg bg-gray-100 animate-pulse" />
                    </div>
                  )}
                  {stageLeads.map(lead => (
                    <div
                      key={lead.id}
                      draggable
                      onDragStart={() => { dragRef.current = lead.id }}
                      onClick={() => setSelectedLead(lead)}
                      className="rounded-lg border border-gray-200 bg-white p-3 cursor-pointer hover:border-navy-300 hover:shadow-sm transition-all select-none"
                    >
                      <div className="flex items-start justify-between gap-1 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {lead.nationality && (
                            <span className="text-sm shrink-0">{FLAGS[lead.nationality] ?? "🌍"}</span>
                          )}
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {lead.name}
                          </span>
                        </div>
                        {lead.language && (
                          <span className={`shrink-0 text-[10px] font-bold rounded px-1.5 py-0.5 ${
                            lead.language === "EN" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                          }`}>
                            {lead.language}
                          </span>
                        )}
                      </div>

                      {lead.email && (
                        <div className="flex items-center gap-1 text-[11px] text-gray-400 mb-1 truncate">
                          <Mail className="h-3 w-3 shrink-0" />
                          {lead.email}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1.5">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {daysAgo(lead.createdAt)}d ago
                        </div>
                        <span className="text-[10px] bg-gray-100 text-gray-500 rounded px-1.5 py-0.5">
                          {SOURCE_LABEL[lead.source] ?? lead.source}
                        </span>
                      </div>
                      {lead.score !== null && (
                        <div className="mt-2">
                          <ScorePill score={lead.score} />
                        </div>
                      )}
                    </div>
                  ))}

                  {!loading && stageLeads.length === 0 && (
                    <div className="text-center py-8 text-xs text-gray-300">Drop here</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── BANT Panel ────────────────────────────────────────────────────────────────

function BantPanel({ lead, onUpdate }: {
  lead: Lead
  onUpdate: (updated: Partial<Lead>) => void
}) {
  const [answers, setAnswers] = useState<BantAnswers>(lead.bantData ?? {})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Sync if lead changes (e.g. navigating between leads)
  useEffect(() => { setAnswers(lead.bantData ?? {}); setSaved(false) }, [lead.id, lead.bantData])

  const answeredCount = BANT_QUESTIONS.filter(q => answers[q.id]).length
  const currentScore = answeredCount > 0 ? calcScore(answers) : null

  const handleAnswer = (qid: keyof BantAnswers, value: string) => {
    setAnswers(prev => ({ ...prev, [qid]: value }))
    setSaved(false)
  }

  const save = async () => {
    if (answeredCount === 0) return
    setSaving(true)
    const score = calcScore(answers)
    try {
      const res = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, bantData: answers }),
      })
      if (!res.ok) throw new Error(await res.text())
      setSaved(true)
      onUpdate({ id: lead.id, score, bantData: answers })
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      console.error("Failed to save score:", e)
      alert("Failed to save — check console")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs uppercase tracking-wider text-gray-400">Lead Qualification</h3>
        {currentScore !== null && (
          <ScorePill score={currentScore} />
        )}
      </div>

      {/* Score bar */}
      {currentScore !== null && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>{answeredCount}/{BANT_QUESTIONS.length} answered</span>
            <span className="font-semibold">{currentScore}/100</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                currentScore >= 80 ? "bg-red-500" :
                currentScore >= 60 ? "bg-orange-400" :
                currentScore >= 40 ? "bg-yellow-400" : "bg-gray-300"
              }`}
              style={{ width: `${currentScore}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-4">
        {BANT_QUESTIONS.map(q => (
          <div key={q.id}>
            <p className="text-xs font-medium text-gray-600 mb-1.5">
              <span className="mr-1">{q.icon}</span>{q.label}
            </p>
            <div className="grid grid-cols-1 gap-1">
              {q.options.map(opt => {
                const selected = answers[q.id] === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => handleAnswer(q.id, opt.value)}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs text-left transition-all ${
                      selected
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-200 text-gray-600 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                  >
                    <span>{opt.label}</span>
                    <span className={`font-bold shrink-0 ml-2 ${selected ? "text-yellow-400" : "text-gray-300"}`}>
                      +{opt.pts}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={save}
          disabled={saving || answeredCount === 0}
          className="flex-1 rounded-lg bg-gray-900 text-white py-2 text-sm font-semibold hover:bg-gray-700 disabled:opacity-40 transition-colors"
        >
          {saving ? "Saving…" : saved ? "✓ Score saved" : "Save qualification"}
        </button>
        {answers && Object.keys(answers).length > 0 && (
          <button
            onClick={() => { setAnswers({}); setSaved(false) }}
            className="rounded-lg border px-3 py-2 text-xs text-gray-500 hover:bg-gray-50"
            title="Clear answers"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  )
}

// ── Integrations Modal ────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="flex items-center gap-1 rounded px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 transition-colors shrink-0"
    >
      {copied ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 text-gray-500" />}
      {copied ? "Copied" : "Copy"}
    </button>
  )
}

function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative rounded-lg bg-gray-900 p-3 text-xs text-gray-100 font-mono overflow-x-auto">
      <div className="absolute top-2 right-2"><CopyButton text={code} /></div>
      <pre className="pr-16 whitespace-pre-wrap break-all">{code}</pre>
    </div>
  )
}

function IntegrationsModal({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState<string | null>("webhook")
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://your-domain.com"
  const webhookUrl = `${baseUrl}/api/leads/public`
  const token = process.env.NEXT_PUBLIC_INTEGRATION_SECRET ?? "YOUR_TOKEN"

  const embedForm = `<!-- HostMasters Lead Form -->
<form id="hm-lead-form">
  <input name="name" placeholder="Your name" required />
  <input name="email" type="email" placeholder="Email" />
  <input name="phone" placeholder="Phone" />
  <button type="submit">Request info</button>
</form>
<script>
document.getElementById('hm-lead-form').addEventListener('submit', async e => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(e.target));
  await fetch('${webhookUrl}', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, source: 'WEBSITE' })
  });
  e.target.innerHTML = '<p>Thank you! We will contact you shortly.</p>';
});
</script>`

  const metaWebhook = `{
  "object": "page",
  "entry": [{
    "changes": [{
      "value": {
        "leadgen_id": "{{lead.id}}",
        "field_data": [
          { "name": "full_name", "values": ["{{lead.full_name}}"] },
          { "name": "email", "values": ["{{lead.email}}"] },
          { "name": "phone_number", "values": ["{{lead.phone}}"] }
        ]
      }
    }]
  }]
}`

  const zapierBody = `{
  "name": "{{Full Name}}",
  "email": "{{Email}}",
  "phone": "{{Phone}}",
  "source": "ONLINE",
  "language": "EN",
  "notes": "Via Zapier / Make"
}`

  const sections = [
    {
      id: "webhook",
      icon: Webhook,
      title: "API Webhook",
      desc: "POST leads directly from any tool",
      content: (
        <div className="space-y-3">
          <p className="text-xs text-gray-600">Send a POST request to this URL to create a lead:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-gray-100 rounded px-2 py-1.5 truncate">{webhookUrl}</code>
            <CopyButton text={webhookUrl} />
          </div>
          <p className="text-xs font-semibold text-gray-700 mt-2">Payload (JSON)</p>
          <CodeBlock code={`POST ${webhookUrl}
Content-Type: application/json
x-integration-token: ${token}

{
  "name": "John Smith",       // required
  "email": "john@example.com",
  "phone": "+34 600 000 000",
  "source": "ONLINE",         // ONLINE | REFERRAL | WHATSAPP | ...
  "language": "EN",           // EN | DE
  "notes": "Interested in 3-bed villa"
}`} />
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            Set <code className="font-mono">INTEGRATION_SECRET</code> in your Vercel environment variables to secure the endpoint.
          </div>
        </div>
      ),
    },
    {
      id: "embed",
      icon: Code2,
      title: "Website Embed",
      desc: "Drop a lead form on any website",
      content: (
        <div className="space-y-3">
          <p className="text-xs text-gray-600">Copy and paste this snippet into any HTML page:</p>
          <CodeBlock code={embedForm} />
          <p className="text-xs text-gray-500">The form submits directly to HostMasters. Customize the fields and styling to match your brand.</p>
        </div>
      ),
    },
    {
      id: "meta",
      icon: QrCode,
      title: "Meta Lead Ads",
      desc: "Facebook / Instagram lead forms",
      content: (
        <div className="space-y-3">
          <div className="text-xs text-gray-600 space-y-2">
            <p><strong>Step 1:</strong> In Meta Business Manager → Leads Center → Integrations → CRM Integration</p>
            <p><strong>Step 2:</strong> Choose "Webhook" as connection type</p>
            <p><strong>Step 3:</strong> Enter the webhook URL:</p>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-gray-100 rounded px-2 py-1.5 truncate">{webhookUrl}</code>
            <CopyButton text={webhookUrl} />
          </div>
          <p className="text-xs text-gray-600"><strong>Step 4:</strong> Verification token (for GET challenge):</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-gray-100 rounded px-2 py-1.5">hostmasters</code>
            <CopyButton text="hostmasters" />
          </div>
          <p className="text-xs font-semibold text-gray-700 mt-2">Expected payload from Meta:</p>
          <CodeBlock code={metaWebhook} />
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-800">
            Meta sends the lead data in a different format. Use a middleware (Zapier/Make) to map the fields to HostMasters format if needed.
          </div>
        </div>
      ),
    },
    {
      id: "whatsapp",
      icon: MessageSquare,
      title: "WhatsApp",
      desc: "Click-to-chat lead capture",
      content: (
        <div className="space-y-3">
          <p className="text-xs text-gray-600">Add a WhatsApp click-to-chat button to your website or ads. When a prospect messages you, manually create the lead in the CRM.</p>
          <p className="text-xs font-semibold text-gray-700">Generate a click-to-chat link:</p>
          <CodeBlock code={`https://wa.me/34XXXXXXXXX?text=Hi%20HostMasters%2C%20I%27m%20interested%20in%20property%20management`} />
          <p className="text-xs text-gray-600"><strong>Tip:</strong> Add UTM parameters to your ad links to track which campaign generated the lead, then note it in the lead source.</p>
          <p className="text-xs font-semibold text-gray-700 mt-2">HTML button:</p>
          <CodeBlock code={`<a href="https://wa.me/34XXXXXXXXX?text=Hi%20HostMasters" 
   target="_blank"
   style="background:#25D366;color:white;padding:12px 24px;border-radius:8px;text-decoration:none">
  💬 Chat on WhatsApp
</a>`} />
        </div>
      ),
    },
    {
      id: "zapier",
      icon: Zap,
      title: "Zapier / Make",
      desc: "Automate from any source",
      content: (
        <div className="space-y-3">
          <p className="text-xs text-gray-600">Use Zapier or Make (formerly Integromat) to push leads from any source — Google Forms, Typeform, Mailchimp, HubSpot, etc.</p>
          <p className="text-xs font-semibold text-gray-700">Action: HTTP POST to</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-gray-100 rounded px-2 py-1.5 truncate">{webhookUrl}</code>
            <CopyButton text={webhookUrl} />
          </div>
          <p className="text-xs font-semibold text-gray-700">Body template:</p>
          <CodeBlock code={zapierBody} />
          <p className="text-xs text-gray-500">Map the fields from your trigger (e.g. Google Form fields) to the JSON keys above.</p>
        </div>
      ),
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/40" onClick={onClose}>
      <div
        className="w-full max-w-lg h-full bg-white shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div>
            <h2 className="font-bold text-navy-900">Lead Integrations</h2>
            <p className="text-xs text-gray-500 mt-0.5">Capture leads from digital marketing channels</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sections */}
        <div className="flex-1 overflow-y-auto divide-y">
          {sections.map(sec => {
            const Icon = sec.icon
            const isOpen = open === sec.id
            return (
              <div key={sec.id}>
                <button
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-left"
                  onClick={() => setOpen(isOpen ? null : sec.id)}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 shrink-0">
                    <Icon className="h-4 w-4 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy-900">{sec.title}</p>
                    <p className="text-xs text-gray-500">{sec.desc}</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 bg-gray-50 border-t">
                    <div className="pt-4">{sec.content}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
