import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCurrentUser, resolveEffectiveUser } from '@/lib/session'
import { ClipboardList, User, LogOut, Menu, X, ChevronRight, Calendar, Wallet, Shield } from 'lucide-react'
import { HmLogo } from '@/components/hm/hm-logo'
import { AiChat } from '@/components/hm/ai-chat'
import { OnboardingGate } from '@/components/hm/onboarding-gate'
import { NotificationBell } from '@/components/hm/notification-bell'
import { loadMessagesSync, t, type Locale } from '@/i18n'

export const dynamic = 'force-dynamic'

export default async function CrewLayout({ children }: { children: React.ReactNode }) {
  const realUser = await getCurrentUser()
  if (!realUser) redirect('/login')
  if (!realUser.isSuperUser && realUser.role !== 'CREW') redirect('/me')
  const user = realUser.isSuperUser ? await resolveEffectiveUser(realUser) : realUser
  const msgs = loadMessagesSync((user.language as Locale) ?? 'en')
  const isCaptain = user.isCaptain === true

  const navLinks = [
    { href: '/crew',          label: t(msgs, 'crew.myTasks'),      icon: ClipboardList },
    { href: '/crew/calendar', label: t(msgs, 'common.calendar'),   icon: Calendar },
    { href: '/crew/earnings', label: t(msgs, 'common.revenue'),    icon: Wallet },
    ...(isCaptain
      ? [{ href: '/crew/approvals', label: t(msgs, 'crew.approvals') || 'Approvals', icon: Shield }]
      : []),
    { href: '/crew/profile',  label: t(msgs, 'common.myProfile'),  icon: User },
  ]

  const initials = user.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'CR'

  return (
    <div className="flex min-h-screen bg-gray-50">
      <input type="checkbox" id="crew-sidebar-toggle" className="peer hidden" autoComplete="off" defaultChecked={false} />

      {/* Mobile overlay */}
      <label
        htmlFor="crew-sidebar-toggle"
        className="fixed inset-0 z-40 bg-black/50 hidden peer-checked:block lg:hidden"
      />

      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col -translate-x-full transition-transform duration-200 peer-checked:translate-x-0 lg:static lg:translate-x-0 bg-gray-900">

        {/* Logo */}
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          <Link href="/crew" className="flex items-center gap-2">
            <HmLogo size={24} onDark />
            <span className="font-semibold text-white text-sm tracking-tight">
              Host<span style={{ color: '#B08A3E' }}>Masters</span>
            </span>
            {isCaptain ? (
              <span
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                style={{ background: 'rgba(176,138,62,0.25)', color: '#D4AF5A' }}
                title="You are a Crew Captain"
              >
                <Shield className="h-2.5 w-2.5" />
                Captain
              </span>
            ) : (
              <span className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest"
                    style={{ background: 'rgba(176,138,62,0.2)', color: '#B08A3E' }}>Beta</span>
            )}
          </Link>
          <label htmlFor="crew-sidebar-toggle" className="lg:hidden cursor-pointer text-white/50 hover:text-white">
            <X className="h-4 w-4" />
          </label>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 px-2 py-3">
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

        {/* User */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
            {user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0 text-[11px] font-bold"
                   style={{ background: '#B08A3E', color: '#0B1E3A' }}>
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user.name ?? t(msgs, 'common.crewPortal')}</p>
              <p className="text-[10px] text-white/40 truncate">{user.email}</p>
            </div>
            <Link href="/api/auth/signout" title={t(msgs, 'common.logout')} className="text-white/30 hover:text-white/70 transition-colors">
              <LogOut className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-white px-4 sm:px-6">
          <label htmlFor="crew-sidebar-toggle" className="lg:hidden cursor-pointer rounded-md p-1.5 hover:bg-gray-100">
            <Menu className="h-5 w-5 text-gray-600" />
          </label>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <span className="font-medium text-gray-800">HostMasters</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span>{t(msgs, 'common.crewPortal')}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <Link href="/crew/profile"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              {user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                     style={{ background: '#B08A3E', color: '#0B1E3A' }}>
                  {initials}
                </div>
              )}
              <span className="hidden sm:block">{user.name ?? t(msgs, 'common.myProfile')}</span>
            </Link>
          </div>
        </header>
        <main className="flex-1">
          <OnboardingGate role="CREW">{children}</OnboardingGate>
        </main>
      </div>
      <AiChat role="CREW" />
    </div>
  )
}
