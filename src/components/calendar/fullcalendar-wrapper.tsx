'use client'

import React, { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'

export function FullCalendarWrapper(props: any) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-[580px] flex items-center justify-center bg-card text-muted-foreground text-sm font-medium rounded-lg">
        Loading Outlook Calendar...
      </div>
    )
  }

  return (
    <FullCalendar
      plugins={[dayGridPlugin as any, timeGridPlugin as any, interactionPlugin as any]}
      {...props}
    />
  )
}
