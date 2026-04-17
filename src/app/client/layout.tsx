import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, resolveEffectiveUser } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import {
  Home, TrendingUp, CalendarDays, Star, MessageCircle, Building2,
  Wrench, User, LogOut, Menu, X, ChevronRight, Sparkles, FileText,
} from 'lucide-react'
import { OnboardingGate } from '@/components/hm/onboarding-gate'
import { AiChat } from '@/components/hm/ai-chat'
import { NotificationBell } from '@/components/hm/notification-bell'
import { loadMessagesSync, t, type Locale } from '@/i18n'

export const dynamic = 'force-dynamic'

const AI_PLANS = ['MID', 'PREMIUM']

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const realUser = await getCurrentUser()
  if (!realUser) redirect('/login')
  if (!realUser.isSuperUser && realUser.role !== 'CLIENT') redirect('/me')
  const user = realUser.isSuperUser ? await resolveEffectiveUser(realUser) : realUser
  const msgs = loadMessagesSync((user.language as Locale) ?? 'en')

  const baseLinks = [
    { href: '/client/dashboard',  label: t(msgs, 'common.dashboard'),        icon: Home },
    { href: '/client/financials', label: t(msgs, 'owner.monthlyEarnings'),   icon: TrendingUp },
    { href: '/client/bookings',   label: t(msgs, 'owner.myReservations'),    icon: CalendarDays },
    { href: '/client/care',       label: t(msgs, 'common.maintenance'),      icon: Wrench },
    { href: '/client/tax',        label: t(msgs, 'owner.taxCompliance'),     icon: FileText },
    { href: '/client/plan',       label: t(msgs, 'common.myPlan'),           icon: Star },
    { href: '/client/messages',   label: t(msgs, 'owner.contactManager'),    icon: MessageCircle },
  ]

  const initials = user.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'CL'

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { subscriptionPlan: true } })
  const hasAI = AI_PLANS.includes(dbUser?.subscriptionPlan ?? '')
  const navLinks = hasAI
    ? [...baseLinks, { href: '/client/ai', label: 'AI Pricing', icon: Sparkles }]
    : baseLinks

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--hm-ivory)' }}>
      {/* Sidebar — client-side toggle handled via CSS peer trick */}
      <input type="checkbox" id="sidebar-toggle" className="peer hidden" autoComplete="off" defaultChecked={false} />

      {/* Mobile overlay */}
      <label
        htmlFor="sidebar-toggle"
        className="fixed inset-0 z-40 bg-black/50 hidden peer-checked:block lg:hidden"
      />

      {/* Sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col -translate-x-full transition-transform duration-200 peer-checked:translate-x-0 lg:static lg:translate-x-0"
        style={{ background: 'var(--hm-black)' }}
      >
        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b px-4"
             style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
          <Link href="/client/dashboard" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0"
                 style={{ background: 'var(--hm-gold)' }}>
              <Building2 className="h-4 w-4" style={{ color: 'var(--hm-black)' }} />
            </div>
            <span className="font-bold text-white text-sm">
              Host<span style={{ color: 'var(--hm-gold)' }}>Masters</span>
            </span>
          </Link>
          <label htmlFor="sidebar-toggle" className="lg:hidden cursor-pointer text-white/50 hover:text-white">
            <X className="h-4 w-4" />
          </label>
        </div>

        {/* Nav */}
        <nav data-tour="sidebar-nav" className="flex-1 overflow-y-auto space-y-0.5 px-2 py-3">
          {navLinks.map(link => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Icon className="h-4 w-4 shrink-0" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Profile + user */}
        <div className="border-t p-3 space-y-1" style={{ borderColor: 'rgba(201,168,76,0.2)' }}>
          <Link
            href="/client/profile"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors"
          >
            <User className="h-4 w-4 shrink-0" />
            {t(msgs, 'common.myProfile')}
          </Link>
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0 text-[11px] font-bold"
                   style={{ background: 'var(--hm-gold)', color: 'var(--hm-black)' }}>
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name ?? 'Client'}</p>
              <p className="text-[10px] text-white/40 truncate">{user.email}</p>
            </div>
            <Link href="/api/auth/signout" title="Sign out" className="text-white/30 hover:text-white/70 transition-colors">
              <LogOut className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-white px-4 sm:px-6">
          <label htmlFor="sidebar-toggle" className="lg:hidden cursor-pointer rounded-md p-1.5 hover:bg-gray-100">
            <Menu className="h-5 w-5 text-gray-600" />
          </label>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <span className="font-medium text-gray-800">HostMasters</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>{t(msgs, 'common.clientPortal')}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <Link href="/client/profile"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                     style={{ background: 'var(--hm-gold)', color: 'var(--hm-black)' }}>
                  {initials}
                </div>
              )}
              <span className="hidden sm:block">{user.name ?? t(msgs, 'common.myProfile')}</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6">
          <OnboardingGate role="CLIENT">
            {children}
          </OnboardingGate>
        </main>
        <AiChat role="CLIENT" />

        <footer className="border-t py-6 text-center text-xs text-gray-400"
                style={{ borderColor: 'var(--hm-border)' }}>
          HostMasters · Costa Tropical, Spain
        </footer>
      </div>
    </div>
  )
}
