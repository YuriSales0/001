import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export type MarketProperty = {
  id: string
  name: string
  latitude: number
  longitude: number
  status: string
  zoneId: string
  avgPrice: number       // ADR — €/noite médio
  occupancy: number      // 0-100
  revPAR: number         // ADR × Occ/100
  grossRevenue: number   // últimos 90 dias
  marketScore: number    // 0-100 composite
  bedrooms: number
  isReal: boolean
}

export type MarketZone = {
  id: string
  name: string
  shortName: string
  polygon: [number, number][]  // [lng, lat] closed ring
  center: [number, number]     // [lng, lat]
  propertyCount: number
  avgPrice: number
  avgOccupancy: number
  revPAR: number
  totalRevenue: number
  marketScore: number
  temperature: 'HOT' | 'WARM' | 'COOL' | 'COLD'
}

export type POI = {
  id: string
  name: string
  type: 'beach' | 'marina' | 'landmark' | 'viewpoint'
  latitude: number
  longitude: number
}

// ── Zonas de Almuñécar com polígonos aproximados (GeoJSON order: [lng, lat]) ──
const ZONES: Omit<MarketZone, 'propertyCount' | 'avgPrice' | 'avgOccupancy' | 'revPAR' | 'totalRevenue' | 'marketScore' | 'temperature'>[] = [
  {
    id: 'zone-san-cristobal',
    name: 'Playa San Cristóbal',
    shortName: 'San Cristóbal',
    center: [-3.7005, 36.7310],
    polygon: [
      [-3.7080, 36.7250],
      [-3.7080, 36.7360],
      [-3.6940, 36.7360],
      [-3.6940, 36.7250],
      [-3.7080, 36.7250],
    ],
  },
  {
    id: 'zone-centro',
    name: 'Puerta del Mar · Centro',
    shortName: 'Centro',
    center: [-3.6890, 36.7355],
    polygon: [
      [-3.6940, 36.7305],
      [-3.6940, 36.7410],
      [-3.6820, 36.7410],
      [-3.6820, 36.7305],
      [-3.6940, 36.7305],
    ],
  },
  {
    id: 'zone-velilla',
    name: 'Playa Velilla',
    shortName: 'Velilla',
    center: [-3.6750, 36.7345],
    polygon: [
      [-3.6820, 36.7290],
      [-3.6820, 36.7385],
      [-3.6660, 36.7385],
      [-3.6660, 36.7290],
      [-3.6820, 36.7290],
    ],
  },
  {
    id: 'zone-herradura',
    name: 'La Herradura',
    shortName: 'La Herradura',
    center: [-3.7330, 36.7400],
    polygon: [
      [-3.7450, 36.7320],
      [-3.7450, 36.7470],
      [-3.7230, 36.7470],
      [-3.7230, 36.7320],
      [-3.7450, 36.7320],
    ],
  },
  {
    id: 'zone-marina-este',
    name: 'Marina del Este',
    shortName: 'Marina del Este',
    center: [-3.7260, 36.7280],
    polygon: [
      [-3.7320, 36.7240],
      [-3.7320, 36.7320],
      [-3.7220, 36.7320],
      [-3.7220, 36.7240],
      [-3.7320, 36.7240],
    ],
  },
  {
    id: 'zone-taramay-cotobro',
    name: 'Taramay · Cotobro',
    shortName: 'Taramay',
    center: [-3.6700, 36.7255],
    polygon: [
      [-3.6850, 36.7200],
      [-3.6850, 36.7290],
      [-3.6540, 36.7290],
      [-3.6540, 36.7200],
      [-3.6850, 36.7200],
    ],
  },
  {
    id: 'zone-interior',
    name: 'Interior · Cumbres',
    shortName: 'Interior',
    center: [-3.6900, 36.7490],
    polygon: [
      [-3.7050, 36.7420],
      [-3.7050, 36.7600],
      [-3.6600, 36.7600],
      [-3.6600, 36.7420],
      [-3.7050, 36.7420],
    ],
  },
  {
    id: 'zone-salobrena',
    name: 'Salobreña',
    shortName: 'Salobreña',
    center: [-3.5850, 36.7480],
    polygon: [
      [-3.6000, 36.7400],
      [-3.6000, 36.7580],
      [-3.5700, 36.7580],
      [-3.5700, 36.7400],
      [-3.6000, 36.7400],
    ],
  },
]

