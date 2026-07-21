import { COMPANY_DOMAIN, WORKING_HOURS, WORKING_DAYS } from './constants'

/**
 * Validates company email domain requirement (must contain cba.lk)
 */
export function isValidCompanyEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false
  const cleanEmail = email.trim().toLowerCase()
  return cleanEmail.includes(COMPANY_DOMAIN)
}

/**
 * Checks if a date falls on a weekend in Asia/Colombo (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Colombo',
    weekday: 'short',
  })
  const dayStr = formatter.format(date) // "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
  return dayStr === 'Sat' || dayStr === 'Sun'
}

/**
 * Checks if a booking time range is within official working hours in Asia/Colombo (8:30 AM - 5:00 PM)
 */
export function isWithinWorkingHours(startDate: Date, endDate: Date): boolean {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Colombo',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  })

  // Format returns e.g. "10:30" or "08:30" or "17:00"
  const startParts = formatter.format(startDate).split(':').map(Number)
  const endParts = formatter.format(endDate).split(':').map(Number)

  const startHour = startParts[0]
  const startMin = startParts[1]
  const endHour = endParts[0]
  const endMin = endParts[1]

  const startTotalMinutes = startHour * 60 + startMin
  const endTotalMinutes = endHour * 60 + endMin

  const workStartMinutes = WORKING_HOURS.startHour * 60 + WORKING_HOURS.startMinute // 8:30 = 510
  const workEndMinutes = WORKING_HOURS.endHour * 60 + WORKING_HOURS.endMinute // 17:00 = 1020

  return startTotalMinutes >= workStartMinutes && endTotalMinutes <= workEndMinutes
}

/**
 * Checks if a booking date/time is in the past
 */
export function isPastDateTime(date: Date): boolean {
  const now = new Date()
  return date.getTime() < now.getTime() - 60000 // 1 minute grace margin
}

/**
 * Validates a complete booking request
 */
export function validateBooking(
  startTimeStr: string,
  endTimeStr: string
): { isValid: boolean; error?: string } {
  const start = new Date(startTimeStr)
  const end = new Date(endTimeStr)

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, error: 'Invalid date or time provided.' }
  }

  if (end <= start) {
    return { isValid: false, error: 'End time must be after start time.' }
  }

  if (isPastDateTime(start)) {
    return { isValid: false, error: 'Bookings cannot be created in the past.' }
  }

  if (isWeekend(start) || isWeekend(end)) {
    return { isValid: false, error: 'Bookings are only allowed Monday to Friday.' }
  }

  // Check same-day condition in Asia/Colombo
  const startDayStr = start.toLocaleDateString('en-US', { timeZone: 'Asia/Colombo' })
  const endDayStr = end.toLocaleDateString('en-US', { timeZone: 'Asia/Colombo' })
  if (startDayStr !== endDayStr) {
    return { isValid: false, error: 'Bookings must start and end on the same day.' }
  }

  if (!isWithinWorkingHours(start, end)) {
    return {
      isValid: false,
      error: 'Bookings must be within office hours (8:30 AM – 5:00 PM).',
    }
  }

  return { isValid: true }
}
