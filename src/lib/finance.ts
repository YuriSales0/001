/**
 * Hostmaster financial rules — anti-human-error.
 * - Commission: fixed 18% on gross stay amount
 * - Owner payout: scheduled D+7 from check-out
 */

export const COMMISSION_RATE = 0.18
export const PAYOUT_DELAY_DAYS = 7

export function calcCommission(gross: number) {
  const commission = +(gross * COMMISSION_RATE).toFixed(2)
  const net = +(gross - commission).toFixed(2)
  return { gross, commission, net }
}

export function payoutDateFrom(checkOut: Date) {
  const d = new Date(checkOut)
  d.setDate(d.getDate() + PAYOUT_DELAY_DAYS)
  return d
}
