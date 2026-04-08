import { NextRequest, NextResponse } from 'next/server'
import { type TaskType } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { calcCommission, payoutDateFrom } from '@/lib/finance'
import { pickLeastBusyCrew, buildChecklist, autoTasksForPlan } from '@/lib/crew'
import { notifyAdmin } from '@/lib/notify'

export async function GET(request: NextRequest) {
  const { requireRole } = await import('@/lib/session')
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
  try {
    const body = await request.json()
    const { propertyId, guestName, guestEmail, guestPhone, checkIn, checkOut, amount, platform } = body

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
      include: { owner: { select: { subscriptionPlan: true } } },
    })
    const ownerPlan = property?.owner?.subscriptionPlan ?? null
    const { commission, commissionRate, net } = calcCommission(amount, ownerPlan)

    const platformEnum = (platform as string | undefined)?.toUpperCase() as
      | 'AIRBNB' | 'BOOKING' | 'DIRECT' | 'OTHER' | undefined
    const validPlatforms = ['AIRBNB', 'BOOKING', 'DIRECT', 'OTHER']
    const platformValue = platformEnum && validPlatforms.includes(platformEnum) ? platformEnum : undefined

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
    const assigneeId = await pickLeastBusyCrew()
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

    await prisma.task.createMany({
      data: autoTasks.map(t => ({
        propertyId,
        type: t.type,
        title: t.title,
        dueDate: t.dueDate,
        assigneeId: assigneeId ?? null,
        checklist: buildChecklist(t.type),
        notes: '',
      })),
    })

    if (!assigneeId) {
      await notifyAdmin({
        subject: '⚠️ Reservation created without crew assignment',
        message:
          `A new reservation for ${guestName} was created but no CREW user is available to assign the tasks.\n\n` +
          `Reservation ID: ${reservation.id}\nProperty ID: ${propertyId}\nCheck-in: ${checkInDate.toISOString()}\n\n` +
          `Create a crew member or assign the tasks manually.`,
      })
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
