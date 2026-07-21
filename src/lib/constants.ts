export const COMPANY_DOMAIN = 'cba.lk'

export const TIME_ZONE = 'Asia/Colombo' // Sri Lanka Time Zone

export const WORKING_HOURS = {
  start: '08:30:00',
  end: '17:00:00',
  startHour: 8,
  startMinute: 30,
  endHour: 17,
  endMinute: 0,
}

// 1 = Mon, 5 = Fri
export const WORKING_DAYS = [1, 2, 3, 4, 5]

export const DEFAULT_ROOM_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  'Executive Meeting Room': {
    bg: '#6F1258',
    border: '#530D42',
    text: '#FFFFFF',
  },
  'Meeting Room': {
    bg: '#313773',
    border: '#232857',
    text: '#FFFFFF',
  },
  default: {
    bg: '#FF6C0E',
    border: '#D95806',
    text: '#FFFFFF',
  },
}
