import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendEmail, monthlyStatementEmail } from '@/lib/email'
import { commissionRateForPlan } from '@/lib/finance'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5-minute timeout for batch sends

/**
 * Cron job: send monthly owner statements on the 1st of each month.
 * Scheduled in vercel.json: "0 8 1 * *" (08:00 UTC on the 1st).
 *
 * Vercel automatically sends Authorization: Bearer <CRON_SECRET>.
 * Set CRON_SECRET in Vercel environment variables.
 *
 * Optimised: batches all queries upfront (3 queries instead of 3*N),
 * then loops in-memory and sends emails serially.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Previous month
  const now   = new Date()
  const year  = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const month = now.getMonth() === 0 ? 12 : now.getMonth() // 1–12

  const monthStart = new Date(year, month - 1, 1)
  const monthEnd   = new Date(year, month, 1)

  const MONTH_NAMES = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]
  const monthName = MONTH_NAMES[month]

  // ── BATCH 1: Properties + owners ──────────────────────────────────────────
  const properties = await prisma.property.findMany({
    where: { status: 'ACTIVE' },
    include: {
      owner: { select: { id: true, name: true, email: true, subscriptionPlan: true } },
    },
  })

  if (properties.length === 0) {
    return NextResponse.json({ month: monthName, year, total: 0, sent: 0, skipped: 0, errors: 0, results: [] })
  }

  const propertyIds = properties.map(p => p.id)

  // ── BATCH 2-4: Existing reports + reservations + expenses (3 queries total) ──
  const [existingReports, allReservations, allExpenses] = await Promise.all([
    prisma.monthlyReport.findMany({
      where: { propertyId: { in: propertyIds }, month, year },
      select: { propertyId: true, sentAt: true },
    }),
    prisma.reservation.findMany({
      where: {
        propertyId: { in: propertyIds },
        checkIn: { gte: monthStart, lt: monthEnd },
        status: { not: 'CANCELLED' },
      },
      select: { propertyId: true, amount: true },
    }),
    prisma.expense.findMany({
      where: {
        propertyId: { in: propertyIds },
        date: { gte: monthStart, lt: monthEnd },
      },
      select: { propertyId: true, amount: true },
    }),
  ])

  // Group results by propertyId for O(1) lookup
  const reportByProperty = new Map(existingReports.map(r => [r.propertyId, r]))
  const reservationsByProperty = new Map<string, typeof allReservations>()
  const expensesByProperty = new Map<string, typeof allExpenses>()

  for (const r of allReservations) {
    if (!reservationsByProperty.has(r.propertyId)) reservationsByProperty.set(r.propertyId, [])
    reservationsByProperty.get(r.propertyId)!.push(r)
  }
  for (const e of allExpenses) {
    if (!expensesByProperty.has(e.propertyId)) expensesByProperty.set(e.propertyId, [])
    expensesByProperty.get(e.propertyId)!.push(e)
  }

  const results: { propertyId: string; status: string; reason?: string }[] = []

  // ── Process each property in-memory ──────────────────────────────────────
  for (const property of properties) {
    try {
      const existing = reportByProperty.get(property.id)
      if (existing?.sentAt) {
        results.push({ propertyId: property.id, status: 'skipped', reason: 'already sent' })
        continue
      }

      const reservations = reservationsByProperty.get(property.id) ?? []
      const expenses = expensesByProperty.get(property.id) ?? []

      const grossRevenue  = reservations.reduce((s, r) => s + r.amount, 0)
      const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
      const commissionRate = commissionRateForPlan(property.owner.subscriptionPlan) * 100
      const commission    = +(grossRevenue * commissionRate / 100).toFixed(2)
      const ownerPayout   = +(grossRevenue - totalExpenses - commission).toFixed(2)

      // Upsert report record
      await prisma.monthlyReport.upsert({
        where: { propertyId_month_year: { propertyId: property.id, month, year } },
        create: { propertyId: property.id, month, year, grossRevenue, totalExpenses, commission, ownerPayout },
        update: { grossRevenue, totalExpenses, commission, ownerPayout },
      })

      // Send email
      const ownerEmail = property.owner.email
      if (ownerEmail) {
        await sendEmail({
          to: ownerEmail,
          subject: `Your HostMasters statement — ${monthName} ${year} · ${property.name}`,
          html: monthlyStatementEmail({
            ownerName:        property.owner.name ?? 'Owner',
            propertyName:     property.name,
            month:            monthName,
            year,
            grossRevenue,
            totalExpenses,
            commissionRate,
            commission,
            ownerPayout,
            reservationCount: reservations.length,
            dashboardUrl:     process.env.NEXT_PUBLIC_APP_URL
              ? `${process.env.NEXT_PUBLIC_APP_URL}/client/reports`
              : undefined,
          }),
        })

        // Mark as sent
        await prisma.monthlyReport.update({
          where: { propertyId_month_year: { propertyId: property.id, month, year } },
          data: { sentAt: new Date() },
        })
      }

      results.push({ propertyId: property.id, status: 'sent' })
    } catch (err) {
      console.error(`Monthly statement error for property ${property.id}:`, err)
      results.push({ propertyId: property.id, status: 'error', reason: String(err) })
    }
  }

  const summary = {
    month: monthName,
    year,
    total:   results.length,
    sent:    results.filter(r => r.status === 'sent').length,
    skipped: results.filter(r => r.status === 'skipped').length,
    errors:  results.filter(r => r.status === 'error').length,
    results,
  }

  console.log('Monthly statements cron:', JSON.stringify(summary))
  return NextResponse.json(summary)
}
