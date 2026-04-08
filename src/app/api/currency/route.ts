import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** In-memory cache so we don't spam the free API */
let cachedRates: Record<string, number> | null = null
let cacheExpiry = 0

export async function GET() {
  const now = Date.now()
  if (cachedRates && now < cacheExpiry) {
    return NextResponse.json(cachedRates, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    })
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/EUR', {
      next: { revalidate: 3600 },
    })
    if (!res.ok) throw new Error(`ER-API ${res.status}`)
    const data = await res.json()
    const rates: Record<string, number> = {
      EUR: 1,
      USD: data.rates?.USD ?? 1.08,
      GBP: data.rates?.GBP ?? 0.86,
      BRL: data.rates?.BRL ?? 5.40,
    }
    cachedRates = rates
    cacheExpiry = now + 60 * 60 * 1000 // 1 hour
    return NextResponse.json(rates, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    })
  } catch {
    // Fallback rates if API unavailable
    const fallback = { EUR: 1, USD: 1.08, GBP: 0.86, BRL: 5.40 }
    return NextResponse.json(fallback, {
      headers: { 'Cache-Control': 'public, max-age=300' },
    })
  }
}
