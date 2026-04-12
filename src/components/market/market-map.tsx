'use client'

import { useEffect, useMemo, useState } from 'react'
import { DeckGL } from '@deck.gl/react'
import { ScatterplotLayer, PolygonLayer, TextLayer } from '@deck.gl/layers'
import { HeatmapLayer, HexagonLayer } from '@deck.gl/aggregation-layers'
import Map from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  Flame, MapPin, Layers, Eye, X,
  TrendingUp, Home, Percent, Euro, Activity, Waves, Anchor, Landmark, Mountain,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────
type MarketProperty = {
  id: string
  name: string
  latitude: number
  longitude: number
  status: string
  zoneId: string
  avgPrice: number
  occupancy: number
  revPAR: number
  grossRevenue: number
  marketScore: number
  bedrooms: number
  isReal: boolean
}

type MarketZone = {
  id: string
  name: string
  shortName: string
  polygon: [number, number][]
  center: [number, number]
  propertyCount: number
  avgPrice: number
  avgOccupancy: number
  revPAR: number
  totalRevenue: number
  marketScore: number
  temperature: 'HOT' | 'WARM' | 'COOL' | 'COLD'
}

type POI = {
  id: string
  name: string
  type: 'beach' | 'marina' | 'landmark' | 'viewpoint'
  latitude: number
  longitude: number
}

type GeoResponse = {
  center: { latitude: number; longitude: number }
  region: string
  count: number
  realCount: number
  competitorCount: number
  demoCount: number
  demoMode: boolean
  stats: { totalGross: number; avgPricePerNight: number; avgOccupancy: number; avgRevPAR: number }
  points: MarketProperty[]
  zones: MarketZone[]
  pois: POI[]
}

type Metric = 'price' | 'occupancy' | 'revpar' | 'revenue' | 'score'
type ViewMode = 'points' | 'heatmap' | 'hexagon'
type MapStyleName = 'dark' | 'light'

// ─── Config ───────────────────────────────────────────────────────────────
const INITIAL_VIEW_STATE = {
  latitude: 36.7340,
  longitude: -3.6899,
  zoom: 12.2,
  pitch: 45,
  bearing: 0,
}

const MAP_STYLES: Record<MapStyleName, string> = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
}

const METRIC_CONFIG: Record<Metric, { label: string; short: string; unit: string; icon: typeof Euro; accessor: (p: MarketProperty) => number; accessorZone: (z: MarketZone) => number; max: number }> = {
  price:     { label: 'ADR (Preço/noite)', short: 'ADR',     unit: '€',  icon: Euro,       accessor: (p) => p.avgPrice,    accessorZone: (z) => z.avgPrice,    max: 400 },
  occupancy: { label: 'Ocupação',          short: 'Occ',     unit: '%',  icon: Percent,    accessor: (p) => p.occupancy,   accessorZone: (z) => z.avgOccupancy, max: 100 },
  revpar:    { label: 'RevPAR',            short: 'RevPAR',  unit: '€',  icon: TrendingUp, accessor: (p) => p.revPAR,      accessorZone: (z) => z.revPAR,      max: 300 },
  revenue:   { label: 'Receita 90d',       short: 'Revenue', unit: '€',  icon: Activity,   accessor: (p) => p.grossRevenue, accessorZone: (z) => z.totalRevenue, max: 25000 },
  score:     { label: 'Market Score',      short: 'Score',   unit: '',   icon: Flame,      accessor: (p) => p.marketScore,  accessorZone: (z) => z.marketScore, max: 100 },
}

const fmtEUR = (n: number) => new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)
const fmtN   = (n: number) => new Intl.NumberFormat('pt-PT').format(n)

