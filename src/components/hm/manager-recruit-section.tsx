"use client"

import { useState } from "react"
import {
  Briefcase, Users, TrendingUp, MapPin, ArrowRight, CheckCircle2,
  Globe, Shield, Zap, DollarSign, ChevronRight, Wrench,
} from "lucide-react"
import { useLocale } from "@/i18n/provider"

const PLAN_FEES = [
  { plan: "Starter", fee: 0 },
  { plan: "Basic", fee: 89 },
  { plan: "Mid", fee: 159 },
  { plan: "Premium", fee: 269 },
]
const AVG_MONTHLY_FEE = 159
const SUB_SHARE = 0.15
const RENTAL_SHARE = 0.03
const AVG_GROSS_RENTAL = 1800

function calcEarnings(clients: number) {
  const subIncome = clients * AVG_MONTHLY_FEE * SUB_SHARE
  const rentalIncome = clients * AVG_GROSS_RENTAL * RENTAL_SHARE
  const bonus = clients >= 30 ? 750 : clients >= 20 ? 400 : clients >= 10 ? 150 : 0
  return { subIncome, rentalIncome, bonus, total: subIncome + rentalIncome + bonus }
}

const fmtEUR = (n: number) => `€${Math.round(n).toLocaleString('en')}`

export function ManagerRecruitSection() {
  const { t } = useLocale()
  const [clients, setClients] = useState(10)
  const earnings = calcEarnings(clients)

  return (
    <section id="manager" className="py-20 sm:py-28" style={{ background: "#071328" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* ── Header ── */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium mb-6"
               style={{ background: "rgba(201,168,76,0.15)", color: "#B08A3E", border: "1px solid rgba(201,168,76,0.25)" }}>
            <Briefcase className="h-3.5 w-3.5" />
            Become a Manager
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.15]">
            Manage properties on the Costa Tropical.{" "}
            <span style={{ color: "#B08A3E" }}>Earn recurring commissions.</span>
          </h2>
          <p className="mt-5 text-lg text-gray-400 max-w-2xl mx-auto">
            You bring the owners — we handle operations, cleaning, maintenance, compliance, and AI pricing. No licence needed. Exclusive territory. Start earning in week one.
          </p>
        </div>

        {/* ── The Uber Model ── */}
        <div className="grid md:grid-cols-3 gap-5 mb-16">
          <ModelCard
            icon={Globe}
            title="Expat advantage"
            desc="You already speak the language of property owners in your zone — English, German, Dutch, Swedish. That's your edge. No real-estate licence required."
          />
          <ModelCard
            icon={MapPin}
            title="Exclusive territory"
            desc="One Manager per zone — Almuñécar, Nerja, Salobreña, La Herradura. No competition from other Managers in your area."
          />
          <ModelCard
            icon={Shield}
            title="Zero operational risk"
            desc="You don't clean, maintain, or handle guest comms. The HM Crew does that. You close deals and nurture relationships."
          />
        </div>

        {/* ── Earnings Simulator ── */}
        <div className="rounded-2xl overflow-hidden mb-16"
             style={{ background: "linear-gradient(135deg, #0B1E3A 0%, #142B4D 100%)", border: "1px solid rgba(201,168,76,0.2)" }}>
          <div className="p-8 sm:p-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,168,76,0.15)" }}>
                <DollarSign className="h-5 w-5" style={{ color: "#B08A3E" }} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Earnings simulator</h3>
                <p className="text-xs text-gray-400">Based on Mid plan (€159/mo) + avg. €1,800 gross rental/property</p>
              </div>
            </div>

            {/* Slider */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-3">
                <label className="text-sm text-gray-400">Properties in your portfolio</label>
                <span className="text-3xl font-bold text-white">{clients}</span>
              </div>
              <input
                type="range"
                min={1}
                max={40}
                value={clients}
                onChange={e => setClients(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{ background: `linear-gradient(to right, #B08A3E ${(clients / 40) * 100}%, rgba(255,255,255,0.1) ${(clients / 40) * 100}%)` }}
              />
              <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                <span>1</span>
                <span>10</span>
                <span>20</span>
                <span>30</span>
                <span>40</span>
              </div>
            </div>

            {/* Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <EarningCard label="15% subscriptions" value={fmtEUR(earnings.subIncome)} sub="/month" />
              <EarningCard label="3% gross rental" value={fmtEUR(earnings.rentalIncome)} sub="/month" />
              <EarningCard label="Portfolio bonus" value={earnings.bonus > 0 ? fmtEUR(earnings.bonus) : "—"} sub={earnings.bonus > 0 ? "/month" : `starts at 10`} />
              <EarningCard
                label="Total monthly"
                value={fmtEUR(earnings.total)}
                sub="/month"
                highlight
              />
            </div>

            <div className="rounded-lg p-3 text-center" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)" }}>
              <p className="text-sm text-gray-300">
                Annual projection: <strong className="text-white text-lg">{fmtEUR(earnings.total * 12)}</strong>/year
                {clients >= 10 && <span className="ml-2 text-xs" style={{ color: "#B08A3E" }}>+ one-time acquisition bonuses (€50–€150 per client)</span>}
              </p>
            </div>
          </div>
        </div>

        {/* ── Platform does the work ── */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-white text-center mb-8">You close. The platform does the rest.</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <PlatformCard
              icon={Users}
              title="Personal referral link"
              desc="Share your unique URL. Every owner who registers is automatically assigned to you."
            />
            <PlatformCard
              icon={TrendingUp}
              title="CRM pipeline"
              desc="Track leads from first contact to signed contract. Never lose a prospect."
            />
            <PlatformCard
              icon={Wrench}
              title="HM Crew handles ops"
              desc="Cleaning, check-in/out, maintenance, inspections — all done by our on-demand team."
            />
            <PlatformCard
              icon={Zap}
              title="AI pricing engine"
              desc="Dynamic pricing for each property. Your clients earn more — and so do you."
            />
          </div>
        </div>

        {/* ── CTA dual: Manager (main) + Crew (secondary) ── */}
        <div className="grid md:grid-cols-5 gap-6">
          {/* Manager CTA — spans 3 cols */}
          <div className="md:col-span-3 rounded-2xl p-8 sm:p-10"
               style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.04) 100%)", border: "1px solid rgba(201,168,76,0.25)" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#B08A3E" }}>Manager</p>
            <h3 className="text-2xl font-bold text-white mb-3">Ready to build your portfolio?</h3>
            <p className="text-sm text-gray-400 mb-6">
              6-month minimum contract. Exclusive territory. Commission from day one. No upfront cost.
            </p>
            <ul className="space-y-2 mb-6">
              {[
                "15% of every client's subscription — recurring",
                "3% of gross rental — recurring",
                "Portfolio bonuses: +€150 / +€400 / +€750 at 10 / 20 / 30 properties",
                "One-time acquisition bonus per client (€50–€150)",
              ].map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#B08A3E" }} />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <a
              href="#join"
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3.5 text-sm font-bold transition-all hover:scale-[1.02]"
              style={{ background: "#B08A3E", color: "#0B1E3A" }}
            >
              Apply as Manager <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Crew CTA — spans 2 cols */}
          <div className="md:col-span-2 rounded-2xl p-8"
               style={{ background: "#142B4D", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3 text-gray-500">Crew</p>
            <h3 className="text-xl font-bold text-white mb-3">Prefer hands-on work?</h3>
            <p className="text-sm text-gray-400 mb-5">
              Join our field operations team. Cleaning, maintenance, check-in/out, inspections. Paid within 24h per job.
            </p>
            <ul className="space-y-2 mb-6">
              {[
                "Work year-round (not just summer)",
                "Paid within 24 hours via platform",
                "Choose your tasks and schedule",
              ].map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-gray-500" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
            <a
              href="#join"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors"
            >
              Apply as Crew <ChevronRight className="h-4 w-4" />
            </a>
          </div>
        </div>

      </div>
    </section>
  )
}

function ModelCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="rounded-xl p-6" style={{ background: "#142B4D", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "rgba(201,168,76,0.12)" }}>
        <Icon className="h-5 w-5" style={{ color: "#B08A3E" }} />
      </div>
      <h4 className="font-bold text-white mb-2">{title}</h4>
      <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
    </div>
  )
}

function EarningCard({ label, value, sub, highlight }: { label: string; value: string; sub: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? '' : ''}`}
         style={{
           background: highlight ? "rgba(201,168,76,0.12)" : "rgba(255,255,255,0.04)",
           border: highlight ? "1px solid rgba(201,168,76,0.3)" : "1px solid rgba(255,255,255,0.06)",
         }}>
      <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-[#B08A3E]' : 'text-white'}`}>{value}</p>
      <p className="text-[10px] text-gray-500">{sub}</p>
    </div>
  )
}

function PlatformCard({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <div className="rounded-xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <Icon className="h-5 w-5 mb-3" style={{ color: "#B08A3E" }} />
      <h4 className="font-semibold text-white text-sm mb-1">{title}</h4>
      <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  )
}
