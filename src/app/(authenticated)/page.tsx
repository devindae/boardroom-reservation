'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Room, ReservationWithDetails } from '@/lib/types'
import { Sidebar } from '@/components/layout/sidebar'
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
  const [selectedRoomId, setSelectedRoomId] = useState('all')
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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Left Sidebar */}
      <Sidebar
        rooms={rooms}
        reservations={reservations}
        selectedRoomId={selectedRoomId}
        onRoomSelect={setSelectedRoomId}
        onSearch={setSearchQuery}
        onNewBookingClick={() => setIsNewBookingOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 ml-[220px] overflow-y-auto flex flex-col">
        <div className="flex-1 flex flex-col">
          <CalendarView
            rooms={rooms}
            initialReservations={reservations}
            searchQuery={searchQuery}
            selectedRoomId={selectedRoomId}
            onRoomSelect={setSelectedRoomId}
          />
        </div>
        {/* Main Footer */}
        <div className="py-4 text-center border-t border-border/50 shrink-0">
          <p className="text-xs font-medium text-muted-foreground">
            Ceylon Business Appliances (Pvt) Ltd. © 2026
          </p>
        </div>
      </main>

      <BookingDialog
        isOpen={isNewBookingOpen}
        onClose={() => setIsNewBookingOpen(false)}
        rooms={rooms}
        initialValues={null}
        onSave={() => {
          window.dispatchEvent(new Event('reservation-updated'))
        }}
      />
    </div>
  )
}
