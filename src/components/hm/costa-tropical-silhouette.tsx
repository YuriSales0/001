/**
 * Stylized SVG silhouette of the Costa Tropical coastline
 * from Nerja (west/left) to Calahonda (east/right).
 * Based on the real geography — mostly horizontal coast with
 * La Herradura bay as the key feature.
 */
export function CostaTropicalSilhouette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 400"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none"
    >
      {/* Mountain silhouette — Sierra de Almijara (above Nerja/La Herradura) + Sierra Nevada foothills (east) */}
      <path
        d="M0 220
           L40 200 L80 185 L110 170 L140 155 L170 140 L200 125
           L230 115 L260 108 L290 100 L320 95 L350 90 L380 88
           L410 92 L440 98 L470 95 L500 100 L530 108
           L560 115 L590 120 L620 128 L650 135 L680 140
           L710 148 L740 155 L770 160 L800 168 L830 175
           L860 180 L890 185 L920 190 L950 195 L980 200
           L1010 205 L1040 210 L1070 215 L1100 220 L1130 225
           L1160 230 L1200 235
           L1200 400 L0 400 Z"
        fill="url(#hm-mountain-grad)"
        opacity="0.10"
      />

      {/* Land mass above coastline */}
      <path
        d="M0 295
           C30 293, 50 292, 80 290
           C110 288, 130 290, 150 292
           C170 294, 185 298, 200 305
           C215 312, 230 322, 245 330
           C255 335, 262 338, 270 338
           C280 337, 290 332, 300 325
           C310 318, 318 312, 330 308
           C345 302, 360 298, 380 296
           C400 294, 420 293, 450 292
           C480 291, 510 290, 540 290
           C570 290, 590 291, 610 292
           C630 293, 645 292, 660 290
           C675 288, 685 289, 700 290
           C720 291, 740 290, 760 290
           C790 290, 820 291, 850 292
           C880 293, 910 292, 940 291
           C960 290, 980 291, 1000 293
           C1020 295, 1040 298, 1060 302
           C1080 306, 1095 312, 1110 318
           C1125 324, 1140 330, 1155 336
           C1170 342, 1185 348, 1200 352
           L1200 400 L0 400 Z"
        fill="url(#hm-coast-grad)"
        opacity="0.07"
      />

      {/* Coastline stroke — the actual shore */}
      <path
        d="M0 295
           C30 293, 50 292, 80 290
           C110 288, 130 290, 150 292
           C170 294, 185 298, 200 305
           C215 312, 230 322, 245 330
           C255 335, 262 338, 270 338
           C280 337, 290 332, 300 325
           C310 318, 318 312, 330 308
           C345 302, 360 298, 380 296
           C400 294, 420 293, 450 292
           C480 291, 510 290, 540 290
           C570 290, 590 291, 610 292
           C630 293, 645 292, 660 290
           C675 288, 685 289, 700 290
           C720 291, 740 290, 760 290
           C790 290, 820 291, 850 292
           C880 293, 910 292, 940 291
           C960 290, 980 291, 1000 293
           C1020 295, 1040 298, 1060 302
           C1080 306, 1095 312, 1110 318
           C1125 324, 1140 330, 1155 336
           C1170 342, 1185 348, 1200 352"
        stroke="url(#hm-line-grad)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.30"
      />

      {/* City markers */}
      {/* Nerja (far west) */}
      <circle cx="80" cy="288" r="2.5" fill="#C9A84C" opacity="0.6" />
      <text x="80" y="278" textAnchor="middle" fill="#C9A84C" opacity="0.4" fontSize="10" fontFamily="system-ui">Nerja</text>

      {/* La Herradura (in the bay) */}
      <circle cx="270" cy="336" r="2.5" fill="#C9A84C" opacity="0.6" />
      <text x="270" y="350" textAnchor="middle" fill="#C9A84C" opacity="0.4" fontSize="10" fontFamily="system-ui">La Herradura</text>

      {/* Almuñécar */}
      <circle cx="420" cy="292" r="2.5" fill="#C9A84C" opacity="0.6" />
      <text x="420" y="282" textAnchor="middle" fill="#C9A84C" opacity="0.4" fontSize="10" fontFamily="system-ui">Almuñécar</text>

      {/* Salobreña */}
      <circle cx="660" cy="289" r="2.5" fill="#C9A84C" opacity="0.6" />
      <text x="660" y="279" textAnchor="middle" fill="#C9A84C" opacity="0.4" fontSize="10" fontFamily="system-ui">Salobreña</text>

      {/* Motril */}
      <circle cx="880" cy="292" r="2.5" fill="#C9A84C" opacity="0.6" />
      <text x="880" y="282" textAnchor="middle" fill="#C9A84C" opacity="0.4" fontSize="10" fontFamily="system-ui">Motril</text>

      {/* Torrenueva */}
      <circle cx="1080" cy="304" r="2.5" fill="#C9A84C" opacity="0.6" />
      <text x="1080" y="294" textAnchor="middle" fill="#C9A84C" opacity="0.35" fontSize="9" fontFamily="system-ui">Torrenueva</text>

      <defs>
        <linearGradient id="hm-mountain-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9A84C" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
        <linearGradient id="hm-coast-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="20%" stopColor="#C9A84C" />
          <stop offset="80%" stopColor="#C9A84C" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
        <linearGradient id="hm-line-grad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="15%" stopColor="#C9A84C" />
          <stop offset="85%" stopColor="#C9A84C" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
    </svg>
  )
}
