"use client"

import { HmLogo } from "./hm-logo"

/**
 * HostMasters branded loading screen.
 * Shows the HM Meridian monogram with pulse + sliding gold bar.
 * Displayed on every page transition via Next.js loading.tsx convention.
 */
export function HmLoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B1E3A]">
      <div
        className="absolute inset-0 opacity-25"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(176,138,62,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex flex-col items-center gap-8">
        {/* Logo monogram — large, pulsing */}
        <div className="hm-logo-pulse">
          <HmLogo size={80} onDark />
        </div>

        {/* Wordmark */}
        <p className="text-2xl font-semibold tracking-tight" style={{ color: '#F6F2EA' }}>
          Host<span style={{ color: "#B08A3E" }}>Masters</span>
        </p>

        {/* Sliding gold bar */}
        <div className="w-48 h-[3px] rounded-full overflow-hidden bg-white/10">
          <div className="hm-loading-bar h-full rounded-full" style={{ background: "#B08A3E" }} />
        </div>
      </div>
    </div>
  )
}
