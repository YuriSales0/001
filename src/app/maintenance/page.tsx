"use client"

import { useEffect, useState } from "react"
import { CheckSquare, Square, AlertTriangle, FileText, Plus, X, ChevronDown, ChevronUp } from "lucide-react"

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

// ── Checklist ─────────────────────────────────────────────────────────────────
const CHECKLIST_SECTIONS = [
  {
    section: "Exterior",
    items: [
      { id: "facade",   label: "Fachada e portão de entrada" },
      { id: "pool",     label: "Piscina (pH, nível de água, limpeza)" },
      { id: "garden",   label: "Jardim / terraço / varanda" },
      { id: "mailbox",  label: "Caixa de correio e área de entrada" },
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

const ALL_ITEMS = CHECKLIST_SECTIONS.flatMap(s => s.items.map(i => ({ ...i, section: s.section })))

type ChecklistState = Record<string, { checked: boolean; anomaly: boolean; note: string }>

function freshChecklist(): ChecklistState {
  const r: ChecklistState = {}
  for (const item of ALL_ITEMS) r[item.id] = { checked: false, anomaly: false, note: "" }
  return r
}

// ── Constants ─────────────────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  MAINTENANCE_PREVENTIVE: "bg-blue-100 text-blue-700",
  MAINTENANCE_CORRECTIVE: "bg-red-100 text-red-700",
}
const STATUS_COLOR: Record<string, string> = {
  PENDING:   "bg-gray-100 text-gray-600",
  IN_PROGRESS:"bg-amber-100 text-amber-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-600",
}
const fmt = (s: string) =>
  new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

// ── Create Task Modal ─────────────────────────────────────────────────────────
function CreateModal({
  properties, onClose, onCreated,
}: {
  properties: Property[]; onClose: ()=>void; onCreated: ()=>void
}) {
  const [propertyId, setPropertyId] = useState(properties[0]?.id??'')
  const [type, setType] = useState('MAINTENANCE_PREVENTIVE')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0,10))
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!propertyId||!title||!dueDate) return
    setSaving(true)
    await fetch('/api/tasks',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({propertyId,type,title,description,dueDate:new Date(dueDate).toISOString()})})
    setSaving(false)
    onCreated()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-base font-bold">Nova visita de manutenção</h2>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-gray-100"><X className="h-4 w-4"/></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Tipo</label>
              <select value={type} onChange={e=>setType(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                <option value="MAINTENANCE_PREVENTIVE">Preventiva</option>
                <option value="MAINTENANCE_CORRECTIVE">Correctiva</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Data</label>
              <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Propriedade</label>
            <select value={propertyId} onChange={e=>setPropertyId(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
              {properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Título / motivo</label>
            <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex: Revisão trimestral — ar condicionado"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Descrição (opcional)</label>
            <textarea rows={3} value={description} onChange={e=>setDescription(e.target.value)}
              placeholder="Detalhes, instrução especial para o técnico…"
              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
          </div>
        </div>
        <div className="flex gap-3 px-6 py-4 border-t">
          <button onClick={onClose} className="flex-1 rounded-lg border py-2.5 text-sm hover:bg-gray-50">Cancelar</button>
          <button onClick={submit} disabled={saving||!title||!propertyId}
            className="flex-1 rounded-lg bg-gray-900 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50">
            {saving?'A criar…':'Criar visita'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function MaintenancePage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [selected, setSelected] = useState<Task | null>(null)
  const [loading, setLoading] = useState(true)
  const [checklist, setChecklist] = useState<ChecklistState>(freshChecklist())
  const [expandedNote, setExpandedNote] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    const [tRes, pRes] = await Promise.all([fetch('/api/tasks'),fetch('/api/properties')])
    if (tRes.ok) {
      const all: Task[] = await tRes.json()
      const maintenance = all.filter(t =>
        t.type==='MAINTENANCE_PREVENTIVE'||t.type==='MAINTENANCE_CORRECTIVE'
      )
      setTasks(maintenance)
      if (!selected && maintenance.length > 0) {
        setSelected(maintenance[0])
        setChecklist(freshChecklist())
      }
    }
    if (pRes.ok) setProperties(await pRes.json())
    setLoading(false)
  }

  useEffect(()=>{load()},[])

  const selectTask = (t: Task) => {
    setSelected(t)
    setChecklist(freshChecklist())
    setExpandedNote(null)
    setSubmitted(null)
  }

  const toggleCheck = (id: string) =>
    setChecklist(c=>({...c,[id]:{...c[id],checked:!c[id].checked}}))

  const toggleAnomaly = (id: string) =>
    setChecklist(c=>({...c,[id]:{...c[id],anomaly:!c[id].anomaly}}))

  const setNote = (id: string, note: string) =>
    setChecklist(c=>({...c,[id]:{...c[id],note}}))

  const totalItems = ALL_ITEMS.length
  const checkedCount = Object.values(checklist).filter(i=>i.checked).length
  const anomalyCount = Object.values(checklist).filter(i=>i.anomaly).length

  const submitReport = async () => {
    if (!selected) return
    setSubmitting(true)
    // Build report text
    const lines = [`## Relatório de Manutenção — ${selected.title}`, '']
    for (const sec of CHECKLIST_SECTIONS) {
      lines.push(`### ${sec.section}`)
      for (const item of sec.items) {
        const state = checklist[item.id]
        const status = state.checked ? '✓' : '✗'
        const anomaly = state.anomaly ? ' ⚠️ ANOMALIA' : ''
        lines.push(`${status} ${item.label}${anomaly}`)
        if (state.note) lines.push(`   Nota: ${state.note}`)
      }
      lines.push('')
    }
    lines.push(`Inspeccionados: ${checkedCount}/${totalItems} itens`)
    if (anomalyCount > 0) lines.push(`Anomalias detectadas: ${anomalyCount}`)

    await fetch(`/api/tasks/${selected.id}`,{
      method:'PATCH',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        status:'COMPLETED',
        notes:lines.join('\n'),
      }),
    })
    setSubmitting(false)
    setSubmitted(selected.id)
    await load()
  }

  const isComplete = selected?.status === 'COMPLETED'

  return (
    <div className="flex h-[calc(100vh-64px)]">
      {/* ── List sidebar ── */}
      <div className="w-72 border-r bg-white flex flex-col shrink-0">
        <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 text-sm">Manutenção</h2>
            <p className="text-xs text-gray-400 mt-0.5">{tasks.length} visita{tasks.length!==1?'s':''}</p>
          </div>
          <button onClick={()=>setShowCreate(true)}
            className="rounded-lg bg-gray-900 text-white p-1.5 hover:bg-gray-800" title="Nova visita">
            <Plus className="h-4 w-4"/>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y">
          {loading&&<div className="p-4 text-center text-sm text-gray-400">A carregar…</div>}
          {!loading&&tasks.length===0&&(
            <div className="p-6 text-center text-sm text-gray-400">
              Sem visitas de manutenção.
              <button onClick={()=>setShowCreate(true)} className="mt-2 block w-full rounded-lg border py-2 text-xs hover:bg-gray-50">
                + Criar primeira visita
              </button>
            </div>
          )}
          {tasks.map(t=>{
            const isSelected = selected?.id===t.id
            return (
              <button key={t.id} onClick={()=>selectTask(t)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                  isSelected?'bg-blue-50 border-l-2 border-l-gray-900':''}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-gray-900 truncate">{t.property.name}</span>
                  <span className={`text-[10px] font-semibold rounded px-1.5 py-0.5 shrink-0 ml-1 ${
                    TYPE_COLOR[t.type]??'bg-gray-100 text-gray-600'}`}>
                    {t.type==='MAINTENANCE_PREVENTIVE'?'P':'C'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate mb-1">{t.title}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className={`rounded px-1.5 py-0.5 font-medium ${STATUS_COLOR[t.status]??''}`}>
                    {t.status.toLowerCase()}
                  </span>
                  <span className="text-gray-400">{fmt(t.dueDate)}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Checklist panel ── */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
        {selected ? (
          <div className="max-w-xl mx-auto">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{selected.property.name}</h1>
                <p className="text-sm text-gray-600 mt-0.5">{selected.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${TYPE_COLOR[selected.type]??'bg-gray-100 text-gray-600'}`}>
                    {selected.type==='MAINTENANCE_PREVENTIVE'?'Preventiva':'Correctiva'}
                  </span>
                  <span className={`text-xs font-semibold rounded-full px-2.5 py-1 ${STATUS_COLOR[selected.status]??''}`}>
                    {selected.status.toLowerCase()}
                  </span>
                  <span className="text-xs text-gray-400">{fmt(selected.dueDate)}</span>
                </div>
              </div>
              <div className="text-right shrink-0 ml-4">
                <div className="text-2xl font-bold text-gray-900">{checkedCount}/{totalItems}</div>
                <div className="text-xs text-gray-400">verificados</div>
                {anomalyCount>0&&(
                  <div className="text-xs text-red-500 mt-0.5">{anomalyCount} anomalia{anomalyCount!==1?'s':''}</div>
                )}
              </div>
            </div>

            {/* Assignee */}
            {selected.assignee&&(
              <div className="rounded-xl border bg-white px-4 py-3 mb-4 text-sm">
                <span className="text-gray-500">Técnico:</span>
                <span className="font-semibold text-gray-900 ml-2">{selected.assignee.name}</span>
              </div>
            )}

            {/* Progress bar */}
            <div className="h-2 rounded-full bg-gray-200 mb-5 overflow-hidden">
              <div className="h-full rounded-full bg-green-500 transition-all duration-300"
                style={{width:`${(checkedCount/totalItems)*100}%`}}/>
            </div>

            {/* Submitted banner */}
            {(submitted===selected.id||isComplete)&&(
              <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 mb-4 flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-600 shrink-0"/>
                <div className="text-sm text-green-700">
                  <span className="font-semibold">Relatório submetido.</span> O Manager pode consultar nos Relatórios.
                </div>
              </div>
            )}

            {/* Checklist sections */}
            {CHECKLIST_SECTIONS.map(sec=>(
              <div key={sec.section} className="mb-4">
                <h3 className="text-xs uppercase tracking-widest text-gray-400 mb-2 px-1">{sec.section}</h3>
                <div className="rounded-xl border bg-white overflow-hidden divide-y">
                  {sec.items.map(item=>{
                    const state = checklist[item.id]
                    const hasNote = expandedNote===item.id
                    return (
                      <div key={item.id}>
                        <div className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                          state.anomaly?'bg-red-50/60':state.checked?'bg-green-50/40':''}`}>
                          {/* Checkbox */}
                          <button onClick={()=>toggleCheck(item.id)} className="shrink-0" disabled={isComplete}>
                            {state.checked
                              ? <CheckSquare className="h-5 w-5 text-green-600"/>
                              : <Square className="h-5 w-5 text-gray-300 hover:text-gray-500"/>}
                          </button>

                          {/* Label */}
                          <div className="flex-1 min-w-0">
                            <span className={`text-sm ${state.checked?'text-gray-400 line-through':'text-gray-800'}`}>
                              {item.label}
                            </span>
                            {state.anomaly&&(
                              <div className="flex items-center gap-1 text-red-600 text-xs mt-0.5">
                                <AlertTriangle className="h-3 w-3"/>Anomalia registada
                              </div>
                            )}
                            {state.note&&!hasNote&&(
                              <p className="text-xs text-gray-400 mt-0.5 truncate">📝 {state.note}</p>
                            )}
                          </div>

                          {/* Actions */}
                          {!isComplete&&(
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={()=>toggleAnomaly(item.id)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  state.anomaly?'bg-red-100 text-red-600':'text-gray-300 hover:bg-red-50 hover:text-red-500'}`}
                                title="Registar anomalia">
                                <AlertTriangle className="h-4 w-4"/>
                              </button>
                              <button onClick={()=>setExpandedNote(hasNote?null:item.id)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  state.note?'bg-blue-50 text-blue-500':'text-gray-300 hover:bg-gray-100 hover:text-gray-600'}`}
                                title="Adicionar nota">
                                {hasNote?<ChevronUp className="h-4 w-4"/>:<ChevronDown className="h-4 w-4"/>}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Inline note input */}
                        {hasNote&&(
                          <div className="px-4 pb-3 pt-2 border-t border-gray-100 bg-gray-50">
                            <textarea rows={2}
                              value={state.note}
                              onChange={e=>setNote(item.id,e.target.value)}
                              placeholder="Descreve a anomalia ou adiciona observações…"
                              className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"/>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Submit */}
            {!isComplete&&(
              <div className="flex gap-3 mt-6">
                <button
                  onClick={submitReport}
                  disabled={submitting||checkedCount===0}
                  className="flex-1 rounded-xl bg-gray-900 text-white py-3 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2">
                  <FileText className="h-4 w-4"/>
                  {submitting?'A submeter…':'Submeter relatório'}
                </button>
              </div>
            )}
            {isComplete&&selected.notes&&(
              <div className="mt-6 rounded-xl border bg-white p-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Relatório submetido</h3>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">{selected.notes}</pre>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            {loading?'A carregar…':'Selecciona uma visita para ver a checklist'}
          </div>
        )}
      </div>

      {showCreate&&(
        <CreateModal
          properties={properties}
          onClose={()=>setShowCreate(false)}
          onCreated={()=>{setShowCreate(false);load()}}
        />
      )}
    </div>
  )
}
