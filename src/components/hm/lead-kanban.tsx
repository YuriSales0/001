"use client"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { Clock, Phone, Globe } from "lucide-react"

export type LeadStage =
  | "NEW_LEAD"
  | "FIRST_CONTACT"
  | "CALL_SCHEDULED"
  | "QUALIFIED"
  | "PROPOSAL_SENT"
  | "CONTRACT_SIGNED"
  | "ACTIVE_OWNER"

export interface Lead {
  id: string
  name: string
  nationality?: string
  propertyLocation?: string
  assignedAgent?: string
  stage: LeadStage
  language?: "EN" | "DE"
  daysInStage: number
  lastActivityDate?: string
  source?: string
}

const STAGES: { id: LeadStage; label: string; color: string }[] = [
  { id: "NEW_LEAD",        label: "New Lead",        color: "bg-hm-slate/10 border-hm-slate/30" },
  { id: "FIRST_CONTACT",  label: "First Contact",   color: "bg-hm-blue/10 border-hm-blue/30" },
  { id: "CALL_SCHEDULED", label: "Call Scheduled",  color: "bg-amber-50 border-amber-200" },
  { id: "QUALIFIED",      label: "Qualified",       color: "bg-hm-gold/10 border-hm-gold/30" },
  { id: "PROPOSAL_SENT",  label: "Proposal Sent",   color: "bg-purple-50 border-purple-200" },
  { id: "CONTRACT_SIGNED",label: "Contract Signed", color: "bg-hm-green/10 border-hm-green/30" },
  { id: "ACTIVE_OWNER",   label: "Active Owner",    color: "bg-hm-black/5 border-hm-black/20" },
]

const FLAGS: Record<string, string> = {
  GB:"🇬🇧", SE:"🇸🇪", NO:"🇳🇴", DK:"🇩🇰",
  NL:"🇳🇱", DE:"🇩🇪", FR:"🇫🇷", ES:"🇪🇸",
}

interface LeadKanbanProps {
  leads: Lead[]
  onStageChange?: (leadId: string, newStage: LeadStage) => void
  onLeadClick?: (lead: Lead) => void
  className?: string
}

export function LeadKanban({ leads, onStageChange, onLeadClick, className }: LeadKanbanProps) {
  const [items, setItems] = useState<Lead[]>(leads)
  const dragRef = useRef<string | null>(null)
  const [draggingOver, setDraggingOver] = useState<LeadStage | null>(null)

  const getByStage = (stage: LeadStage) => items.filter(l => l.stage === stage)

  const handleDrop = (stage: LeadStage) => {
    const id = dragRef.current
    if (!id) return
    setItems(prev => prev.map(l => l.id === id ? { ...l, stage } : l))
    onStageChange?.(id, stage)
    dragRef.current = null
    setDraggingOver(null)
  }

  return (
    <div className={cn("flex gap-3 overflow-x-auto pb-4", className)}>
      {STAGES.map(stage => {
        const stageLeads = getByStage(stage.id)
        const isDragTarget = draggingOver === stage.id
        return (
          <div
            key={stage.id}
            className={cn(
              "flex-shrink-0 w-64 rounded-hm border-2 transition-colors",
              stage.color,
              isDragTarget && "ring-2 ring-hm-gold ring-offset-1"
            )}
            onDragOver={e => { e.preventDefault(); setDraggingOver(stage.id) }}
            onDragLeave={() => setDraggingOver(null)}
            onDrop={() => handleDrop(stage.id)}
          >
            {/* Column header */}
            <div className="px-3 py-2.5 border-b border-hm-border/50 flex items-center justify-between">
              <span className="text-xs font-sans font-semibold uppercase tracking-wider text-hm-slate">
                {stage.label}
              </span>
              <span className="text-xs font-sans font-bold text-hm-slate/60 bg-hm-ivory rounded-full px-2 py-0.5">
                {stageLeads.length}
              </span>
            </div>

            {/* Cards */}
            <div className="p-2 space-y-2 min-h-[200px]">
              {stageLeads.map(lead => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={() => { dragRef.current = lead.id }}
                  onClick={() => onLeadClick?.(lead)}
                  className="rounded-lg bg-hm-ivory border border-hm-border p-3 cursor-pointer hover:border-hm-gold/50 hover:shadow-sm transition-all select-none"
                >
                  <div className="flex items-start justify-between gap-1 mb-2">
                    <div className="flex items-center gap-1.5">
                      {lead.nationality && (
                        <span className="text-sm">{FLAGS[lead.nationality] ?? "🌍"}</span>
                      )}
                      <span className="text-sm font-serif font-semibold text-hm-black truncate">
                        {lead.name}
                      </span>
                    </div>
                    {lead.language && (
                      <span className={cn(
                        "shrink-0 text-[10px] font-sans font-bold rounded px-1.5 py-0.5",
                        lead.language === "EN"
                          ? "bg-hm-blue/15 text-hm-blue"
                          : "bg-hm-red/10 text-hm-red"
                      )}>
                        {lead.language}
                      </span>
                    )}
                  </div>

                  {lead.propertyLocation && (
                    <div className="flex items-center gap-1 text-xs font-sans text-hm-slate/70 mb-1.5">
                      <Globe className="h-3 w-3" />
                      {lead.propertyLocation}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] font-sans text-hm-slate/60">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {lead.daysInStage}d in stage
                    </div>
                    {lead.assignedAgent && (
                      <span className="truncate ml-2">{lead.assignedAgent}</span>
                    )}
                  </div>
                </div>
              ))}

              {stageLeads.length === 0 && (
                <div className="text-center py-8 text-xs font-sans text-hm-slate/40">
                  Drop here
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
