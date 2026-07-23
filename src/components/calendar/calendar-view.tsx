'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { FullCalendarWrapper } from './fullcalendar-wrapper'
import { Room, ReservationWithDetails, CalendarEvent } from '@/lib/types'
import { useAuth } from '@/lib/auth-context'
import { DEFAULT_ROOM_COLORS, WORKING_HOURS, TIME_ZONE } from '@/lib/constants'
import { BookingDialog } from './booking-dialog'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { ChevronLeft, ChevronRight, User } from 'lucide-react'
import { toast } from 'sonner'

interface CalendarViewProps {
  rooms: Room[]
  initialReservations?: ReservationWithDetails[]
  searchQuery?: string
  selectedRoomId?: string
  onRoomSelect?: (id: string) => void
}

export function CalendarView({ rooms, initialReservations = [], searchQuery = '', selectedRoomId: externalRoomId, onRoomSelect }: CalendarViewProps) {
  const { profile, isAdmin } = useAuth()
  const calendarRef = useRef<any>(null)

  const [mounted, setMounted] = useState(false)
  const [currentView, setCurrentView] = useState<'timeGridDay' | 'timeGridWeek' | 'dayGridMonth'>('timeGridWeek')
  const [selectedRoomId, setSelectedRoomId] = useState<string>(externalRoomId ?? 'all')
  const [myBookingsOnly, setMyBookingsOnly] = useState(false)
  const [reservations, setReservations] = useState<ReservationWithDetails[]>(initialReservations)
  const [isLoading, setIsLoading] = useState(false)
  const [currentTitle, setCurrentTitle] = useState<string>('')
  const [liveDate, setLiveDate] = useState<string>('')
  const [liveTime, setLiveTime] = useState<string>('')

  // Live Ticking Clock (Sri Lanka Time)
  useEffect(() => {
    const updateClock = () => {
      const now = new Date()
      setLiveDate(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: TIME_ZONE,
        })
      )
      setLiveTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: TIME_ZONE,
        })
      )
    }

    updateClock()
    const timer = setInterval(updateClock, 1000)
    return () => clearInterval(timer)
  }, [])

  // Booking Modal state
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogInitialValues, setDialogInitialValues] = useState<any>(null)

  // Load saved calendar view preference
  useEffect(() => {
    setMounted(true)
    const savedView = localStorage.getItem('fc_preferred_view')
    if (savedView && ['timeGridDay', 'timeGridWeek', 'dayGridMonth'].includes(savedView)) {
      setCurrentView(savedView as any)
    }
  }, [])

  // Fetch reservations from API
  const fetchReservations = useCallback(async () => {
    setIsLoading(true)
    try {
      let url = '/api/reservations?'
      if (selectedRoomId !== 'all') url += `roomId=${selectedRoomId}&`
      if (myBookingsOnly && profile?.id) url += `userId=${profile.id}&`

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setReservations(data)
      }
    } catch {
      toast.error('Failed to load reservations')
    } finally {
      setIsLoading(false)
    }
  }, [selectedRoomId, myBookingsOnly, profile?.id])

  useEffect(() => {
    if (mounted) {
      fetchReservations()
    }
  }, [fetchReservations, mounted])

  // Sync room selection from sidebar
  useEffect(() => {
    if (externalRoomId !== undefined) {
      setSelectedRoomId(externalRoomId)
    }
  }, [externalRoomId])

  // Listen for search result clicks
  useEffect(() => {
    const handleFocusReservation = (e: any) => {
      const { id, date } = e.detail
      
      // Navigate calendar to that date
      if (calendarRef.current) {
        const api = calendarRef.current.getApi()
        api.gotoDate(date)
        if (currentView === 'dayGridMonth') {
          api.changeView('timeGridWeek')
          setCurrentView('timeGridWeek')
        }
      }

      // Open the booking dialog
      const existing = reservations.find((r) => r.id === id)
      if (existing) {
        setDialogInitialValues(existing)
        setIsDialogOpen(true)
      }
    }

    window.addEventListener('focus-reservation', handleFocusReservation)
    return () => window.removeEventListener('focus-reservation', handleFocusReservation)
  }, [reservations, currentView])

  // Change Calendar View
  const handleViewChange = (viewName: 'timeGridDay' | 'timeGridWeek' | 'dayGridMonth') => {
    setCurrentView(viewName)
    localStorage.setItem('fc_preferred_view', viewName)
    if (calendarRef.current) {
      const api = calendarRef.current.getApi()
      api.changeView(viewName)
    }
  }

  // Quick "Today" Navigation
  const handleTodayClick = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi()
      api.today()
    }
  }

  const handlePrevClick = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi()
      api.prev()
    }
  }

  const handleNextClick = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi()
      api.next()
    }
  }

  // Handle Date Selection (Click & Drag on empty slot)
  const handleDateSelect = (selectInfo: any) => {
    const start = selectInfo.start
    const end = selectInfo.end

    const dateStr = start.toISOString().split('T')[0]
    const startTimeStr = start.toTimeString().slice(0, 5)
    const endTimeStr = end.toTimeString().slice(0, 5)

    const targetRoomId = selectedRoomId !== 'all' ? selectedRoomId : rooms[0]?.id

    setDialogInitialValues({
      roomId: targetRoomId,
      date: dateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
    })
    setIsDialogOpen(true)
  }

  // Handle Event Click (View / Edit existing booking)
  const handleEventClick = (clickInfo: any) => {
    const event = clickInfo.event
    const resId = event.id
    const existing = reservations.find((r) => r.id === resId)

    if (existing) {
      const startDate = new Date(existing.start_time)
      const endDate = new Date(existing.end_time)

      setDialogInitialValues({
        id: existing.id,
        title: existing.title,
        roomId: existing.room_id,
        date: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endTime: endDate.toTimeString().slice(0, 5),
        notes: existing.notes || '',
        userId: existing.user_id,
      })
      setIsDialogOpen(true)
    }
  }

  // Handle Drag & Drop move or resize
  const handleEventDropOrResize = async (changeInfo: any) => {
    const event = changeInfo.event
    const resId = event.id
    const startIso = event.start?.toISOString()
    const endIso = event.end?.toISOString()
    const existing = reservations.find((r) => r.id === resId)

    if (!existing || !startIso || !endIso) return

    // Check ownership or admin
    if (existing.user_id !== profile?.id && !isAdmin) {
      toast.error('You can only modify your own reservations.')
      changeInfo.revert()
      return
    }

    try {
      const response = await fetch(`/api/reservations/${resId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: existing.room_id,
          title: existing.title,
          notes: existing.notes || '',
          start_time: startIso,
          end_time: endIso,
        }),
      })

      if (response.ok) {
        toast.success('Reservation updated!')
        fetchReservations()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update reservation.')
        changeInfo.revert()
      }
    } catch {
      toast.error('Network error during update.')
      changeInfo.revert()
    }
  }

  // Convert DB reservations to FullCalendar events
  const events: CalendarEvent[] = reservations.map((res) => {
    const room = res.room || rooms.find((r) => r.id === res.room_id)
    const roomName = room?.name || 'Meeting Room'
    // Use room's saved color, or fall back to name-based default
    const roomHex = room?.color
    const colorTheme = roomHex
      ? { bg: roomHex, border: roomHex, text: '#FFFFFF' }
      : DEFAULT_ROOM_COLORS[roomName] || DEFAULT_ROOM_COLORS.default
    const organizerName = res.profile?.name || res.profile?.email?.split('@')[0] || 'Employee'

    return {
      id: res.id,
      title: res.title,
      start: res.start_time,
      end: res.end_time,
      roomId: res.room_id,
      userId: res.user_id,
      organizerName,
      notes: res.notes || undefined,
      backgroundColor: colorTheme.bg,
      borderColor: colorTheme.border,
      textColor: colorTheme.text,
      extendedProps: {
        roomName,
        organizerName,
        notes: res.notes || '',
        division: (res as any).division || '',
        contact_number: (res as any).contact_number || '',
      },
    }
  })

  // Client-side multi-field search filter
  const filteredEvents = searchQuery.trim().length >= 1
    ? events.filter((e) => {
        const q = searchQuery.toLowerCase().trim()
        return (
          e.title?.toLowerCase().includes(q) ||
          (e.extendedProps as any)?.roomName?.toLowerCase().includes(q) ||
          (e.extendedProps as any)?.organizerName?.toLowerCase().includes(q) ||
          (e.extendedProps as any)?.division?.toLowerCase().includes(q)
        )
      })
    : events

  if (!mounted) {
    return <div className="h-96 flex items-center justify-center text-muted-foreground">Loading Calendar...</div>
  }

  return (
    <div className="w-full px-5 space-y-4 pt-4 pb-6">
      {/* Unified Toolbar — single row, no card borders */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Left: Date & Time */}
        <div className="flex items-center gap-5">
          <div>
            {liveDate ? (
              <>
                <h1 className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                  {liveTime}
                </h1>
                <p className="text-sm font-medium text-muted-foreground mt-0.5">
                  {liveDate}
                </p>
              </>
            ) : (
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Schedule
              </h1>
            )}
          </div>
        </div>

        {/* Right: Navigation + View Controls + Date Range */}
        <div className="flex flex-col items-end gap-1.5 mt-4 lg:mt-0">
          <div className="flex items-center gap-3 flex-wrap">
          {/* Nav arrows + Today */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevClick}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTodayClick}
              className="h-8 text-xs font-medium px-3 rounded-md"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextClick}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-border hidden sm:block" />

          {/* View switcher */}
          <div className="flex items-center bg-secondary rounded-lg p-0.5">
            {(['timeGridDay', 'timeGridWeek', 'dayGridMonth'] as const).map((view) => (
              <button
                key={view}
                onClick={() => handleViewChange(view)}
                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-all ${
                  currentView === view
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {view === 'timeGridDay' ? 'Day' : view === 'timeGridWeek' ? 'Week' : 'Month'}
              </button>
            ))}
          </div>

          {/* Separator */}
          <div className="w-px h-6 bg-border hidden sm:block" />

          {/* My Bookings toggle */}
          <div className="flex items-center gap-2">
            <Switch
              id="my-bookings"
              checked={myBookingsOnly}
              onCheckedChange={setMyBookingsOnly}
            />
            <Label htmlFor="my-bookings" className="text-xs font-medium text-muted-foreground cursor-pointer whitespace-nowrap">
              My bookings
            </Label>
          </div>
          </div>
          {/* Week/Month Details */}
          <div className="text-sm font-semibold text-primary mr-1 bg-primary/5 px-3 py-1 rounded-full">
            {currentTitle}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card rounded-xl border border-border overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-card/80 z-10 flex items-center justify-center">
            <div className="flex items-center gap-2.5 bg-card px-4 py-2.5 rounded-lg border border-border shadow-lg text-sm font-medium text-foreground">
              <span className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              Loading...
            </div>
          </div>
        )}

        <FullCalendarWrapper
          ref={calendarRef}
          initialView={currentView}
          datesSet={(dateInfo: any) => {
            if (dateInfo?.view?.title) {
              setCurrentTitle(dateInfo.view.title)
            }
          }}
          headerToolbar={false}
          weekends={false}
          slotMinTime={WORKING_HOURS.start}
          slotMaxTime="18:00:00"
          allDaySlot={false}
          selectable={true}
          selectMirror={true}
          editable={true}
          eventResizableFromStart={true}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDropOrResize}
          eventResize={handleEventDropOrResize}
          events={filteredEvents}
          height="auto"
          contentHeight={600}
          expandRows={true}
          nowIndicator={true}
          timeZone="local"
          slotEventOverlap={false}
          eventMaxStack={2}
          eventContent={(eventInfo: any) => (
            <div className="px-1.5 py-1 text-xs leading-tight flex flex-col h-full overflow-hidden">
              <div className="font-semibold truncate text-foreground">
                {eventInfo.event.extendedProps.roomName && (
                  <span className="opacity-60 font-medium">({eventInfo.event.extendedProps.roomName}) </span>
                )}
                {eventInfo.event.title}
              </div>
              <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                <User className="w-2.5 h-2.5 shrink-0" />
                <span>{eventInfo.event.extendedProps.organizerName}</span>
              </div>
            </div>
          )}
          eventDidMount={(info: any) => {
            const hexColor = info.event.borderColor || '#FF6C0E'
            info.el.style.setProperty('--fc-event-border-color', hexColor)
            info.el.style.backgroundColor = `${hexColor}14`
          }}
        />
      </div>

      {/* Booking Form Dialog */}
      <BookingDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        rooms={rooms}
        initialValues={dialogInitialValues}
        onSave={fetchReservations}
        onDelete={() => fetchReservations()}
      />
    </div>
  )
}
