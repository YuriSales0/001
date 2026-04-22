import { describe, it, expect } from 'vitest'
import {
  newBookingEmail,
  checkoutReminderEmail,
  taskCompletedEmail,
  monthlyReportEmail,
  monthlyStatementEmail,
  receiptCreatedEmail,
  receiptPaidEmail,
  ownerStatementEmail,
  subscriptionReceiptEmail,
} from '@/lib/email'

describe('newBookingEmail', () => {
  it('returns HTML with guest and property details', () => {
    const html = newBookingEmail('John Doe', 'Villa Sol', '2026-04-15', '2026-04-20')
    expect(html).toContain('John Doe')
    expect(html).toContain('Villa Sol')
    expect(html).toContain('2026-04-15')
    expect(html).toContain('2026-04-20')
    expect(html).toContain('New Booking Received')
  })
})

describe('checkoutReminderEmail', () => {
  it('returns HTML with checkout details', () => {
    const html = checkoutReminderEmail('Jane Smith', 'Casa del Mar', '2026-05-01')
    expect(html).toContain('Jane Smith')
    expect(html).toContain('Casa del Mar')
    expect(html).toContain('2026-05-01')
    expect(html).toContain('Checkout Tomorrow')
  })
})

describe('taskCompletedEmail', () => {
  it('returns HTML with task details', () => {
    const html = taskCompletedEmail({
      propertyName: 'Villa Sol',
      taskTitle: 'Limpeza pós-checkout',
      taskType: 'CLEANING',
    })
    expect(html).toContain('Villa Sol')
    expect(html).toContain('Limpeza pós-checkout')
    expect(html).toContain('cleaning')
  })

  it('includes condition label when provided', () => {
    const html = taskCompletedEmail({
      propertyName: 'Casa',
      taskTitle: 'Inspection',
      taskType: 'INSPECTION',
      condition: 'minor',
    })
    expect(html).toContain('Minor issues observed')
  })

  it('shows major issues label', () => {
    const html = taskCompletedEmail({
      propertyName: 'Casa',
      taskTitle: 'Check',
      taskType: 'CHECK_OUT',
      condition: 'major',
    })
    expect(html).toContain('Major issues')
  })

  it('includes issues text when provided', () => {
    const html = taskCompletedEmail({
      propertyName: 'Casa',
      taskTitle: 'Check',
      taskType: 'CHECK_OUT',
      issues: 'Broken window in bedroom',
    })
    expect(html).toContain('Broken window in bedroom')
  })
})

describe('monthlyReportEmail', () => {
  it('returns HTML with property and period', () => {
    const html = monthlyReportEmail('Villa Sol', 'March', 2026)
    expect(html).toContain('Villa Sol')
    expect(html).toContain('March')
    expect(html).toContain('2026')
    expect(html).toContain('Monthly Report Available')
  })
})

describe('monthlyStatementEmail', () => {
  it('returns full HTML email with financial summary', () => {
    const html = monthlyStatementEmail({
      ownerName: 'Carlos Mendes',
      propertyName: 'Villa Sol',
      month: 'April',
      year: 2026,
      grossRevenue: 3000,
      totalExpenses: 200,
      commissionRate: 17,
      commission: 510,
      ownerPayout: 2290,
      reservationCount: 4,
    })
    expect(html).toContain('Carlos')
    expect(html).toContain('Villa Sol')
    expect(html).toContain('April 2026')
    expect(html).toContain('Monthly Statement')
    expect(html).toContain('17%')
    expect(html).toContain('HostMasters')
  })

  it('includes dashboard link when provided', () => {
    const html = monthlyStatementEmail({
      ownerName: 'Owner',
      propertyName: 'Prop',
      month: 'Jan',
      year: 2026,
      grossRevenue: 0,
      totalExpenses: 0,
      commissionRate: 17,
      commission: 0,
      ownerPayout: 0,
      reservationCount: 0,
      dashboardUrl: 'https://app.hostmaster.es/client/reports',
    })
    expect(html).toContain('https://app.hostmaster.es/client/reports')
    expect(html).toContain('View full report')
  })

  it('shows zero reservation message when no bookings', () => {
    const html = monthlyStatementEmail({
      ownerName: 'Owner',
      propertyName: 'Prop',
      month: 'Jan',
      year: 2026,
      grossRevenue: 0,
      totalExpenses: 0,
      commissionRate: 17,
      commission: 0,
      ownerPayout: 0,
      reservationCount: 0,
    })
    expect(html).toContain('No reservations recorded')
  })
})

