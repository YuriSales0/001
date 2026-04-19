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
               style={{ background: "rgba(176,138,62,0.15)", color: "#B08A3E", border: "1px solid rgba(176,138,62,0.25)" }}>
            <Briefcase className="h-3.5 w-3.5" />
            {t("landing.join.manager.badge")}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-[1.15]">
            {t("landing.join.manager.headline")}{" "}
            <span style={{ color: "#B08A3E" }}>{t("landing.join.manager.headlineHighlight")}</span>
          </h2>
          <p className="mt-5 text-lg text-gray-400 max-w-2xl mx-auto">
            {t("landing.join.manager.description")}
          </p>
        </div>

        {/* ── The Uber Model ── */}
        <div className="grid md:grid-cols-3 gap-5 mb-16">
          <ModelCard
            icon={Globe}
            title={t("landing.join.manager.expatTitle")}
            desc={t("landing.join.manager.expatDesc")}
          />
          <ModelCard
            icon={MapPin}
            title={t("landing.join.manager.territoryTitle")}
            desc={t("landing.join.manager.territoryDesc")}
          />
          <ModelCard
            icon={Shield}
            title={t("landing.join.manager.riskTitle")}
            desc={t("landing.join.manager.riskDesc")}
          />
        </div>

        {/* ── Earnings Simulator ── */}
        <div className="rounded-2xl overflow-hidden mb-16"
             style={{ background: "linear-gradient(135deg, #0B1E3A 0%, #142B4D 100%)", border: "1px solid rgba(176,138,62,0.2)" }}>
          <div className="p-8 sm:p-10">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: "rgba(176,138,62,0.15)" }}>
                <DollarSign className="h-5 w-5" style={{ color: "#B08A3E" }} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{t("landing.join.manager.simulatorTitle")}</h3>
                <p className="text-xs text-gray-400">{t("landing.join.manager.simulatorSub")}</p>
              </div>
            </div>

            {/* Slider */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-3">
                <label className="text-sm text-gray-400">{t("landing.join.manager.sliderLabel")}</label>
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
              <EarningCard label={t("landing.join.manager.labelSubscriptions")} value={fmtEUR(earnings.subIncome)} sub={t("landing.join.manager.perMonth")} />
              <EarningCard label={t("landing.join.manager.labelRental")} value={fmtEUR(earnings.rentalIncome)} sub={t("landing.join.manager.perMonth")} />
              <EarningCard label={t("landing.join.manager.labelBonus")} value={earnings.bonus > 0 ? fmtEUR(earnings.bonus) : "—"} sub={earnings.bonus > 0 ? t("landing.join.manager.perMonth") : t("landing.join.manager.startsAt")} />
              <EarningCard
                label={t("landing.join.manager.labelTotal")}
                value={fmtEUR(earnings.total)}
                sub={t("landing.join.manager.perMonth")}
                highlight
              />
            </div>

            <div className="rounded-lg p-3 text-center" style={{ background: "rgba(176,138,62,0.08)", border: "1px solid rgba(176,138,62,0.15)" }}>
              <p className="text-sm text-gray-300">
                {t("landing.join.manager.annualProjection")} <strong className="text-white text-lg">{fmtEUR(earnings.total * 12)}</strong>{t("landing.join.manager.perYear")}
                {clients >= 10 && <span className="ml-2 text-xs" style={{ color: "#B08A3E" }}>{t("landing.join.manager.acquisitionBonuses")}</span>}
              </p>
            </div>
          </div>
        </div>

        {/* ── Platform does the work ── */}
        <div className="mb-16">
          <h3 className="text-2xl font-bold text-white text-center mb-8">{t("landing.join.manager.platformTitle")}</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <PlatformCard
              icon={Users}
              title={t("landing.join.manager.referralTitle")}
              desc={t("landing.join.manager.referralDesc")}
            />
            <PlatformCard
              icon={TrendingUp}
              title={t("landing.join.manager.crmTitle")}
              desc={t("landing.join.manager.crmDesc")}
            />
            <PlatformCard
              icon={Wrench}
              title={t("landing.join.manager.crewOpsTitle")}
              desc={t("landing.join.manager.crewOpsDesc")}
            />
            <PlatformCard
              icon={Zap}
              title={t("landing.join.manager.aiTitle")}
              desc={t("landing.join.manager.aiDesc")}
            />
          </div>
        </div>

        {/* ── CTA dual: Manager (main) + Crew (secondary) ── */}
        <div className="grid md:grid-cols-5 gap-6">
          {/* Manager CTA — spans 3 cols */}
          <div className="md:col-span-3 rounded-2xl p-8 sm:p-10"
               style={{ background: "linear-gradient(135deg, rgba(176,138,62,0.12) 0%, rgba(176,138,62,0.04) 100%)", border: "1px solid rgba(176,138,62,0.25)" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#B08A3E" }}>{t("landing.join.manager.roleLabel")}</p>
            <h3 className="text-2xl font-bold text-white mb-3">{t("landing.join.manager.ctaTitle")}</h3>
            <p className="text-sm text-gray-400 mb-6">
              {t("landing.join.manager.ctaDesc")}
            </p>
            <ul className="space-y-2 mb-6">
              {[
                t("landing.join.manager.ctaPoint1"),
                t("landing.join.manager.ctaPoint2"),
                t("landing.join.manager.ctaPoint3"),
                t("landing.join.manager.ctaPoint4"),
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
              {t("landing.join.manager.cta")} <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Crew CTA — spans 2 cols */}
          <div className="md:col-span-2 rounded-2xl p-8"
               style={{ background: "#142B4D", border: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3 text-gray-500">{t("landing.join.crew.roleLabel")}</p>
            <h3 className="text-xl font-bold text-white mb-3">{t("landing.join.crew.ctaTitle")}</h3>
            <p className="text-sm text-gray-400 mb-5">
              {t("landing.join.crew.ctaDesc")}
            </p>
            <ul className="space-y-2 mb-6">
              {[
                t("landing.join.crew.ctaPoint1"),
                t("landing.join.crew.ctaPoint2"),
                t("landing.join.crew.ctaPoint3"),
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
              {t("landing.join.crew.cta")} <ChevronRight className="h-4 w-4" />
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
      <div className="h-10 w-10 rounded-lg flex items-center justify-center mb-4" style={{ background: "rgba(176,138,62,0.12)" }}>
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
           background: highlight ? "rgba(176,138,62,0.12)" : "rgba(255,255,255,0.04)",
           border: highlight ? "1px solid rgba(176,138,62,0.3)" : "1px solid rgba(255,255,255,0.06)",
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