// Gradient: cold blue → warm gold → hot red
function gradientColor(value: number, max: number): [number, number, number, number] {
  const t = Math.max(0, Math.min(1, value / max))
  if (t < 0.25) {
    const k = t / 0.25
    return [Math.round(59 + k * (34 - 59)), Math.round(130 + k * (197 - 130)), Math.round(246 + k * (94 - 246)), 220]
  }
  if (t < 0.5) {
    const k = (t - 0.25) / 0.25
    return [Math.round(34 + k * (201 - 34)), Math.round(197 + k * (168 - 197)), Math.round(94 + k * (76 - 94)), 220]
  }
  if (t < 0.75) {
    const k = (t - 0.5) / 0.25
    return [Math.round(201 + k * (249 - 201)), Math.round(168 + k * (115 - 168)), Math.round(76 + k * (22 - 76)), 220]
  }
  const k = (t - 0.75) / 0.25
  return [Math.round(249 + k * (220 - 249)), Math.round(115 + k * (38 - 115)), Math.round(22 + k * (38 - 22)), 230]
}

function temperatureBadge(t: MarketZone['temperature']) {
  const map = {
    HOT:  { label: 'HOT',  bg: '#dc2626', fg: '#fff' },
    WARM: { label: 'WARM', bg: '#f59e0b', fg: '#111' },
    COOL: { label: 'COOL', bg: '#3b82f6', fg: '#fff' },
    COLD: { label: 'COLD', bg: '#475569', fg: '#fff' },
  } as const
  return map[t]
}

const POI_ICONS: Record<POI['type'], { icon: typeof Waves; color: string }> = {
  beach:     { icon: Waves,    color: '#38bdf8' },
  marina:    { icon: Anchor,   color: '#C9A84C' },
  landmark:  { icon: Landmark, color: '#f472b6' },
  viewpoint: { icon: Mountain, color: '#a3e635' },
}

