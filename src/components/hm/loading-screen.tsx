"use client"

/**
 * HostMasters branded loading screen.
 * Shows the HM logo with a gold pulse animation.
 * Used as the global loading.tsx fallback for all route transitions.
 */
export function HmLoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B1E3A]">
      {/* Subtle background glow */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(201,168,76,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex flex-col items-center gap-6">
        {/* Logo mark */}
        <div className="hm-logo-pulse relative">
          <div
            className="h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg"
            style={{ background: "#B08A3E" }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
        </div>

        {/* Wordmark */}
        <div className="text-center">
          <p className="text-xl font-bold text-white tracking-tight">
            Host<span style={{ color: "#B08A3E" }}>Masters</span>
          </p>
        </div>

        {/* Loading bar */}
        <div className="w-40 h-1 rounded-full overflow-hidden bg-white/10">
          <div className="hm-loading-bar h-full rounded-full" style={{ background: "#B08A3E" }} />
        </div>
      </div>
    </div>
  )
}
