"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Building2, CalendarDays, ClipboardList, Users,
  TrendingUp, FileBarChart, Bell, Search, Menu, MessageCircle, Wrench,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
}

export default function ManagerLayout({ children }: ManagerLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen" style={{ fontFamily: 'system-ui, sans-serif' }}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
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
        <div className="flex h-14 items-center gap-2 border-b border-white/10 px-4">
          <Link href="/manager/dashboard" className="text-base font-bold tracking-tight">
            Host<span style={{ color: '#C9A84C' }}>Masters</span>
          </Link>
          <span className="ml-auto rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: 'rgba(201,168,76,0.2)', color: '#C9A84C' }}>
            Manager
          </span>
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

        {/* Manager info */}
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-7 w-7">
              <AvatarFallback style={{ background: '#C9A84C', color: '#1e3a5f', fontSize: '11px', fontWeight: 700 }}>
                MA
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xs font-semibold text-white">Manoela</div>
              <div className="text-[10px] text-gray-400">Operations Manager</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-white px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden h-8 w-8"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search…"
              className="h-8 w-full rounded-lg border bg-gray-50 pl-8 pr-3 text-sm placeholder:text-gray-400 focus:border-navy-400 focus:outline-none focus:ring-1 focus:ring-navy-400"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4 text-gray-500" />
              <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
            </Button>
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
