/**
 * HostMasters Meridian Logo — SVG monogram
 *
 * Faithful reproduction from Brand Guidelines "La Malla":
 * - Grid: 10×10 units
 * - Frame: 0.5u stroke, inset 0.5u from edge
 * - H/M bars: 0.5u wide, ~5.3u tall
 * - Meridian: y=5.75u from top, 0.2u height, gold, full width
 * - M diagonal: 0.5u stroke, miter join, peaks at center-top
 * - Padding: 1.5u top, 2.25u bottom
 * - Ratio: 1:1 square
 */

type LogoProps = {
  size?: number
  variant?: 'mark' | 'compact'
  className?: string
  onDark?: boolean
}

export function HmLogo({ size = 32, variant = 'mark', className, onDark }: LogoProps) {
  const navy = onDark ? '#F6F2EA' : '#0B1E3A'
  const gold = '#B08A3E'

  if (variant === 'compact') {
    return (
      <span className={`inline-flex items-center gap-2 shrink-0 ${className ?? ''}`}>
        <HmMark size={size} navy={navy} gold={gold} />
        <span className="font-semibold tracking-tight" style={{ color: onDark ? '#F6F2EA' : '#0B1E3A', fontSize: size * 0.5 }}>
          Host<span style={{ color: gold }}>Masters</span>
        </span>
      </span>
    )
  }

  return <HmMark size={size} navy={navy} gold={gold} className={className} />
}

function HmMark({ size, navy, gold, className }: { size: number; navy: string; gold: string; className?: string }) {
  // All coordinates on a 100-unit viewBox (10×10 grid × 10)
  const sw = 4           // stroke/bar width (0.5u × 8 scaled)
  const frame = 5        // frame inset
  const frameW = 90      // frame size
  const frameSw = 3.5    // frame stroke

  // Glyph area
  const top = 17         // 1.5u padding from frame top + frame
  const bot = 78         // bottom of bars
  const barH = bot - top // bar height

  // H position (left half)
  const hL = 20          // H left bar x
  const hR = 35          // H right bar x
  const hMid = 46        // H crossbar y center

  // M position (right half)
  const mL = 50          // M left bar x
  const mR = 76          // M right bar x
  const mPeakY = top     // M diagonal peak y
  const mPeakX = (mL + mR + sw) / 2  // M center x

  // Meridian
  const merY = 60        // meridian y (5.75u from top ≈ 60 on 100-grid)
  const merH = 2.5       // meridian height

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="HostMasters"
    >
      {/* Frame — square, sharp corners */}
      <rect
        x={frame} y={frame}
        width={frameW} height={frameW}
        stroke={navy} strokeWidth={frameSw}
        fill="none" strokeLinejoin="miter"
      />

      {/* ── H ── */}
      {/* Left vertical */}
      <rect x={hL} y={top} width={sw} height={barH} fill={navy} />
      {/* Right vertical */}
      <rect x={hR} y={top} width={sw} height={barH} fill={navy} />
      {/* Crossbar */}
      <rect x={hL} y={hMid} width={hR - hL + sw} height={sw} fill={navy} />

      {/* ── M ── */}
      {/* Left vertical */}
      <rect x={mL} y={top} width={sw} height={barH} fill={navy} />
      {/* Right vertical */}
      <rect x={mR} y={top} width={sw} height={barH} fill={navy} />
      {/* Left diagonal (top-left to center peak) */}
      <polygon
        points={`${mL},${top} ${mL + sw},${top} ${mPeakX + sw / 2},${top + barH * 0.42} ${mPeakX - sw / 2},${top + barH * 0.42}`}
        fill={navy}
      />
      {/* Right diagonal (top-right to center peak) */}
      <polygon
        points={`${mR + sw},${top} ${mR},${top} ${mPeakX - sw / 2},${top + barH * 0.42} ${mPeakX + sw / 2},${top + barH * 0.42}`}
        fill={navy}
      />

      {/* ── Meridian — gold line crossing full width ── */}
      <rect x={frame - 1} y={merY} width={frameW + 2} height={merH} fill={gold} />
    </svg>
  )
}

export function HmFavicon({ size = 16 }: { size?: number }) {
  return <HmMark size={size} navy="#0B1E3A" gold="#B08A3E" />
}
