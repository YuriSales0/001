import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser } from '@/lib/session'
import {
  Home, TrendingUp, CalendarDays, Star, MessageCircle, LogOut, Building2
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const navLinks = [
  { href: '/client/dashboard',  label: 'My Home',      icon: Home },
  { href: '/client/financials', label: 'My Earnings',   icon: TrendingUp },
  { href: '/client/bookings',   label: 'My Bookings',   icon: CalendarDays },
  { href: '/client/plan',       label: 'My Plan',       icon: Star },
  { href: '/client/messages',   label: 'Contact us',    icon: MessageCircle },
]

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  if (user.role !== 'CLIENT') redirect('/me')

  return (
    <div className="min-h-screen" style={{ background: 'var(--hm-ivory)' }}>
      {/* Top header */}
      <header
        className="sticky top-0 z-50 border-b"
        style={{
          background: 'var(--hm-black)',
          borderColor: 'rgba(201,168,76,0.3)',
        }}
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/client/dashboard" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full"
                   style={{ background: 'var(--hm-gold)' }}>
                <Building2 className="h-4 w-4 text-[var(--hm-black)]" />
              </div>
              <div>
                <span className="font-serif font-bold text-white text-lg leading-none">
                  Host<span style={{ color: 'var(--hm-gold)' }}>Masters</span>
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map(link => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 font-sans text-sm text-white/75 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                )
              })}
            </nav>

            {/* Right side */}
            <div className="flex items-center gap-3">
              <span className="hidden sm:block font-sans text-sm text-white/50">{user.email}</span>
              <Link
                href="/api/auth/signout"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 font-sans text-sm text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* Mobile nav */}
          <div className="flex md:hidden overflow-x-auto pb-2 gap-1 -mx-1 px-1">
            {navLinks.map(link => {
              const Icon = link.icon
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex-shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-sans text-sm text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-12">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t py-8 text-center font-sans text-sm"
              style={{ borderColor: 'var(--hm-border)', color: 'var(--hm-slate)', opacity: 0.7 }}>
        <p>HostMasters · Costa Tropical, Spain</p>
        <p className="mt-1">
          Questions? Call us or{' '}
          <a
            href="https://wa.me/34600000000"
            className="underline hover:opacity-100"
            style={{ color: 'var(--hm-gold-dk)' }}
          >
            WhatsApp us
          </a>
        </p>
      </footer>
    </div>
  )
}
