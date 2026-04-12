"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"
import { useLocale } from "@/i18n/provider"
import { LOCALES } from "@/i18n"

interface LanguageSelectorProps {
  className?: string
}

export function LanguageSelector({ className }: LanguageSelectorProps) {
  const { locale, setLocale } = useLocale()
  const [open, setOpen] = useState(false)
  const selected = LOCALES.find(l => l.code === locale) ?? LOCALES[0]

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg border border-hm-border bg-hm-sand px-3 py-2 text-sm font-serif text-hm-slate hover:border-hm-gold/50 transition-colors"
      >
        <span className="text-base">{selected.flag}</span>
        <span className="hidden sm:inline">{selected.label}</span>
        <ChevronDown className="h-3 w-3 opacity-60" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 min-w-[160px] rounded-hm border border-hm-border bg-hm-ivory shadow-lg">
            {LOCALES.map(lang => (
              <button
                key={lang.code}
                onClick={() => {
                  setLocale(lang.code)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-serif hover:bg-hm-sand transition-colors text-left",
                  locale === lang.code ? "text-hm-gold-dk font-semibold" : "text-hm-slate"
                )}
              >
                <span className="text-base">{lang.flag}</span>
                {lang.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
