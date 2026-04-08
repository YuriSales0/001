"use client"

import { useEffect, useState } from "react"
import { Plus, X, User, Home, CalendarDays, DollarSign, LayoutList, Columns, CheckCircle2, Clock, XCircle } from "lucide-react"

type ReservationStatus = "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED"
type Platform = "AIRBNB" | "BOOKING" | "DIRECT" | "OTHER"

interface Reservation {
  id: string
  guestName: string
  guestNationality?: string
  guestEmail: string | null
  guestPhone: string | null
  property: { id: string; name: string; city: string; owner?: { subscriptionPlan?: string } }
  checkIn: string
  checkOut: string
  amount: number
  grossAmount?: number
  platform: Platform | null
  channel?: string
  status: ReservationStatus
}
interface Property { id: string; name: string; city: string }

const STATUS_COLOR: Record<ReservationStatus, string> = {
  UPCOMING:  "bg-blue-100 text-blue-800",
  ACTIVE:    "bg-emerald-100 text-emerald-800",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
}
const STATUS_COLS: { id: ReservationStatus; label: string; border: string; header: string }[] = [
  { id: "UPCOMING",  label: "Upcoming",  border: "border-blue-200",  header: "bg-blue-50" },
  { id: "ACTIVE",    label: "Active",    border: "border-emerald-200",header: "bg-emerald-50" },
  { id: "COMPLETED", label: "Completed", border: "border-gray-200",  header: "bg-gray-50" },
  { id: "CANCELLED", label: "Cancelled", border: "border-red-200",   header: "bg-red-50" },
]
const PLATFORM_COLOR: Record<string, string> = {
  AIRBNB:  "bg-rose-100 text-rose-800",
  BOOKING: "bg-blue-100 text-blue-800",
  DIRECT:  "bg-violet-100 text-violet-800",
  OTHER:   "bg-gray-100 text-gray-700",
}
const PLAN_SLA: Record<string, { guest: number; owner: number; emergency: number }> = {
  STARTER: { guest: 4, owner: 24, emergency: 48 },
  BASIC:   { guest: 4, owner: 24, emergency: 48 },
  MID:     { guest: 2, owner: 12, emergency: 24 },
  PREMIUM: { guest: 1, owner: 4,  emergency: 4  },
}
const FLAGS: Record<string, string> = {
  GB:"🇬🇧",SE:"🇸🇪",NO:"🇳🇴",DK:"🇩🇰",NL:"🇳🇱",DE:"🇩🇪",FR:"🇫🇷",ES:"🇪🇸",IT:"🇮🇹",
  PT:"🇵🇹",US:"🇺🇸",BR:"🇧🇷",
}

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })
const fmtFull = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })
const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n)
const nights = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
function daysUntil(s: string) {
  return Math.ceil((new Date(s).getTime() - Date.now()) / 86_400_000)
}

