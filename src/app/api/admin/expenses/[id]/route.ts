import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

type RouteContext = { params: { id: string } }

function serialize(e: Record<string, unknown>) {
  return {
    ...e,
    amount: Number(e.amount),
    vatAmount: e.vatAmount != null ? Number(e.vatAmount) : null,
    vatRate: e.vatRate != null ? Number(e.vatRate) : null,
  }
}

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const expense = await prisma.expense.findUnique({
    where: { id: params.id },
    include: { property: { select: { id: true, name: true } } },
  })

  if (!expense) {
    return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
  }

  return NextResponse.json(serialize(expense as unknown as Record<string, unknown>))
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const existing = await prisma.expense.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const data: Record<string, unknown> = {}

    // Editable fields
    const textFields = [
      'description', 'subcategory', 'supplierName', 'supplierTaxId',
      'supplierInvoice', 'invoiceUrl', 'invoicePhotoUrl', 'notes',
    ] as const
    for (const f of textFields) {
      if (body[f] !== undefined) data[f] = body[f]?.trim() || null
    }
    if (body.category !== undefined) data.category = body.category
    if (body.amount !== undefined) data.amount = body.amount
    if (body.vatAmount !== undefined) data.vatAmount = body.vatAmount
    if (body.vatRate !== undefined) data.vatRate = body.vatRate
    if (body.expenseDate !== undefined) data.expenseDate = new Date(body.expenseDate)
    if (body.dueDate !== undefined) data.dueDate = body.dueDate ? new Date(body.dueDate) : null
    if (body.propertyId !== undefined) data.propertyId = body.propertyId || null
    if (body.isRecurring !== undefined) {
      data.isRecurring = body.isRecurring === true
      if (!body.isRecurring) data.recurringFreq = null
    }
    if (body.recurringFreq !== undefined) data.recurringFreq = body.recurringFreq || null
    if (body.autoStockEntry !== undefined) data.autoStockEntry = body.autoStockEntry === true

    // Status transitions
    if (body.status !== undefined) {
      const newStatus = body.status
      const currentStatus = existing.status

      // Validate allowed transitions
      const VALID_TRANSITIONS: Record<string, string[]> = {
        DRAFT: ['PENDING_APPROVAL', 'CANCELLED'],
        PENDING_APPROVAL: ['APPROVED', 'REJECTED'],
        APPROVED: ['PAID', 'REJECTED'],
        REJECTED: ['DRAFT'],
        PAID: [],
        CANCELLED: [],
      }

      const allowed = VALID_TRANSITIONS[currentStatus] || []
      if (!allowed.includes(newStatus)) {
        return NextResponse.json(
          { error: `Cannot transition from ${currentStatus} to ${newStatus}` },
          { status: 400 }
        )
      }

      data.status = newStatus

      if (newStatus === 'APPROVED') {
        data.approvedBy = guard.user!.id
        data.approvedAt = new Date()
      }

      // Flag to inform UI about autoStockEntry prompt
      if (newStatus === 'APPROVED' && (existing.autoStockEntry || body.autoStockEntry)) {
        data._autoStockEntryPrompt = true
      }

      if (newStatus === 'PAID') {
        data.paidAt = new Date()
        if (body.paymentMethod) data.paymentMethod = body.paymentMethod
        if (body.paymentReference) data.paymentReference = body.paymentReference
      }
    }

    if (body.paymentMethod !== undefined && body.status === undefined) {
      data.paymentMethod = body.paymentMethod || null
    }
    if (body.paymentReference !== undefined && body.status === undefined) {
      data.paymentReference = body.paymentReference?.trim() || null
    }

    // Extract the UI flag before saving — it's not a DB column
    const autoStockEntryPrompt = !!data._autoStockEntryPrompt
    delete data._autoStockEntryPrompt

    const expense = await prisma.expense.update({
      where: { id: params.id },
      data,
      include: { property: { select: { id: true, name: true } } },
    })

    const result = serialize(expense as unknown as Record<string, unknown>)
    if (autoStockEntryPrompt) {
      (result as Record<string, unknown>).autoStockEntryPrompt = true
    }

    return NextResponse.json(result)
  } catch (e) {
    console.error('Failed to update expense:', e)
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const existing = await prisma.expense.findUnique({ where: { id: params.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
  }

  // Only allow deletion of DRAFT or CANCELLED expenses
  if (existing.status !== 'DRAFT' && existing.status !== 'CANCELLED') {
    return NextResponse.json(
      { error: 'Only DRAFT or CANCELLED expenses can be deleted' },
      { status: 400 }
    )
  }

  await prisma.expense.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
