import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calcCommission, payoutDateFrom } from '@/lib/finance'
import { pickLeastBusyCrew, buildChecklist } from '@/lib/crew'
import { notifyAdmin } from '@/lib/notify'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const status = searchParams.get('status')

    const where: Record<string, unknown> = {}
    if (propertyId) where.propertyId = propertyId
    if (status) where.status = status

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

    // Auto-create ops tasks (check-in, check-out, post-checkout cleaning)
    const assigneeId = await pickLeastBusyCrew()
    const baseTasks = [
      { type: 'CHECK_IN' as const, title: `Check-in · ${guestName}`, dueDate: checkInDate },
      { type: 'CHECK_OUT' as const, title: `Check-out · ${guestName}`, dueDate: checkOutDate },
      { type: 'CLEANING' as const, title: `Post-checkout cleaning`, dueDate: checkOutDate },
    ]
    await prisma.task.createMany({
      data: baseTasks.map(t => ({
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