// ─── Component ────────────────────────────────────────────────────────────
export function MarketMap() {
  const [data, setData] = useState<GeoResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [demoMode, setDemoMode] = useState(false)
  const [metric, setMetric] = useState<Metric>('revpar')
  const [viewMode, setViewMode] = useState<ViewMode>('points')
  const [mapStyle, setMapStyle] = useState<MapStyleName>('dark')
  const [showZones, setShowZones] = useState(true)
  const [showPOIs, setShowPOIs] = useState(true)
  const [selectedProp, setSelectedProp] = useState<MarketProperty | null>(null)
  const [selectedZone, setSelectedZone] = useState<MarketZone | null>(null)
  const [hovered, setHovered] = useState<{ x: number; y: number; point: MarketProperty } | null>(null)

  const loadData = (demo: boolean) => {
    setLoading(true)
    fetch(`/api/market/geo${demo ? '?demo=true' : ''}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadData(demoMode) }, [demoMode])

  const cfg = METRIC_CONFIG[metric]

  // Comparables para propriedade seleccionada (top 3 mais próximos)
  const comparables = useMemo(() => {
    if (!selectedProp || !data) return []
    const dist = (a: MarketProperty, b: MarketProperty) => {
      const dLat = a.latitude - b.latitude
      const dLng = a.longitude - b.longitude
      return Math.sqrt(dLat * dLat + dLng * dLng)
    }
    return data.points
      .filter(p => p.id !== selectedProp.id)
      .map(p => ({ p, d: dist(p, selectedProp) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 3)
      .map(x => x.p)
  }, [selectedProp, data])

  const layers = useMemo(() => {
    if (!data) return []

    const ls: unknown[] = []

    // ── Layer 1: Zone polygons ──
    if (showZones && viewMode === 'points') {
      ls.push(
        new PolygonLayer<MarketZone>({
          id: 'zones',
          data: data.zones.filter(z => z.propertyCount > 0),
          pickable: true,
          stroked: true,
          filled: true,
          extruded: false,
          lineWidthMinPixels: 2,
          getPolygon: (d) => d.polygon,
          getFillColor: (d) => {
            const v = cfg.accessorZone(d)
            const c = gradientColor(v, cfg.max)
            return [c[0], c[1], c[2], 55]
          },
          getLineColor: (d) => {
            const v = cfg.accessorZone(d)
            const c = gradientColor(v, cfg.max)
            return [c[0], c[1], c[2], 200]
          },
          onClick: (info) => {
            if (info.object) {
              setSelectedZone(info.object as MarketZone)
              setSelectedProp(null)
            }
          },
          updateTriggers: { getFillColor: metric, getLineColor: metric },
        })
      )

      // Zone labels
      ls.push(
        new TextLayer<MarketZone>({
          id: 'zone-labels',
          data: data.zones.filter(z => z.propertyCount > 0),
          getPosition: (d) => d.center,
          getText: (d) => d.shortName.toUpperCase(),
          getSize: 11,
          getColor: [255, 255, 255, 180],
          fontWeight: 700,
          fontFamily: 'Inter, system-ui, sans-serif',
          background: true,
          backgroundPadding: [6, 3],
          getBackgroundColor: [17, 24, 39, 200],
        })
      )
    }

    // ── Layer 2: Properties (depends on view mode) ──
    if (viewMode === 'heatmap') {
      ls.push(
        new HeatmapLayer<MarketProperty>({
          id: 'heatmap',
          data: data.points,
          getPosition: (d) => [d.longitude, d.latitude],
          getWeight: (d) => cfg.accessor(d),
          radiusPixels: 70,
          intensity: 1.5,
          threshold: 0.05,
          colorRange: [
            [30, 64, 175, 0],
            [59, 130, 246, 120],
            [34, 197, 94, 180],
            [251, 191, 36, 220],
            [249, 115, 22, 240],
            [220, 38, 38, 255],
          ],
          updateTriggers: { getWeight: metric },
        })
      )
    } else if (viewMode === 'hexagon') {
      ls.push(
        new HexagonLayer<MarketProperty>({
          id: 'hexagon',
          data: data.points,
          getPosition: (d) => [d.longitude, d.latitude],
          getElevationWeight: (d) => cfg.accessor(d),
          getColorWeight: (d) => cfg.accessor(d),
          radius: 350,
          elevationScale: metric === 'revenue' ? 0.15 : (metric === 'price' ? 8 : 25),
          extruded: true,
          coverage: 0.88,
          opacity: 0.9,
          colorRange: [
            [59, 130, 246],
            [34, 197, 94],
            [201, 168, 76],
            [249, 115, 22],
            [220, 38, 38],
            [201, 168, 76],
          ],
          updateTriggers: { getElevationWeight: metric, getColorWeight: metric },
        })
      )
    } else {
      // Points mode
      ls.push(
        new ScatterplotLayer<MarketProperty>({
          id: 'properties',
          data: data.points,
          pickable: true,
          opacity: 0.95,
          stroked: true,
          filled: true,
          radiusScale: 1,
          radiusMinPixels: 7,
          radiusMaxPixels: 36,
          lineWidthMinPixels: 2,
          getPosition: (d) => [d.longitude, d.latitude],
          getRadius: (d) => 50 + cfg.accessor(d) * 0.4,
          getFillColor: (d) => gradientColor(cfg.accessor(d), cfg.max),
          getLineColor: (d) => d.isReal ? [255, 255, 255, 255] : [201, 168, 76, 200],
          onHover: (info) => {
            if (info.object) setHovered({ x: info.x, y: info.y, point: info.object as MarketProperty })
            else setHovered(null)
          },
          onClick: (info) => {
            if (info.object) {
              setSelectedProp(info.object as MarketProperty)
              setSelectedZone(null)
            }
          },
          updateTriggers: { getFillColor: metric, getRadius: metric },
        })
      )
    }

    // ── Layer 3: POIs ──
    if (showPOIs) {
      const poiColors: Record<POI['type'], [number, number, number]> = {
        beach:     [56, 189, 248],
        marina:    [201, 168, 76],
        landmark:  [244, 114, 182],
        viewpoint: [163, 230, 53],
      }
      ls.push(
        new ScatterplotLayer<POI>({
          id: 'pois',
          data: data.pois,
          pickable: true,
          stroked: true,
          filled: true,
          radiusMinPixels: 5,
          radiusMaxPixels: 10,
          lineWidthMinPixels: 1.5,
          getPosition: (d) => [d.longitude, d.latitude],
          getRadius: 30,
          getFillColor: (d) => [...poiColors[d.type], 255],
          getLineColor: [17, 24, 39, 255],
        })
      )
      ls.push(
        new TextLayer<POI>({
          id: 'poi-labels',
          data: data.pois,
          getPosition: (d) => [d.longitude, d.latitude],
          getText: (d) => d.name,
          getSize: 9,
          getColor: [255, 255, 255, 200],
          getPixelOffset: [0, -16],
          fontWeight: 500,
          fontFamily: 'Inter, system-ui, sans-serif',
          background: true,
          backgroundPadding: [4, 2],
          getBackgroundColor: [17, 24, 39, 180],
        })
      )
    }

    return ls
  }, [data, viewMode, metric, showZones, showPOIs, cfg])

  // Top zones ranking by current metric
  const topZones = useMemo(() => {
    if (!data) return []
    return [...data.zones]
      .filter(z => z.propertyCount > 0)
      .sort((a, b) => cfg.accessorZone(b) - cfg.accessorZone(a))
      .slice(0, 5)
  }, [data, cfg])

  const formatMetric = (value: number, m: Metric) => {
    if (m === 'occupancy') return `${value}%`
    if (m === 'score') return `${value}/100`
    return fmtEUR(value)
  }

  return (
    <div className="relative h-full w-full bg-[#0a0e1a] overflow-hidden" style={{ minHeight: 500 }}>
      {/* ── Deck.gl Map ── */}
      {/* @ts-expect-error deck.gl layer typing is loose across versions */}
      <DeckGL initialViewState={INITIAL_VIEW_STATE} controller={true} layers={layers}>
        <Map reuseMaps mapStyle={MAP_STYLES[mapStyle]} attributionControl={false} />
      </DeckGL>

      {/* ── Loading ── */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-30">
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <div className="h-2 w-2 rounded-full bg-[#C9A84C] animate-pulse" />
            A carregar inteligência de mercado…
          </div>
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between gap-3 p-3 pointer-events-none">
        {/* Brand + region */}
        <div className="pointer-events-auto rounded-xl border border-white/10 bg-[#111827]/95 backdrop-blur-md px-4 py-2.5 shadow-2xl flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#C9A84C] to-[#8a6d28] flex items-center justify-center">
              <MapPin className="h-4 w-4 text-[#111827]" strokeWidth={3} />
            </div>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-wider text-[#C9A84C]">Market Intelligence</div>
              <div className="text-sm font-bold text-white leading-tight">Costa Tropical</div>
            </div>
          </div>
          {data && (
            <div className="pl-3 ml-1 border-l border-white/10 text-[10px] text-white/60 leading-tight">
              <div>{data.count} propriedades</div>
              <div className="text-[#C9A84C]">
                {data.realCount} próprias · {data.competitorCount} scraped
                {data.demoCount > 0 && <span className="text-amber-400"> · {data.demoCount} demo</span>}
              </div>
            </div>
          )}
        </div>

        {/* Metric toggle */}
        <div className="pointer-events-auto rounded-xl border border-white/10 bg-[#111827]/95 backdrop-blur-md p-1 shadow-2xl flex gap-0.5">
          {(Object.keys(METRIC_CONFIG) as Metric[]).map(m => {
            const active = metric === m
            const MIcon = METRIC_CONFIG[m].icon
            return (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors flex items-center gap-1.5 ${
                  active ? 'bg-[#C9A84C] text-[#111827]' : 'text-white/65 hover:bg-white/5 hover:text-white'
                }`}
                title={METRIC_CONFIG[m].label}
              >
                <MIcon className="h-3 w-3" />
                {METRIC_CONFIG[m].short}
              </button>
            )
          })}
        </div>

        {/* Layer controls */}
        <div className="pointer-events-auto rounded-xl border border-white/10 bg-[#111827]/95 backdrop-blur-md p-1 shadow-2xl flex gap-0.5">
          {([
            { key: 'points',  label: 'Pins' },
            { key: 'heatmap', label: 'Heat' },
            { key: 'hexagon', label: '3D' },
          ] as { key: ViewMode; label: string }[]).map(opt => (
            <button
              key={opt.key}
              onClick={() => setViewMode(opt.key)}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                viewMode === opt.key ? 'bg-white text-[#111827]' : 'text-white/65 hover:bg-white/5 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── LEFT PANEL: Stats ── */}
      {data && (
        <div className="absolute top-20 left-3 z-10 w-64 rounded-xl border border-white/10 bg-[#111827]/95 backdrop-blur-md shadow-2xl text-white">
          <div className="px-4 py-3 border-b border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">Mercado — 90 dias</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-[9px] uppercase text-white/40 tracking-wider">ADR médio</div>
                <div className="text-lg font-bold mt-0.5">{fmtEUR(data.stats.avgPricePerNight)}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase text-white/40 tracking-wider">Ocupação</div>
                <div className="text-lg font-bold mt-0.5">{data.stats.avgOccupancy}%</div>
              </div>
              <div>
                <div className="text-[9px] uppercase text-white/40 tracking-wider">RevPAR</div>
                <div className="text-lg font-bold mt-0.5 text-[#C9A84C]">{fmtEUR(data.stats.avgRevPAR)}</div>
              </div>
              <div>
                <div className="text-[9px] uppercase text-white/40 tracking-wider">Total receita</div>
                <div className="text-lg font-bold mt-0.5">{fmtEUR(data.stats.totalGross)}</div>
              </div>
            </div>
          </div>

          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">
                Top zonas · {cfg.short}
              </div>
              <Flame className="h-3 w-3 text-[#C9A84C]" />
            </div>
            <div className="space-y-1.5">
              {topZones.map((z, i) => {
                const badge = temperatureBadge(z.temperature)
                const v = cfg.accessorZone(z)
                return (
                  <button
                    key={z.id}
                    onClick={() => { setSelectedZone(z); setSelectedProp(null) }}
                    className="w-full rounded-lg px-2 py-1.5 hover:bg-white/5 transition-colors flex items-center justify-between gap-2 text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-[9px] w-4 text-white/40 font-mono">{i + 1}</span>
                      <span className="text-xs font-medium truncate">{z.shortName}</span>
                      <span className="text-[8px] font-bold rounded px-1 py-0.5 shrink-0" style={{ background: badge.bg, color: badge.fg }}>
                        {badge.label}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#C9A84C] shrink-0">{formatMetric(v, metric)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="px-4 py-3 border-t border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">Camadas</div>
            <div className="space-y-1.5 text-xs">
              <label className="flex items-center gap-2 cursor-pointer hover:text-white text-white/70">
                <input type="checkbox" checked={showZones} onChange={e => setShowZones(e.target.checked)} className="accent-[#C9A84C]" />
                <Layers className="h-3.5 w-3.5" />
                Zonas
              </label>
              <label className="flex items-center gap-2 cursor-pointer hover:text-white text-white/70">
                <input type="checkbox" checked={showPOIs} onChange={e => setShowPOIs(e.target.checked)} className="accent-[#C9A84C]" />
                <Eye className="h-3.5 w-3.5" />
                POIs (praias · landmarks)
              </label>
            </div>
          </div>

          <div className="px-4 py-3 border-t border-white/10">
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">Estilo do mapa</div>
            <div className="flex gap-1">
              {(['dark', 'light'] as MapStyleName[]).map(s => (
                <button
                  key={s}
                  onClick={() => setMapStyle(s)}
                  className={`flex-1 rounded-md px-2 py-1 text-[10px] font-semibold capitalize transition-colors ${
                    mapStyle === s ? 'bg-[#C9A84C] text-[#111827]' : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-3 border-t border-white/10">
            <button
              onClick={() => setDemoMode(d => !d)}
              className={`w-full rounded-lg px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                demoMode
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  : 'bg-white/5 text-white/40 border border-white/10 hover:bg-white/10 hover:text-white/70'
              }`}
            >
              {demoMode ? 'Demo activo — ver dados reais' : 'Activar modo demo'}
            </button>
            {!demoMode && data && data.count === 0 && (
              <p className="text-[9px] text-white/30 mt-1.5 text-center">Sem dados reais — activa o demo para preview</p>
            )}
          </div>
        </div>
      )}

      {/* ── LEGEND (bottom left) ── */}
      {viewMode === 'points' && data && (
        <div className="absolute bottom-3 left-3 z-10 rounded-xl border border-white/10 bg-[#111827]/95 backdrop-blur-md px-4 py-3 shadow-2xl text-white max-w-[260px]">
          <div className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2 flex items-center gap-1.5">
            <cfg.icon className="h-3 w-3 text-[#C9A84C]" />
            {cfg.label}
          </div>
          <div className="h-2 rounded-full" style={{ background: 'linear-gradient(to right, rgb(59,130,246), rgb(34,197,94), rgb(201,168,76), rgb(249,115,22), rgb(220,38,38))' }} />
          <div className="flex justify-between text-[9px] text-white/50 mt-1 font-mono">
            <span>0</span>
            <span>{metric === 'occupancy' ? '100%' : metric === 'score' ? '100' : fmtEUR(cfg.max)}</span>
          </div>
          {showPOIs && (
            <div className="mt-3 pt-2 border-t border-white/10 flex flex-wrap gap-2 text-[9px]">
              {(Object.keys(POI_ICONS) as POI['type'][]).map(t => {
                const PIcon = POI_ICONS[t].icon
                return (
                  <div key={t} className="flex items-center gap-1 text-white/60">
                    <PIcon className="h-2.5 w-2.5" style={{ color: POI_ICONS[t].color }} />
                    {t}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── PROPERTY DETAIL DRAWER (right) ── */}
      {selectedProp && (
        <div className="absolute top-20 right-3 z-20 w-80 rounded-xl border border-white/10 bg-[#111827]/95 backdrop-blur-md shadow-2xl text-white overflow-hidden animate-[slideIn_0.2s_ease-out]">
          <div className="px-4 py-3 border-b border-white/10 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-[#C9A84C] font-bold mb-0.5">
                <Home className="h-3 w-3" />
                Propriedade {selectedProp.isReal ? '· real' : '· demo'}
              </div>
              <div className="font-bold text-sm leading-tight">{selectedProp.name}</div>
              <div className="text-[10px] text-white/50 mt-0.5">{selectedProp.bedrooms} quartos · zone {selectedProp.zoneId.replace('zone-', '')}</div>
            </div>
            <button onClick={() => setSelectedProp(null)} className="rounded p-1 text-white/40 hover:text-white hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-4 py-3 grid grid-cols-2 gap-3">
            <div>
              <div className="text-[9px] uppercase text-white/40 tracking-wider">ADR</div>
              <div className="text-base font-bold mt-0.5">{fmtEUR(selectedProp.avgPrice)}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase text-white/40 tracking-wider">Ocupação</div>
              <div className="text-base font-bold mt-0.5">{selectedProp.occupancy}%</div>
            </div>
            <div>
              <div className="text-[9px] uppercase text-white/40 tracking-wider">RevPAR</div>
              <div className="text-base font-bold mt-0.5 text-[#C9A84C]">{fmtEUR(selectedProp.revPAR)}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase text-white/40 tracking-wider">Score</div>
              <div className="text-base font-bold mt-0.5">{selectedProp.marketScore}/100</div>
            </div>
          </div>

          <div className="px-4 py-3 border-t border-white/10 bg-white/[0.02]">
            <div className="text-[9px] uppercase text-white/40 tracking-wider mb-1">Receita últimos 90 dias</div>
            <div className="text-xl font-bold text-[#C9A84C]">{fmtEUR(selectedProp.grossRevenue)}</div>
          </div>

          {comparables.length > 0 && (
            <div className="px-4 py-3 border-t border-white/10">
              <div className="text-[10px] font-bold uppercase tracking-wider text-white/50 mb-2">Comparáveis próximos</div>
              <div className="space-y-1.5">
                {comparables.map(c => {
                  const deltaRevPAR = c.revPAR - selectedProp.revPAR
                  const deltaPct = selectedProp.revPAR > 0 ? (deltaRevPAR / selectedProp.revPAR) * 100 : 0
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedProp(c)}
                      className="w-full text-left rounded-lg px-2 py-1.5 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-medium truncate">{c.name}</div>
                          <div className="text-[9px] text-white/40 mt-0.5">
                            {c.bedrooms}q · ADR {fmtEUR(c.avgPrice)} · {c.occupancy}% occ
                          </div>
                        </div>
                        <div className={`text-[10px] font-bold ${deltaRevPAR >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {deltaRevPAR >= 0 ? '+' : ''}{deltaPct.toFixed(0)}%
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── ZONE DETAIL POPUP ── */}
      {selectedZone && !selectedProp && (
        <div className="absolute top-20 right-3 z-20 w-72 rounded-xl border border-white/10 bg-[#111827]/95 backdrop-blur-md shadow-2xl text-white overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-[9px] uppercase tracking-wider text-[#C9A84C] font-bold mb-0.5">
                <MapPin className="h-3 w-3" />
                Zona
              </div>
              <div className="font-bold text-sm">{selectedZone.name}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] font-bold rounded px-1.5 py-0.5" style={{ background: temperatureBadge(selectedZone.temperature).bg, color: temperatureBadge(selectedZone.temperature).fg }}>
                  {temperatureBadge(selectedZone.temperature).label}
                </span>
                <span className="text-[10px] text-white/50">{selectedZone.propertyCount} propriedades</span>
              </div>
            </div>
            <button onClick={() => setSelectedZone(null)} className="rounded p-1 text-white/40 hover:text-white hover:bg-white/10">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="px-4 py-3 grid grid-cols-2 gap-3">
            <div>
              <div className="text-[9px] uppercase text-white/40 tracking-wider">ADR médio</div>
              <div className="text-base font-bold mt-0.5">{fmtEUR(selectedZone.avgPrice)}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase text-white/40 tracking-wider">Ocupação</div>
              <div className="text-base font-bold mt-0.5">{selectedZone.avgOccupancy}%</div>
            </div>
            <div>
              <div className="text-[9px] uppercase text-white/40 tracking-wider">RevPAR</div>
              <div className="text-base font-bold mt-0.5 text-[#C9A84C]">{fmtEUR(selectedZone.revPAR)}</div>
            </div>
            <div>
              <div className="text-[9px] uppercase text-white/40 tracking-wider">Market Score</div>
              <div className="text-base font-bold mt-0.5">{selectedZone.marketScore}/100</div>
            </div>
          </div>

          <div className="px-4 py-3 border-t border-white/10 bg-white/[0.02]">
            <div className="text-[9px] uppercase text-white/40 tracking-wider mb-1">Receita total (90d)</div>
            <div className="text-xl font-bold text-[#C9A84C]">{fmtEUR(selectedZone.totalRevenue)}</div>
          </div>
        </div>
      )}

      {/* ── Hover tooltip ── */}
      {hovered && !selectedProp && (
        <div
          className="pointer-events-none absolute z-30 rounded-lg border border-white/10 bg-[#111827]/95 backdrop-blur-md px-3 py-2 text-xs text-white shadow-2xl"
          style={{ left: hovered.x + 14, top: hovered.y + 14 }}
        >
          <div className="font-semibold text-[#C9A84C] mb-0.5 flex items-center gap-1.5">
            {hovered.point.name}
            {!hovered.point.isReal && (
              <span className="rounded bg-amber-400/20 px-1 py-0.5 text-[8px] font-bold text-amber-300">DEMO</span>
            )}
          </div>
          <div className="text-[10px] text-white/60">
            {fmtEUR(hovered.point.avgPrice)}/n · {hovered.point.occupancy}% occ · RevPAR {fmtEUR(hovered.point.revPAR)}
          </div>
        </div>
      )}

      {/* ── Attribution ── */}
      <div className="absolute bottom-2 right-2 z-10 text-[9px] text-white/30">
        © OpenStreetMap · Carto · deck.gl · MapLibre
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(8px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
