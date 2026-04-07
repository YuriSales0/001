import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ReportData {
  propertyName: string
  ownerName: string
  month: string
  year: number
  reservations: Array<{
    guest: string
    checkIn: string
    checkOut: string
    amount: number
    platform: string
  }>
  expenses: Array<{
    description: string
    category: string
    amount: number
  }>
  grossRevenue: number
  totalExpenses: number
  commissionRate: number
  commission: number
  ownerPayout: number
}

export function generateMonthlyReportPDF(data: ReportData): jsPDF {
  const doc = new jsPDF()
  const navy: [number, number, number] = [30, 58, 95]
  const gold: [number, number, number] = [201, 169, 110]

  // Header
  doc.setFillColor(...navy)
  doc.rect(0, 0, 210, 40, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(24)
  doc.setFont('helvetica', 'bold')
  doc.text('Hostmaster', 15, 20)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Property Management Report', 15, 28)
  doc.setTextColor(...gold)
  doc.setFontSize(12)
  doc.text(`${data.month} ${data.year}`, 195, 20, { align: 'right' })
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.text(data.propertyName, 195, 28, { align: 'right' })

  // Property & Owner Info
  doc.setTextColor(0, 0, 0)
  doc.setFontSize(10)
  let y = 50
  doc.setFont('helvetica', 'bold')
  doc.text('Property:', 15, y)
  doc.setFont('helvetica', 'normal')
  doc.text(data.propertyName, 50, y)
  y += 7
  doc.setFont('helvetica', 'bold')
  doc.text('Owner:', 15, y)
  doc.setFont('helvetica', 'normal')
  doc.text(data.ownerName, 50, y)
  y += 7
  doc.setFont('helvetica', 'bold')
  doc.text('Period:', 15, y)
  doc.setFont('helvetica', 'normal')
  doc.text(`${data.month} ${data.year}`, 50, y)

  // Income Section
  y += 15
  doc.setFillColor(...navy)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.rect(15, y - 5, 180, 8, 'F')
  doc.text('INCOME', 20, y)
  y += 10

  autoTable(doc, {
    startY: y,
    head: [['Guest', 'Check-in', 'Check-out', 'Platform', 'Amount']],
    body: data.reservations.map(r => [
      r.guest,
      r.checkIn,
      r.checkOut,
      r.platform,
      `€${r.amount.toLocaleString()}`,
    ]),
    foot: [['', '', '', 'Total', `€${data.grossRevenue.toLocaleString()}`]],
    headStyles: { fillColor: [100, 130, 160], textColor: 255 },
    footStyles: { fillColor: [240, 244, 248], textColor: navy, fontStyle: 'bold' },
    margin: { left: 15, right: 15 },
    styles: { fontSize: 9 },
  })

  // Expenses Section
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 15
  doc.setFillColor(...navy)
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.rect(15, y - 5, 180, 8, 'F')
  doc.text('EXPENSES', 20, y)
  y += 10

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Category', 'Amount']],
    body: data.expenses.map(e => [
      e.description,
      e.category,
      `€${e.amount.toLocaleString()}`,
    ]),
    foot: [['', 'Total', `€${data.totalExpenses.toLocaleString()}`]],
    headStyles: { fillColor: [100, 130, 160], textColor: 255 },
    footStyles: { fillColor: [240, 244, 248], textColor: navy, fontStyle: 'bold' },
    margin: { left: 15, right: 15 },
    styles: { fontSize: 9 },
  })

  // Summary Section
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 15
  doc.setFillColor(240, 244, 248)
  doc.rect(15, y - 5, 180, 45, 'F')

  doc.setTextColor(...navy)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('SUMMARY', 20, y + 2)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  y += 12
  doc.text('Gross Revenue:', 25, y)
  doc.text(`€${data.grossRevenue.toLocaleString()}`, 185, y, { align: 'right' })
  y += 7
  doc.text('Total Expenses:', 25, y)
  doc.text(`-€${data.totalExpenses.toLocaleString()}`, 185, y, { align: 'right' })
  y += 7
  doc.text(`Management Commission (${data.commissionRate}%):`, 25, y)
  doc.text(`-€${data.commission.toLocaleString()}`, 185, y, { align: 'right' })
  y += 2
  doc.setDrawColor(...navy)
  doc.line(25, y, 185, y)
  y += 7
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Owner Payout:', 25, y)
  doc.setTextColor(...gold)
  doc.text(`€${data.ownerPayout.toLocaleString()}`, 185, y, { align: 'right' })

  // Footer
  const pageHeight = doc.internal.pageSize.height
  doc.setFillColor(...navy)
  doc.rect(0, pageHeight - 15, 210, 15, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Hostmaster — Property Management for Coastal Spain', 105, pageHeight - 6, { align: 'center' })

  return doc
}
