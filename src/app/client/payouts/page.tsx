"use client"

import { useEffect, useState } from "react"
import { Banknote, FileText } from "lucide-react"
import { useLocale } from "@/i18n/provider"

type Payout = {
  id: string
  grossAmount: number
  commission: number
  netAmount: number
  scheduledFor: string
  paidAt: string | null
  status: 'SCHEDULED' | 'PAID' | 'CANCELLED'
  property: { id: string; name: string }
  reservation: { id: string; guestName: string; checkIn: string; checkOut: string }
}

type Invoice = {
  id: string
  description: string
  amount: number
  status: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED'
  dueDate: string | null
  paidAt: string | null
  property: { id: string; name: string } | null
  createdBy: { name: string | null; email: string }
  createdAt: string
}

const fmtEUR = (n: number) => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(n)
const fmtDate = (s: string) => new Date(s).toLocaleDateString('en-GB')

export default function ClientPayouts() {
  const { t } = useLocale()
  const [payouts, setPayouts] = useState<Payout[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/payouts').then(r => r.ok ? r.json() : []),
      fetch('/api/invoices').then(r => r.ok ? r.json() : []),
    ]).then(([p, i]) => {
      setPayouts(p)
      setInvoices(i)
      setLoading(false)
    })
  }, [])

  const totalIn = payouts.filter(p => p.status === 'SCHEDULED').reduce((s, p) => s + p.netAmount, 0)
  const totalOut = invoices.filter(i => i.status === 'SENT' || i.status === 'DRAFT').reduce((s, i) => s + i.amount, 0)

  if (loading) return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="h-10 rounded-hm bg-hm-sand w-64" />
      <div className="h-48 rounded-hm bg-hm-sand" />
    </div>
  )

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-hm-black">{t('client.payouts.title')}</h1>
        <p className="text-sm text-gray-600">{t('client.payouts.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-hm border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">{t('client.payouts.scheduledReceive')}</div>
          <div className="text-2xl font-semibold text-green-700 mt-1">{fmtEUR(totalIn)}</div>
        </div>
        <div className="rounded-hm border bg-white p-4">
          <div className="text-xs uppercase text-gray-500">{t('client.payouts.pendingInvoices')}</div>
          <div className="text-2xl font-semibold text-orange-600 mt-1">{fmtEUR(totalOut)}</div>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold text-hm-black mb-2">{t('client.payouts.rentalPayouts')}</h2>
        <div className="rounded-hm border bg-white overflow-hidden">
          <div className="overflow-x-auto">
          <table className="min-w-[600px] w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">{t('client.payouts.thProperty')}</th>
                <th className="px-4 py-3">{t('client.payouts.thGuest')}</th>
                <th className="px-4 py-3">{t('client.payouts.thCheckout')}</th>
                <th className="px-4 py-3">{t('client.payouts.thPayoutDate')}</th>
                <th className="px-4 py-3 text-right">{t('client.payouts.thGross')}</th>
                <th className="px-4 py-3 text-right">{t('client.payouts.thCommission')}</th>
                <th className="px-4 py-3 text-right">{t('client.payouts.thNet')}</th>
                <th className="px-4 py-3">{t('client.payouts.thStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {payouts.length === 0 && (
                <tr><td colSpan={8} className="py-12 text-center">
                  <Banknote className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                  <p className="font-serif font-bold text-hm-black">{t('client.payouts.noPayouts')}</p>
                  <p className="text-sm text-gray-500 mt-0.5">Payouts will appear here once bookings are completed.</p>
                </td></tr>
              )}
              {payouts.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3 max-w-[180px]"><span className="block truncate" title={p.property.name}>{p.property.name}</span></td>
                  <td className="px-4 py-3 max-w-[160px]"><span className="block truncate" title={p.reservation.guestName}>{p.reservation.guestName}</span></td>
                  <td className="px-4 py-3">{fmtDate(p.reservation.checkOut)}</td>
                  <td className="px-4 py-3">{fmtDate(p.scheduledFor)}</td>
                  <td className="px-4 py-3 text-right">{fmtEUR(p.grossAmount)}</td>
                  <td className="px-4 py-3 text-right text-orange-600">{fmtEUR(p.commission)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{fmtEUR(p.netAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={p.status === 'PAID' ? 'rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs' : 'rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs'}>
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-hm-black mb-2">{t('client.payouts.serviceInvoices')}</h2>
        <div className="rounded-hm border bg-white overflow-hidden">
          <div className="overflow-x-auto">
          <table className="min-w-[600px] w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">{t('client.payouts.thDate')}</th>
                <th className="px-4 py-3">{t('client.payouts.thDescription')}</th>
                <th className="px-4 py-3">{t('client.payouts.thProperty')}</th>
                <th className="px-4 py-3">{t('client.payouts.thIssuedBy')}</th>
                <th className="px-4 py-3">{t('client.payouts.thDue')}</th>
                <th className="px-4 py-3 text-right">{t('client.payouts.thAmount')}</th>
                <th className="px-4 py-3">{t('client.payouts.thStatus')}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 && (
                <tr><td colSpan={7} className="py-12 text-center">
                  <FileText className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                  <p className="font-serif font-bold text-hm-black">{t('client.payouts.noInvoices')}</p>
                  <p className="text-sm text-gray-500 mt-0.5">Service invoices will be listed here when issued.</p>
                </td></tr>
              )}
              {invoices.map(i => (
                <tr key={i.id} className="border-t">
                  <td className="px-4 py-3">{fmtDate(i.createdAt)}</td>
                  <td className="px-4 py-3">{i.description}</td>
                  <td className="px-4 py-3">{i.property?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{i.createdBy.name || i.createdBy.email}</td>
                  <td className="px-4 py-3">{i.dueDate ? fmtDate(i.dueDate) : '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold">{fmtEUR(i.amount)}</td>
                  <td className="px-4 py-3">
                    <span className={
                      i.status === 'PAID' ? 'rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs'
                      : i.status === 'SENT' ? 'rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-xs'
                      : 'rounded-full bg-gray-200 text-gray-700 px-2 py-0.5 text-xs'
                    }>{i.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </section>
    </div>
  )
}
