'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Search, Shield, LogOut, Plus } from 'lucide-react'

interface NavbarProps {
  onSearch?: (query: string) => void
  onNewBookingClick?: () => void
}

export function Navbar({ onSearch, onNewBookingClick }: NavbarProps) {
  const { profile, isAdmin, signOut } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchQuery(val)
    if (onSearch) {
      onSearch(val)
    }
  }

  const userInitials = profile?.name
    ? profile.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : profile?.email
    ? profile.email.slice(0, 2).toUpperCase()
    : 'US'

  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-card border-b border-border">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 h-[80px] flex items-center justify-between gap-6">
        {/* Left: Brand */}
        <Link href="/" className="flex items-center gap-3 shrink-0 group">
          <img
            src="/logo.png"
            alt="CBA Logo"
            className="h-14 w-auto object-contain transition-transform group-hover:scale-[1.03]"
          />
          <div className="hidden sm:block leading-none">
            <span className="text-[15px] font-semibold tracking-tight text-foreground block">
              Meeting Room
            </span>
            <span className="text-[10px] uppercase font-semibold tracking-[0.12em] text-accent block mt-0.5">
              Reservation
            </span>
          </div>
        </Link>

        {/* Center: Search */}
        <div className="flex-1 max-w-sm hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search meetings..."
              className="pl-9 h-9 text-sm bg-secondary border-0 focus-visible:ring-1 focus-visible:ring-ring placeholder:text-muted-foreground rounded-lg"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {onNewBookingClick && (
            <Button
              onClick={onNewBookingClick}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm gap-2 h-9 px-4 rounded-lg shadow-none"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Meeting</span>
            </Button>
          )}

          {isAdmin && (
            <Link href={pathname === '/admin' ? '/' : '/admin'}>
              <Button
                variant="ghost"
                size="sm"
                className="text-sm gap-2 h-9 text-muted-foreground hover:text-foreground"
              >
                <Shield className="w-4 h-4" />
                <span className="hidden lg:inline">
                  {pathname === '/admin' ? 'Calendar' : 'Admin'}
                </span>
              </Button>
            </Link>
          )}

          <ThemeToggle />

          {/* Divider */}
          <div className="w-px h-8 bg-border mx-1 hidden sm:block" />

          {/* User section */}
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarFallback className="bg-primary text-primary-foreground font-medium text-xs">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:flex flex-col items-start leading-none">
              <span className="text-sm font-medium text-foreground">
                {profile?.name || 'User'}
              </span>
              <button
                onClick={() => signOut()}
                className="text-[11px] text-muted-foreground hover:text-destructive transition-colors mt-0.5"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
