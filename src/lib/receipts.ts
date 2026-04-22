import { prisma } from './prisma'

/**
 * Generate sequential internal receipt number: HM-{YEAR}-{XXXX}
 * Resets to 0001 at start of each year.
 */
export async function generateReceiptNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `HM-${year}-`

  const lastReceipt = await prisma.paymentReceipt.findFirst({
    where: { receiptNumber: { startsWith: prefix } },
    orderBy: { receiptNumber: 'desc' },
    select: { receiptNumber: true },
  })

  const lastSeq = lastReceipt
    ? parseInt(lastReceipt.receiptNumber.split('-')[2], 10)
    : 0

  return `${prefix}${String(lastSeq + 1).padStart(4, '0')}`
}

/**
 * Generate Taxfix export number: TFX-{YEAR}-{MM}
 */
export async function generateExportNumber(year: number, month: number): Promise<string> {
  return `TFX-${year}-${String(month).padStart(2, '0')}`
}

/** Standard Spanish IVA rate for services */
export const IVA_RATE = 21

/** Calculate VAT breakdown from a gross amount (IVA included) */
export function vatFromTotal(totalWithVat: number, rate = IVA_RATE) {
  const net = +(totalWithVat / (1 + rate / 100)).toFixed(2)
  const vat = +(totalWithVat - net).toFixed(2)
  return { net, vat, rate, total: totalWithVat }
}

/** Calculate VAT breakdown from a net amount (IVA NOT included) */
export function vatOnNet(netAmount: number, rate = IVA_RATE) {
  const vat = +(netAmount * rate / 100).toFixed(2)
  const total = +(netAmount + vat).toFixed(2)
  return { net: netAmount, vat, rate, total }
}