// Pontos de interesse curados (reais)
const POIS: POI[] = [
  { id: 'poi-p1', name: 'Playa San Cristóbal',     type: 'beach',     latitude: 36.7302, longitude: -3.7005 },
  { id: 'poi-p2', name: 'Playa Puerta del Mar',    type: 'beach',     latitude: 36.7332, longitude: -3.6870 },
  { id: 'poi-p3', name: 'Playa Velilla',           type: 'beach',     latitude: 36.7342, longitude: -3.6740 },
  { id: 'poi-p4', name: 'Playa La Herradura',      type: 'beach',     latitude: 36.7398, longitude: -3.7340 },
  { id: 'poi-p5', name: 'Playa Cotobro',           type: 'beach',     latitude: 36.7258, longitude: -3.6815 },
  { id: 'poi-p6', name: 'Playa Taramay',           type: 'beach',     latitude: 36.7250, longitude: -3.6620 },
  { id: 'poi-m1', name: 'Marina del Este',         type: 'marina',    latitude: 36.7281, longitude: -3.7266 },
  { id: 'poi-l1', name: 'Castillo de San Miguel',  type: 'landmark',  latitude: 36.7363, longitude: -3.6915 },
  { id: 'poi-l2', name: 'Peñón del Santo',         type: 'viewpoint', latitude: 36.7295, longitude: -3.6900 },
  { id: 'poi-l3', name: 'Acueducto Romano',        type: 'landmark',  latitude: 36.7470, longitude: -3.6930 },
  { id: 'poi-l4', name: 'Parque El Majuelo',       type: 'landmark',  latitude: 36.7337, longitude: -3.6935 },
  { id: 'poi-l5', name: 'Castillo de Salobreña',   type: 'landmark',  latitude: 36.7482, longitude: -3.5850 },
  { id: 'poi-v1', name: 'Mirador La Caleta',       type: 'viewpoint', latitude: 36.7245, longitude: -3.7020 },
  { id: 'poi-v2', name: 'Cerro Gordo',             type: 'viewpoint', latitude: 36.7500, longitude: -3.7820 },
]

// Point-in-polygon simplificado (polígonos são axis-aligned bounding boxes)
function findZoneFor(lat: number, lng: number): string {
  for (const z of ZONES) {
    const lngs = z.polygon.map(p => p[0])
    const lats = z.polygon.map(p => p[1])
    const minLng = Math.min(...lngs), maxLng = Math.max(...lngs)
    const minLat = Math.min(...lats), maxLat = Math.max(...lats)
    if (lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat) return z.id
  }
  return 'zone-interior'
}

function temperatureFor(score: number): MarketZone['temperature'] {
  if (score >= 80) return 'HOT'
  if (score >= 65) return 'WARM'
  if (score >= 50) return 'COOL'
  return 'COLD'
}

