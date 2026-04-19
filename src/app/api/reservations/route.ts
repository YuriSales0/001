import { NextRequest, NextResponse } from 'next/server'
import { type TaskType, Platform } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { calcCommission, payoutDateFrom } from '@/lib/finance'
import { buildChecklist, autoTasksForPlan } from '@/lib/crew'
import { findBestCrew } from '@/lib/crew-assignment'
import { notifyAdmin } from '@/lib/notify'
import { requireRole } from '@/lib/session'
import { notify } from '@/lib/notifications'

export async function GET(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (propertyId) where.propertyId = propertyId
    if (status) where.status = status
    if (me.role === 'CLIENT') where.property = { ownerId: me.id }
    else if (me.role === 'MANAGER') where.property = { owner: { managerId: me.id } }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
          },
        },
      },
      orderBy: { checkIn: 'desc' },
      take: 500,
    })

    return NextResponse.json(reservations)
  } catch (error) {
    console.error('Error fetching reservations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  try {
    const body = await request.json()
    const {
      propertyId, guestName, guestEmail, guestPhone, checkIn, checkOut, amount, platform,
      // Guest demographics
      guestNationality, guestCountry, guestAge, guestAgeGroup, guestGroupSize,
      hasChildren, hasPets, isRepeatGuest, guestLanguage, bookingChannel,
    } = body

    if (!propertyId || !guestName || !checkIn || !checkOut || amount == null) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyId, guestName, checkIn, checkOut, amount' },
        { status: 400 }
      )
    }

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    // Get owner's plan to calculate correct commission rate
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: { owner: { select: { subscriptionPlan: true, managerId: true } } },
    })
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }
    // MANAGER can only create reservations for properties owned by their managed clients
    if (me.role === 'MANAGER' && property.owner?.managerId !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const ownerPlan = property?.owner?.subscriptionPlan ?? null
    const { commission, commissionRate, net } = calcCommission(amount, ownerPlan)

    const platformUpper = typeof platform === 'string' ? platform.toUpperCase() : undefined
    const platformValue: Platform | undefined =
      platformUpper && (Object.values(Platform) as string[]).includes(platformUpper)
        ? (platformUpper as Platform)
        : undefined

    // Auto-calculate booking lead days
    const autoLeadDays = Math.max(0, Math.round((checkInDate.getTime() - Date.now()) / 86400000))

    const reservation = await prisma.reservation.create({
      data: {
        propertyId,
        guestName,
        guestEmail,
        guestPhone,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        amount,
        platform: platformValue,
        // Guest demographics
        guestNationality: guestNationality ?? null,
        guestCountry: guestCountry ?? null,
        guestAge: guestAge ? parseInt(guestAge) : null,
        guestAgeGroup: guestAgeGroup ?? null,
        guestGroupSize: guestGroupSize ? parseInt(guestGroupSize) : null,
        hasChildren: hasChildren ?? null,
        hasPets: hasPets ?? null,
        isRepeatGuest: isRepeatGuest ?? false,
        guestLanguage: guestLanguage ?? null,
        bookingLeadDays: autoLeadDays,
        bookingChannel: bookingChannel ?? null,
        payouts: {
          create: {
            propertyId,
            grossAmount: amount,
            commission,
            commissionRate,
            netAmount: net,
            scheduledFor: payoutDateFrom(checkOutDate, platformValue),
            platform: platformValue,
          },
        },
      },
      include: {
        property: { select: { id: true, name: true } },
        payouts: true,
      },
    })

    // ── Auto-tasks ──────────────────────────────────────────────────────────
    const bestCrew = await findBestCrew(propertyId)
    const assigneeId = bestCrew?.userId ?? null
    const plan = ownerPlan ?? 'STARTER'

    // 1 day before check-in for pre-stay inspection / shopping
    const dayBeforeCheckIn = new Date(checkInDate)
    dayBeforeCheckIn.setDate(dayBeforeCheckIn.getDate() - 1)

    // Base tasks — all plans
    type TaskRow = { type: TaskType; title: string; dueDate: Date }
    const autoTasks: TaskRow[] = [
      { type: 'CHECK_IN',  title: `Check-in · ${guestName}`,     dueDate: checkInDate  },
      { type: 'CHECK_OUT', title: `Check-out · ${guestName}`,    dueDate: checkOutDate },
      { type: 'CLEANING',  title: `Limpeza pós-checkout`,         dueDate: checkOutDate },
    ]

    // Plan-aware extra tasks
    const planExtras = autoTasksForPlan(plan)

    if (planExtras.includes('INSPECTION')) {
      autoTasks.push(
        { type: 'INSPECTION', title: `Inspecção pré-estadia · ${guestName}`, dueDate: dayBeforeCheckIn },
        { type: 'INSPECTION', title: `Inspecção pós-estadia · ${guestName}`, dueDate: checkOutDate     },
      )
    }
    if (planExtras.includes('SHOPPING')) {
      autoTasks.push(
        { type: 'SHOPPING', title: `Compras pré-chegada · ${guestName}`, dueDate: dayBeforeCheckIn },
      )
    }
    if (planExtras.includes('TRANSFER')) {
      autoTasks.push(
        { type: 'TRANSFER', title: `Transfer aeroporto · ${guestName}`, dueDate: checkInDate },
      )
    }
    if (planExtras.includes('LAUNDRY')) {
      autoTasks.push(
        { type: 'LAUNDRY', title: `Lavandaria pós-checkout · ${guestName}`, dueDate: checkOutDate },
      )
    }

    const now = new Date()
    await prisma.task.createMany({
      data: autoTasks.map(t => ({
        propertyId,
        type: t.type,
        title: t.title,
        dueDate: t.dueDate,
        assigneeId,
        status: assigneeId ? 'NOTIFIED' as const : 'PENDING' as const,
        notifiedAt: assigneeId ? now : null,
        checklist: buildChecklist(t.type),
        notes: '',
      })),
    })

    // Notify assigned crew about their new tasks
    if (assigneeId) {
      notify({
        userId: assigneeId,
        type: 'TASK_ASSIGNED',
        title: `New tasks: ${guestName}`,
        body: `${autoTasks.length} task(s) for ${reservation.property.name} — confirm within 30 min`,
        link: '/crew',
      }).catch(() => {})
    }

    if (!assigneeId) {
      await notifyAdmin({
        subject: '⚠️ Reservation created without crew assignment',
        message:
          `A new reservation for ${guestName} was created but no CREW user is available to assign the tasks.\n\n` +
          `Reservation ID: ${reservation.id}\nProperty ID: ${propertyId}\nCheck-in: ${checkInDate.toISOString()}\n\n` +
          `Create a crew member or assign the tasks manually.`,
      })
    }

    // ── PricingDataPoint — collect one row per night ─────────────────────────
    const nights: {
      propertyId: string; reservationId: string; date: Date
      priceCharged: number; platform: typeof platformValue
      leadTimeDays: number; stayLength: number
      dayOfWeek: number; monthOfYear: number
      isWeekend: boolean
    }[] = []

    const stayLength = Math.max(
      1,
      Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 86400000),
    )
    const pricePerNight = amount / stayLength
    const leadTimeDays = Math.max(
      0,
      Math.round((checkInDate.getTime() - Date.now()) / 86400000),
    )

    for (let i = 0; i < stayLength; i++) {
      const night = new Date(checkInDate)
      night.setDate(night.getDate() + i)
      const dow = night.getDay() // 0=Sun … 6=Sat
      nights.push({
        propertyId,
        reservationId: reservation.id,
        date: night,
        priceCharged: +pricePerNight.toFixed(2),
        platform: platformValue,
        leadTimeDays,
        stayLength,
        dayOfWeek: dow === 0 ? 6 : dow - 1, // normalize to 0=Mon
        monthOfYear: night.getMonth() + 1,
        isWeekend: dow === 0 || dow === 6,
      })
    }

    await prisma.pricingDataPoint.createMany({ data: nights }).catch(e =>
      console.error('PricingDataPoint collection error:', e),
    )

    // Notify property owner about new booking
    if (property.ownerId) {
      notify({
        userId: property.ownerId,
        type: 'BOOKING_RECEIVED',
        title: `New booking: ${guestName}`,
        body: `${new Date(checkIn).toLocaleDateString('en-GB')} → ${new Date(checkOut).toLocaleDateString('en-GB')} · €${amount}`,
        link: '/client/bookings',
      }).catch(() => {})
    }

    return NextResponse.json(reservation, { status: 201 })
  } catch (error) {
    console.error('Error creating reservation:', error)
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    )
  }
}
