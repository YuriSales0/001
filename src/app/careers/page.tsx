"use client"

import Link from "next/link"
import { Building2, ArrowLeft } from "lucide-react"
import { LanguageSelector } from "@/components/hm/language-selector"
import { ManagerRecruitSection } from "@/components/hm/manager-recruit-section"
import { JoinHostMasters } from "@/components/hm/join-hostmasters"

export default function CareersPage() {
  return (
    <div className="min-h-screen" style={{ fontFamily: "system-ui, -apple-system, sans-serif", background: "#0d1420" }}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-[#111827]/90 backdrop-blur-md" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full flex items-center justify-center" style={{ background: "#C9A84C" }}>
              <Building2 className="h-[18px] w-[18px] text-white" />
            </div>
            <span className="text-lg font-bold text-white">
              Host<span style={{ color: "#C9A84C" }}>Masters</span>
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a href="#manager" className="hover:text-white transition-colors">Manager</a>
            <a href="#join" className="hover:text-white transition-colors">Crew</a>
            <a href="#join" className="hover:text-white transition-colors">Apply</a>
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> Back to site
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold px-5 py-2.5 rounded-lg transition-all hover:opacity-90"
              style={{ background: "#C9A84C", color: "#111827" }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </header>

      {/* Manager Recruitment — full detailed section */}
      <ManagerRecruitSection />

      {/* Application form (Managers + Crew) */}
      <JoinHostMasters />

      {/* Footer */}
      <footer className="border-t py-10" style={{ borderColor: "rgba(255,255,255,0.06)", background: "#0a0f18" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full flex items-center justify-center" style={{ background: "#C9A84C" }}>
              <Building2 className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-bold text-white">
              Host<span style={{ color: "#C9A84C" }}>Masters</span>
            </span>
            <span className="text-xs text-gray-500 ml-2">Costa Tropical · España</span>
          </div>
          <p className="text-xs text-gray-600">
            © {new Date().getFullYear()} HostMasters. Property management powered by AI.
          </p>
        </div>
      </footer>
    </div>
  )
}
