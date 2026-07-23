'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Room } from '@/lib/types'
import { DEFAULT_ROOM_COLORS } from '@/lib/constants'
import { Search, Plus, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-react'

interface SidebarProps {
  rooms: Room[]
  selectedRoomId: string
  onRoomSelect: (id: string) => void
  onSearch: (q: string) => void
  onNewBookingClick: () => void
}

export function Sidebar({
  rooms,
  selectedRoomId,
  onRoomSelect,
  onSearch,
  onNewBookingClick,
}: SidebarProps) {
  const { profile, isAdmin, signOut } = useAuth()
  const pathname = usePathname()
  const [searchVal, setSearchVal] = useState('')

  // Mini calendar state
  const today = new Date()
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear] = useState(today.getFullYear())

  const userInitials = profile?.name
    ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email ? profile.email.slice(0, 2).toUpperCase() : 'US'

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value)
    onSearch(e.target.value)
  }

  // Mini calendar helpers
  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December']
  const dayNames = ['S','M','T','W','T','F','S']
  const firstDay = new Date(calYear, calMonth, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const todayDate = today.getDate()
  const isCurrentMonth = calMonth === today.getMonth() && calYear === today.getFullYear()

  const prevMonth = () => {
    if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) }
    else setCalMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) }
    else setCalMonth(m => m + 1)
  }

  // Build calendar grid
  const calCells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) calCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d)

  return (
    <aside className="w-[220px] min-w-[220px] h-screen fixed left-0 top-0 z-30 flex flex-col bg-card border-r border-border/60 overflow-y-auto">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 px-4 pt-5 pb-4 shrink-0 group">
        <img src="/logo.png" alt="CBA" className="h-10 w-auto object-contain transition-transform group-hover:scale-105" />
        <div className="leading-none">
          <span className="text-[13px] font-bold tracking-tight text-foreground block">Meeting Room</span>
          <span className="text-[9px] uppercase font-semibold tracking-widest text-primary block mt-0.5">Reservation</span>
        </div>
      </Link>

      <div className="px-3 space-y-5 flex-1">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search meetings..."
            value={searchVal}
            onChange={handleSearch}
            className="pl-8 h-8 text-xs bg-secondary border-0 rounded-lg focus-visible:ring-1"
          />
        </div>

        {/* New Meeting Button */}
        <Button
          onClick={onNewBookingClick}
          size="sm"
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm gap-2 h-9 rounded-xl shadow-md shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          New Meeting
        </Button>

        {/* Room Filter */}
        <div>
          <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-2 px-1">Rooms</p>
          <div className="space-y-0.5">
            <button
              onClick={() => onRoomSelect('all')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                selectedRoomId === 'all'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/40 shrink-0" />
              All Rooms
            </button>
            {rooms.map((r) => {
              const color = r.color || DEFAULT_ROOM_COLORS[r.name]?.bg || DEFAULT_ROOM_COLORS.default.bg
              return (
                <button
                  key={r.id}
                  onClick={() => onRoomSelect(r.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                    selectedRoomId === r.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="truncate">{r.name}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Mini Calendar */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
              {monthNames[calMonth]} {calYear}
            </p>
            <div className="flex items-center gap-0.5">
              <button onClick={prevMonth} className="h-5 w-5 flex items-center justify-center rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <ChevronLeft className="w-3 h-3" />
              </button>
              <button onClick={nextMonth} className="h-5 w-5 flex items-center justify-center rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-0">
            {dayNames.map((d, i) => (
              <div key={i} className="text-center text-[9px] font-bold text-muted-foreground py-0.5">{d}</div>
            ))}
            {calCells.map((d, i) => (
              <div key={i} className="flex items-center justify-center py-0.5">
                {d ? (
                  <span className={`text-[11px] w-6 h-6 flex items-center justify-center rounded-full font-medium transition-colors ${
                    isCurrentMonth && d === todayDate
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground cursor-pointer'
                  }`}>
                    {d}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: User + Controls */}
      <div className="px-3 py-4 border-t border-border/60 space-y-3 shrink-0">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isAdmin && (
            <Link href={pathname === '/admin' ? '/' : '/admin'} title={pathname === '/admin' ? 'Back to Calendar' : 'Admin Console'} className="flex-1">
              <button className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                pathname === '/admin'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}>
                <Settings className="w-3.5 h-3.5 shrink-0" />
                {pathname === '/admin' ? 'Calendar' : 'Admin'}
              </button>
            </Link>
          )}
        </div>

        {/* User */}
        <div className="flex items-center gap-2.5">
          <Avatar className="h-8 w-8 border-2 border-primary/20 shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground font-semibold text-xs">
              {userInitials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground truncate">{profile?.name || 'User'}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{profile?.role?.replace('_', ' ') || 'user'}</p>
          </div>
          <button
            onClick={() => signOut()}
            title="Sign out"
            className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
