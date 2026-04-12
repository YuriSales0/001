import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export type MarketProperty = {
  id: string
  name: string
  latitude: number
  longitude: number
  status: string
  avgPrice: number       // €/noite médio
  occupancy: number      // 0-100
  grossRevenue: number   // últimos 90 dias
  isReal: boolean        // true = dados reais, false = demo seed
}

/**
 * Dados geospatiais do mercado de Almuñécar.
 * Combina propriedades reais (com lat/lon) com seed data de demo
 * para popular o mapa quando ainda não há volume suficiente.
 *
 * Centro de Almuñécar: 36.7340, -3.6899
 */
export async function GET() {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  // 90 dias atrás
  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  // Propriedades reais com lat/lon preenchidos
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
      reservations: {
        where: { checkIn: { gte: ninetyDaysAgo }, status: { not: 'CANCELLED' } },
        select: { amount: true, checkIn: true, checkOut: true },
      },
    },
  })

  const realPoints: MarketProperty[] = realProperties.map(p => {
    const reservations = p.reservations
    const grossRevenue = reservations.reduce((s, r) => s + r.amount, 0)
    const totalNights = reservations.reduce(
      (s, r) => s + Math.max(1, Math.ceil((r.checkOut.getTime() - r.checkIn.getTime()) / (1000 * 60 * 60 * 24))),
      0,
    )
    const avgPrice = totalNights > 0 ? grossRevenue / totalNights : 0
    const occupancy = Math.min(100, (totalNights / 90) * 100)

    return {
      id: p.id,
      name: p.name,
      latitude: p.latitude!,
      longitude: p.longitude!,
      status: p.status,
      avgPrice: +avgPrice.toFixed(0),
      occupancy: +occupancy.toFixed(0),
      grossRevenue: +grossRevenue.toFixed(0),
      isReal: true,
    }
  })

  // Demo seed — propriedades simuladas em Almuñécar (zonas reais)
  // Usamos isto para o mapa ter visual impacto mesmo sem dados reais ainda
  const DEMO_SEED: MarketProperty[] = [
    // Playa San Cristóbal (centro/oeste, beachfront premium)
    { id: 'demo-1',  name: 'Demo · Villa San Cristóbal',   latitude: 36.7318, longitude: -3.7005, status: 'ACTIVE', avgPrice: 185, occupancy: 82, grossRevenue: 13600, isReal: false },
    { id: 'demo-2',  name: 'Demo · Apartamento Marina',    latitude: 36.7295, longitude: -3.6985, status: 'ACTIVE', avgPrice: 140, occupancy: 75, grossRevenue: 9450,  isReal: false },
    { id: 'demo-3',  name: 'Demo · Ático Paseo',           latitude: 36.7305, longitude: -3.6960, status: 'ACTIVE', avgPrice: 220, occupancy: 88, grossRevenue: 17420, isReal: false },

    // Playa Puerta del Mar (centro)
    { id: 'demo-4',  name: 'Demo · Casa Puerta del Mar',   latitude: 36.7341, longitude: -3.6893, status: 'ACTIVE', avgPrice: 165, occupancy: 78, grossRevenue: 11585, isReal: false },
    { id: 'demo-5',  name: 'Demo · Estudio Centro',        latitude: 36.7360, longitude: -3.6878, status: 'ACTIVE', avgPrice: 95,  occupancy: 70, grossRevenue: 5985,  isReal: false },
    { id: 'demo-6',  name: 'Demo · Duplex Ayuntamiento',   latitude: 36.7375, longitude: -3.6905, status: 'ACTIVE', avgPrice: 125, occupancy: 72, grossRevenue: 8100,  isReal: false },

    // Playa Velilla (este)
    { id: 'demo-7',  name: 'Demo · Villa Velilla',         latitude: 36.7360, longitude: -3.6745, status: 'ACTIVE', avgPrice: 240, occupancy: 85, grossRevenue: 18360, isReal: false },
    { id: 'demo-8',  name: 'Demo · Apartamento Velilla',   latitude: 36.7345, longitude: -3.6770, status: 'ACTIVE', avgPrice: 135, occupancy: 74, grossRevenue: 8991,  isReal: false },
    { id: 'demo-9',  name: 'Demo · Casa Playa Velilla',    latitude: 36.7335, longitude: -3.6755, status: 'ACTIVE', avgPrice: 175, occupancy: 80, grossRevenue: 12600, isReal: false },

    // La Herradura (oeste, premium)
    { id: 'demo-10', name: 'Demo · Villa Herradura',       latitude: 36.7378, longitude: -3.7340, status: 'ACTIVE', avgPrice: 280, occupancy: 79, grossRevenue: 19908, isReal: false },
    { id: 'demo-11', name: 'Demo · Casa Marina del Este',  latitude: 36.7279, longitude: -3.7264, status: 'ACTIVE', avgPrice: 310, occupancy: 82, grossRevenue: 22878, isReal: false },
    { id: 'demo-12', name: 'Demo · Apartamento Herradura', latitude: 36.7402, longitude: -3.7318, status: 'ACTIVE', avgPrice: 155, occupancy: 72, grossRevenue: 10044, isReal: false },

    // Taramay / Cotobro (este-sudeste)
    { id: 'demo-13', name: 'Demo · Villa Taramay',         latitude: 36.7265, longitude: -3.6580, status: 'ACTIVE', avgPrice: 200, occupancy: 76, grossRevenue: 13680, isReal: false },
    { id: 'demo-14', name: 'Demo · Casa Cotobro',          latitude: 36.7250, longitude: -3.6810, status: 'ACTIVE', avgPrice: 210, occupancy: 81, grossRevenue: 15309, isReal: false },

    // Interior / Monte (residencial)
    { id: 'demo-15', name: 'Demo · Casa Alberdín',         latitude: 36.7440, longitude: -3.6870, status: 'ACTIVE', avgPrice: 110, occupancy: 65, grossRevenue: 6435,  isReal: false },
    { id: 'demo-16', name: 'Demo · Casa Rural Jete',       latitude: 36.7555, longitude: -3.6600, status: 'ACTIVE', avgPrice: 130, occupancy: 60, grossRevenue: 7020,  isReal: false },
    { id: 'demo-17', name: 'Demo · Casa Cumbres',          latitude: 36.7488, longitude: -3.7010, status: 'ACTIVE', avgPrice: 145, occupancy: 68, grossRevenue: 8874,  isReal: false },

    // Salobreña (vizinha — comparação de mercado)
    { id: 'demo-18', name: 'Demo · Villa Salobreña',       latitude: 36.7476, longitude: -3.5838, status: 'ACTIVE', avgPrice: 170, occupancy: 77, grossRevenue: 11781, isReal: false },
    { id: 'demo-19', name: 'Demo · Apartamento Salobreña', latitude: 36.7495, longitude: -3.5870, status: 'ACTIVE', avgPrice: 115, occupancy: 70, grossRevenue: 7245,  isReal: false },

    // Maro (oeste — limite com Málaga)
    { id: 'demo-20', name: 'Demo · Cueva Maro',            latitude: 36.7530, longitude: -3.7830, status: 'ACTIVE', avgPrice: 195, occupancy: 83, grossRevenue: 14560, isReal: false },
  ]

  const points = [...realPoints, ...DEMO_SEED]

  // Agregações por zona para o painel lateral
  const totalGross = points.reduce((s, p) => s + p.grossRevenue, 0)
  const avgOccupancy = points.length > 0
    ? points.reduce((s, p) => s + p.occupancy, 0) / points.length
    : 0
  const avgPricePerNight = points.length > 0
    ? points.reduce((s, p) => s + p.avgPrice, 0) / points.length
    : 0

  return NextResponse.json({
    center: { latitude: 36.7340, longitude: -3.6899 },
    region: 'Costa Tropical · Almuñécar',
    count: points.length,
    realCount: realPoints.length,
    demoCount: DEMO_SEED.length,
    stats: {
      totalGross: +totalGross.toFixed(0),
      avgOccupancy: +avgOccupancy.toFixed(0),
      avgPricePerNight: +avgPricePerNight.toFixed(0),
    },
    points,
  })
}
