"use client"

/**
 * HostMasters loading screen — the monogram draws itself,
 * fills with gold, then dissolves. Elegant, on-brand.
 */
export function HmLoadingScreen() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0B1E3A]">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: "radial-gradient(ellipse at 50% 40%, rgba(176,138,62,0.15) 0%, transparent 70%)",
        }}
      />

      <div className="relative flex flex-col items-center gap-6">
        {/* Animated monogram */}
        <div className="hm-draw-logo">
          <svg
            width={100}
            height={100}
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Frame — draws itself */}
            <rect
              className="hm-draw-frame"
              x="5" y="5" width="90" height="90"
              stroke="#F6F2EA" strokeWidth="3.5"
              fill="none" strokeLinejoin="miter"
            />

            {/* H left vertical */}
            <rect className="hm-draw-bar hm-bar-1" x="20" y="17" width="4" height="61" fill="#F6F2EA" />
            {/* H right vertical */}
            <rect className="hm-draw-bar hm-bar-2" x="35" y="17" width="4" height="61" fill="#F6F2EA" />
            {/* H crossbar */}
            <rect className="hm-draw-bar hm-bar-3" x="20" y="46" width="19" height="4" fill="#F6F2EA" />

            {/* M left vertical */}
            <rect className="hm-draw-bar hm-bar-4" x="50" y="17" width="4" height="61" fill="#F6F2EA" />
            {/* M right vertical */}
            <rect className="hm-draw-bar hm-bar-5" x="76" y="17" width="4" height="61" fill="#F6F2EA" />
            {/* M left diagonal */}
            <polygon className="hm-draw-bar hm-bar-6" points="50,17 54,17 67,42.6 63,42.6" fill="#F6F2EA" />
            {/* M right diagonal */}
            <polygon className="hm-draw-bar hm-bar-7" points="80,17 76,17 63,42.6 67,42.6" fill="#F6F2EA" />

            {/* Meridian — gold line, appears last */}
            <rect className="hm-draw-meridian" x="4" y="60" width="92" height="2.5" fill="#B08A3E" rx="1" />
          </svg>
        </div>

        {/* Wordmark — fades in after logo draws */}
        <p className="hm-draw-wordmark text-2xl font-semibold tracking-tight" style={{ color: '#F6F2EA' }}>
          Host<span style={{ color: "#B08A3E" }}>Masters</span>
        </p>
      </div>
    </div>
  )
}
