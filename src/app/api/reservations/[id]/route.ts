import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CLIENT', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  try {
    const { id } = params

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            ownerId: true,
            owner: { select: { managerId: true } },
          },
        },
      },
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
    }

    // Scope checks
    if (me.role === 'CLIENT' && reservation.property.ownerId !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (me.role === 'MANAGER' && reservation.property.owner.managerId !== me.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (me.role === 'CREW') {
      // CREW can only view reservations for properties where they have tasks
      const hasTask = await prisma.task.findFirst({
        where: { propertyId: reservation.property.id, assigneeId: me.id },
        select: { id: true },
      })
      if (!hasTask) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      // Return limited data for CREW — no financial details
      const safeReservation = reservation
      return NextResponse.json({
        ...safeReservation,
        amount: undefined,
        property: {
          id: reservation.property.id,
          name: reservation.property.name,
          address: reservation.property.address,
          city: reservation.property.city,
        },
      })
    }

    return NextResponse.json(reservation)
  } catch (error) {
    console.error('Error fetching reservation:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reservation' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  try {
    const { id } = params

    // MANAGER can only update reservations for properties belonging to their clients
    if (me.role === 'MANAGER') {
      const existing = await prisma.reservation.findUnique({
        where: { id },
        include: { property: { select: { owner: { select: { managerId: true } } } } },
      })
      if (!existing || existing.property?.owner?.managerId !== me.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const body = await request.json()

    // ── Cancelling a reservation ──
    let paidPayoutsWarning: string | null = null
    if (body.status === 'CANCELLED') {
      const reservation = await prisma.reservation.findUnique({
        where: { id },
        select: { id: true, status: true },
      })
      if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (reservation.status === 'CANCELLED') return NextResponse.json({ error: 'Already cancelled' }, { status: 409 })

      // Count PAID payouts — they stay PAID and require manual refund
      const paidCount = await prisma.payout.count({
        where: { reservationId: id, status: 'PAID' },
      })

      // Cancel associated SCHEDULED payouts
      await prisma.payout.updateMany({
        where: { reservationId: id, status: 'SCHEDULED' },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      })

      paidPayoutsWarning = paidCount > 0
        ? `${paidCount} paid payout${paidCount === 1 ? '' : 's'} require manual refund`
        : null

      // Cancel ALL associated pending/notified/confirmed tasks
      const res = await prisma.reservation.findUnique({ where: { id }, select: { propertyId: true, checkIn: true, checkOut: true } })
      if (res) {
        await prisma.task.updateMany({
          where: {
            propertyId: res.propertyId,
            status: { in: ['PENDING', 'NOTIFIED', 'CONFIRMED', 'IN_PROGRESS'] },
            dueDate: { gte: res.checkIn, lte: res.checkOut },
          },
          data: { status: 'COMPLETED' },
        })
      }
    }

    // ── Admin activating reservation manually ──
    if (body.status === 'ACTIVE' || body.status === 'COMPLETED') {
      const reservation = await prisma.reservation.findUnique({
        where: { id },
        select: { id: true, status: true, propertyId: true, checkIn: true, checkOut: true },
      })
      if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      // Check if crew has completed CHECK_IN task
      if (body.status === 'ACTIVE') {
        const checkInTask = await prisma.task.findFirst({
          where: {
            propertyId: reservation.propertyId,
            type: 'CHECK_IN',
            dueDate: {
              gte: new Date(new Date(reservation.checkIn).setDate(reservation.checkIn.getDate() - 1)),
              lte: new Date(new Date(reservation.checkIn).setDate(reservation.checkIn.getDate() + 1)),
            },
          },
          select: { id: true, status: true, assignee: { select: { name: true } } },
        })

        const crewCompleted = checkInTask?.status === 'COMPLETED'

        // If force=false and crew hasn't completed, return warning
        if (!body.force && !crewCompleted) {
          return NextResponse.json({
            warning: true,
            message: checkInTask
              ? `A tarefa de CHECK_IN atribuída a ${checkInTask.assignee?.name ?? 'crew'} ainda não foi concluída (estado: ${checkInTask.status}). Deseja activar a reserva mesmo assim?`
              : 'Não existe tarefa de CHECK_IN para esta reserva. Deseja activar mesmo assim?',
            taskId: checkInTask?.id ?? null,
            taskStatus: checkInTask?.status ?? null,
          }, { status: 200 })
        }
      }
    }

    const data: Record<string, unknown> = { ...body }
    delete data.force // don't persist the force flag
    if (body.checkIn) data.checkIn = new Date(body.checkIn)
    if (body.checkOut) data.checkOut = new Date(body.checkOut)

    const reservation = await prisma.reservation.update({
      where: { id },
      data,
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json({ ...reservation, warning: paidPayoutsWarning })
  } catch (error) {
    console.error('Error updating reservation:', error)
    return NextResponse.json(
      { error: 'Failed to update reservation' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  try {
    const { id } = params

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      select: { id: true, status: true, propertyId: true, checkIn: true, checkOut: true },
    })
    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 })
    }

    // Clean up related records before deleting
    await prisma.$transaction(async (tx) => {
      // Delete associated payouts
      await tx.payout.deleteMany({ where: { reservationId: id } })

      // Delete associated tasks (scoped by property + date range)
      await tx.task.deleteMany({
        where: {
          propertyId: reservation.propertyId,
          dueDate: { gte: reservation.checkIn, lte: reservation.checkOut },
        },
      })

      // Delete stay review if exists
      await tx.stayReview.deleteMany({ where: { reservationId: id } })

      // Delete the reservation
      await tx.reservation.delete({ where: { id } })
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting reservation:', error)
    return NextResponse.json(
      { error: 'Failed to delete reservation' },
      { status: 500 }
    )
  }
}
