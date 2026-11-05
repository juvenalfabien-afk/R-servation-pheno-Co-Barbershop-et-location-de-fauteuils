export interface CalendarDay {
  n: number
  cls: string
  ds: string
}

function pad(value: number) {
  return value < 10 ? `0${value}` : String(value)
}

export function buildRdvCalendarDays(input: {
  year: number
  month: number
  selectedDate: string | null
  openDays: number[]
  closedDates: string[]
  now?: Date
}): CalendarDay[] {
  const now = input.now ?? new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const first = new Date(input.year, input.month, 1).getDay()
  const offset = (first + 6) % 7
  const daysInMonth = new Date(input.year, input.month + 1, 0).getDate()
  const days: CalendarDay[] = []

  for (let empty = 0; empty < offset; empty += 1) {
    days.push({ n: 0, cls: 'rdv-cd off', ds: '' })
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    const current = new Date(input.year, input.month, day)
    const date = `${input.year}-${pad(input.month + 1)}-${pad(day)}`
    const unavailable = current < today
      || !input.openDays.includes(current.getDay())
      || input.closedDates.includes(date)
    let cls = 'rdv-cd'
    if (unavailable) cls += ' off'
    else if (input.selectedDate === date) cls += ' csel'
    else cls += ' avail'
    days.push({ n: day, cls, ds: date })
  }
  return days
}

function toMinutes(slot: string) {
  const [hours, minutes] = slot.split(':').map(Number)
  return hours * 60 + minutes
}

export function overlapsBookedSlot(
  slot: string,
  duration: number,
  bookings: Array<{ slot: string; duration: number }>,
) {
  const start = toMinutes(slot)
  const end = start + Math.max(duration, 30)
  return bookings.some(booking => {
    const bookedStart = toMinutes(booking.slot)
    const bookedEnd = bookedStart + Math.max(booking.duration, 30)
    return start < bookedEnd && end > bookedStart
  })
}
