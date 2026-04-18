"use client"

import { useState } from "react"
import { useLocale } from "@/i18n/provider"
import {
  Home, CalendarDays, FileText, Wrench, MessageCircle,
  TrendingUp, CheckCircle2, Flag, BarChart3, Star,
  ArrowRight, Lock, Wifi,
} from "lucide-react"

const TABS = [
  { key: "dashboard",     icon: Home },
  { key: "bookings",      icon: CalendarDays },
  { key: "finance",       icon: FileText },
  { key: "care",          icon: Wrench },
  { key: "communication", icon: MessageCircle },
] as const

type TabKey = typeof TABS[number]["key"]

/* ── Simulated dashboard mockup ── */
function DashboardMock({ t }: { t: (k: string) => string }) {
  return (
    <div className="space-y-4">
      {/* Earnings hero */}
      <div className="rounded-xl p-6 text-center" style={{ background: "var(--hm-ivory, #FDFCF8)", border: "1px solid #E8E3D8" }}>
        <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">{t('demo.dashboard.features.0')}</p>
        <p className="text-4xl font-bold" style={{ color: "#0B1E3A" }}>€3,240</p>
        <div className="mt-3 max-w-xs mx-auto">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{t('demo.dashboard.features.1')}</span>
            <span className="font-semibold" style={{ color: "#0B1E3A" }}>78%</span>
          </div>
          <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: "78%", background: "#B08A3E" }} />
          </div>
        </div>
      </div>
      {/* Cards row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg p-3 border" style={{ borderColor: "#E8E3D8" }}>
          <div className="flex items-center gap-2 mb-1">
            <Flag className="h-3.5 w-3.5" style={{ color: "#B08A3E" }} />
            <span className="text-[10px] uppercase tracking-wider text-gray-400">{t('demo.dashboard.features.2')}</span>
          </div>
          <p className="font-semibold text-sm" style={{ color: "#0B1E3A" }}>🇬🇧 James W.</p>
          <p className="text-xs text-gray-400">15 — 22 Jul</p>
        </div>
        <div className="rounded-lg p-3 border" style={{ borderColor: "#E8E3D8" }}>
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
            <span className="text-[10px] uppercase tracking-wider text-gray-400">{t('demo.dashboard.features.3')}</span>
          </div>
          <p className="font-semibold text-sm text-green-600">All good</p>
          <p className="text-xs text-gray-400">Inspected 3d ago</p>
        </div>
        <div className="rounded-lg p-3 border" style={{ borderColor: "#E8E3D8" }}>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="h-3.5 w-3.5" style={{ color: "#2A7A4F" }} />
            <span className="text-[10px] uppercase tracking-wider text-gray-400">Smart Lock</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-green-600">Connected</span>
          </div>
        </div>
      </div>
      {/* Quick actions */}
      <div className="flex gap-2">
        {[t('demo.dashboard.features.4')?.split(': ')[1]?.split(', ') || ["Block dates", "Request visit", "View reports"]].flat().slice(0,3).map((a, i) => (
          <div key={i} className="flex-1 rounded-lg border px-3 py-2 text-center text-xs font-medium text-gray-600" style={{ borderColor: "#E8E3D8" }}>
            {a}
          </div>
        ))}
      </div>
    </div>
  )
}

