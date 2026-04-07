import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/session'
import { Building2, LogOut } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CrewLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'CREW') redirect('/me')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/crew" className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-navy-900" />
            <span className="font-bold text-navy-900">Hostmaster · Crew</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/crew" className="text-gray-700 hover:text-navy-900">Tasks</Link>
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
