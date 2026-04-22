import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'
import { generateExportNumber } from '@/lib/receipts'

/**
 * GET /api/taxfix-exports — list all exports
 * POST /api/taxfix-exports/generate — generate for previous month
 */
export async function GET(_request: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const exports = await prisma.taxfixExport.findMany({
    orderBy: { createdAt: 'desc' },
    take: 60,
  })
  return NextResponse.json(exports)
}

export async function POST(request: NextRequest) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })
  const me = guard.user!

  const body = await request.json().catch(() => ({})) as { year?: number; month?: number }

  const now = new Date()
  const targetYear = body.year ?? (now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear())
  const targetMonth = body.month ?? (now.getUTCMonth() === 0 ? 12 : now.getUTCMonth())

  const periodStart = new Date(Date.UTC(targetYear, targetMonth - 1, 1))
  const periodEnd = new Date(Date.UTC(targetYear, targetMonth, 1))

  // Check for existing export
  const exportNum = await generateExportNumber(targetYear, targetMonth)
  const existing = await prisma.taxfixExport.findUnique({ where: { exportNumber: exportNum } })
  if (existing) {
    return NextResponse.json({ error: `Export ${exportNum} already exists`, existingId: existing.id }, { status: 409 })
  }

  // Gather paid receipts not yet exported
  const receipts = await prisma.paymentReceipt.findMany({
    where: {
      status: 'PAID',
      paidAt: { gte: periodStart, lt: periodEnd },
      taxfixExported: false,
    },
    include: {
      client: { select: { name: true, email: true, phone: true } },
      property: { select: { name: true, city: true } },
    },
    orderBy: { paidAt: 'asc' },
  })

  if (receipts.length === 0) {
    return NextResponse.json({ error: 'No unexported paid receipts for this period' }, { status: 404 })
  }

  const totalGross = receipts.reduce((s, r) => s + Number(r.grossAmount), 0)
  const totalVat = receipts.reduce((s, r) => s + Number(r.vatAmount), 0)
  const totalNet = receipts.reduce((s, r) => s + Number(r.totalAmount), 0)

  // Generate CSV
  const header = 'Numero_Recibo,Fecha,Cliente_Nombre,Cliente_Email,Concepto,Base_Imponible,IVA_Porcentaje,IVA_Importe,Total,Metodo_Pago,Referencia_Stripe'
  const rows = receipts.map(r => [
    r.receiptNumber,
    r.paidAt?.toISOString().split('T')[0] ?? '',
    (r.client?.name ?? '').replace(/"/g, '""'),
    r.client?.email ?? '',
    r.description.replace(/"/g, '""'),
    Number(r.grossAmount).toFixed(2),
    Number(r.vatRate).toFixed(0),
    Number(r.vatAmount).toFixed(2),
    Number(r.totalAmount).toFixed(2),
    r.paymentMethod ?? 'OTHER',
    r.stripePaymentIntentId ?? '',
  ].map(c => `"${c}"`).join(','))

  const csv = [header, ...rows].join('\n')

  const exportRecord = await prisma.taxfixExport.create({
    data: {
      exportNumber: exportNum,
      periodStart,
      periodEnd,
      totalReceipts: receipts.length,
      totalGrossAmount: totalGross,
      totalVatAmount: totalVat,
      totalNetAmount: totalNet,
      status: 'GENERATED',
      exportedAt: new Date(),
      exportedById: me.id,
    },
  })

  // Link receipts to this export
  await prisma.paymentReceipt.updateMany({
    where: { id: { in: receipts.map(r => r.id) } },
    data: { taxfixExportId: exportRecord.id, taxfixExported: true },
  })

  return NextResponse.json({
    export: exportRecord,
    csv,
    receiptCount: receipts.length,
    totalGross: totalGross.toFixed(2),
    totalVat: totalVat.toFixed(2),
    totalNet: totalNet.toFixed(2),
  }, { status: 201 })
}
