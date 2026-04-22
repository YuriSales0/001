import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireRole } from '@/lib/session'

/**
 * GET /api/taxfix-exports/[id] — view export details with linked receipts
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const exp = await prisma.taxfixExport.findUnique({
    where: { id: params.id },
    include: {
      receipts: {
        include: {
          client: { select: { name: true, email: true } },
        },
        orderBy: { paidAt: 'asc' },
      },
    },
  })
  if (!exp) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(exp)
}

/**
 * PATCH /api/taxfix-exports/[id] — update status
 * Body: { action: 'mark-uploaded' | 'import-invoices', mappings?: [...] }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireRole(['ADMIN'])
  if (guard.error) return NextResponse.json({ error: guard.error }, { status: guard.status })

  const exp = await prisma.taxfixExport.findUnique({ where: { id: params.id } })
  if (!exp) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await request.json() as {
    action: 'mark-uploaded' | 'import-invoices'
    mappings?: Array<{ receiptNumber: string; taxfixInvoiceNumber: string; taxfixDate: string }>
  }

  if (body.action === 'mark-uploaded') {
    const updated = await prisma.taxfixExport.update({
      where: { id: params.id },
      data: { status: 'UPLOADED_TO_TAXFIX', importedToTaxfixAt: new Date() },
    })
    return NextResponse.json(updated)
  }

  if (body.action === 'import-invoices' && body.mappings) {
    for (const m of body.mappings) {
      await prisma.paymentReceipt.updateMany({
        where: { receiptNumber: m.receiptNumber, taxfixExportId: params.id },
        data: {
          externalFiscalRef: m.taxfixInvoiceNumber,
          externalFiscalDate: new Date(m.taxfixDate),
        },
      })
    }
    const updated = await prisma.taxfixExport.update({
      where: { id: params.id },
      data: { taxfixInvoicesGenerated: true, status: 'INVOICES_RECEIVED' },
    })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
