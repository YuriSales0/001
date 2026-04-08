import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function GET(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CREW', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const where: Record<string, unknown> = {}
    if (propertyId) where.propertyId = propertyId
    if (status) where.status = status
    if (type) where.type = type
    if (me.role === 'CLIENT') where.property = { ownerId: me.id }
    else if (me.role === 'MANAGER') where.property = { owner: { managerId: me.id } }

    const tasks = await prisma.task.findMany({
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
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CREW', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  try {
    const body = await request.json()
    const { propertyId, type, title, description, notes, dueDate } = body
    let { assigneeId } = body

    if (!propertyId || !type || !title || !dueDate) {
      return NextResponse.json(
        { error: 'Missing required fields: propertyId, type, title, dueDate' },
        { status: 400 }
      )
    }

    // CLIENT can only create tasks for their own properties
    if (me.role === 'CLIENT') {
      const prop = await import('@/lib/prisma').then(m =>
        m.prisma.property.findUnique({ where: { id: propertyId }, select: { ownerId: true } })
      )
      if (prop?.ownerId !== me.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    if (!assigneeId) {
      const { pickLeastBusyCrew } = await import('@/lib/crew')
      assigneeId = await pickLeastBusyCrew()
    }
    // CLIENT-created tasks don't require crew assignment immediately
    if (!assigneeId && me.role !== 'CLIENT') {
      return NextResponse.json({ error: 'No crew available to assign task' }, { status: 400 })
    }

    const { buildChecklist } = await import('@/lib/crew')
    const task = await prisma.task.create({
      data: {
        propertyId,
        type,
        title,
        description,
        notes: notes ?? '',
        checklist: buildChecklist(type),
        dueDate: new Date(dueDate),
        assigneeId,
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    return NextResponse.json(task, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
  }
}
