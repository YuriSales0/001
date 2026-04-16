"use client"

import Link from "next/link"
import { UserPlus, Users, MessageCircle, TrendingUp, Sparkles, ArrowRight } from "lucide-react"

/**
 * First-time experience for Managers with zero clients.
 * Shown on /manager/dashboard when clientsCount === 0.
 * Provides clear next steps to get started.
 */
export function ManagerEmptyState() {
  return (
    <div className="space-y-6">
      {/* Hero welcome */}
      <div className="rounded-2xl overflow-hidden relative" style={{ background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)" }}>
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(201,168,76,0.15) 0%, transparent 70%)" }} />
        <div className="relative p-8 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium mb-4" style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.25)" }}>
            <Sparkles className="h-3.5 w-3.5" />
            Welcome to HostMasters
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white max-w-2xl leading-tight">
            Your Manager portal is ready.
            <br />
            <span style={{ color: "#C9A84C" }}>Let&rsquo;s get your first client on board.</span>
          </h2>
          <p className="text-gray-400 mt-3 max-w-xl text-sm">
            You earn 15% of monthly subscriptions + 3% of gross rental for every client you manage.
            Portfolio bonuses start at 10 properties. The system handles operations — you focus on relationships.
          </p>
        </div>
      </div>

      {/* Next steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StepCard
          number={1}
          icon={UserPlus}
          title="Add your first client"
          description="Invite a property owner from your network. The system sends them a signup link and service agreement."
          cta="Add client"
          href="/manager/clients"
        />
        <StepCard
          number={2}
          icon={TrendingUp}
          title="Help them set up"
          description="Owner uploads property info, photos, selects house rules, and signs the service agreement."
          cta="Learn the flow"
          href="/manager/clients"
          secondary
        />
        <StepCard
          number={3}
          icon={Users}
          title="Watch your portfolio grow"
          description="Track earnings, commissions, and portfolio bonuses in real time. Operations are handled by HM Crew."
          cta="See dashboard"
          href="#"
          secondary
        />
      </div>

      {/* Key info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <InfoCard label="Per client (Mid)"     value="€59/mo"   sub="15% sub + 3% rental" />
        <InfoCard label="At 10 properties"     value="+€150/mo" sub="Portfolio bonus" />
        <InfoCard label="At 20 properties"     value="+€400/mo" sub="Portfolio bonus" />
        <InfoCard label="At 30 properties"     value="+€750/mo" sub="Portfolio bonus" />
      </div>

      {/* Resources */}
      <div className="rounded-xl border bg-white p-6">
        <h3 className="font-semibold text-navy-900 mb-3">Need help getting started?</h3>
        <div className="space-y-2 text-sm">
          <Link href="/manager/profile" className="flex items-center justify-between gap-2 rounded-lg border px-4 py-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,168,76,0.15)" }}>
                <MessageCircle className="h-4 w-4" style={{ color: "#C9A84C" }} />
              </div>
              <div>
                <p className="font-semibold text-navy-900">Review your profile & compensation</p>
                <p className="text-xs text-gray-500">Check your territory, shares, and contract details</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </Link>
          <Link href="/manager/messages" className="flex items-center justify-between gap-2 rounded-lg border px-4 py-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,168,76,0.15)" }}>
                <MessageCircle className="h-4 w-4" style={{ color: "#C9A84C" }} />
              </div>
              <div>
                <p className="font-semibold text-navy-900">Contact your Admin</p>
                <p className="text-xs text-gray-500">Questions about process, territory, or commission</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
          </Link>
        </div>
      </div>
    </div>
  )
}

function StepCard({
  number, icon: Icon, title, description, cta, href, secondary,
}: {
  number: number
  icon: React.ElementType
  title: string
  description: string
  cta: string
  href: string
  secondary?: boolean
}) {
  return (
    <div className="rounded-xl border bg-white p-5 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="text-2xl font-bold text-gray-300">{number.toString().padStart(2, "0")}</span>
        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,168,76,0.15)" }}>
          <Icon className="h-4 w-4" style={{ color: "#C9A84C" }} />
        </div>
      </div>
      <h3 className="font-semibold text-navy-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1">{description}</p>
      <Link
        href={href}
        className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-all self-start ${secondary ? "border border-gray-200 text-gray-700 hover:bg-gray-50" : "bg-[#C9A84C] text-[#111827] hover:opacity-90"}`}
      >
        {cta}
        <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  )
}

function InfoCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-xl border bg-white p-4">
      <p className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-1">{label}</p>
      <p className="text-xl font-bold text-navy-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
    </div>
  )
}
