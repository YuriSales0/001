"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Building2, CalendarDays, Users,
  TrendingUp, FileBarChart, Menu, MessageCircle, User, LogOut, X, ChevronRight, ChevronDown,
  BarChart3, FileText, Calendar, Wrench, Home, Wallet, Receipt, Sparkles, Megaphone, Landmark, Activity,
  Target, Settings, Brain, Briefcase, Link2, Handshake, Star,
} from "lucide-react"
import { AiChat } from "@/components/hm/ai-chat"
import { OnboardingGate } from "@/components/hm/onboarding-gate"
import { NotificationBell } from "@/components/hm/notification-bell"
import { cn } from "@/lib/utils"
import { HmLogo } from "@/components/hm/hm-logo"
import { useLocale } from "@/i18n/provider"

type NavItem = { href: string; label: string; icon: React.ElementType }
type NavGroup = { label: string; icon: React.ElementType; items: NavItem[] }
type NavEntry = NavItem | NavGroup

function isGroup(entry: NavEntry): entry is NavGroup {
  return 'items' in entry
}

function useAdminNav(): NavEntry[] {
  const { t } = useLocale()
  return [
    { href: "/dashboard", label: t('common.dashboard'), icon: Home },
    {
      label: t('common.leads'), icon: Target, items: [
        { href: "/crm", label: t('common.crmPipeline'), icon: BarChart3 },
        { href: "/marketing", label: t('common.marketing'), icon: Megaphone },
      ],
    },
    {
      label: t('common.operations'), icon: CalendarDays, items: [
        { href: "/calendar", label: t('common.calendar'), icon: Calendar },
        { href: "/reservations", label: t('common.reservations'), icon: CalendarDays },
        { href: "/setup", label: t('common.setup'), icon: FileText },
        { href: "/maintenance", label: t('common.maintenance'), icon: Wrench },
      ],
    },
    {
      label: t('finance.income'), icon: Wallet, items: [
        { href: "/payouts", label: t('common.payouts'), icon: Wallet },
        { href: "/expenses", label: t('admin.expenses.title'), icon: Receipt },
        { href: "/manager/invoices", label: t('common.invoices'), icon: Receipt },
        { href: "/report-summary", label: t('common.reports'), icon: FileBarChart },
        { href: "/my-reports", label: t('common.ownerReports'), icon: FileText },
      ],
    },
    {
      label: t('common.administration'), icon: Settings, items: [
        { href: "/team", label: t('common.team'), icon: Users },
        { href: "/recruit", label: t('admin.recruiting'), icon: Briefcase },
        { href: "/partners", label: t('admin.partners.title'), icon: Handshake },
        { href: "/my-properties", label: t('common.properties'), icon: Building2 },
        { href: "/integrations", label: t('common.integrations'), icon: Landmark },
      ],
    },
    {
      label: t('admin.hmAi'), icon: Brain, items: [
        { href: "/ai", label: t('common.aiPricing'), icon: Sparkles },
        { href: "/ai-monitor", label: t('admin.aiMonitor'), icon: Activity },
      ],
    },
    { href: "/messages", label: t('common.messages'), icon: MessageCircle },
  ]
}

function useManagerNav(): NavEntry[] {
  const { t } = useLocale()
  return [
    { href: "/manager/dashboard", label: t('common.dashboard'), icon: LayoutDashboard },
    {
      label: t('common.leads'), icon: Target, items: [
        { href: "/crm", label: t('common.crmPipeline'), icon: BarChart3 },
      ],
    },
    {
      label: t('common.operations'), icon: CalendarDays, items: [
        { href: "/calendar", label: t('common.calendar'), icon: Calendar },
        { href: "/reservations", label: t('common.reservations'), icon: CalendarDays },
        { href: "/reviews", label: t('manager.reviews.title'), icon: Star },
        { href: "/properties", label: t('common.properties'), icon: Building2 },
        { href: "/setup", label: t('common.setup'), icon: FileText },
        { href: "/maintenance", label: t('common.maintenance'), icon: Wrench },
      ],
    },
    {
      label: t('finance.income'), icon: Wallet, items: [
        { href: "/manager/invoices", label: t('common.invoices'), icon: Receipt },
        { href: "/revenue", label: t('common.revenue'), icon: TrendingUp },
        { href: "/reports", label: t('common.reports'), icon: FileBarChart },
      ],
    },
    {
      label: t('common.myPortfolio'), icon: Users, items: [
        { href: "/manager/clients", label: t('common.myOwners'), icon: Users },
        { href: "/manager/referral", label: t('manager.referralPage.title'), icon: Link2 },
      ],
    },
    { href: "/manager/messages", label: t('common.messages'), icon: MessageCircle },
  ]
}

