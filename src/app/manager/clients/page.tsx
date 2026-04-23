"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Users, UserPlus } from "lucide-react"
import { useLocale } from "@/i18n/provider"

type Client = { id: string; name: string | null; email: string; phone: string | null }

export default function ManagerClients() {
  const { t } = useLocale()
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  useEffect(() => {
    fetch('/api/users?role=CLIENT')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(setClients)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])
  if (loading) return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-serif font-bold text-hm-black">{t('manager.clientsPage.title')}</h1>
      <div className="space-y-4 animate-pulse">
        <div className="h-8 rounded bg-gray-100 w-48" />
        <div className="h-40 rounded-hm bg-gray-100" />
        <div className="h-40 rounded-hm bg-gray-100" />
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-3xl font-serif font-bold text-hm-black">{t('manager.clientsPage.title')}</h1>
        <Link
          href="/manager/clients/invite"
          className="inline-flex items-center gap-2 rounded-lg text-white px-4 py-2 text-sm font-bold hover:opacity-90"
          style={{ background: '#B08A3E' }}
        >
          <UserPlus className="h-4 w-4" /> {t('manager.clientsPage.inviteBtn')}
        </Link>
      </div>
      <div className="rounded-hm border bg-white overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="min-w-[600px] w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">{t('manager.clientsPage.thName')}</th>
              <th className="px-4 py-3">{t('manager.clientsPage.thEmail')}</th>
              <th className="px-4 py-3">{t('manager.clientsPage.thPhone')}</th>
              <th className="px-4 py-3">{t('manager.clientsPage.thId')}</th>
            </tr>
          </thead>
          <tbody>
            {error && <tr><td colSpan={4} className="text-center py-8"><p className="text-sm text-red-500">{t('manager.clientsPage.loadFailed')}</p></td></tr>}
            {!loading && !error && clients.length === 0 && (
              <tr><td colSpan={4}>
                <div className="p-10 text-center">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{t('manager.clientsPage.emptyTitle')}</h3>
                  <p className="text-sm text-gray-500 mb-4">{t('manager.clientsPage.emptyBody')}</p>
                  <Link href="/manager/clients/invite" className="inline-flex items-center gap-2 rounded-lg bg-hm-black text-white px-4 py-2 text-sm font-semibold hover:bg-hm-black/90">
                    {t('manager.clientsPage.inviteFirst')}
                  </Link>
                </div>
              </td></tr>
            )}
            {clients.map(c => (
              <tr key={c.id} className="border-t">
                <td className="px-4 py-3">{c.name || '—'}</td>
                <td className="px-4 py-3">{c.email}</td>
                <td className="px-4 py-3">{c.phone || '—'}</td>
                <td className="px-4 py-3 font-mono text-xs text-gray-400">{c.id}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
