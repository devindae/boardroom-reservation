'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Settings, LogOut } from 'lucide-react'

export function UserDock() {
  const { profile, isAdmin, signOut } = useAuth()
  const pathname = usePathname()

  const userInitials = profile?.name
    ? profile.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : profile?.email
    ? profile.email.slice(0, 2).toUpperCase()
    : 'US'

  return (
    <div className="fixed bottom-5 left-5 z-50">
      <div className="flex items-center gap-3 bg-card/90 backdrop-blur-md border border-border/60 rounded-2xl px-4 py-3 shadow-xl shadow-black/10 dark:shadow-black/30 transition-all">
        {/* Avatar */}
        <Avatar className="h-9 w-9 border-2 border-primary/20 shrink-0">
          <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
            {userInitials}
          </AvatarFallback>
        </Avatar>

        {/* User info */}
        <div className="flex flex-col leading-none min-w-0">
          <span className="text-sm font-semibold text-foreground whitespace-nowrap">
            {profile?.name || 'User'}
          </span>
          <span className="text-[11px] text-muted-foreground mt-0.5 capitalize">
            {profile?.role?.replace('_', ' ') || 'user'}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-7 bg-border mx-0.5 shrink-0" />

        {/* Admin button (only for admin/super_admin) */}
        {isAdmin && (
          <Link
            href={pathname === '/admin' ? '/' : '/admin'}
            title={pathname === '/admin' ? 'Back to Calendar' : 'Admin Console'}
          >
            <button
              className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all ${
                pathname === '/admin'
                  ? 'bg-primary text-primary-foreground shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </Link>
        )}

        {/* Sign out */}
        <button
          onClick={() => signOut()}
          title="Sign out"
          className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