interface ManagerLayoutProps {
  children: React.ReactNode
  user?: { name?: string | null; email?: string | null; image?: string | null }
  role?: string
}

export default function ManagerLayout({ children, user, role }: ManagerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const pathname = usePathname()
  const { t } = useLocale()
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : role === "ADMIN" ? "AD" : "MG"

  const isAdmin = role === "ADMIN"
  const adminNav = useAdminNav()
  const managerNav = useManagerNav()
  const nav = isAdmin ? adminNav : managerNav
  const dashboardHref = isAdmin ? "/dashboard" : "/manager/dashboard"
  const profileHref = isAdmin ? "/profile" : "/manager/profile"
  const badgeLabel = isAdmin ? "Admin" : "Manager"

  // Auto-expand group containing active page
  const isPathInGroup = (group: NavGroup) => group.items.some(item =>
    pathname === item.href || (item.href !== "/dashboard" && item.href !== "/manager/dashboard" && pathname.startsWith(item.href))
  )

  const toggleGroup = (label: string) => {
    setExpanded(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const isGroupExpanded = (group: NavGroup) => {
    if (expanded[group.label] !== undefined) return expanded[group.label]
    return isPathInGroup(group) // auto-expand if active page is inside
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-56 flex-col text-white transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: '#0B1E3A' }}
      >
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          <Link href={dashboardHref} className="flex items-center gap-2">
            <HmLogo size={24} onDark />
            <span className="text-sm font-semibold tracking-tight text-white">
              Host<span style={{ color: '#B08A3E' }}>Masters</span>
            </span>
            <span className="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest"
                  style={{ background: 'rgba(176,138,62,0.2)', color: '#B08A3E' }}>Beta</span>
          </Link>
          <button aria-label="Close" className="lg:hidden text-white/50 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
          {nav.map((entry, i) => {
            if (!isGroup(entry)) {
              // Simple link
              const Icon = entry.icon
              const isActive = pathname === entry.href ||
                (entry.href !== "/dashboard" && entry.href !== "/manager/dashboard" && entry.href !== "/manager" && pathname.startsWith(entry.href))
              return (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {entry.label}
                </Link>
              )
            }

            // Group with sub-items
            const GroupIcon = entry.icon
            const isOpen = isGroupExpanded(entry)
            const hasActive = isPathInGroup(entry)

            return (
              <div key={`group-${i}`}>
                <button
                  onClick={() => toggleGroup(entry.label)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    hasActive ? "text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <GroupIcon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{entry.label}</span>
                  {isOpen
                    ? <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                    : <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                  }
                </button>
                {isOpen && (
                  <div className="ml-4 pl-3 border-l border-white/10 space-y-0.5 mt-0.5 mb-1">
                    {entry.items.map(item => {
                      const ItemIcon = item.icon
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                            isActive ? "bg-white/10 text-white" : "text-gray-500 hover:bg-white/5 hover:text-gray-300"
                          )}
                          onClick={() => setSidebarOpen(false)}
                        >
                          <ItemIcon className="h-3.5 w-3.5 shrink-0" />
                          {item.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </nav>

        <div className="border-t border-white/10 p-3 space-y-1">
          <Link
            href={profileHref}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === profileHref
                ? "text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
            style={pathname === profileHref ? { background: 'rgba(176,138,62,0.15)', color: '#B08A3E' } : {}}
          >
            <User className="h-4 w-4 shrink-0" />
            {t('common.myProfile')}
          </Link>
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0 text-[11px] font-bold"
                   style={{ background: '#B08A3E', color: '#1e3a5f' }}>
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name ?? badgeLabel}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email ?? ""}</p>
            </div>
            <Link href="/api/auth/signout" title="Sign out" className="text-white/30 hover:text-white/70 transition-colors">
              <LogOut className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-white px-4 sm:px-6">
          <button
            className="lg:hidden rounded-md p-2 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <span className="font-medium text-gray-800">HostMasters</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="capitalize">{pathname.split("/").filter(Boolean).pop() || "dashboard"}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NotificationBell />
            <Link href={profileHref}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              {user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                     style={{ background: '#B08A3E', color: '#1e3a5f' }}>
                  {initials}
                </div>
              )}
              <span className="hidden sm:block">{user?.name ?? badgeLabel}</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 bg-gray-50">
          {role === 'MANAGER' ? (
            <OnboardingGate role="MANAGER">{children}</OnboardingGate>
          ) : children}
        </main>
      </div>
      <AiChat role={role} />
    </div>
  )
}
