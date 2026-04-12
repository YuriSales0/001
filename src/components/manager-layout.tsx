"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Building2, CalendarDays, Users,
  TrendingUp, FileBarChart, Menu, MessageCircle, User, LogOut, X, ChevronRight, ChevronDown,
  BarChart3, FileText, Calendar, Wrench, Home, Wallet, Receipt, Sparkles, Megaphone, Landmark, Activity,
  Target, Settings, Brain,
} from "lucide-react"
import { AiChat } from "@/components/hm/ai-chat"
import { cn } from "@/lib/utils"

type NavItem = { href: string; label: string; icon: React.ElementType }
type NavGroup = { label: string; icon: React.ElementType; items: NavItem[] }
type NavEntry = NavItem | NavGroup

function isGroup(entry: NavEntry): entry is NavGroup {
  return 'items' in entry
}

// ── Admin navigation (grouped) ──
const adminNav: NavEntry[] = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  {
    label: "Leads", icon: Target, items: [
      { href: "/crm", label: "CRM Pipeline", icon: BarChart3 },
      { href: "/marketing", label: "Marketing", icon: Megaphone },
    ],
  },
  {
    label: "Operations", icon: CalendarDays, items: [
      { href: "/calendar", label: "Calendar", icon: Calendar },
      { href: "/reservations", label: "Reservations", icon: CalendarDays },
      { href: "/setup", label: "Setup", icon: FileText },
      { href: "/maintenance", label: "Maintenance", icon: Wrench },
    ],
  },
  {
    label: "Finance", icon: Wallet, items: [
      { href: "/payouts", label: "Payouts", icon: Wallet },
      { href: "/manager/invoices", label: "Invoices", icon: Receipt },
      { href: "/report-summary", label: "Reports", icon: FileBarChart },
      { href: "/my-reports", label: "Owner Reports", icon: FileText },
    ],
  },
  {
    label: "Administration", icon: Settings, items: [
      { href: "/team", label: "Team", icon: Users },
      { href: "/my-properties", label: "Properties", icon: Building2 },
      { href: "/integrations", label: "Integrations", icon: Landmark },
    ],
  },
  {
    label: "HostMasters AI", icon: Brain, items: [
      { href: "/ai", label: "AI Pricing", icon: Sparkles },
      { href: "/ai-monitor", label: "AI Monitor", icon: Activity },
    ],
  },
  { href: "/messages", label: "Messages", icon: MessageCircle },
]

// ── Manager navigation (grouped) ──
const managerNav: NavEntry[] = [
  { href: "/manager/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    label: "Leads", icon: Target, items: [
      { href: "/crm", label: "CRM Pipeline", icon: BarChart3 },
    ],
  },
  {
    label: "Operations", icon: CalendarDays, items: [
      { href: "/calendar", label: "Calendar", icon: Calendar },
      { href: "/reservations", label: "Reservations", icon: CalendarDays },
      { href: "/properties", label: "Properties", icon: Building2 },
      { href: "/setup", label: "Setup", icon: FileText },
      { href: "/maintenance", label: "Maintenance", icon: Wrench },
    ],
  },
  {
    label: "Finance", icon: Wallet, items: [
      { href: "/manager/invoices", label: "Invoices", icon: Receipt },
      { href: "/revenue", label: "Revenue", icon: TrendingUp },
      { href: "/reports", label: "Reports", icon: FileBarChart },
    ],
  },
  {
    label: "My Portfolio", icon: Users, items: [
      { href: "/manager/clients", label: "My Owners", icon: Users },
    ],
  },
  { href: "/manager/messages", label: "Messages", icon: MessageCircle },
]

interface ManagerLayoutProps {
  children: React.ReactNode
  user?: { name?: string | null; email?: string | null; image?: string | null }
  role?: string
}

export default function ManagerLayout({ children, user, role }: ManagerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const pathname = usePathname()
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : role === "ADMIN" ? "AD" : "MG"

  const isAdmin = role === "ADMIN"
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
        style={{ background: '#111827' }}
      >
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          <Link href={dashboardHref} className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-white">
              Host<span style={{ color: '#C9A84C' }}>Masters</span>
            </span>
            <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                  style={{ background: 'rgba(201,168,76,0.2)', color: '#C9A84C' }}>
              {badgeLabel}
            </span>
          </Link>
          <button className="lg:hidden text-white/50 hover:text-white" onClick={() => setSidebarOpen(false)}>
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
            style={pathname === profileHref ? { background: 'rgba(201,168,76,0.15)', color: '#C9A84C' } : {}}
          >
            <User className="h-4 w-4 shrink-0" />
            My Profile
          </Link>
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt="" className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0 text-[11px] font-bold"
                   style={{ background: '#C9A84C', color: '#1e3a5f' }}>
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name ?? (isAdmin ? "Admin" : "Manager")}</p>
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
            className="lg:hidden rounded-md p-1.5 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <span className="font-medium text-gray-800">HostMasters</span>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="capitalize">{pathname.split("/").filter(Boolean).pop() || "dashboard"}</span>
          </div>
          <div className="ml-auto">
            <Link href={profileHref}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-600 hover:bg-gray-100 transition-colors">
              {user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.image} alt="" className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                     style={{ background: '#C9A84C', color: '#1e3a5f' }}>
                  {initials}
                </div>
              )}
              <span className="hidden sm:block">{user?.name ?? (isAdmin ? "Admin" : "Manager")}</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 bg-gray-50">
          {children}
        </main>
      </div>
      <AiChat role={role} />
    </div>
  )
}
