/**
 * HostMasters Logo — uses the official PNG from /public/logo.png
 *
 * Variants:
 * - mark: just the HM monogram (square)
 * - compact: monogram + "HostMasters" wordmark
 * - full: monogram + wordmark + "Costa Tropical · España"
 *
 * For dark backgrounds, use onDark to switch to the light version.
 * Falls back to SVG inline monogram if image fails to load.
 */

import Image from 'next/image'

type LogoProps = {
  size?: number
  variant?: 'mark' | 'compact' | 'full'
  className?: string
  onDark?: boolean
}

export function HmLogo({ size = 32, variant = 'mark', className, onDark }: LogoProps) {
  const gold = '#B08A3E'
  const textColor = onDark ? '#F6F2EA' : '#0B1E3A'

  if (variant === 'full') {
    return (
      <span className={`inline-flex items-center gap-3 shrink-0 ${className ?? ''}`}>
        <HmMark size={size} onDark={onDark} />
        <span className="flex flex-col">
          <span className="font-semibold tracking-tight" style={{ color: textColor, fontSize: size * 0.45 }}>
            Host<span style={{ color: gold }}>Masters</span>
          </span>
          <span className="hm-eyebrow" style={{ color: gold, fontSize: size * 0.15 }}>
            Costa Tropical · España
          </span>
        </span>
      </span>
    )
  }

  if (variant === 'compact') {
    return (
      <span className={`inline-flex items-center gap-2 shrink-0 ${className ?? ''}`}>
        <HmMark size={size} onDark={onDark} />
        <span className="font-semibold tracking-tight" style={{ color: textColor, fontSize: size * 0.5 }}>
          Host<span style={{ color: gold }}>Masters</span>
        </span>
      </span>
    )
  }

  return <HmMark size={size} onDark={onDark} className={className} />
}

function HmMark({ size, onDark, className }: { size: number; onDark?: boolean; className?: string }) {
  const navy = onDark ? '#F6F2EA' : '#0B1E3A'
  const gold = '#B08A3E'

  // SVG inline fallback — matches brand malla construction
  const sw = 4
  const frame = 5
  const frameW = 90
  const frameSw = 3.5
  const top = 17
  const bot = 78
  const barH = bot - top
  const hL = 20
  const hR = 35
  const hMid = 46
  const mL = 50
  const mR = 76
  const mPeakX = (mL + mR + sw) / 2
  const merY = 60
  const merH = 2.5

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
      <rect x={frame} y={frame} width={frameW} height={frameW} stroke={navy} strokeWidth={frameSw} fill="none" strokeLinejoin="miter" />
      <rect x={hL} y={top} width={sw} height={barH} fill={navy} />
      <rect x={hR} y={top} width={sw} height={barH} fill={navy} />
      <rect x={hL} y={hMid} width={hR - hL + sw} height={sw} fill={navy} />
      <rect x={mL} y={top} width={sw} height={barH} fill={navy} />
      <rect x={mR} y={top} width={sw} height={barH} fill={navy} />
      <polygon points={`${mL},${top} ${mL + sw},${top} ${mPeakX + sw / 2},${top + barH * 0.42} ${mPeakX - sw / 2},${top + barH * 0.42}`} fill={navy} />
      <polygon points={`${mR + sw},${top} ${mR},${top} ${mPeakX - sw / 2},${top + barH * 0.42} ${mPeakX + sw / 2},${top + barH * 0.42}`} fill={navy} />
      <rect x={frame - 1} y={merY} width={frameW + 2} height={merH} fill={gold} />
    </svg>
  )
}

export function HmFavicon({ size = 16 }: { size?: number }) {
  return <HmMark size={size} />
}
