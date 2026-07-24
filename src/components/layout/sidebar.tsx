'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Room, ReservationWithDetails, AppNotification } from '@/lib/types'
import { DEFAULT_ROOM_COLORS } from '@/lib/constants'
import { Search, Plus, Settings, LogOut, ChevronLeft, ChevronRight, Calendar, Clock, MapPin, User, X, Bell, CheckCircle2 } from 'lucide-react'

interface SidebarProps {
  rooms: Room[]
  reservations?: ReservationWithDetails[]
  selectedRoomId: string
  onRoomSelect: (id: string) => void
  onSearch: (q: string) => void
  onNewBookingClick: () => void
}

export function Sidebar({
  rooms,
  reservations = [],
  selectedRoomId,
  onRoomSelect,
  onSearch,
  onNewBookingClick,
}: SidebarProps) {
  const { profile, isAdmin, signOut } = useAuth()
  const pathname = usePathname()
  const [searchVal, setSearchVal] = useState('')
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Notifications state
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications')
        if (res.ok) {
          const data = await res.json()
          setNotifications(data)
        }
      } catch (e) {
        console.error('Failed to fetch notifications', e)
      }
    }
    
    // Fetch if logged in
    if (profile) {
      fetchNotifications()
      const interval = setInterval(fetchNotifications, 60000)
      return () => clearInterval(interval)
    }
  }, [profile])



  const markAsRead = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'PUT' })
      if (res.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Mini calendar state
  const today = new Date()
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear] = useState(today.getFullYear())

  const userInitials = profile?.name
    ? profile.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : profile?.email ? profile.email.slice(0, 2).toUpperCase() : 'US'

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchVal(val)
    onSearch(val)
    setShowResults(val.trim().length >= 1)
  }

  const clearSearch = () => {
    setSearchVal('')
    onSearch('')
    setShowResults(false)
  }

  // Search results — filter across title, room name, organizer, division
  const searchResults = searchVal.trim().length >= 1
    ? reservations.filter((r) => {
        const q = searchVal.toLowerCase().trim()
        const roomName = r.room?.name || rooms.find(rm => rm.id === r.room_id)?.name || ''
        const organizer = r.profile?.name || r.profile?.email?.split('@')[0] || ''
        const division = (r as any).division || ''
        return (
          r.title?.toLowerCase().includes(q) ||
          roomName.toLowerCase().includes(q) ||
          organizer.toLowerCase().includes(q) ||
          division.toLowerCase().includes(q)
        )
      }).slice(0, 6)
    : []

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

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

  const calCells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) calCells.push(null)
  for (let d = 1; d <= daysInMonth; d++) calCells.push(d)

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-US', {
      hour: '2-digit', minute: '2-digit', hour12: true
    })
  }
  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric'
    })
  }

  return (
    <aside className="w-[220px] min-w-[220px] h-screen fixed left-0 top-0 z-30 flex flex-col bg-card border-r border-border/60 overflow-y-auto">
      {/* Logo and Notifications Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4 shrink-0">
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <img src="/logo.png" alt="CBA" className="h-8 w-auto object-contain transition-transform group-hover:scale-105" />
          <div className="leading-none">
            <span className="text-[12px] font-bold tracking-tight text-foreground block">Meeting Room</span>
            <span className="text-[8px] uppercase font-semibold tracking-widest text-primary block mt-0.5">Reservation</span>
          </div>
        </Link>

        {/* Notifications */}
        <Popover>
          <PopoverTrigger
            title="Notifications"
            className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all relative shrink-0"
          >
            <Bell className="w-4 h-4" />
            {notifications.filter(n => !n.is_read).length > 0 && (
              <span className="absolute top-1 right-1.5 w-2 h-2 bg-destructive rounded-full border border-card" />
            )}
          </PopoverTrigger>
          
          <PopoverContent align="start" side="bottom" sideOffset={4} className="w-64 p-0 rounded-xl overflow-hidden shadow-2xl border border-border bg-popover z-50">
            <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Notifications</span>
              <span className="text-[10px] bg-secondary px-1.5 rounded-full text-foreground">{notifications.filter(n => !n.is_read).length} new</span>
            </div>
            <div className="max-h-60 overflow-y-auto p-1 flex flex-col gap-1">
              {notifications.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-muted-foreground">No notifications</div>
              ) : (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`px-3 py-2.5 rounded-lg text-xs flex gap-2 items-start transition-colors ${n.is_read ? 'opacity-60 hover:bg-secondary/40' : 'bg-primary/5 hover:bg-primary/10'}`}
                  >
                    <div className="flex-1 mt-0.5 text-left">
                      <p className="text-foreground leading-snug whitespace-normal break-words">{n.message}</p>
                      <p className="text-[9px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                    {!n.is_read && (
                      <button onClick={() => markAsRead(n.id)} className="text-primary hover:text-primary/80 shrink-0" title="Mark as read">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="px-3 space-y-4 flex-1">
        {/* Search with dropdown */}
        <div className="relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search meetings..."
              value={searchVal}
              onChange={handleSearch}
              onFocus={() => searchVal.trim().length >= 1 && setShowResults(true)}
              className="pl-8 pr-7 h-8 text-xs bg-secondary border-0 rounded-lg focus-visible:ring-1"
            />
            {searchVal && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-xl shadow-2xl z-50 overflow-hidden max-h-[340px] overflow-y-auto">
              {searchResults.length === 0 ? (
                <div className="px-3 py-5 text-center">
                  <Search className="w-6 h-6 text-muted-foreground/40 mx-auto mb-1.5" />
                  <p className="text-xs text-muted-foreground">No meetings found</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">Try a different name or room</p>
                </div>
              ) : (
                <>
                  <div className="px-3 py-2 border-b border-border/50">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {searchResults.map((r) => {
                    const roomName = r.room?.name || rooms.find(rm => rm.id === r.room_id)?.name || 'Room'
                    const roomColor = r.room?.color || DEFAULT_ROOM_COLORS[roomName]?.bg || DEFAULT_ROOM_COLORS.default.bg
                    const organizer = r.profile?.name || r.profile?.email?.split('@')[0] || 'Employee'
                    return (
                      <div
                        key={r.id}
                        className="px-3 py-2.5 hover:bg-secondary/60 cursor-pointer border-b border-border/30 last:border-0 transition-colors"
                        onClick={() => {
                          setShowResults(false)
                          window.dispatchEvent(new CustomEvent('focus-reservation', { 
                            detail: { id: r.id, date: r.start_time }
                          }))
                        }}
                      >
                        {/* Color bar + title */}
                        <div className="flex items-start gap-2">
                          <div
                            className="w-1 h-full min-h-[32px] rounded-full shrink-0 mt-0.5"
                            style={{ backgroundColor: roomColor }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate leading-tight">
                              {r.title}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <MapPin className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                              <span className="text-[10px] text-muted-foreground truncate">{roomName}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              <User className="w-2.5 h-2.5 text-muted-foreground shrink-0" />
                              <span className="text-[10px] text-muted-foreground truncate">{organizer}</span>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                              <Calendar className="w-2.5 h-2.5 shrink-0" />
                              <span>{formatDate(r.start_time)}</span>
                              <Clock className="w-2.5 h-2.5 shrink-0 ml-1" />
                              <span>{formatTime(r.start_time)} – {formatTime(r.end_time)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )}
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
                  <span 
                    onClick={() => {
                      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
                      window.dispatchEvent(new CustomEvent('navigate-date', { detail: { date: dateStr } }))
                    }}
                    className={`text-[11px] w-6 h-6 flex items-center justify-center rounded-full font-medium cursor-pointer transition-colors ${
                    isCurrentMonth && d === todayDate
                      ? 'bg-primary text-primary-foreground font-bold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}>
                    {d}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: Footer + User + Controls */}
      <div className="px-3 py-4 border-t border-border/60 space-y-3 shrink-0">
        {/* Footer branding */}
        <p className="text-[9px] text-muted-foreground/60 text-center leading-tight">
          Ceylon Business Appliances (Pvt) Ltd. © 2026
        </p>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          {isAdmin && (
            <Link href={pathname === '/admin' ? '/' : '/admin'} className="flex-1">
              <button className={`w-full flex items-center justify-center gap-2 px-2.5 h-8 rounded-lg text-xs font-medium transition-all ${
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
