import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const url = new URL(request.url)
  const category = url.searchParams.get('category')
  const status = url.searchParams.get('status')
  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const supplierId = url.searchParams.get('supplierId')
  const skip = parseInt(url.searchParams.get('skip') || '0', 10)
  const take = parseInt(url.searchParams.get('take') || '50', 10)

  const where: Record<string, unknown> = {}

  if (category) where.category = category
  if (status) where.status = status
  if (supplierId) where.supplierName = { contains: supplierId, mode: 'insensitive' }
  if (from || to) {
    where.expenseDate = {}
    if (from) (where.expenseDate as Record<string, unknown>).gte = new Date(from)
    if (to) (where.expenseDate as Record<string, unknown>).lte = new Date(to)
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: { property: { select: { id: true, name: true } } },
      orderBy: { expenseDate: 'desc' },
      skip,
      take,
    }),
    prisma.expense.count({ where }),
  ])

  // Convert Decimal fields to numbers for JSON serialization
  const result = expenses.map((e: Record<string, unknown>) => ({
    ...e,
    amount: Number(e.amount),
    vatAmount: e.vatAmount != null ? Number(e.vatAmount) : null,
    vatRate: e.vatRate != null ? Number(e.vatRate) : null,
  }))

  return NextResponse.json({ expenses: result, total })
}

export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  try {
    const body = await request.json()
    const {
      description, category, subcategory, amount, vatAmount, vatRate,
      expenseDate, dueDate, supplierName, supplierTaxId, supplierInvoice,
      invoiceUrl, invoicePhotoUrl, propertyId, notes, isRecurring,
      recurringFreq, paymentMethod, autoStockEntry,
    } = body

    // Validate required fields
    if (!description || typeof description !== 'string' || !description.trim()) {
      return NextResponse.json({ error: 'description is required' }, { status: 400 })
    }
    if (!category) {
      return NextResponse.json({ error: 'category is required' }, { status: 400 })
    }
    if (amount == null || isNaN(Number(amount)) || Number(amount) <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 })
    }
    if (!expenseDate) {
      return NextResponse.json({ error: 'expenseDate is required' }, { status: 400 })
    }
    if (!supplierName || typeof supplierName !== 'string' || !supplierName.trim()) {
      return NextResponse.json({ error: 'supplierName is required' }, { status: 400 })
    }

    const expense = await prisma.expense.create({
      data: {
        description: description.trim(),
        category,
        subcategory: subcategory?.trim() || null,
        amount,
        vatAmount: vatAmount != null ? vatAmount : null,
        vatRate: vatRate != null ? vatRate : null,
        expenseDate: new Date(expenseDate),
        dueDate: dueDate ? new Date(dueDate) : null,
        supplierName: supplierName.trim(),
        supplierTaxId: supplierTaxId?.trim() || null,
        supplierInvoice: supplierInvoice?.trim() || null,
        invoiceUrl: invoiceUrl?.trim() || null,
        invoicePhotoUrl: invoicePhotoUrl?.trim() || null,
        propertyId: propertyId || null,
        notes: notes?.trim() || null,
        isRecurring: isRecurring === true,
        recurringFreq: isRecurring ? recurringFreq || null : null,
        paymentMethod: paymentMethod || null,
        autoStockEntry: autoStockEntry === true,
        status: 'DRAFT',
        createdBy: guard.user!.id,
      },
      include: { property: { select: { id: true, name: true } } },
    })

    const result = {
      ...expense,
      amount: Number(expense.amount),
      vatAmount: expense.vatAmount != null ? Number(expense.vatAmount) : null,
      vatRate: expense.vatRate != null ? Number(expense.vatRate) : null,
    }

    return NextResponse.json(result, { status: 201 })
  } catch (e) {
    console.error('Failed to create expense:', e)
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}
