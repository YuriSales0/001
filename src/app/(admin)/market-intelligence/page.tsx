'use client'

import dynamic from 'next/dynamic'

// deck.gl and maplibre-gl require `window`, so client-only render
const MarketMap = dynamic(
  () => import('@/components/market/market-map').then(m => m.MarketMap),
  { ssr: false, loading: () => (
    <div className="h-[calc(100vh-3.5rem)] w-full flex items-center justify-center bg-[#0a0e1a] text-white/50 text-sm">
      A preparar o mapa…
    </div>
  )},
)

export default function MarketIntelligencePage() {
  return <MarketMap />
}