export async function GET(request: { nextUrl: URL } & Request) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const showDemo = new URL(request.url).searchParams.get('demo') === 'true'

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const realProperties = await prisma.property.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
      status: { in: ['ACTIVE', 'MAINTENANCE'] },
    },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      status: true,
      bedrooms: true,
      reservations: {
        where: { checkIn: { gte: ninetyDaysAgo }, status: { not: 'CANCELLED' } },
        select: { amount: true, checkIn: true, checkOut: true },
      },
    },
  })

  const realPoints = realProperties.map(p => {
    const reservations = p.reservations
    const grossRevenue = reservations.reduce((s, r) => s + r.amount, 0)
    const totalNights = reservations.reduce(
      (s, r) => s + Math.max(1, Math.ceil((r.checkOut.getTime() - r.checkIn.getTime()) / (1000 * 60 * 60 * 24))),
      0,
    )
    const avgPrice = totalNights > 0 ? grossRevenue / totalNights : 0
    const occupancy = Math.min(100, (totalNights / 90) * 100)
    const revPAR = (avgPrice * occupancy) / 100

    return {
      id: p.id,
      name: p.name,
      latitude: p.latitude!,
      longitude: p.longitude!,
      status: p.status,
      bedrooms: p.bedrooms ?? 2,
      zoneId: findZoneFor(p.latitude!, p.longitude!),
      avgPrice: +avgPrice.toFixed(0),
      occupancy: +occupancy.toFixed(0),
      revPAR: +revPAR.toFixed(0),
      grossRevenue: +grossRevenue.toFixed(0),
      isReal: true as const,
    }
  })

  // ── Competitor listings (dados reais de scraping) ──
  const competitors = await prisma.competitorListing.findMany({
    where: { isActive: true },
    select: {
      id: true,
      title: true,
      latitude: true,
      longitude: true,
      bedrooms: true,
      pricePerNight: true,
      rating: true,
      reviewCount: true,
      isSuperhost: true,
      zoneId: true,
    },
  })

  const competitorPoints = competitors.map(c => ({
    id: `comp-${c.id}`,
    name: c.title,
    latitude: c.latitude,
    longitude: c.longitude,
    status: 'ACTIVE',
    bedrooms: c.bedrooms,
    zoneId: c.zoneId ?? findZoneFor(c.latitude, c.longitude) ?? 'zone-interior',
    avgPrice: +c.pricePerNight.toFixed(0),
    occupancy: 70, // estimativa base para competitors (não temos dados reais de ocupação)
    revPAR: +(c.pricePerNight * 0.70).toFixed(0),
    grossRevenue: +(c.pricePerNight * 0.70 * 90).toFixed(0), // estimativa 90 dias
    isReal: true as const, // scraped = real market data
  }))

  // Demo seed — só incluído quando ?demo=true
  type DemoRaw = Omit<MarketProperty, 'zoneId' | 'marketScore' | 'revPAR'>
  const DEMO_SEED_RAW: DemoRaw[] = !showDemo ? [] : [
    // San Cristóbal
    { id: 'd-sc-1', name: 'Villa San Cristóbal',       latitude: 36.7318, longitude: -3.7005, status: 'ACTIVE', bedrooms: 4, avgPrice: 235, occupancy: 82, grossRevenue: 17343, isReal: false },
    { id: 'd-sc-2', name: 'Apartamento Paseo',         latitude: 36.7305, longitude: -3.6985, status: 'ACTIVE', bedrooms: 2, avgPrice: 145, occupancy: 78, grossRevenue: 10179, isReal: false },
    { id: 'd-sc-3', name: 'Ático Frente al Mar',       latitude: 36.7295, longitude: -3.6995, status: 'ACTIVE', bedrooms: 3, avgPrice: 210, occupancy: 85, grossRevenue: 16065, isReal: false },
    { id: 'd-sc-4', name: 'Studio San Cristóbal',      latitude: 36.7330, longitude: -3.7020, status: 'ACTIVE', bedrooms: 1, avgPrice: 95,  occupancy: 72, grossRevenue: 6156,  isReal: false },

    // Centro
    { id: 'd-ct-1', name: 'Casa Puerta del Mar',       latitude: 36.7341, longitude: -3.6893, status: 'ACTIVE', bedrooms: 3, avgPrice: 165, occupancy: 76, grossRevenue: 11286, isReal: false },
    { id: 'd-ct-2', name: 'Estudio Centro',            latitude: 36.7360, longitude: -3.6878, status: 'ACTIVE', bedrooms: 1, avgPrice: 85,  occupancy: 70, grossRevenue: 5355,  isReal: false },
    { id: 'd-ct-3', name: 'Duplex Ayuntamiento',       latitude: 36.7375, longitude: -3.6905, status: 'ACTIVE', bedrooms: 2, avgPrice: 120, occupancy: 68, grossRevenue: 7344,  isReal: false },
    { id: 'd-ct-4', name: 'Loft Histórico',            latitude: 36.7385, longitude: -3.6885, status: 'ACTIVE', bedrooms: 1, avgPrice: 110, occupancy: 66, grossRevenue: 6534,  isReal: false },

    // Velilla
    { id: 'd-vl-1', name: 'Villa Velilla Beachfront',  latitude: 36.7342, longitude: -3.6745, status: 'ACTIVE', bedrooms: 4, avgPrice: 255, occupancy: 84, grossRevenue: 19278, isReal: false },
    { id: 'd-vl-2', name: 'Apartamento Velilla',       latitude: 36.7338, longitude: -3.6770, status: 'ACTIVE', bedrooms: 2, avgPrice: 135, occupancy: 74, grossRevenue: 8991,  isReal: false },
    { id: 'd-vl-3', name: 'Casa Playa Velilla',        latitude: 36.7325, longitude: -3.6755, status: 'ACTIVE', bedrooms: 3, avgPrice: 175, occupancy: 78, grossRevenue: 12285, isReal: false },
    { id: 'd-vl-4', name: 'Townhouse Velilla',         latitude: 36.7355, longitude: -3.6735, status: 'ACTIVE', bedrooms: 3, avgPrice: 160, occupancy: 71, grossRevenue: 10224, isReal: false },

    // La Herradura — premium
    { id: 'd-hr-1', name: 'Villa Herradura Luxury',    latitude: 36.7378, longitude: -3.7340, status: 'ACTIVE', bedrooms: 5, avgPrice: 320, occupancy: 79, grossRevenue: 22752, isReal: false },
    { id: 'd-hr-2', name: 'Apartamento Herradura',     latitude: 36.7402, longitude: -3.7318, status: 'ACTIVE', bedrooms: 2, avgPrice: 155, occupancy: 72, grossRevenue: 10044, isReal: false },
    { id: 'd-hr-3', name: 'Casa Vista Mar Herradura',  latitude: 36.7415, longitude: -3.7300, status: 'ACTIVE', bedrooms: 3, avgPrice: 210, occupancy: 76, grossRevenue: 14364, isReal: false },

    // Marina del Este — top
    { id: 'd-me-1', name: 'Villa Marina del Este',     latitude: 36.7279, longitude: -3.7264, status: 'ACTIVE', bedrooms: 4, avgPrice: 340, occupancy: 81, grossRevenue: 24786, isReal: false },
    { id: 'd-me-2', name: 'Apartamento Marina Este',   latitude: 36.7290, longitude: -3.7280, status: 'ACTIVE', bedrooms: 2, avgPrice: 180, occupancy: 74, grossRevenue: 11988, isReal: false },

    // Taramay / Cotobro
    { id: 'd-tc-1', name: 'Villa Taramay',             latitude: 36.7250, longitude: -3.6620, status: 'ACTIVE', bedrooms: 4, avgPrice: 225, occupancy: 76, grossRevenue: 15390, isReal: false },
    { id: 'd-tc-2', name: 'Casa Cotobro',              latitude: 36.7258, longitude: -3.6810, status: 'ACTIVE', bedrooms: 3, avgPrice: 195, occupancy: 79, grossRevenue: 13860, isReal: false },

    // Interior
    { id: 'd-in-1', name: 'Casa Alberdín',             latitude: 36.7470, longitude: -3.6880, status: 'ACTIVE', bedrooms: 3, avgPrice: 95,  occupancy: 62, grossRevenue: 5301,  isReal: false },
    { id: 'd-in-2', name: 'Casa Rural Cumbres',        latitude: 36.7555, longitude: -3.6760, status: 'ACTIVE', bedrooms: 4, avgPrice: 130, occupancy: 58, grossRevenue: 6786,  isReal: false },
    { id: 'd-in-3', name: 'Finca Interior',            latitude: 36.7488, longitude: -3.7010, status: 'ACTIVE', bedrooms: 5, avgPrice: 165, occupancy: 60, grossRevenue: 8910,  isReal: false },

    // Salobreña
    { id: 'd-sl-1', name: 'Villa Salobreña Castillo',  latitude: 36.7485, longitude: -3.5838, status: 'ACTIVE', bedrooms: 4, avgPrice: 185, occupancy: 77, grossRevenue: 12820, isReal: false },
    { id: 'd-sl-2', name: 'Apartamento Salobreña',     latitude: 36.7520, longitude: -3.5870, status: 'ACTIVE', bedrooms: 2, avgPrice: 115, occupancy: 69, grossRevenue: 7141,  isReal: false },
  ]

  const demoPoints = DEMO_SEED_RAW.map(p => ({
    ...p,
    zoneId: findZoneFor(p.latitude, p.longitude),
    revPAR: +((p.avgPrice * p.occupancy) / 100).toFixed(0),
  }))

  const realPointsWithRevPAR = realPoints.map(p => ({
    ...p,
    revPAR: +((p.avgPrice * p.occupancy) / 100).toFixed(0),
  }))

  const allPointsRaw = [...realPointsWithRevPAR, ...competitorPoints, ...demoPoints]

  // Market score: 50% RevPAR normalizado + 50% occupancy
  const maxRevPAR = Math.max(...allPointsRaw.map(p => p.revPAR), 1)
  const points: MarketProperty[] = allPointsRaw.map(p => ({
    ...p,
    marketScore: +((p.revPAR / maxRevPAR) * 50 + (p.occupancy / 100) * 50).toFixed(0),
  }))

  // Agregar por zona
  const zones: MarketZone[] = ZONES.map(z => {
    const zonePoints = points.filter(p => p.zoneId === z.id)
    const count = zonePoints.length
    if (count === 0) {
      return { ...z, propertyCount: 0, avgPrice: 0, avgOccupancy: 0, revPAR: 0, totalRevenue: 0, marketScore: 0, temperature: 'COLD' as const }
    }
    const avgPrice = zonePoints.reduce((s, p) => s + p.avgPrice, 0) / count
    const avgOccupancy = zonePoints.reduce((s, p) => s + p.occupancy, 0) / count
    const revPAR = zonePoints.reduce((s, p) => s + p.revPAR, 0) / count
    const totalRevenue = zonePoints.reduce((s, p) => s + p.grossRevenue, 0)
    const marketScore = zonePoints.reduce((s, p) => s + p.marketScore, 0) / count
    return {
      ...z,
      propertyCount: count,
      avgPrice: +avgPrice.toFixed(0),
      avgOccupancy: +avgOccupancy.toFixed(0),
      revPAR: +revPAR.toFixed(0),
      totalRevenue: +totalRevenue.toFixed(0),
      marketScore: +marketScore.toFixed(0),
      temperature: temperatureFor(marketScore),
    }
  })

  // Stats globais
  const totalGross = points.reduce((s, p) => s + p.grossRevenue, 0)
  const avgPrice = points.reduce((s, p) => s + p.avgPrice, 0) / Math.max(1, points.length)
  const avgOccupancy = points.reduce((s, p) => s + p.occupancy, 0) / Math.max(1, points.length)
  const avgRevPAR = points.reduce((s, p) => s + p.revPAR, 0) / Math.max(1, points.length)

  return NextResponse.json({
    center: { latitude: 36.7340, longitude: -3.6899 },
    region: 'Costa Tropical · Almuñécar',
    count: points.length,
    realCount: realPoints.length,
    competitorCount: competitorPoints.length,
    demoCount: demoPoints.length,
    demoMode: showDemo,
    stats: {
      totalGross: +totalGross.toFixed(0),
      avgPricePerNight: +avgPrice.toFixed(0),
      avgOccupancy: +avgOccupancy.toFixed(0),
      avgRevPAR: +avgRevPAR.toFixed(0),
    },
    points,
    zones,
    pois: POIS,
  })
}
