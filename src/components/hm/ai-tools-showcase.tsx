"use client"

import { useLocale } from "@/i18n/provider"
import { Brain, MessageCircle, Shield, Globe, BarChart3 } from "lucide-react"

const TOOL_ICONS = [Brain, MessageCircle, Shield, Globe, BarChart3]

export function AiToolsShowcase() {
  const { t } = useLocale()

  return (
    <section className="py-20 sm:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: "#B08A3E" }}>
            {t('aiTools.badge')}
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: "#0B1E3A" }}>
            {t('aiTools.title')}
          </h2>
          <p className="mt-4 text-gray-500 text-lg">{t('aiTools.subtitle')}</p>
        </div>

        <div className="grid md:grid-cols-5 gap-4">
          {TOOL_ICONS.map((Icon, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 border transition-all hover:shadow-lg hover:border-[#B08A3E]/30 group"
              style={{ borderColor: "#E5E7EB" }}
            >
              <div
                className="h-11 w-11 rounded-xl flex items-center justify-center mb-4 transition-colors group-hover:scale-110"
                style={{ background: "rgba(176,138,62,0.1)" }}
              >
                <Icon className="h-5 w-5" style={{ color: "#B08A3E" }} />
              </div>
              <h3 className="font-bold text-sm mb-2" style={{ color: "#0B1E3A" }}>
                {t(`aiTools.tools.${i}.name`)}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                {t(`aiTools.tools.${i}.desc`)}
              </p>
              <div className="pt-3 border-t" style={{ borderColor: "#f3f4f6" }}>
                <p className="text-lg font-bold" style={{ color: "#B08A3E" }}>
                  {t(`aiTools.tools.${i}.stat`)}
                </p>
                <p className="text-[11px] text-gray-400 uppercase tracking-wider">
                  {t(`aiTools.tools.${i}.statLabel`)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
