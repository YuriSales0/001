"use client"

import Link from "next/link"
import { UserPlus, Users, MessageCircle, TrendingUp, Sparkles, ArrowRight } from "lucide-react"
import { useLocale } from "@/i18n/provider"

/**
 * First-time experience for Managers with zero clients.
 * Shown on /manager/dashboard when clientsCount === 0.
 * Provides clear next steps to get started.
 */
export function ManagerEmptyState() {
  const { t } = useLocale()
  return (
    <div className="space-y-6">
      {/* Hero welcome */}
      <div className="rounded-2xl overflow-hidden relative" style={{ background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)" }}>
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(ellipse at 30% 50%, rgba(201,168,76,0.15) 0%, transparent 70%)" }} />
        <div className="relative p-8 sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium mb-4" style={{ background: "rgba(201,168,76,0.15)", color: "#C9A84C", border: "1px solid rgba(201,168,76,0.25)" }}>
            <Sparkles className="h-3.5 w-3.5" />
            {t('manager.welcome.badge')}
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white max-w-2xl leading-tight">
            {t('manager.welcome.titleLine1')}
            <br />
            <span style={{ color: "#C9A84C" }}>{t('manager.welcome.titleLine2')}</span>
          </h2>
          <p className="text-gray-400 mt-3 max-w-xl text-sm">
            {t('manager.welcome.description')}
          </p>
        </div>
      </div>

      {/* Next steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StepCard
          number={1}
          icon={UserPlus}
          title={t('manager.welcome.step1Title')}
          description={t('manager.welcome.step1Desc')}
          cta={t('manager.welcome.step1Cta')}
          href="/manager/clients/invite"
        />
        <StepCard
          number={2}
          icon={TrendingUp}
          title={t('manager.welcome.step2Title')}
          description={t('manager.welcome.step2Desc')}
          cta={t('manager.welcome.step2Cta')}
          href="/manager/clients"
          secondary
        />
        <StepCard
          number={3}
          icon={Users}
          title={t('manager.welcome.step3Title')}
          description={t('manager.welcome.step3Desc')}
          cta={t('manager.welcome.step3Cta')}
          href="/manager/dashboard"
          secondary
        />
      </div>

      {/* Key info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <InfoCard label={t('manager.welcome.infoPerClient')} value="€59/mo"   sub={t('manager.welcome.infoPerClientSub')} />
        <InfoCard label={t('manager.welcome.infoAt10')}      value="+€150/mo" sub={t('manager.welcome.infoBonus')} />
        <InfoCard label={t('manager.welcome.infoAt20')}      value="+€400/mo" sub={t('manager.welcome.infoBonus')} />
        <InfoCard label={t('manager.welcome.infoAt30')}      value="+€750/mo" sub={t('manager.welcome.infoBonus')} />
      </div>

      {/* Resources */}
      <div className="rounded-xl border bg-white p-6">
        <h3 className="font-semibold text-navy-900 mb-3">{t('manager.welcome.helpTitle')}</h3>
        <div className="space-y-2 text-sm">
          <Link href="/manager/profile" className="flex items-center justify-between gap-2 rounded-lg border px-4 py-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(201,168,76,0.15)" }}>
                <MessageCircle className="h-4 w-4" style={{ color: "#C9A84C" }} />
              </div>
              <div>
                <p className="font-semibold text-navy-900">{t('manager.welcome.helpProfileTitle')}</p>
                <p className="text-xs text-gray-500">{t('manager.welcome.helpProfileDesc')}</p>
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
                <p className="font-semibold text-navy-900">{t('manager.welcome.helpContactTitle')}</p>
                <p className="text-xs text-gray-500">{t('manager.welcome.helpContactDesc')}</p>
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