// ── Pipeline detail sidebar ───────────────────────────────────────────────────
function PipelineDetail({ r, onClose }: { r: Reservation; onClose: ()=>void }) {
  const plan = r.property.owner?.subscriptionPlan ?? "STARTER"
  const sla = PLAN_SLA[plan]
  const gross = r.grossAmount ?? r.amount
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end bg-black/30">
      <div className="w-full max-w-md h-full bg-white shadow-2xl overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {r.guestNationality&&<span className="text-xl">{FLAGS[r.guestNationality]??"🌍"}</span>}
            <div>
              <div className="font-bold text-gray-900">{r.guestName}</div>
              <div className="text-xs text-gray-400">{r.property.name}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XCircle className="h-5 w-5"/></button>
        </div>
        <div className="p-5 space-y-5">
          {/* Dates */}
          <div className="rounded-xl border bg-blue-50 border-blue-200 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-gray-500 mb-1">Check-in</div>
                <div className="font-bold text-gray-900">{fmtFull(r.checkIn)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Check-out</div>
                <div className="font-bold text-gray-900">{fmtFull(r.checkOut)}</div>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500">{nights(r.checkIn,r.checkOut)} nights · {r.channel??r.platform??'Direct'}</div>
          </div>
          {/* Financials */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Financials</h3>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Gross booking</span>
                <span className="font-semibold">{fmtMoney(gross)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">HostMasters commission (20%)</span>
                <span className="text-emerald-600 font-semibold">{fmtMoney(gross*0.2)}</span>
              </div>
            </div>
          </div>
          {/* SLA */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">SLA — {plan} Plan</h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                {label:"Guest response",hours:sla.guest},
                {label:"Owner response",hours:sla.owner},
                {label:"Emergency",hours:sla.emergency},
              ].map(item=>(
                <div key={item.label} className="rounded-lg bg-gray-50 border p-2">
                  <div className="text-lg font-bold text-gray-900">{item.hours}h</div>
                  <div className="text-[10px] text-gray-400">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Lifecycle */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-gray-400 mb-2">Full lifecycle</h3>
            <div className="space-y-1.5">
              {[
                {label:"Booking confirmed → owner notified",done:true},
                {label:"Guest welcome email sent",done:true},
                {label:"Nuki access code generated",done:true},
                {label:"48h before: cleaning confirmed",done:r.status!=="UPCOMING"},
                {label:"Pre-stay inspection done",done:r.status==="ACTIVE"||r.status==="COMPLETED"},
                {label:"Guest reminder sent",done:r.status!=="UPCOMING"},
                {label:"Check-in: code activated",done:r.status==="ACTIVE"||r.status==="COMPLETED"},
                {label:"Check-out: inspection + cleaning",done:r.status==="COMPLETED"},
                {label:"Review request sent",done:r.status==="COMPLETED"},
                {label:"Financials logged",done:r.status==="COMPLETED"},
              ].map(item=>(
                <div key={item.label} className="flex items-center gap-2 text-sm">
                  {item.done?(
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0"/>
                  ):(
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300 shrink-0"/>
                  )}
                  <span className={item.done?"text-gray-400 line-through":"text-gray-700"}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterProperty, setFilterProperty] = useState("all")
  const [view, setView] = useState<'list'|'pipeline'>('list')
  const [pipelineSelected, setPipelineSelected] = useState<Reservation|null>(null)

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [form, setForm] = useState({
    propertyId:"",guestName:"",guestEmail:"",guestPhone:"",
    checkIn:"",checkOut:"",amount:"",platform:"DIRECT",
  })

  const load = async () => {
    setLoading(true)
    const [rRes, pRes] = await Promise.all([fetch("/api/reservations"),fetch("/api/properties")])
    if (rRes.ok) setReservations(await rRes.json())
    if (pRes.ok) setProperties(await pRes.json())
    setLoading(false)
  }
  useEffect(()=>{load()},[])

  const filtered = reservations.filter(r => {
    if (filterStatus !== "all" && r.status !== filterStatus) return false
    if (filterProperty !== "all" && r.property.id !== filterProperty) return false
    return true
  })

  const upcoming  = reservations.filter(r=>r.status==="UPCOMING").length
  const active    = reservations.filter(r=>r.status==="ACTIVE").length
  const completed = reservations.filter(r=>r.status==="COMPLETED").length
  const totalRev  = reservations.reduce((s,r)=>s+r.amount,0)

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError("")
    if (!form.propertyId||!form.guestName||!form.checkIn||!form.checkOut||!form.amount) {
      setCreateError("Fill in all required fields.")
      return
    }
    setCreating(true)
    const res = await fetch("/api/reservations",{
      method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        propertyId:form.propertyId,guestName:form.guestName,
        guestEmail:form.guestEmail||undefined,guestPhone:form.guestPhone||undefined,
        checkIn:new Date(form.checkIn).toISOString(),checkOut:new Date(form.checkOut).toISOString(),
        amount:parseFloat(form.amount),platform:form.platform,
      }),
    })
    if (!res.ok) {
      const err = await res.json().catch(()=>({}))
      setCreateError(err.error??"Failed to create reservation")
    } else {
      setShowCreate(false)
      setForm({propertyId:"",guestName:"",guestEmail:"",guestPhone:"",checkIn:"",checkOut:"",amount:"",platform:"DIRECT"})
      await load()
    }
    setCreating(false)
  }

  const byStatus = (status: ReservationStatus) =>
    reservations.filter(r=>r.status===status)
      .sort((a,b)=>new Date(a.checkIn).getTime()-new Date(b.checkIn).getTime())

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reservations</h1>
          <p className="text-sm text-gray-500">Track and manage all guest reservations.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border overflow-hidden">
            <button onClick={()=>setView('list')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${
                view==='list'?'bg-gray-900 text-white':'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <LayoutList className="h-4 w-4"/>List
            </button>
            <button onClick={()=>setView('pipeline')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors border-l ${
                view==='pipeline'?'bg-gray-900 text-white':'bg-white text-gray-600 hover:bg-gray-50'}`}>
              <Columns className="h-4 w-4"/>Pipeline
            </button>
          </div>
          <button onClick={()=>setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-gray-900 text-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-800">
            <Plus className="h-4 w-4"/>New
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          {label:"Upcoming", value:upcoming,           icon:CalendarDays, color:"text-blue-600 bg-blue-50"},
          {label:"Active",   value:active,             icon:Clock,        color:"text-emerald-600 bg-emerald-50"},
          {label:"Completed",value:completed,           icon:User,         color:"text-gray-600 bg-gray-100"},
          {label:"Revenue",  value:fmtMoney(totalRev),  icon:DollarSign,   color:"text-amber-600 bg-amber-50"},
        ].map(({label,value,icon:Icon,color})=>(
          <div key={label} className="rounded-xl border bg-white p-4 flex items-center gap-3">
            <div className={`rounded-lg p-2 ${color.split(" ")[1]}`}><Icon className={`h-5 w-5 ${color.split(" ")[0]}`}/></div>
            <div>
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-lg font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── LIST VIEW ── */}
      {view==='list'&&(
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <select value={filterProperty} onChange={e=>setFilterProperty(e.target.value)}
              className="rounded-lg border bg-white px-3 py-2 text-sm">
              <option value="all">All properties</option>
              {properties.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
              className="rounded-lg border bg-white px-3 py-2 text-sm">
              <option value="all">All statuses</option>
              <option value="UPCOMING">Upcoming</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="space-y-3">
            {loading&&<div className="py-8 text-center text-sm text-gray-400">Loading…</div>}
            {!loading&&filtered.length===0&&(
              <div className="py-12 text-center text-sm text-gray-400 rounded-xl border bg-white">No reservations match your filters.</div>
            )}
            {filtered.map(r=>(
              <div key={r.id} className="rounded-xl border bg-white p-4 hover:shadow-sm transition-shadow">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                      {r.guestNationality?(
                        <span className="text-lg">{FLAGS[r.guestNationality]??"🌍"}</span>
                      ):(
                        <User className="h-4 w-4 text-gray-500"/>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{r.guestName}</span>
                        {r.platform&&<span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${PLATFORM_COLOR[r.platform]}`}>{r.platform}</span>}
                        <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${STATUS_COLOR[r.status]}`}>{r.status}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><Home className="h-3 w-3"/>{r.property.name}</span>
                        <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3"/>{fmt(r.checkIn)} — {fmt(r.checkOut)} · {nights(r.checkIn,r.checkOut)}n</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                    <span className="text-base font-bold text-gray-900">{fmtMoney(r.amount)}</span>
                    {r.guestEmail&&<span className="text-xs text-gray-400 truncate max-w-[160px]">{r.guestEmail}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── PIPELINE VIEW ── */}
      {view==='pipeline'&&(
        <div className="overflow-x-auto -mx-6 px-6">
          <div className="flex gap-4 min-w-[900px] pb-4">
            {STATUS_COLS.map(col=>{
              const items = byStatus(col.id)
              return (
                <div key={col.id} className={`flex flex-col w-72 rounded-xl border-2 bg-white flex-shrink-0 ${col.border}`}>
                  <div className={`px-3 py-2.5 rounded-t-xl border-b ${col.header} flex items-center justify-between`}>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-600">{col.label}</span>
                    <span className="text-xs font-bold bg-white text-gray-500 rounded-full px-2 py-0.5 border">{items.length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto max-h-[60vh] p-2 space-y-2">
                    {loading&&<div className="h-24 rounded-lg bg-gray-100 animate-pulse"/>}
                    {items.map(r=>{
                      const d = daysUntil(r.checkIn)
                      const plan = r.property.owner?.subscriptionPlan??"STARTER"
                      return (
                        <div key={r.id} onClick={()=>setPipelineSelected(r)}
                          className="rounded-lg border border-gray-200 bg-white p-3 cursor-pointer hover:border-gray-400 hover:shadow-sm transition-all">
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-1.5">
                              {r.guestNationality&&<span className="text-base">{FLAGS[r.guestNationality]??"🌍"}</span>}
                              <span className="text-sm font-semibold text-gray-900 truncate">{r.guestName}</span>
                            </div>
                            <span className="text-xs text-gray-400">{r.channel??r.platform??''}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1.5">
                            <Home className="h-3 w-3 text-gray-400"/>
                            <span className="truncate">{r.property.name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                            <CalendarDays className="h-3 w-3 text-gray-400"/>
                            {fmt(r.checkIn)} → {fmt(r.checkOut)} · {nights(r.checkIn,r.checkOut)}n
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${
                                plan==="PREMIUM"?"bg-gray-900 text-yellow-400":
                                plan==="MID"?"bg-yellow-100 text-yellow-700":"bg-gray-100 text-gray-600"}`}>
                                {plan}
                              </span>
                              {col.id==="UPCOMING"&&d<=2&&d>=0&&(
                                <span className="text-[10px] text-orange-600 bg-orange-50 rounded px-1.5 py-0.5 font-medium">
                                  {d===0?"Today!":`${d}d`}
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-bold text-gray-900">{fmtMoney(r.grossAmount??r.amount)}</span>
                          </div>
                        </div>
                      )
                    })}
                    {!loading&&items.length===0&&(
                      <div className="text-center py-8 text-xs text-gray-300">No reservations</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Pipeline detail */}
      {pipelineSelected&&<PipelineDetail r={pipelineSelected} onClose={()=>setPipelineSelected(null)}/>}

      {/* Create modal */}
      {showCreate&&(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={()=>setShowCreate(false)}>
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h2 className="text-base font-bold">New reservation</h2>
                <p className="text-xs text-gray-500 mt-0.5">Auto-tasks will be generated on save.</p>
              </div>
              <button onClick={()=>setShowCreate(false)} className="rounded-md p-1 hover:bg-gray-100"><X className="h-5 w-5"/></button>
            </div>
            <form onSubmit={submitCreate} className="p-5 space-y-4">
              {createError&&<div className="rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2">{createError}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Property *</label>
                  <select value={form.propertyId} onChange={e=>setForm(f=>({...f,propertyId:e.target.value}))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                    <option value="">Select a property…</option>
                    {properties.map(p=><option key={p.id} value={p.id}>{p.name} · {p.city}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Guest name *</label>
                  <input type="text" value={form.guestName} onChange={e=>setForm(f=>({...f,guestName:e.target.value}))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="Full name"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Platform</label>
                  <select value={form.platform} onChange={e=>setForm(f=>({...f,platform:e.target.value}))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
                    <option value="AIRBNB">Airbnb</option>
                    <option value="BOOKING">Booking.com</option>
                    <option value="DIRECT">Direct</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Guest email</label>
                  <input type="email" value={form.guestEmail} onChange={e=>setForm(f=>({...f,guestEmail:e.target.value}))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="optional"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={form.guestPhone} onChange={e=>setForm(f=>({...f,guestPhone:e.target.value}))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="optional"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Check-in *</label>
                  <input type="date" value={form.checkIn} onChange={e=>setForm(f=>({...f,checkIn:e.target.value}))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Check-out *</label>
                  <input type="date" value={form.checkOut} onChange={e=>setForm(f=>({...f,checkOut:e.target.value}))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"/>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Amount (€) *</label>
                  <input type="number" min="0" step="0.01" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))}
                    className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" placeholder="0.00"/>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={()=>setShowCreate(false)} className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={creating}
                  className="rounded-lg bg-gray-900 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-800 disabled:opacity-50">
                  {creating?"Saving…":"Create reservation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
