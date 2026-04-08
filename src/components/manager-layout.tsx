"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Building2, CalendarDays, ClipboardList, Users,
  TrendingUp, FileBarChart, Menu, MessageCircle, User, LogOut, X, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

const sidebarLinks = [
  { href: "/manager/dashboard", label: "Dashboard",    icon: LayoutDashboard },
  { href: "/properties",        label: "Properties",   icon: Building2 },
  { href: "/reservations",      label: "Reservations", icon: CalendarDays },
  { href: "/tasks",             label: "Tasks",        icon: ClipboardList },
  { href: "/manager/clients",   label: "My Owners",    icon: Users },
  { href: "/revenue",           label: "Revenue",      icon: TrendingUp },
  { href: "/reports",           label: "Reports",      icon: FileBarChart },
  { href: "/manager/messages",  label: "Messages",     icon: MessageCircle },
]

interface ManagerLayoutProps {
  children: React.ReactNode
  user?: { name?: string | null; email?: string | null; image?: string | null }
}

export default function ManagerLayout({ children, user }: ManagerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const initials = user?.name
    ? user.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "MG"

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-56 flex-col text-white transition-transform duration-200 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: '#111827' }}
      >
        {/* Sidebar Header */}
        <div className="flex h-14 items-center justify-between border-b border-white/10 px-4">
          <Link href="/manager/dashboard" className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-white">
              Host<span style={{ color: '#C9A84C' }}>Masters</span>
            </span>
            <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                  style={{ background: 'rgba(201,168,76,0.2)', color: '#C9A84C' }}>
              Manager
            </span>
          </Link>
          <button className="lg:hidden text-white/50 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 space-y-0.5 px-2 py-3">
          {sidebarLinks.map((link) => {
            const Icon = link.icon
            const isActive =
              pathname === link.href ||
              (link.href !== "/manager/dashboard" && link.href !== "/manager" && pathname.startsWith(link.href))
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Profile link + user info */}
        <div className="border-t border-white/10 p-3 space-y-1">
          <Link
            href="/manager/profile"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              pathname === "/manager/profile"
                ? "text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
            style={pathname === "/manager/profile" ? { background: 'rgba(201,168,76,0.15)', color: '#C9A84C' } : {}}
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
              <p className="text-xs font-semibold text-white truncate">{user?.name ?? "Manager"}</p>
              <p className="text-[10px] text-gray-400 truncate">{user?.email ?? ""}</p>
            </div>
            <Link href="/api/auth/signout" title="Sign out" className="text-white/30 hover:text-white/70 transition-colors">
              <LogOut className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Bar */}
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
            <Link href="/manager/profile"
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
              <span className="hidden sm:block">{user?.name ?? "Manager"}</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  )
}
