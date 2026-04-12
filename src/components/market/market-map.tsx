'use client'

import { useEffect, useMemo, useState } from 'react'
import { DeckGL } from '@deck.gl/react'
import { ScatterplotLayer } from '@deck.gl/layers'
import { HeatmapLayer, HexagonLayer } from '@deck.gl/aggregation-layers'
import Map from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

type MarketProperty = {
  id: string
  name: string
  latitude: number
  longitude: number
  status: string
  avgPrice: number
  occupancy: number
  grossRevenue: number
  isReal: boolean
}

type GeoResponse = {
  center: { latitude: number; longitude: number }
  region: string
  count: number
  realCount: number
  demoCount: number
  stats: { totalGross: number; avgOccupancy: number; avgPricePerNight: number }
  points: MarketProperty[]
}

type LayerMode = 'points' | 'heatmap' | 'hexagon'

const INITIAL_VIEW_STATE = {
  latitude: 36.7340,
  longitude: -3.6899,
  zoom: 11.5,
  pitch: 45,
  bearing: 0,
}

// Free Carto dark base map — sem token
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

const fmtEUR = (n: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

export function MarketMap() {
  const [data, setData] = useState<GeoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<LayerMode>('points')
  const [hovered, setHovered] = useState<{ x: number; y: number; point: MarketProperty } | null>(null)

  useEffect(() => {
    fetch('/api/market/geo')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const layers = useMemo(() => {
    if (!data) return []

    if (mode === 'heatmap') {
      return [
        new HeatmapLayer<MarketProperty>({
          id: 'heatmap',
          data: data.points,
          getPosition: (d) => [d.longitude, d.latitude],
          getWeight: (d) => d.avgPrice,
          radiusPixels: 60,
          intensity: 1.5,
          threshold: 0.05,
          colorRange: [
            [30, 64, 175, 0],     // blue transparent
            [59, 130, 246, 120],  // blue
            [16, 185, 129, 180],  // green
            [251, 191, 36, 220],  // amber
            [249, 115, 22, 240],  // orange
            [220, 38, 38, 255],   // red
          ],
        }),
      ]
    }

    if (mode === 'hexagon') {
      return [
        new HexagonLayer<MarketProperty>({
          id: 'hexagon',
          data: data.points,
          getPosition: (d) => [d.longitude, d.latitude],
          getElevationWeight: (d) => d.grossRevenue,
          getColorWeight: (d) => d.avgPrice,
          radius: 400,
          elevationScale: 4,
          extruded: true,
          coverage: 0.85,
          opacity: 0.85,
          colorRange: [
            [59, 130, 246],
            [16, 185, 129],
            [251, 191, 36],
            [249, 115, 22],
            [220, 38, 38],
            [201, 168, 76],
          ],
        }),
      ]
    }

    return [
      new ScatterplotLayer<MarketProperty>({
        id: 'properties',
        data: data.points,
        pickable: true,
        opacity: 0.9,
        stroked: true,
        filled: true,
        radiusScale: 1,
        radiusMinPixels: 6,
        radiusMaxPixels: 30,
        lineWidthMinPixels: 2,
        getPosition: (d) => [d.longitude, d.latitude],
        getRadius: (d) => 40 + d.avgPrice * 0.3,
        getFillColor: (d) => {
          // Cor por ocupação — verde=alta, amarelo=média, vermelho=baixa
          if (d.occupancy >= 80) return [16, 185, 129, 220]
          if (d.occupancy >= 70) return [201, 168, 76, 220]
          if (d.occupancy >= 60) return [251, 146, 60, 220]
          return [220, 38, 38, 220]
        },
        getLineColor: (d) => d.isReal ? [255, 255, 255, 255] : [201, 168, 76, 180],
        onHover: (info) => {
          if (info.object) {
            setHovered({ x: info.x, y: info.y, point: info.object as MarketProperty })
          } else {
            setHovered(null)
          }
        },
      }),
    ]
  }, [data, mode])

  return (
    <div className="relative h-[calc(100vh-3.5rem)] w-full bg-[#0a0e1a]">
      {/* Map container */}
      <DeckGL
        initialViewState={INITIAL_VIEW_STATE}
        controller={true}
        layers={layers}
      >
        <Map
          reuseMaps
          mapStyle={MAP_STYLE}
          attributionControl={false}
        />
      </DeckGL>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-20">
          <div className="text-white text-sm">A carregar dados do mercado…</div>
        </div>
      )}

      {/* Header panel */}
      <div className="absolute top-4 left-4 z-10 rounded-xl border border-white/10 bg-[#111827]/95 backdrop-blur-md px-5 py-4 shadow-2xl text-white max-w-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-2 w-2 rounded-full bg-[#C9A84C] animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C9A84C]">Market Intelligence</span>
        </div>
        <h1 className="text-lg font-bold leading-tight">
          Costa Tropical<span className="text-[#C9A84C]">.</span>
        </h1>
        <p className="text-xs text-white/60 mt-0.5">Almuñécar · La Herradura · Salobreña</p>

        {data && (
          <div className="mt-4 pt-3 border-t border-white/10 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-white/50">Propriedades no mapa</span>
              <span className="font-semibold">{data.count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Preço médio / noite</span>
              <span className="font-semibold">{fmtEUR(data.stats.avgPricePerNight)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Ocupação média</span>
              <span className="font-semibold">{data.stats.avgOccupancy}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/50">Receita total (90d)</span>
              <span className="font-semibold text-[#C9A84C]">{fmtEUR(data.stats.totalGross)}</span>
            </div>
          </div>
        )}

        {data && data.demoCount > 0 && (
          <div className="mt-4 pt-3 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-[10px] text-amber-400/80">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              {data.realCount} reais · {data.demoCount} demo
            </div>
          </div>
        )}
      </div>

      {/* Layer switcher */}
      <div className="absolute top-4 right-4 z-10 rounded-xl border border-white/10 bg-[#111827]/95 backdrop-blur-md p-1 shadow-2xl flex gap-1">
        {([
          { key: 'points',  label: 'Propriedades' },
          { key: 'heatmap', label: 'Heatmap' },
          { key: 'hexagon', label: 'Hexbin 3D' },
        ] as { key: LayerMode; label: string }[]).map(opt => (
          <button
            key={opt.key}
            onClick={() => setMode(opt.key)}
            className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              mode === opt.key
                ? 'bg-[#C9A84C] text-[#111827]'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Legend */}
      {mode === 'points' && (
        <div className="absolute bottom-4 left-4 z-10 rounded-xl border border-white/10 bg-[#111827]/95 backdrop-blur-md px-4 py-3 shadow-2xl text-white text-xs">
          <p className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">Ocupação</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[rgb(16,185,129)]" /> ≥ 80%</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#C9A84C]" /> 70–79%</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[rgb(251,146,60)]" /> 60–69%</div>
            <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[rgb(220,38,38)]" /> &lt; 60%</div>
          </div>
        </div>
      )}

      {/* Attribution */}
      <div className="absolute bottom-2 right-2 z-10 text-[9px] text-white/30">
        © OpenStreetMap · Carto · deck.gl
      </div>

      {/* Hover tooltip */}
      {hovered && (
        <div
          className="pointer-events-none absolute z-20 rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-xs text-white shadow-2xl"
          style={{ left: hovered.x + 12, top: hovered.y + 12 }}
        >
          <div className="font-semibold text-[#C9A84C] mb-1 flex items-center gap-1.5">
            {hovered.point.name}
            {!hovered.point.isReal && (
              <span className="rounded bg-amber-400/20 px-1.5 py-0.5 text-[8px] font-bold text-amber-300">DEMO</span>
            )}
          </div>
          <div className="space-y-0.5 text-white/70">
            <div>Preço médio: <span className="text-white font-semibold">{fmtEUR(hovered.point.avgPrice)}/noite</span></div>
            <div>Ocupação: <span className="text-white font-semibold">{hovered.point.occupancy}%</span></div>
            <div>Receita 90d: <span className="text-white font-semibold">{fmtEUR(hovered.point.grossRevenue)}</span></div>
          </div>
        </div>
      )}
    </div>
  )
}
