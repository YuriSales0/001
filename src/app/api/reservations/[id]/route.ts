import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CLIENT', 'CREW'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
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
          },
        },
        expenses: {
          orderBy: { date: 'desc' },
        },
      },
    })

    if (!reservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      )
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
  try {
    const { id } = params
    const body = await request.json()

    // ── Cancelling a reservation ──
    if (body.status === 'CANCELLED') {
      const reservation = await prisma.reservation.findUnique({
        where: { id },
        select: { id: true, status: true },
      })
      if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      if (reservation.status === 'CANCELLED') return NextResponse.json({ error: 'Already cancelled' }, { status: 409 })

      // Cancel associated SCHEDULED payouts
      await prisma.payout.updateMany({
        where: { reservationId: id, status: 'SCHEDULED' },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      })

      // Cancel associated pending tasks
      await prisma.task.updateMany({
        where: {
          propertyId: (await prisma.reservation.findUnique({ where: { id }, select: { propertyId: true } }))!.propertyId,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { gte: new Date() },
        },
        data: { status: 'COMPLETED' },
      })
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

    return NextResponse.json(reservation)
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

    await prisma.reservation.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Reservation deleted successfully' })
  } catch (error) {
    console.error('Error deleting reservation:', error)
    return NextResponse.json(
      { error: 'Failed to delete reservation' },
      { status: 500 }
    )
  }
}
