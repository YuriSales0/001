import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseIcal } from '@/lib/ical'

export const dynamic = 'force-dynamic'

async function fetchAndParse(url: string) {
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
  return parseIcal(await res.text())
}

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const property = await prisma.property.findUnique({ where: { id: params.id } })
  if (!property) return NextResponse.json({ error: 'Property not found' }, { status: 404 })

  const sources: Array<{ name: string; url: string | null }> = [
    { name: 'airbnb', url: property.airbnbIcalUrl },
    { name: 'booking', url: property.bookingIcalUrl },
  ]

  const summary: Record<string, { events: number; created: number; error?: string }> = {}

  for (const src of sources) {
    if (!src.url) continue
    try {
      const events = await fetchAndParse(src.url)
      let created = 0
      for (const ev of events) {
        // Use BlockedDate as the canonical "external booking" representation —
        // these are syncs from third parties, not platform-managed reservations.
        const exists = await prisma.blockedDate.findFirst({
          where: {
            propertyId: property.id,
            startDate: ev.start,
            endDate: ev.end,
            reason: `${src.name}:${ev.uid}`,
          },
        })
        if (!exists) {
          await prisma.blockedDate.create({
            data: {
              propertyId: property.id,
              startDate: ev.start,
              endDate: ev.end,
              reason: `${src.name}:${ev.uid}`,
            },
          })
          created++
        }
      }
      summary[src.name] = { events: events.length, created }
    } catch (e) {
      summary[src.name] = { events: 0, created: 0, error: e instanceof Error ? e.message : String(e) }
    }
  }

  // Mark connection flags
  await prisma.property.update({
    where: { id: property.id },
    data: {
      airbnbConnected: !!property.airbnbIcalUrl,
      bookingConnected: !!property.bookingIcalUrl,
    },
  })

  return NextResponse.json({ ok: true, summary, syncedAt: new Date().toISOString() })
}
