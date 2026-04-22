"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Zap, ArrowRight, Lock } from "lucide-react"
import { useLocale } from "@/i18n/provider"

/**
 * Dashboard card shown only to Starter (free) clients.
 * Links to /client/plus — the consolidated "what you're missing" section.
 */
export function UpsellCard() {
  const { t } = useLocale()
  const [plan, setPlan] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/profile')
      .then(r => r.ok ? r.json() : null)
      .then(p => setPlan(p?.subscriptionPlan ?? 'STARTER'))
      .catch(() => setPlan('STARTER'))
  }, [])

  if (plan !== 'STARTER') return null

  return (
    <Link href="/client/plus"
      className="block rounded-2xl overflow-hidden group transition-transform hover:scale-[1.005]"
      style={{ background: 'linear-gradient(135deg, #0B1E3A 0%, #1F3A66 100%)' }}>
      <div className="px-6 py-5 md:px-8 md:py-6 text-white relative">
        <div className="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity">
          <Lock className="h-16 w-16" style={{ color: '#B08A3E' }} />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#B08A3E' }}>
          <Zap className="h-3.5 w-3.5" />
          {t('client.plus.cardBadge') || 'Starter Plan'}
        </div>
        <h3 className="text-xl md:text-2xl font-serif font-bold mb-2 max-w-lg">
          {t('client.plus.cardTitle') || "Your property isn't reaching its potential"}
        </h3>
        <p className="text-sm text-white/70 max-w-xl mb-4">
          {t('client.plus.cardBody') || 'See 10+ features you are missing — AI pricing, smart lock, fiscal compliance, voice feedback. Upgrade or buy individually, no commitment.'}
        </p>
        <div className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold"
          style={{ background: '#B08A3E', color: '#0B1E3A' }}>
          {t('client.plus.cardCta') || 'See what you are missing'} <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </Link>
  )
}
