'use client'

import React, { useState, useEffect } from 'react'

import dynamic from 'next/dynamic'
import { Room, ReservationWithDetails } from '@/lib/types'
import { Navbar } from '@/components/layout/navbar'
import { BookingDialog } from '@/components/calendar/booking-dialog'
import { toast } from 'sonner'

const CalendarView = dynamic(
  () => import('@/components/calendar/calendar-view').then((mod) => mod.CalendarView),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 flex items-center justify-center text-muted-foreground text-sm">
        Loading Calendar...
      </div>
    ),
  }
)

const MOCK_ROOMS: Room[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Executive Meeting Room', location: 'Upper Floor' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Meeting Room', location: 'First Floor' },
]

export default function HomePage() {
  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS)
  const [reservations, setReservations] = useState<ReservationWithDetails[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false)

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [roomsRes, resRes] = await Promise.all([
          fetch('/api/rooms'),
          fetch('/api/reservations'),
        ])

        if (roomsRes.ok) {
          const roomsData = await roomsRes.json()
          if (roomsData && roomsData.length > 0) {
            setRooms(roomsData)
          }
        }

        if (resRes.ok) {
          const resData = await resRes.json()
          setReservations(resData)
        }
      } catch (e) {
        console.warn('Using default fallback state:', e)
      }
    }

    loadInitialData()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navbar */}
      <Navbar
        onSearch={setSearchQuery}
        onNewBookingClick={() => setIsNewBookingOpen(true)}
      />

      {/* Main Calendar Section — padding handled inside CalendarView */}
      <CalendarView
        rooms={rooms}
        initialReservations={reservations}
        searchQuery={searchQuery}
      />

      {/* Quick Booking Dialog triggered from Navbar */}
      <BookingDialog
        isOpen={isNewBookingOpen}
        onClose={() => setIsNewBookingOpen(false)}
        rooms={rooms}
        initialValues={null}
        onSave={() => {
          // Trigger refresh inside calendar component or re-fetch
          window.dispatchEvent(new Event('reservation-updated'))
        }}
      />
    </div>
  )
}
