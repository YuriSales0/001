"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Home, Calendar, FileText, Menu, X, LogOut, User, Wallet, Users,
  MessageCircle, BarChart3, Wrench, Settings, ClipboardList, Activity,
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

const navLinks = [
  { href: "/dashboard",    label: "Dashboard",    icon: Home },
  { href: "/crm",          label: "CRM",          icon: BarChart3 },
  { href: "/calendar",     label: "Calendar",     icon: Calendar },
  { href: "/operations",   label: "Operations",   icon: Activity },
  { href: "/tasks",        label: "Tasks",        icon: ClipboardList },
  { href: "/setup",        label: "Setup",        icon: ClipboardList },
  { href: "/maintenance",  label: "Maintenance",  icon: Wrench },
  { href: "/my-properties",label: "Properties",   icon: Building2 },
  { href: "/payouts",      label: "Payouts",      icon: Wallet },
  { href: "/team",         label: "Team",         icon: Users },
  { href: "/messages",     label: "Messages",     icon: MessageCircle },
]

interface OwnerLayoutProps {
  children: React.ReactNode
}

export default function OwnerLayout({ children }: OwnerLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen" style={{ background: '#F5F5F5', fontFamily: 'system-ui, sans-serif' }}>
      {/* Header */}
      <header className="sticky top-0 z-50 shadow-sm" style={{ background: '#1e3a5f' }}>
        <div className="mx-auto flex h-14 max-w-screen-xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="h-7 w-7 rounded-full flex items-center justify-center"
                 style={{ background: '#C9A84C' }}>
              <Building2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white text-base tracking-tight hidden sm:block">
              Host<span style={{ color: '#C9A84C' }}>Masters</span>
            </span>
            <span className="ml-1 text-[10px] font-bold text-white/50 rounded bg-white/10 px-1.5 py-0.5 uppercase tracking-widest">
              Admin
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-0.5 lg:flex">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href ||
                (link.href !== "/dashboard" && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-white/15 text-[#C9A84C]"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:ring-offset-2 focus:ring-offset-[#1e3a5f]"
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback style={{ background: '#C9A84C', color: '#1e3a5f', fontSize: '11px', fontWeight: 700 }}>
                    YU
                  </AvatarFallback>
                </Avatar>
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl border bg-white py-1 shadow-lg z-50">
                  <button
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => { setUserMenuOpen(false); window.location.href = '/api/auth/signout' }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/10 lg:hidden h-8 w-8"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileMenuOpen && (
          <nav className="border-t border-white/10 px-4 py-2 lg:hidden flex flex-wrap gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors",
                    isActive
                      ? "bg-white/15 text-[#C9A84C]"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </Link>
              )
            })}
          </nav>
        )}
      </header>

      {/* Content */}
      <main>
        {children}
      </main>
    </div>
  )
}
