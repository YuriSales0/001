import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export async function GET(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER', 'CLIENT'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('propertyId')

    const where: Record<string, unknown> = {}
    if (propertyId) where.propertyId = propertyId
    if (me.role === 'CLIENT') where.property = { ownerId: me.id }
    else if (me.role === 'MANAGER') where.property = { owner: { managerId: me.id } }

    const expenses = await prisma.expense.findMany({
      where,
      include: {
        property: { select: { id: true, name: true } },
      },
      orderBy: { expenseDate: 'desc' },
      take: 200,
    })

    return NextResponse.json(expenses)
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN', 'MANAGER'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }
    const { description, amount, category, expenseDate, supplierName } = body

    if (!description || amount == null || !category || !expenseDate || !supplierName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const expense = await prisma.expense.create({
      data: {
        description,
        amount: Number(amount),
        category,
        expenseDate: new Date(expenseDate),
        supplierName,
        subcategory: body.subcategory || null,
        vatAmount: body.vatAmount ? Number(body.vatAmount) : null,
        vatRate: body.vatRate ? Number(body.vatRate) : null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        supplierTaxId: body.supplierTaxId || null,
        supplierInvoice: body.supplierInvoice || null,
        invoiceUrl: body.invoiceUrl || null,
        invoicePhotoUrl: body.invoicePhotoUrl || null,
        propertyId: body.propertyId || null,
        notes: body.notes || null,
        paymentMethod: body.paymentMethod || null,
        isRecurring: body.isRecurring ?? false,
        recurringFreq: body.recurringFreq || null,
        autoStockEntry: body.autoStockEntry ?? false,
        status: 'DRAFT',
        createdBy: me.id,
      },
      include: { property: { select: { id: true, name: true } } },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}
