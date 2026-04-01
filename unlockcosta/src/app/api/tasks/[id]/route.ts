import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    const data: Record<string, unknown> = {}
    if (body.status) data.status = body.status
    if (body.assigneeId !== undefined) data.assigneeId = body.assigneeId || null
    if (body.title) data.title = body.title
    if (body.description !== undefined) data.description = body.description
    if (body.dueDate) data.dueDate = new Date(body.dueDate)
    if (body.type) data.type = body.type

    const task = await prisma.task.update({
      where: { id },
      data,
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

    return NextResponse.json(task)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}
