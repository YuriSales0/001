/**
 * Stylized SVG silhouette of the Costa Tropical coastline
 * from Motril (east) to Nerja (west), with mountain backdrop.
 * Used as hero background element on the landing page.
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
      {/* Mountain silhouette (Sierra Nevada / Sierra de Almijara backdrop) */}
      <path
        d="M0 280 L30 260 L60 240 L90 210 L120 190 L150 170 L170 155 L200 140 L220 130 L250 120 L270 115 L290 110 L310 105 L340 100 L360 108 L380 115 L400 105 L420 95 L440 85 L460 80 L480 78 L500 82 L520 90 L540 85 L560 75 L580 70 L600 65 L620 60 L640 65 L660 72 L680 68 L700 62 L720 58 L740 55 L760 60 L780 68 L800 75 L820 70 L840 65 L860 72 L880 80 L900 88 L920 95 L940 100 L960 110 L980 120 L1000 135 L1020 150 L1040 160 L1060 170 L1080 185 L1100 200 L1120 220 L1140 240 L1160 255 L1180 270 L1200 280 L1200 400 L0 400 Z"
        fill="url(#mountain-gradient)"
        opacity="0.12"
      />

      {/* Coastline — the actual Costa Tropical shore from Motril to Nerja */}
      <path
        d="M0 340
           C40 338, 60 335, 100 330
           C130 326, 150 322, 180 318
           L210 315
           C230 313, 245 310, 260 306
           C280 300, 295 295, 320 290
           C340 286, 355 284, 370 282
           C390 280, 410 278, 430 275
           C445 272, 460 268, 480 264
           C500 260, 515 258, 535 256
           C555 254, 575 252, 590 248
           C610 244, 625 240, 645 238
           C660 236, 672 235, 685 236
           C700 238, 710 240, 720 238
           C735 234, 748 228, 765 224
           C780 220, 795 218, 810 220
           C825 222, 835 226, 845 224
           C860 220, 875 215, 895 212
           C915 210, 930 212, 945 214
           C960 216, 972 220, 985 218
           C1000 214, 1015 210, 1035 208
           C1055 206, 1075 208, 1095 212
           C1115 216, 1135 222, 1155 228
           C1175 234, 1190 240, 1200 245
           L1200 400 L0 400 Z"
        fill="url(#coast-gradient)"
        opacity="0.08"
      />

      {/* Sea line — subtle wave at the coast edge */}
      <path
        d="M0 340
           C40 338, 60 335, 100 330
           C130 326, 150 322, 180 318
           L210 315
           C230 313, 245 310, 260 306
           C280 300, 295 295, 320 290
           C340 286, 355 284, 370 282
           C390 280, 410 278, 430 275
           C445 272, 460 268, 480 264
           C500 260, 515 258, 535 256
           C555 254, 575 252, 590 248
           C610 244, 625 240, 645 238
           C660 236, 672 235, 685 236
           C700 238, 710 240, 720 238
           C735 234, 748 228, 765 224
           C780 220, 795 218, 810 220
           C825 222, 835 226, 845 224
           C860 220, 875 215, 895 212
           C915 210, 930 212, 945 214
           C960 216, 972 220, 985 218
           C1000 214, 1015 210, 1035 208
           C1055 206, 1075 208, 1095 212
           C1115 216, 1135 222, 1155 228
           C1175 234, 1190 240, 1200 245"
        stroke="url(#line-gradient)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.25"
      />

      {/* City markers along the coast */}
      {/* Motril */}
      <circle cx="180" cy="316" r="3" fill="#C9A84C" opacity="0.5" />
      <text x="180" y="308" textAnchor="middle" fill="#C9A84C" opacity="0.35" fontSize="9" fontFamily="system-ui">Motril</text>

      {/* Salobreña */}
      <circle cx="370" cy="281" r="3" fill="#C9A84C" opacity="0.5" />
      <text x="370" y="273" textAnchor="middle" fill="#C9A84C" opacity="0.35" fontSize="9" fontFamily="system-ui">Salobreña</text>

      {/* Almuñécar */}
      <circle cx="590" cy="247" r="3" fill="#C9A84C" opacity="0.5" />
      <text x="590" y="239" textAnchor="middle" fill="#C9A84C" opacity="0.35" fontSize="9" fontFamily="system-ui">Almuñécar</text>

      {/* La Herradura */}
      <circle cx="810" cy="219" r="3" fill="#C9A84C" opacity="0.5" />
      <text x="810" y="211" textAnchor="middle" fill="#C9A84C" opacity="0.35" fontSize="9" fontFamily="system-ui">La Herradura</text>

      {/* Nerja */}
      <circle cx="1035" cy="207" r="3" fill="#C9A84C" opacity="0.5" />
      <text x="1035" y="199" textAnchor="middle" fill="#C9A84C" opacity="0.35" fontSize="9" fontFamily="system-ui">Nerja</text>

      {/* Gradients */}
      <defs>
        <linearGradient id="mountain-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C9A84C" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
        <linearGradient id="coast-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#111827" />
          <stop offset="30%" stopColor="#C9A84C" />
          <stop offset="70%" stopColor="#C9A84C" />
          <stop offset="100%" stopColor="#111827" />
        </linearGradient>
        <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="20%" stopColor="#C9A84C" />
          <stop offset="80%" stopColor="#C9A84C" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
    </svg>
  )
}
