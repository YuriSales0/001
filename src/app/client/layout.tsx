import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/session'
import { Building2, LogOut, MessageCircle, ClipboardList } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'CLIENT') redirect('/me')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/client/payouts" className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-navy-900" />
            <span className="font-bold text-navy-900">Hostmaster</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/client/payouts" className="text-gray-700 hover:text-navy-900">Payouts</Link>
            <Link href="/client/properties" className="text-gray-700 hover:text-navy-900">Properties</Link>
            <Link href="/client/tasks" className="inline-flex items-center gap-1 text-gray-700 hover:text-navy-900">
              <ClipboardList className="h-4 w-4" />
              Tarefas
            </Link>
            <Link href="/client/messages" className="inline-flex items-center gap-1 text-navy-900 font-medium hover:text-navy-700">
              <MessageCircle className="h-4 w-4" />
              Contactar gestor
            </Link>
            <span className="text-gray-400">|</span>
            <span className="text-gray-500">{user.email}</span>
            <Link href="/api/auth/signout" className="text-gray-500 hover:text-red-600 inline-flex items-center gap-1">
              <LogOut className="h-4 w-4" />
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto">{children}</main>
    </div>
  )
}
