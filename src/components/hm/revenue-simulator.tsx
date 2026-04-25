"use client"

import { useState } from "react"
import { TrendingUp } from "lucide-react"
import {
  PLAN_COMMISSION,
  PLAN_MONTHLY_FEE,
  CLEANING_FEE_STANDARD,
  CLEANING_INCLUDED_MIN_NIGHTS,
} from "@/lib/finance"

// Assumed average guest stay, used to estimate turnovers and decide
// whether plan-level "cleaning included" thresholds apply.
const AVG_STAY_NIGHTS = 4.5

// Deterministic number format (avoids hydration mismatch from locale-dependent toLocaleString)
function fmt(n: number): string {
  const abs = Math.abs(n)
  const parts = abs.toString().split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return (n < 0 ? '-' : '') + parts.join(',')
}

export function RevenueSimulator({
  initialNights = 120,
  initialAvgPrice = 110,
  title = "See exactly how much you keep with each plan",
  subtitle = "Adjust to your property. Numbers include AI pricing uplift, commission, fees and cleaning costs.",
  className,
}: {
  initialNights?: number
  initialAvgPrice?: number
  title?: string
  subtitle?: string
  className?: string
}) {
  const [nights, setNights] = useState(initialNights)
  const [avgPrice, setAvgPrice] = useState(initialAvgPrice)

  const avgTurnovers = Math.ceil(nights / AVG_STAY_NIGHTS)
  const grossAnnual = nights * avgPrice

  const plans = (['STARTER', 'BASIC', 'MID', 'PREMIUM'] as const).map(tier => {
    const pricingUplift = tier === 'MID' ? 1.18 : tier === 'PREMIUM' ? 1.25 : 1.0
    // Occupancy uplift: Basic gets +8% from Guest Stay Chat + VAGF (better reviews → more repeat bookings)
    // Mid/Premium also get +8% (same guest experience benefits on top of pricing).
    const occupancyUplift = tier === 'MID' || tier === 'PREMIUM' || tier === 'BASIC' ? 1.08 : 1.0
    const adjustedGross = Math.round(grossAnnual * pricingUplift * occupancyUplift)
    const commission = Math.round(adjustedGross * PLAN_COMMISSION[tier])
    const monthlyFee = PLAN_MONTHLY_FEE[tier] * 12
    const cleaningThreshold = CLEANING_INCLUDED_MIN_NIGHTS[tier]
    const cleaningIncluded = cleaningThreshold !== null && AVG_STAY_NIGHTS >= cleaningThreshold
    const cleaningCost = cleaningIncluded ? 0 : avgTurnovers * CLEANING_FEE_STANDARD[tier]
    const totalCost = commission + monthlyFee + cleaningCost
    const net = adjustedGross - totalCost
    return {
      tier,
      label: tier.charAt(0) + tier.slice(1).toLowerCase(),
      adjustedGross,
      commission,
      monthlyFee,
      cleaningCost,
      cleaningIncluded,
      totalCost,
      net,
      pricingUplift,
    }
  })

  const best = plans.reduce((a, b) => a.net > b.net ? a : b)
  const starter = plans[0]
  const bestIdx = plans.findIndex(p => p.tier === best.tier)

  return (
    <section
      className={`rounded-2xl border-2 p-6 md:p-8 bg-white ${className ?? ''}`}
      style={{ borderColor: 'rgba(176,138,62,0.4)' }}
    >
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#B08A3E' }}>
        <TrendingUp className="h-3.5 w-3.5" /> Revenue simulator
      </div>
      <h3 className="text-2xl font-serif font-bold text-hm-black mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-6">{subtitle}</p>

      {/* Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6 max-w-2xl">
        <div>
          <label className="text-xs text-gray-600 flex justify-between mb-1">
            <span>Rented nights / year</span>
            <span className="font-bold text-hm-black">{nights}</span>
          </label>
          <input type="range" min={30} max={300} value={nights}
            onChange={e => setNights(Number(e.target.value))}
            className="w-full accent-hm-gold" />
          <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
            <span>30</span><span>150</span><span>300</span>
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-600 flex justify-between mb-1">
            <span>Avg price / night (€)</span>
            <span className="font-bold text-hm-black">€{avgPrice}</span>
          </label>
          <input type="range" min={50} max={350} value={avgPrice}
            onChange={e => setAvgPrice(Number(e.target.value))}
            className="w-full accent-hm-gold" />
          <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
            <span>€50</span><span>€200</span><span>€350</span>
          </div>
        </div>
      </div>

      {/* Mobile: stacked plan cards (all 4 plans visible without horizontal scroll) */}
      <div className="sm:hidden space-y-3">
        {plans.map(p => {
          const isBest = p.tier === best.tier
          const delta = p.net - starter.net
          return (
            <div
              key={p.tier}
              className={`rounded-xl border p-4 ${isBest ? 'bg-hm-gold/5' : 'bg-white'}`}
              style={{ borderColor: isBest ? 'rgba(176,138,62,0.5)' : '#E5E7EB' }}
            >
              <div className="flex items-baseline justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base" style={isBest ? { color: '#B08A3E' } : { color: '#0B1E3A' }}>
                    {p.label}
                  </span>
                  {isBest && (
                    <span className="text-[9px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5"
                      style={{ background: 'rgba(176,138,62,0.15)', color: '#B08A3E' }}>
                      Best for you
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={isBest ? { color: '#B08A3E' } : { color: '#0B1E3A' }}>
                    €{fmt(p.net)}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-gray-400">You keep</div>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Gross revenue {p.pricingUplift > 1 && <span className="text-[10px] text-gray-400">(+{Math.round((p.pricingUplift - 1) * 100)}% AI)</span>}
                  </span>
                  <span className="text-hm-black font-semibold">€{fmt(p.adjustedGross)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Commission ({Math.round(PLAN_COMMISSION[p.tier] * 100)}%)</span>
                  <span className="text-gray-500">-€{fmt(p.commission)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Monthly fee {p.monthlyFee > 0 ? `(€${PLAN_MONTHLY_FEE[p.tier]}/mo × 12)` : ''}
                  </span>
                  <span className="text-gray-500">{p.monthlyFee ? `-€${fmt(p.monthlyFee)}` : 'free'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Cleaning (×{avgTurnovers}) {p.cleaningIncluded && <span className="text-[10px] text-emerald-600 font-semibold">included</span>}
                  </span>
                  <span className="text-gray-500">{p.cleaningIncluded ? '€0' : `-€${fmt(p.cleaningCost)}`}</span>
                </div>
              </div>
              {p.tier !== 'STARTER' && (
                <div className={`mt-3 pt-2 border-t text-[11px] font-semibold ${delta > 0 ? 'text-emerald-600' : 'text-red-600'}`}
                     style={{ borderColor: '#f0ece3' }}>
                  {delta > 0 ? '+' : ''}{fmt(delta)}/yr vs Starter
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Desktop/tablet: comparison table */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2">
              <th className="text-left py-3 pr-4 text-xs text-gray-500 font-semibold" />
              {plans.map(p => (
                <th key={p.tier} className={`text-center py-3 px-3 ${p.tier === best.tier ? 'bg-hm-gold/5 rounded-t-xl' : ''}`}>
                  <span className={`text-xs font-bold ${p.tier === best.tier ? '' : 'text-gray-700'}`}
                    style={p.tier === best.tier ? { color: '#B08A3E' } : {}}>
                    {p.label}
                  </span>
                  {p.tier === best.tier && (
                    <span className="block text-[9px] font-bold uppercase tracking-wider mt-0.5"
                      style={{ color: '#B08A3E' }}>Best for you</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="text-xs">
            <SimRow label="Gross revenue" values={plans.map(p => `€${fmt(p.adjustedGross)}`)}
              sublabel={plans.map(p => p.pricingUplift > 1 ? `+${Math.round((p.pricingUplift - 1) * 100)}% AI` : 'static')}
              bestIdx={bestIdx} />
            <SimRow label="Commission" values={plans.map(p => `-€${fmt(p.commission)}`)}
              sublabel={plans.map(p => `${Math.round(PLAN_COMMISSION[p.tier] * 100)}%`)}
              bestIdx={bestIdx} neg />
            <SimRow label="Monthly fee (×12)" values={plans.map(p => p.monthlyFee ? `-€${fmt(p.monthlyFee)}` : '€0')}
              sublabel={plans.map(p => p.monthlyFee ? `€${PLAN_MONTHLY_FEE[p.tier]}/mo` : 'free')}
              bestIdx={bestIdx} neg />
            <SimRow label={`Cleaning (×${avgTurnovers})`}
              values={plans.map(p => p.cleaningIncluded ? '€0' : `-€${fmt(p.cleaningCost)}`)}
              sublabel={plans.map(p => p.cleaningIncluded ? 'included' : `€${CLEANING_FEE_STANDARD[p.tier]}/turn`)}
              bestIdx={bestIdx} neg />
            <tr className="border-t-2 font-bold">
              <td className="py-3 pr-4 text-hm-black">You keep</td>
              {plans.map(p => (
                <td key={p.tier} className={`text-center py-3 px-3 text-base ${
                  p.tier === best.tier ? 'bg-hm-gold/5 rounded-b-xl' : ''
                }`}>
                  <span className={p.net === best.net ? '' : p.net < starter.net ? 'text-red-600' : 'text-emerald-600'}
                    style={p.net === best.net ? { color: '#B08A3E' } : {}}>
                    €{fmt(p.net)}
                  </span>
                  {p.tier !== 'STARTER' && (
                    <span className={`block text-[10px] font-semibold mt-0.5 ${
                      p.net > starter.net ? 'text-emerald-600' : 'text-red-600'
                    }`}>
                      {p.net > starter.net ? '+' : ''}{fmt(p.net - starter.net)}/yr vs Starter
                    </span>
                  )}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-[10px] text-gray-500 mt-4 text-center">
        Estimates based on Costa Tropical market data. Assumes avg stay {AVG_STAY_NIGHTS} nights.
        AI pricing uplift: +18% (Mid), +25% (Premium).
        Occupancy uplift: +8% on all paid plans (Basic+) from Guest Stay Chat + voice feedback driving better reviews.
        Cleaning included on Mid (stays ≥4 nights) and Premium (stays ≥3 nights).
        Actual results vary by property and season.
      </p>
    </section>
  )
}

function SimRow({ label, values, sublabel, bestIdx, neg }: {
  label: string
  values: string[]
  sublabel?: string[]
  bestIdx: number
  neg?: boolean
}) {
  return (
    <tr className="border-b">
      <td className="py-2.5 pr-4 text-gray-600">{label}</td>
      {values.map((v, i) => (
        <td key={i} className={`text-center py-2.5 px-3 ${i === bestIdx ? 'bg-hm-gold/5' : ''}`}>
          <span className={neg ? 'text-gray-500' : 'text-hm-black font-semibold'}>{v}</span>
          {sublabel?.[i] && (
            <span className="block text-[9px] text-gray-500">{sublabel[i]}</span>
          )}
        </td>
      ))}
    </tr>
  )
}
