import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function calculateOwnerPayout(
  grossRevenue: number,
  totalExpenses: number,
  commissionRate: number = 18
): { commission: number; payout: number } {
  const commission = grossRevenue * (commissionRate / 100)
  const payout = grossRevenue - totalExpenses - commission
  return { commission, payout }
}

export function getOccupancyRate(
  bookedNights: number,
  totalNights: number
): number {
  if (totalNights === 0) return 0
  return Math.round((bookedNights / totalNights) * 100)
}

export function calculateADR(totalRevenue: number, bookedNights: number): number {
  if (bookedNights === 0) return 0
  return Math.round(totalRevenue / bookedNights)
}

export function calculateRevPAR(totalRevenue: number, totalNights: number): number {
  if (totalNights === 0) return 0
  return Math.round(totalRevenue / totalNights)
}
