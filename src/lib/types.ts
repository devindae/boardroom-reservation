export type Role = 'user' | 'admin' | 'super_admin'

export interface Profile {
  id: string
  name: string
  email: string
  role: Role
  created_at: string
}

export interface Room {
  id: string
  name: string
  location: string
  color?: string
  created_at?: string
}

export interface Reservation {
  id: string
  room_id: string
  user_id: string
  title: string
  notes?: string | null
  start_time: string
  end_time: string
  created_at?: string
}

export interface ReservationWithDetails extends Reservation {
  room?: Room
  profile?: Profile
}

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end: string
  roomId: string
  userId: string
  organizerName: string
  notes?: string
  backgroundColor?: string
  borderColor?: string
  textColor?: string
}
