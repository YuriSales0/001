"use client"

import { useEffect, useState } from "react"
import {
  CheckSquare, Square, AlertTriangle, FileText, Plus, X,
  ChevronDown, ChevronUp, Wrench, Image as ImageIcon, Trash2,
} from "lucide-react"

// ── Types ─────────────────────────────────────────────────────────────────────
type TaskStatus = "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED"

interface Task {
  id: string
  title: string
  type: string
  status: TaskStatus
  dueDate: string
  description: string | null
  notes: string | null
  property: { id: string; name: string }
  assignee: { id: string; name: string | null } | null
}

interface Property {
  id: string; name: string
}

interface ChecklistItemDef {
  id: string
  label: string
  category: string
}

type ChecklistState = Record<string, { checked: boolean; anomaly: boolean; note: string }>

// ── Default checklist (fallback) ──────────────────────────────────────────────
const DEFAULT_SECTIONS = [
  {
    section: "Exterior",
    items: [
      { id: "facade",  label: "Fachada e portão de entrada" },
      { id: "pool",    label: "Piscina (pH, nível de água, limpeza)" },
      { id: "garden",  label: "Jardim / terraço / varanda" },
      { id: "mailbox", label: "Caixa de correio e área de entrada" },
    ],
  },
  {
    section: "Interior",
    items: [
      { id: "humidity",   label: "Humidade e bolor — quartos e casas de banho" },
      { id: "aircon",     label: "Ar condicionado — funcionamento e filtros" },
      { id: "plumbing",   label: "Canalização — água quente/fria, autoclismo" },
      { id: "appliances", label: "Electrodomésticos — frigorífico, forno, máquina de lavar" },
      { id: "nuki",       label: "Fechadura Nuki — bateria e acesso remoto" },
      { id: "wifi",       label: "WiFi e router — ligação activa" },
      { id: "windows",    label: "Janelas, estores e portadas" },
      { id: "alarm",      label: "Alarme de segurança (se existir)" },
    ],
  },
]

function buildSections(customItems: ChecklistItemDef[]) {
  if (customItems.length === 0) return DEFAULT_SECTIONS
  const grouped: Record<string, ChecklistItemDef[]> = {}
  for (const item of customItems) {
    if (!grouped[item.category]) grouped[item.category] = []
    grouped[item.category].push(item)
  }
  return Object.entries(grouped).map(([cat, items]) => ({
    section: cat.charAt(0).toUpperCase() + cat.slice(1),
    items: items.map(i => ({ id: i.id, label: i.label })),
  }))
}

function freshChecklist(sections: ReturnType<typeof buildSections>): ChecklistState {
  const r: ChecklistState = {}
  for (const sec of sections) for (const item of sec.items) r[item.id] = { checked: false, anomaly: false, note: "" }
  return r
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  MAINTENANCE_PREVENTIVE: "bg-blue-100 text-blue-700",
  MAINTENANCE_CORRECTIVE: "bg-red-100 text-red-700",
}
const STATUS_COLOR: Record<string, string> = {
  PENDING:    "bg-gray-100 text-gray-600",
  IN_PROGRESS:"bg-amber-100 text-amber-700",
  COMPLETED:  "bg-green-100 text-green-700",
  CANCELLED:  "bg-red-100 text-red-600",
}
const fmt = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

const CORRECTIVE_ACTIONS = [
  { value: "repaired",       label: "Reparado pelo técnico" },
  { value: "specialist",     label: "Especialista contactado" },
  { value: "temporary_fix",  label: "Solução temporária aplicada" },
  { value: "pending_parts",  label: "Aguarda peças / material" },
  { value: "no_action",      label: "Sem acção necessária" },
]

