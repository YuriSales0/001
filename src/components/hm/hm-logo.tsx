/**
 * HostMasters Meridian Logo — SVG monogram
 *
 * Constructed on a 10×10 grid:
 * - Frame: 0.5u stroke, inset 0.5u
 * - H/M bars: 0.5u wide, 5.3u tall
 * - Meridian line: y=5.75u, 0.2u height (gold)
 * - Ratio: 1:1 square
 *
 * Variants: mark (solo), compact (with wordmark), full (with tagline)
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
  const scale = size / 100

  if (variant === 'compact') {
    return (
      <span className={`inline-flex items-center gap-2 ${className ?? ''}`}>
        <HmMark size={size} navy={navy} gold={gold} />
        <span className="font-semibold tracking-tight" style={{ color: onDark ? '#F6F2EA' : '#0B1E3A', fontSize: size * 0.55 }}>
          Host<span style={{ color: gold }}>Masters</span>
        </span>
      </span>
    )
  }

  return <HmMark size={size} navy={navy} gold={gold} className={className} />
}

function HmMark({ size, navy, gold, className }: { size: number; navy: string; gold: string; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Frame — inset 5u, stroke 5u */}
      <rect x="7.5" y="7.5" width="85" height="85" rx="2" stroke={navy} strokeWidth="5" fill="none" />

      {/* H — left vertical */}
      <rect x="22" y="22" width="5" height="53" fill={navy} />
      {/* H — right vertical */}
      <rect x="37" y="22" width="5" height="53" fill={navy} />
      {/* H — horizontal bar */}
      <rect x="22" y="46" width="20" height="5" fill={navy} />

      {/* M — left vertical */}
      <rect x="52" y="22" width="5" height="53" fill={navy} />
      {/* M — right vertical */}
      <rect x="73" y="22" width="5" height="53" fill={navy} />
      {/* M — left diagonal */}
      <polygon points="52,22 57,22 65,45 60,45" fill={navy} />
      {/* M — right diagonal */}
      <polygon points="73,22 78,22 70,45 65,45" fill={navy} />

      {/* Meridian — gold line at y=57.5 */}
      <rect x="5" y="56" width="90" height="2.5" fill={gold} rx="1" />
    </svg>
  )
}

/** Favicon-size mark — simplified for 16-32px */
export function HmFavicon({ size = 16 }: { size?: number }) {
  return <HmMark size={size} navy="#0B1E3A" gold="#B08A3E" />
}
