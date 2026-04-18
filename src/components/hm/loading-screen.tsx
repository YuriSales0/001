"use client"

import { HmLogo } from "./hm-logo"

/**
 * HostMasters branded loading screen.
 * Shows the HM Meridian monogram with a gold pulse animation.
 */
export function HmLoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B1E3A]">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(176,138,62,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex flex-col items-center gap-6">
        <div className="hm-logo-pulse">
          <HmLogo size={64} onDark />
        </div>

        <div className="text-center">
          <p className="text-xl font-semibold tracking-tight" style={{ color: '#F6F2EA' }}>
            Host<span style={{ color: "#B08A3E" }}>Masters</span>
          </p>
        </div>

        <div className="w-40 h-1 rounded-full overflow-hidden bg-white/10">
          <div className="hm-loading-bar h-full rounded-full" style={{ background: "#B08A3E" }} />
        </div>
      </div>
    </div>
  )
}