// ── Create Task Modal ─────────────────────────────────────────────────────────
function CreateModal({ properties, onClose, onCreated }: { properties: Property[]; onClose: ()=>void; onCreated: ()=>void }) {
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? '')
  const [type, setType]             = useState('MAINTENANCE_PREVENTIVE')
  const [title, setTitle]           = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate]       = useState(new Date().toISOString().slice(0, 10))
  const [assigneeId, setAssigneeId] = useState('')
  const [crew, setCrew]             = useState<{ id: string; name: string | null; email: string }[]>([])
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    fetch('/api/users?role=CREW').then(r => r.ok ? r.json() : []).then(setCrew)
  }, [])

  const submit = async () => {
    if (!propertyId || !title || !dueDate) return
    setSaving(true)
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ propertyId, type, title, description, dueDate: new Date(dueDate).toISOString(), assigneeId: assigneeId || undefined }),
    })
    setSaving(false)
    onCreated()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-bold">Nova visita de manutenção</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-2 hover:bg-gray-100"><X className="h-4 w-4"/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Tipo</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold">
                <option value="MAINTENANCE_PREVENTIVE">Preventiva</option>
                <option value="MAINTENANCE_CORRECTIVE">Correctiva</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Data</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Propriedade</label>
            <select value={propertyId} onChange={e => setPropertyId(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold">
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Técnico responsável</label>
            <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold">
              <option value="">— Atribuir automaticamente —</option>
              {crew.map(c => <option key={c.id} value={c.id}>{c.name || c.email}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Título / motivo</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder={type === 'MAINTENANCE_CORRECTIVE' ? 'Ex: Torneira da cozinha com fuga' : 'Ex: Revisão trimestral — ar condicionado'}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Descrição (opcional)</label>
            <textarea rows={2} value={description} onChange={e => setDescription(e.target.value)}
              placeholder={type === 'MAINTENANCE_CORRECTIVE' ? 'Descreve o problema reportado…' : 'Instruções especiais para o técnico…'}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold resize-none"/>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="flex-1 rounded-lg border py-2.5 text-sm hover:bg-gray-50">Cancelar</button>
          <button onClick={submit} disabled={saving || !title || !propertyId}
            className="flex-1 rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">
            {saving ? 'A criar…' : 'Criar visita'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Corrective Report Panel ───────────────────────────────────────────────────
function CorrectivePanel({ task, onSubmitted }: { task: Task; onSubmitted: () => void }) {
  const isComplete = task.status === 'COMPLETED'

  // Parse existing report if completed
  const existing = (() => {
    if (!task.notes) return null
    try { const p = JSON.parse(task.notes); return p?.type === 'corrective' ? p : null } catch { return null }
  })()

  const [problem, setProblem]             = useState(existing?.problem ?? task.description ?? '')
  const [rootCause, setRootCause]         = useState(existing?.rootCause ?? '')
  const [actionTaken, setActionTaken]     = useState(existing?.actionTaken ?? 'repaired')
  const [specialistName, setSpecialistName] = useState(existing?.specialistName ?? '')
  const [cost, setCost]                   = useState(existing?.cost?.toString() ?? '0')
  const [resolved, setResolved]           = useState(existing?.resolved ?? true)
  const [photoUrls, setPhotoUrls]         = useState<string[]>(existing?.photoUrls ?? [''])
  const [submitting, setSubmitting]       = useState(false)
  const [submitted, setSubmitted]         = useState(isComplete)

  const addPhotoField = () => setPhotoUrls(p => [...p, ''])
  const removePhotoField = (i: number) => setPhotoUrls(p => p.filter((_, idx) => idx !== i))
  const setPhotoUrl = (i: number, val: string) => setPhotoUrls(p => p.map((u, idx) => idx === i ? val : u))

  const submit = async () => {
    if (!problem.trim()) return
    setSubmitting(true)
    const report = {
      type: 'corrective',
      problem: problem.trim(),
      rootCause: rootCause.trim() || null,
      actionTaken,
      specialistName: actionTaken === 'specialist' ? (specialistName.trim() || null) : null,
      cost: parseFloat(cost) || 0,
      resolved,
      photoUrls: photoUrls.filter(u => u.trim()),
      submittedAt: new Date().toISOString(),
    }
    await fetch(`/api/tasks/${task.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED', notes: JSON.stringify(report) }),
    })
    setSubmitting(false)
    setSubmitted(true)
    onSubmitted()
  }

  if (submitted && existing) {
    return (
      <div className="space-y-4">
        <div className="rounded-hm border border-green-200 bg-green-50 px-4 py-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-green-600 shrink-0"/>
          <span className="text-sm text-green-700 font-semibold">Relatório corretivo submetido</span>
        </div>
        <div className="rounded-hm border bg-white p-4 space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Problema</p>
            <p className="text-sm text-gray-800">{existing.problem}</p>
          </div>
          {existing.rootCause && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Causa raiz</p>
              <p className="text-sm text-gray-800">{existing.rootCause}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Acção tomada</p>
            <p className="text-sm text-gray-800">{CORRECTIVE_ACTIONS.find(a => a.value === existing.actionTaken)?.label ?? existing.actionTaken}</p>
            {existing.specialistName && <p className="text-xs text-gray-500">Especialista: {existing.specialistName}</p>}
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Custo</p>
              <p className="text-sm text-gray-800">€{existing.cost ?? 0}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Resolvido</p>
              <p className={`text-sm font-semibold ${existing.resolved ? 'text-green-600' : 'text-amber-600'}`}>
                {existing.resolved ? 'Sim' : 'Não — pendente'}
              </p>
            </div>
          </div>
          {existing.photoUrls?.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Fotos</p>
              <div className="grid grid-cols-3 gap-2">
                {existing.photoUrls.map((url: string, i: number) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                     className="block rounded-lg overflow-hidden border aspect-video bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Foto ${i+1}`} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Wrench className="h-4 w-4 text-red-500"/>
        <span className="text-sm font-semibold text-gray-800">Relatório de Manutenção Corretiva</span>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Problema reportado *</label>
        <textarea rows={3} value={problem} onChange={e => setProblem(e.target.value)} disabled={isComplete}
          placeholder="Descreve o problema em detalhe…"
          className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold resize-none disabled:bg-gray-50"/>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Causa raiz identificada</label>
        <textarea rows={2} value={rootCause} onChange={e => setRootCause(e.target.value)} disabled={isComplete}
          placeholder="Ex: Junta de borracha gasta, corrosão na tubagem…"
          className="w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold resize-none disabled:bg-gray-50"/>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Acção tomada</label>
          <select value={actionTaken} onChange={e => setActionTaken(e.target.value)} disabled={isComplete}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold disabled:bg-gray-50">
            {CORRECTIVE_ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Custo (€)</label>
          <input type="number" min="0" step="0.01" value={cost} onChange={e => setCost(e.target.value)} disabled={isComplete}
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold disabled:bg-gray-50"/>
        </div>
      </div>

      {actionTaken === 'specialist' && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Nome / empresa do especialista</label>
          <input value={specialistName} onChange={e => setSpecialistName(e.target.value)} disabled={isComplete}
            placeholder="Ex: Canalizações Silva, Lda."
            className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold disabled:bg-gray-50"/>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={() => !isComplete && setResolved((v: boolean) => !v)}
          disabled={isComplete}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60 ${
            resolved ? 'border-green-300 bg-green-50 text-green-700' : 'border-amber-300 bg-amber-50 text-amber-700'
          }`}
        >
          {resolved ? '✓ Problema resolvido' : '⚠ Ainda pendente'}
        </button>
        <span className="text-xs text-gray-400">Clica para alternar</span>
      </div>

      {/* Photos */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5 flex items-center gap-1">
          <ImageIcon className="h-3.5 w-3.5"/>Fotos (URLs)
        </label>
        <div className="space-y-2">
          {photoUrls.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input value={url} onChange={e => setPhotoUrl(i, e.target.value)} disabled={isComplete}
                placeholder="https://…"
                className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold disabled:bg-gray-50 font-mono text-xs"/>
              {!isComplete && photoUrls.length > 1 && (
                <button onClick={() => removePhotoField(i)} className="p-2 text-gray-300 hover:text-red-500 rounded-lg">
                  <Trash2 className="h-4 w-4"/>
                </button>
              )}
            </div>
          ))}
        </div>
        {!isComplete && (
          <button onClick={addPhotoField} className="mt-2 text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
            <Plus className="h-3.5 w-3.5"/> Adicionar foto
          </button>
        )}
      </div>

      {!isComplete && (
        <button onClick={submit} disabled={submitting || !problem.trim()}
          className="w-full rounded-xl bg-red-600 text-white py-3 text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
          <FileText className="h-4 w-4"/>
          {submitting ? 'A submeter…' : 'Submeter relatório corretivo'}
        </button>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MaintenancePage() {
  const [tasks, setTasks]         = useState<Task[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [selected, setSelected]   = useState<Task | null>(null)
  const [loading, setLoading]     = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)

  // Preventive checklist state
  const [sections, setSections]   = useState(DEFAULT_SECTIONS)
  const [checklist, setChecklist] = useState<ChecklistState>(freshChecklist(DEFAULT_SECTIONS))
  const [expandedNote, setExpandedNote] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [photoUrls, setPhotoUrls] = useState<string[]>([''])

  const load = async () => {
    setLoading(true)
    const [tRes, pRes] = await Promise.all([fetch('/api/tasks'), fetch('/api/properties')])
    if (tRes.ok) {
      const all: Task[] = await tRes.json()
      const maintenance = all.filter(t => t.type === 'MAINTENANCE_PREVENTIVE' || t.type === 'MAINTENANCE_CORRECTIVE')
      setTasks(maintenance)
      if (!selected) {
        // Auto-select first active (non-completed) task
        const firstActive = maintenance.find(t => t.status !== 'COMPLETED') ?? maintenance[0] ?? null
        if (firstActive) loadTask(firstActive)
      }
    }
    if (pRes.ok) setProperties(await pRes.json())
    setLoading(false)
  }

  const loadTask = async (t: Task) => {
    setSelected(t)
    setExpandedNote(null)
    setSubmitted(null)
    setPhotoUrls([''])

    if (t.type === 'MAINTENANCE_PREVENTIVE') {
      // Fetch property-specific checklist
      const res = await fetch(`/api/properties/${t.property.id}/checklist`)
      if (res.ok) {
        const items: { id: string; label: string; category: string; isActive: boolean }[] = await res.json()
        const activeItems = items.filter(i => i.isActive)
        const secs = buildSections(activeItems)
        setSections(secs)
        setChecklist(freshChecklist(secs))
      } else {
        setSections(DEFAULT_SECTIONS)
        setChecklist(freshChecklist(DEFAULT_SECTIONS))
      }
    }
  }

  useEffect(() => { load() }, [])

  const selectTask = (t: Task) => loadTask(t)

  const toggleCheck = (id: string) =>
    setChecklist(c => ({ ...c, [id]: { ...c[id], checked: !c[id].checked } }))

  const toggleAnomaly = (id: string) =>
    setChecklist(c => ({ ...c, [id]: { ...c[id], anomaly: !c[id].anomaly } }))

  const setNote = (id: string, note: string) =>
    setChecklist(c => ({ ...c, [id]: { ...c[id], note } }))

  const allItems = sections.flatMap(s => s.items)
  const checkedCount = Object.values(checklist).filter(i => i.checked).length
  const anomalyCount = Object.values(checklist).filter(i => i.anomaly).length

  const submitPreventiveReport = async () => {
    if (!selected) return
    setSubmitting(true)

    const reportSections = sections.map(sec => ({
      name: sec.section,
      items: sec.items.map(item => ({
        id: item.id,
        label: item.label,
        ...checklist[item.id],
      })),
    }))

    const report = {
      type: 'preventive',
      sections: reportSections,
      checkedCount,
      totalCount: allItems.length,
      anomalyCount,
      photoUrls: photoUrls.filter(u => u.trim()),
      submittedAt: new Date().toISOString(),
    }

    await fetch(`/api/tasks/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'COMPLETED', notes: JSON.stringify(report) }),
    })
    setSubmitting(false)
    setSubmitted(selected.id)
    await load()
  }

  const isComplete = selected?.status === 'COMPLETED'

  const preventiveReport = (() => {
    if (!selected?.notes) return null
    try { const p = JSON.parse(selected.notes); return p?.type === 'preventive' ? p : null } catch { return null }
  })()

  const visibleTasks = tasks.filter(t => showCompleted || t.status !== 'COMPLETED')

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* ── Sidebar ── */}
      <div className="w-72 border-r bg-white flex flex-col shrink-0">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 text-sm">Manutenção</h2>
            <p className="text-xs text-gray-400 mt-0.5">{visibleTasks.length} visita{visibleTasks.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowCompleted(v => !v)}
              className={`rounded-lg px-2 py-1 text-[10px] font-semibold transition-colors ${showCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              title={showCompleted ? 'Ocultar concluídas' : 'Mostrar concluídas'}
            >
              {showCompleted ? '✓ Todas' : 'Activas'}
            </button>
            <button onClick={() => setShowCreate(true)} className="rounded-lg bg-gray-900 text-white p-2 hover:bg-gray-800" title="Nova visita">
              <Plus className="h-4 w-4"/>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto divide-y">
          {loading && <div className="p-4 text-center text-sm text-gray-400">A carregar…</div>}
          {!loading && visibleTasks.length === 0 && (
            <div className="p-6 text-center text-sm text-gray-400">
              Sem visitas de manutenção.
              <button onClick={() => setShowCreate(true)} className="mt-2 block w-full rounded-lg border py-2 text-xs hover:bg-gray-50">
                + Criar primeira visita
              </button>
            </div>
          )}
          {visibleTasks.map(t => {
            const isSelected = selected?.id === t.id
            return (
              <button key={t.id} onClick={() => selectTask(t)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50 border-l-2 border-l-gray-900' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900 truncate">{t.property.name}</span>
                  <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 shrink-0 ml-1 ${TYPE_COLOR[t.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {t.type === 'MAINTENANCE_PREVENTIVE' ? 'P' : 'C'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate mb-1">{t.title}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className={`rounded px-1.5 py-0.5 font-medium ${STATUS_COLOR[t.status] ?? ''}`}>
                    {t.status.toLowerCase()}
                  </span>
                  <span className="text-gray-400">{fmt(t.dueDate)}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Main Panel ── */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {selected ? (
          <div className="max-w-xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{selected.property.name}</h1>
                <p className="text-sm text-gray-600 mt-0.5">{selected.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${TYPE_COLOR[selected.type] ?? 'bg-gray-100 text-gray-600'}`}>
                    {selected.type === 'MAINTENANCE_PREVENTIVE' ? 'Preventiva' : 'Correctiva'}
                  </span>
                  <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${STATUS_COLOR[selected.status] ?? ''}`}>
                    {selected.status.toLowerCase()}
                  </span>
                  <span className="text-xs text-gray-400">{fmt(selected.dueDate)}</span>
                </div>
              </div>
              {selected.type === 'MAINTENANCE_PREVENTIVE' && (
                <div className="text-right shrink-0 ml-4">
                  <div className="text-2xl font-bold text-gray-900">{checkedCount}/{allItems.length}</div>
                  <div className="text-xs text-gray-400">verificados</div>
                  {anomalyCount > 0 && <div className="text-xs text-red-500 mt-0.5">{anomalyCount} anomalia{anomalyCount !== 1 ? 's' : ''}</div>}
                </div>
              )}
            </div>

            {selected.assignee && (
              <div className="rounded-hm border bg-white px-4 py-3 mb-4 text-sm">
                <span className="text-gray-500">Técnico:</span>
                <span className="font-semibold text-gray-900 ml-2">{selected.assignee.name}</span>
              </div>
            )}

            {/* ── CORRECTIVE: custom report form ── */}
            {selected.type === 'MAINTENANCE_CORRECTIVE' && (
              <div className="rounded-hm border bg-white p-5">
                <CorrectivePanel key={selected.id} task={selected} onSubmitted={() => load()} />
              </div>
            )}

            {/* ── PREVENTIVE: dynamic checklist ── */}
            {selected.type === 'MAINTENANCE_PREVENTIVE' && (
              <>
                <div className="h-2 rounded-full bg-gray-200 mb-5 overflow-hidden">
                  <div className="h-full rounded-full bg-green-500 transition-all duration-300"
                    style={{ width: `${allItems.length > 0 ? (checkedCount / allItems.length) * 100 : 0}%` }}/>
                </div>

                {(submitted === selected.id || (isComplete && !preventiveReport)) && (
                  <div className="rounded-hm border border-green-200 bg-green-50 px-4 py-3 mb-4 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-green-600 shrink-0"/>
                    <span className="text-sm text-green-700 font-semibold">Relatório preventivo submetido.</span>
                  </div>
                )}

                {/* Show submitted preventive report */}
                {isComplete && preventiveReport && (
                  <div className="rounded-hm border bg-white p-4 mb-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Relatório preventivo</h3>
                      <span className="text-xs text-gray-400">{preventiveReport.checkedCount}/{preventiveReport.totalCount} verificados</span>
                    </div>
                    {preventiveReport.sections?.map((sec: any) => (
                      <div key={sec.name}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{sec.name}</p>
                        <div className="space-y-0.5">
                          {sec.items?.map((item: any) => (
                            <div key={item.id} className={`flex items-start gap-2 text-xs rounded px-2 py-1 ${item.anomaly ? 'bg-red-50 text-red-700' : item.checked ? 'text-gray-500' : 'text-gray-400'}`}>
                              <span className="shrink-0">{item.checked ? '✓' : '✗'}</span>
                              <span>{item.label}{item.anomaly ? ' ⚠' : ''}</span>
                              {item.note && <span className="text-gray-400 italic">— {item.note}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {preventiveReport.photoUrls?.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">Fotos</p>
                        <div className="grid grid-cols-3 gap-2">
                          {preventiveReport.photoUrls.map((url: string, i: number) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border aspect-video bg-gray-100">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt={`Foto ${i+1}`} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Active checklist */}
                {!isComplete && sections.map(sec => (
                  <div key={sec.section} className="mb-4">
                    <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-2 px-1">{sec.section}</h3>
                    <div className="rounded-hm border bg-white overflow-hidden divide-y">
                      {sec.items.map(item => {
                        const state = checklist[item.id] ?? { checked: false, anomaly: false, note: '' }
                        const hasNote = expandedNote === item.id
                        return (
                          <div key={item.id}>
                            <div className={`flex items-center gap-3 px-4 py-3 transition-colors ${state.anomaly ? 'bg-red-50/60' : state.checked ? 'bg-green-50/40' : ''}`}>
                              <button onClick={() => toggleCheck(item.id)} className="shrink-0">
                                {state.checked
                                  ? <CheckSquare className="h-5 w-5 text-green-600"/>
                                  : <Square className="h-5 w-5 text-gray-300 hover:text-gray-500"/>}
                              </button>
                              <div className="flex-1 min-w-0">
                                <span className={`text-sm ${state.checked ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{item.label}</span>
                                {state.anomaly && <div className="flex items-center gap-1 text-red-600 text-xs mt-0.5"><AlertTriangle className="h-3 w-3"/>Anomalia registada</div>}
                                {state.note && !hasNote && <p className="text-xs text-gray-400 mt-0.5 truncate">📝 {state.note}</p>}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button onClick={() => toggleAnomaly(item.id)}
                                  className={`p-1.5 rounded-lg transition-colors ${state.anomaly ? 'bg-red-100 text-red-600' : 'text-gray-300 hover:bg-red-50 hover:text-red-500'}`}>
                                  <AlertTriangle className="h-4 w-4"/>
                                </button>
                                <button onClick={() => setExpandedNote(hasNote ? null : item.id)}
                                  className={`p-1.5 rounded-lg transition-colors ${state.note ? 'bg-blue-50 text-blue-500' : 'text-gray-300 hover:bg-gray-100 hover:text-gray-600'}`}>
                                  {hasNote ? <ChevronUp className="h-4 w-4"/> : <ChevronDown className="h-4 w-4"/>}
                                </button>
                              </div>
                            </div>
                            {hasNote && (
                              <div className="px-4 pb-3 pt-2 border-t border-gray-100 bg-gray-50">
                                <textarea rows={2} value={state.note} onChange={e => setNote(item.id, e.target.value)}
                                  placeholder="Descreve a anomalia ou adiciona observações…"
                                  className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold resize-none"/>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}

                {/* Photos for preventive */}
                {!isComplete && (
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                      <ImageIcon className="h-3.5 w-3.5"/>Fotos (opcional)
                    </label>
                    <div className="space-y-2">
                      {photoUrls.map((url, i) => (
                        <div key={i} className="flex gap-2">
                          <input value={url} onChange={e => setPhotoUrls(p => p.map((u, idx) => idx === i ? e.target.value : u))}
                            placeholder="https://…"
                            className="flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold font-mono text-xs"/>
                          {photoUrls.length > 1 && (
                            <button onClick={() => setPhotoUrls(p => p.filter((_, idx) => idx !== i))} className="p-2 text-gray-300 hover:text-red-500 rounded-lg">
                              <Trash2 className="h-4 w-4"/>
                            </button>
                          )}
                        </div>
                      ))}
                      <button onClick={() => setPhotoUrls(p => [...p, ''])} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mt-1">
                        <Plus className="h-3.5 w-3.5"/> Adicionar foto
                      </button>
                    </div>
                  </div>
                )}

                {!isComplete && (
                  <button onClick={submitPreventiveReport} disabled={submitting || checkedCount === 0}
                    className="w-full rounded-xl bg-gray-900 text-white py-3 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2">
                    <FileText className="h-4 w-4"/>
                    {submitting ? 'A submeter…' : 'Submeter relatório preventivo'}
                  </button>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            {loading ? 'A carregar…' : 'Selecciona uma visita para ver o relatório'}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateModal
          properties={properties}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load() }}
        />
      )}
    </div>
  )
}