describe('receiptCreatedEmail', () => {
  it('returns HTML with invoice details', () => {
    const html = receiptCreatedEmail({
      clientName: 'Maria Silva',
      invoiceId: 'inv_abc12345',
      description: 'Subscription MID — April 2026',
      amount: 159,
      currency: 'EUR',
    })
    expect(html).toContain('Maria')
    expect(html).toContain('Subscription MID')
    expect(html).toContain('HostMasters')
    expect(html).toContain('payment receipt')
  })

  it('includes due date when provided', () => {
    const html = receiptCreatedEmail({
      clientName: 'Owner',
      invoiceId: 'inv_xyz',
      description: 'Test',
      amount: 100,
      currency: 'EUR',
      dueDate: '2026-05-01',
    })
    expect(html).toContain('Due date')
  })
})

describe('receiptPaidEmail', () => {
  it('returns HTML with payment confirmation', () => {
    const html = receiptPaidEmail({
      clientName: 'João Costa',
      invoiceId: 'inv_paid123',
      description: 'Rental payout — Villa Sol',
      amount: 870,
      currency: 'EUR',
    })
    expect(html).toContain('João')
    expect(html).toContain('Payment confirmed')
    expect(html).toContain('PAID123')  // last 8 chars uppercased
  })
})

describe('ownerStatementEmail', () => {
  it('returns HTML with full payout breakdown', () => {
    const html = ownerStatementEmail({
      ownerName: 'Ana Ferreira',
      propertyName: 'Apartamento Almuñécar',
      payoutId: 'pay_statement1',
      grossAmount: 1200,
      commission: 204,
      commissionRate: 17,
      netAmount: 996,
      currency: 'EUR',
      paidAt: '2026-04-10T10:00:00Z',
      guestName: 'Hans Mueller',
      checkIn: '2026-04-01T00:00:00Z',
      checkOut: '2026-04-08T00:00:00Z',
      platform: 'AIRBNB',
    })
    expect(html).toContain('Ana')
    expect(html).toContain('Apartamento Almuñécar')
    expect(html).toContain('Owner Statement')
    expect(html).toContain('Hans Mueller')
    expect(html).toContain('Airbnb')
    expect(html).toContain('17%')
  })

  it('handles null platform', () => {
    const html = ownerStatementEmail({
      ownerName: 'Test',
      propertyName: 'Prop',
      payoutId: 'pay_x',
      grossAmount: 100,
      commission: 17,
      commissionRate: 17,
      netAmount: 83,
      currency: 'EUR',
      paidAt: '2026-01-01T00:00:00Z',
      guestName: 'Guest',
      checkIn: '2026-01-01T00:00:00Z',
      checkOut: '2026-01-05T00:00:00Z',
      platform: null,
    })
    expect(html).toContain('N/A')
  })
})

describe('subscriptionReceiptEmail', () => {
  it('returns HTML with subscription details', () => {
    const html = subscriptionReceiptEmail({
      clientName: 'Pedro Santos',
      plan: 'MID',
      amount: 159,
      currency: 'EUR',
      periodStart: '2026-04-01',
      periodEnd: '2026-04-30',
      invoiceId: 'inv_sub_mid',
    })
    expect(html).toContain('Pedro')
    expect(html).toContain('HostMasters MID')
    expect(html).toContain('subscription')
    expect(html).toContain('Payment confirmed')
  })
})