function BookingsMock({ t }: { t: (k: string) => string }) {
  const bookings = [
    { guest: "🇬🇧 James W.", dates: "Jul 15 — 22", platform: "Airbnb", amount: "€1,120" },
    { guest: "🇩🇪 Anna K.", dates: "Jul 25 — Aug 1", platform: "Booking", amount: "€980" },
    { guest: "🇳🇱 Peter V.", dates: "Aug 5 — 12", platform: "Direct", amount: "€1,340" },
    { guest: "🇸🇪 Erik L.", dates: "Aug 18 — 25", platform: "Airbnb", amount: "€1,280" },
  ]
  return (
    <div className="space-y-1">
      <div className="grid grid-cols-4 text-[10px] uppercase tracking-wider text-gray-400 px-3 py-2">
        <span>Guest</span><span>Dates</span><span>Platform</span><span className="text-right">Revenue</span>
      </div>
      {bookings.map((b, i) => (
        <div key={i} className="grid grid-cols-4 items-center rounded-lg px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors" style={{ borderBottom: "1px solid #f3f4f6" }}>
          <span className="font-medium" style={{ color: "#0B1E3A" }}>{b.guest}</span>
          <span className="text-gray-500 text-xs">{b.dates}</span>
          <span className="text-xs"><span className="rounded-full px-2 py-0.5 bg-gray-100 text-gray-600">{b.platform}</span></span>
          <span className="text-right font-semibold text-sm" style={{ color: "#0B1E3A" }}>{b.amount}</span>
        </div>
      ))}
      <div className="mt-3 rounded-lg p-3 text-center text-xs text-gray-400" style={{ background: "#FAFAF8", border: "1px dashed #E8E3D8" }}>
        🔒 Aug 28 — Sep 4 · Personal use
      </div>
    </div>
  )
}

