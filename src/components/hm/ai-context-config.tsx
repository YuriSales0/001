"use client"

import { useEffect, useState } from "react"
import { Save, Wifi, Key, Phone, Car, LogIn, LogOut, Zap, AlertTriangle, Droplet, Plus, X, BookOpen } from "lucide-react"

interface PropertyAIContext {
  wifiSsid?: string | null
  wifiPassword?: string | null
  doorCode?: string | null
  smartLockPassword?: string | null
  emergencyWhatsapp?: string | null
  parkingInstructions?: string | null
  checkInInstructions?: string | null
  checkOutInstructions?: string | null
  appliancesInfo?: string | null
  breakerLocation?: string | null
  waterShutoffLocation?: string | null
  propertyQuirks?: string[] | null
  guestGuideUrl?: string | null
}

interface Props {
  propertyId: string
}

export function AiContextConfig({ propertyId }: Props) {
  const [ctx, setCtx] = useState<PropertyAIContext>({})
  const [quirkInput, setQuirkInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`/api/properties/${propertyId}`)
      .then(r => r.ok ? r.json() : null)
      .then(p => {
        if (p) {
          setCtx({
            wifiSsid: p.wifiSsid,
            wifiPassword: p.wifiPassword,
            doorCode: p.doorCode,
            smartLockPassword: p.smartLockPassword,
            emergencyWhatsapp: p.emergencyWhatsapp,
            parkingInstructions: p.parkingInstructions,
            checkInInstructions: p.checkInInstructions,
            checkOutInstructions: p.checkOutInstructions,
            appliancesInfo: p.appliancesInfo,
            breakerLocation: p.breakerLocation,
            waterShutoffLocation: p.waterShutoffLocation,
            propertyQuirks: p.propertyQuirks ?? [],
            guestGuideUrl: p.guestGuideUrl,
          })
        }
        setLoading(false)
      })
  }, [propertyId])

  const save = async () => {
    setSaving(true)
    setSaved(false)
    const res = await fetch(`/api/properties/${propertyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ctx),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  const addQuirk = () => {
    const q = quirkInput.trim()
    if (!q) return
    setCtx(c => ({ ...c, propertyQuirks: [...(c.propertyQuirks ?? []), q] }))
    setQuirkInput('')
  }
  const removeQuirk = (i: number) => {
    setCtx(c => ({ ...c, propertyQuirks: (c.propertyQuirks ?? []).filter((_, idx) => idx !== i) }))
  }

  const update = <K extends keyof PropertyAIContext>(k: K, v: PropertyAIContext[K]) =>
    setCtx(c => ({ ...c, [k]: v }))

  if (loading) {
    return <div className="text-sm text-gray-400 py-4 text-center">Loading…</div>
  }

  const coverage = [
    ctx.wifiSsid, ctx.wifiPassword,
    ctx.doorCode || ctx.smartLockPassword,
    ctx.checkInInstructions, ctx.checkOutInstructions,
    ctx.emergencyWhatsapp, ctx.appliancesInfo,
    ctx.breakerLocation, ctx.waterShutoffLocation,
  ].filter(v => !!v).length
  const coveragePct = Math.round(coverage / 9 * 100)

  return (
    <div className="space-y-5">
      {/* Coverage indicator */}
      <div className="rounded-xl border-2 border-hm-gold/30 bg-hm-gold/5 p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-semibold text-hm-black">AI Assistant coverage</p>
            <p className="text-xs text-gray-500">The more you fill, the less the guest needs to ask a human.</p>
          </div>
          <p className={`text-2xl font-bold ${coveragePct >= 80 ? 'text-emerald-600' : coveragePct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
            {coveragePct}%
          </p>
        </div>
        <div className="h-2 rounded-full bg-white overflow-hidden">
          <div
            className={`h-full transition-all ${coveragePct >= 80 ? 'bg-emerald-500' : coveragePct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${coveragePct}%` }}
          />
        </div>
      </div>

      {/* Section: Connectivity */}
      <section>
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
          <Wifi className="h-3.5 w-3.5" /> Connectivity
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <Field label="WiFi SSID" value={ctx.wifiSsid} onChange={v => update('wifiSsid', v)} placeholder="HM_Villa_Sol" />
          <Field label="WiFi password" value={ctx.wifiPassword} onChange={v => update('wifiPassword', v)} placeholder="•••••••" />
        </div>
      </section>

      {/* Section: Access */}
      <section>
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
          <Key className="h-3.5 w-3.5" /> Access
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Door code (permanent)" value={ctx.doorCode} onChange={v => update('doorCode', v)} placeholder="1234" />
          <Field label="Smart lock code (rotating)" value={ctx.smartLockPassword} onChange={v => update('smartLockPassword', v)} placeholder="Auto-rotated" />
        </div>
      </section>

      {/* Section: Emergency */}
      <section>
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
          <Phone className="h-3.5 w-3.5" /> Emergency contact
        </h4>
        <Field label="Manager's emergency WhatsApp (with country code)" value={ctx.emergencyWhatsapp} onChange={v => update('emergencyWhatsapp', v)} placeholder="+34 600 000 000" />
      </section>

      {/* Section: Check-in / Check-out */}
      <section>
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
          <LogIn className="h-3.5 w-3.5" /> Check-in / <LogOut className="h-3.5 w-3.5" /> Check-out
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <TextArea label="Check-in instructions" value={ctx.checkInInstructions} onChange={v => update('checkInInstructions', v)} rows={3} placeholder="Enter via main door using code. Turn on water valve under sink before using bathrooms." />
          <TextArea label="Check-out instructions" value={ctx.checkOutInstructions} onChange={v => update('checkOutInstructions', v)} rows={3} placeholder="Leave keys inside. Shut main water valve. Empty fridge." />
        </div>
      </section>

      {/* Section: Parking */}
      <section>
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
          <Car className="h-3.5 w-3.5" /> Parking
        </h4>
        <TextArea label="How/where to park" value={ctx.parkingInstructions} onChange={v => update('parkingInstructions', v)} rows={2} placeholder="Public parking 50m downhill. Blue zone Mon-Fri 9-14h. Private garage door opens with remote on key ring." />
      </section>

      {/* Section: Appliances & quirks */}
      <section>
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
          <Zap className="h-3.5 w-3.5" /> Appliances & critical notes
        </h4>
        <TextArea label="Appliances info (important things the guest must know)" value={ctx.appliancesInfo} onChange={v => update('appliancesInfo', v)} rows={3} placeholder="Running AC + oven + washing machine together trips the main breaker. Hot water takes 30 seconds to arrive." />
      </section>

      {/* Section: Utility locations */}
      <section>
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5" /> Utility locations
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Breaker / fuse box location" value={ctx.breakerLocation} onChange={v => update('breakerLocation', v)} placeholder="Cabinet next to entrance, top shelf" />
          <Field label="Main water shutoff" value={ctx.waterShutoffLocation} onChange={v => update('waterShutoffLocation', v)} placeholder="Under kitchen sink, red valve" />
        </div>
      </section>

      {/* Section: Property-specific quirks */}
      <section>
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
          <Droplet className="h-3.5 w-3.5" /> Property-specific quirks
        </h4>
        <p className="text-[11px] text-gray-500 mb-2">
          Add anything particular the AI should know. These are injected into every response.
        </p>
        <div className="space-y-1.5 mb-2">
          {(ctx.propertyQuirks ?? []).map((q, i) => (
            <div key={i} className="flex items-start gap-2 rounded-lg border bg-white px-3 py-2">
              <span className="flex-1 text-sm text-gray-700">{q}</span>
              <button onClick={() => removeQuirk(i)} className="shrink-0 text-gray-300 hover:text-red-500">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={quirkInput}
            onChange={e => setQuirkInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addQuirk() } }}
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
            placeholder="e.g. The dishwasher needs to start on ECO mode to finish in under 3h" />
          <button onClick={addQuirk} className="rounded-lg bg-hm-black text-white px-3 py-2 text-xs font-semibold flex items-center gap-1">
            <Plus className="h-3 w-3" /> Add
          </button>
        </div>
      </section>

      {/* Section: Digital guide */}
      <section>
        <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5" /> Digital house manual (optional)
        </h4>
        <Field label="URL to full guide PDF or web page" value={ctx.guestGuideUrl} onChange={v => update('guestGuideUrl', v)} placeholder="https://..." />
      </section>

      {/* Save button */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t">
        {saved && <span className="text-xs text-emerald-600 font-semibold">✓ Saved</span>}
        <button onClick={save} disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-hm-black text-white px-4 py-2 text-sm font-semibold disabled:opacity-50">
          <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save AI context'}
        </button>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: {
  label: string
  value?: string | null
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-600 mb-1">{label}</label>
      <input type="text" value={value ?? ''} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" />
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder, rows = 2 }: {
  label: string
  value?: string | null
  onChange: (v: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-gray-600 mb-1">{label}</label>
      <textarea value={value ?? ''} onChange={e => onChange(e.target.value)} rows={rows}
        placeholder={placeholder}
        className="w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-hm-gold" />
    </div>
  )
}
