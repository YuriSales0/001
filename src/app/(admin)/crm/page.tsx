"use client"

import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import {
  Plus, X, Phone, Mail, Globe, MessageCircle, Share2, Tag, Search,
  Filter, Clock, ChevronRight, Newspaper, UserPlus,
} from "lucide-react"

type LeadStage =
  | "NEW_LEAD" | "FIRST_CONTACT" | "CALL_SCHEDULED" | "QUALIFIED"
  | "PROPOSAL_SENT" | "CONTRACT_SIGNED" | "ACTIVE_OWNER"

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
  createdAt: string
  updatedAt?: string
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
  const dragRef = useRef<string | null>(null)
  const [draggingOver, setDraggingOver] = useState<LeadStage | null>(null)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)

  // Add lead form state
  const [form, setForm] = useState({
    name: "", email: "", phone: "", source: "WEBSITE", notes: "", language: "EN"
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/leads")
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => {
        const mapped: Lead[] = data.map(l => ({
          ...l,
          status: (STATUS_TO_STAGE[l.status] ?? "NEW_LEAD") as LeadStage,
          language: (l.language?.toUpperCase() === "DE" ? "DE" : "EN") as "EN" | "DE",
          nationality: l.nationality ?? undefined,
        }))
        setLeads(mapped)
      })
      .finally(() => setLoading(false))
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
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-navy-900 text-white px-4 py-2 text-sm font-semibold hover:bg-navy-800 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add lead
          </button>
        </div>
      </div>

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

              {/* BANT */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">BANT Qualification</h3>
                <div className="space-y-2">
                  {[
                    "Property in Costa Tropical (Motril–Nerja)?",
                    "Available more than 5 months/year?",
                    "Direct owner or power of attorney?",
                    "Motivated to rent?",
                  ].map(q => (
                    <label key={q} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input type="checkbox" className="rounded" />
                      {q}
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Notes</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedLead.notes || <span className="text-gray-400 italic">No notes yet</span>}
                </p>
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