function FinanceMock({ t }: { t: (k: string) => string }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: "#E8E3D8" }}>
        <div className="px-4 py-3 flex justify-between items-center" style={{ background: "#FAFAF8" }}>
          <span className="text-sm font-semibold" style={{ color: "#0B1E3A" }}>July 2026 Statement</span>
          <span className="text-xs rounded-full px-2.5 py-0.5 font-medium" style={{ background: "rgba(176,138,62,0.15)", color: "#B08A3E" }}>PDF ↓</span>
        </div>
        <div className="divide-y" style={{ borderColor: "#f3f4f6" }}>
          {[
            { label: "Gross rental income", value: "€4,720", color: "#0B1E3A" },
            { label: "HM commission (17%)", value: "−€802", color: "#A32D2D" },
            { label: "Cleaning fees (3×)", value: "−€135", color: "#A32D2D" },
            { label: "Maintenance", value: "−€45", color: "#A32D2D" },
            { label: "Monthly plan fee (Mid)", value: "−€159", color: "#A32D2D" },
          ].map((row, i) => (
            <div key={i} className="px-4 py-2.5 flex justify-between text-sm">
              <span className="text-gray-600">{row.label}</span>
              <span className="font-medium" style={{ color: row.color }}>{row.value}</span>
            </div>
          ))}
          <div className="px-4 py-3 flex justify-between text-sm font-bold" style={{ background: "#FAFAF8" }}>
            <span style={{ color: "#0B1E3A" }}>Net payout</span>
            <span style={{ color: "#2A7A4F" }}>€3,579</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function CareMock({ t }: { t: (k: string) => string }) {
  const visits = [
    { type: "Cleaning", date: "Jul 22", status: "completed", icon: "✓" },
    { type: "Inspection", date: "Jul 23", status: "completed", icon: "✓" },
    { type: "Maintenance", date: "Jul 28", status: "scheduled", icon: "⏳" },
  ]
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg p-4 border" style={{ borderColor: "#E8E3D8" }}>
          <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Upcoming visits</p>
          <p className="text-2xl font-bold" style={{ color: "#0B1E3A" }}>2</p>
        </div>
        <div className="rounded-lg p-4 border" style={{ borderColor: "#E8E3D8" }}>
          <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Open issues</p>
          <p className="text-2xl font-bold text-green-600">0</p>
        </div>
      </div>
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E8E3D8" }}>
        {visits.map((v, i) => (
          <div key={i} className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: i < visits.length -1 ? "1px solid #f3f4f6" : "none" }}>
            <div className="flex items-center gap-3">
              <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${v.status === "completed" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>{v.icon}</span>
              <div>
                <p className="text-sm font-medium" style={{ color: "#0B1E3A" }}>{v.type}</p>
                <p className="text-xs text-gray-400">{v.date}</p>
              </div>
            </div>
            <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${v.status === "completed" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
              {v.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CommMock({ t }: { t: (k: string) => string }) {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#E8E3D8" }}>
        {/* Chat bubbles */}
        <div className="p-4 space-y-3" style={{ background: "#FAFAF8" }}>
          <div className="flex justify-end">
            <div className="rounded-xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[75%]" style={{ background: "#0B1E3A", color: "#fff" }}>
              Hi Ana, can you check the air conditioning? Guest mentioned it was slow to cool.
            </div>
          </div>
          <div className="flex justify-start">
            <div className="rounded-xl rounded-tl-sm px-4 py-2.5 text-sm max-w-[75%] border" style={{ background: "#fff", borderColor: "#E8E3D8", color: "#0B1E3A" }}>
              Done! Technician visited today — filter was clogged. Cleaned and running perfectly now. No charge (preventive maintenance).
            </div>
          </div>
          <div className="flex justify-end">
            <div className="rounded-xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[75%]" style={{ background: "#0B1E3A", color: "#fff" }}>
              Perfect, thank you! 🙏
            </div>
          </div>
        </div>
        {/* AI assistant hint */}
        <div className="px-4 py-3 flex items-center gap-2 border-t" style={{ borderColor: "#E8E3D8", background: "rgba(176,138,62,0.05)" }}>
          <Star className="h-4 w-4" style={{ color: "#B08A3E" }} />
          <span className="text-xs text-gray-500">AI Assistant available 24/7 for instant answers</span>
        </div>
      </div>
    </div>
  )
}

const MOCK_COMPONENTS: Record<TabKey, React.FC<{ t: (k: string) => string }>> = {
  dashboard: DashboardMock,
  bookings: BookingsMock,
  finance: FinanceMock,
  care: CareMock,
  communication: CommMock,
}

export function PlatformDemo() {
  const { t } = useLocale()
  const [active, setActive] = useState<TabKey>("dashboard")
  const MockComponent = MOCK_COMPONENTS[active]

  return (
    <section className="py-20 sm:py-28" style={{ background: "#0B1E3A" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#B08A3E" }}>
            {t('demo.badge')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {t('demo.title')}
          </h2>
          <p className="mt-4 text-gray-400 text-lg">{t('demo.subtitle')}</p>
        </div>

        <div className="rounded-2xl overflow-hidden border" style={{ borderColor: "rgba(176,138,62,0.2)", background: "#142B4D" }}>
          {/* Tab bar — scrollable on mobile */}
          <div className="flex border-b overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-px" style={{ borderColor: "rgba(255,255,255,0.1)", WebkitOverflowScrolling: 'touch' }}>
            {TABS.map(({ key, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 snap-start shrink-0 min-w-[120px] justify-center ${
                  active === key
                    ? "text-white border-[#B08A3E]"
                    : "text-gray-500 border-transparent hover:text-gray-300"
                }`}
              >
                <Icon className="h-4 w-4" />
                {t(`demo.tabs.${key}`)}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left: description */}
            <div className="p-5 sm:p-8 flex flex-col justify-center">
              <h3 className="text-xl font-bold text-white mb-3">
                {t(`demo.${active}.title`)}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                {t(`demo.${active}.desc`)}
              </p>
              <ul className="space-y-2">
                {[0, 1, 2, 3, 4].map((i) => {
                  const feat = t(`demo.${active}.features.${i}`)
                  if (feat === `demo.${active}.features.${i}`) return null
                  return (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#B08A3E" }} />
                      {feat}
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Right: mock UI */}
            <div className="p-6 md:p-8" style={{ background: "rgba(255,255,255,0.03)" }}>
              <div className="rounded-xl p-5 bg-white shadow-2xl">
                <MockComponent t={t} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
