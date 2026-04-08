"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

const languages = [
  { code: "en", label: "English",    flag: "🇬🇧" },
  { code: "de", label: "Deutsch",    flag: "🇩🇪" },
  { code: "sv", label: "Svenska",    flag: "🇸🇪" },
  { code: "nl", label: "Nederlands", flag: "🇳🇱" },
  { code: "no", label: "Norsk",      flag: "🇳🇴" },
  { code: "da", label: "Dansk",      flag: "🇩🇰" },
]

interface LanguageSelectorProps {
  current?: string
  onChange?: (code: string) => void
  className?: string
}

export function LanguageSelector({ current = "en", onChange, className }: LanguageSelectorProps) {
  const [open, setOpen] = useState(false)
  const selected = languages.find(l => l.code === current) ?? languages[0]

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
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => {
                  onChange?.(lang.code)
                  setOpen(false)
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-serif hover:bg-hm-sand transition-colors text-left",
                  current === lang.code ? "text-hm-gold-dk font-semibold" : "text-hm-slate"
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
