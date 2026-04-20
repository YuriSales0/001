"use client"

import { HmLogo } from "@/components/hm/hm-logo"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  const [partnerName, setPartnerName] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetch("/api/partner/dashboard")
      .then(res => {
        if (!res.ok) return null
        return res.json()
      })
      .then(data => {
        if (data?.partner?.name) setPartnerName(data.partner.name)
      })
      .catch(() => {})
  }, [])

  const handleLogout = () => {
    document.cookie = "hm_partner_token=; path=/; max-age=0"
    router.push("/partner/login")
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HmLogo size={28} variant="compact" />
            <span className="text-xs text-gray-400 hidden sm:inline">Partner Portal</span>
          </div>
          <div className="flex items-center gap-4">
            {partnerName && (
              <span className="text-sm text-gray-600 font-medium">{partnerName}</span>
            )}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
