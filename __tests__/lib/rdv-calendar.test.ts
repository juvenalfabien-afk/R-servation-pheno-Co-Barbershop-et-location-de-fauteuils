import { describe, expect, it } from 'vitest'
import { buildRdvCalendarDays, overlapsBookedSlot } from '@/lib/rdv-calendar'

describe('RDV calendar rules', () => {
  it('désactive les dates passées, fermées et hors jours ouvrés', () => {
    const days = buildRdvCalendarDays({
      year: 2026, month: 10, selectedDate: '2026-11-06', openDays: [2, 3, 4, 5, 6],
      closedDates: ['2026-11-07'], now: new Date(2026, 10, 5, 12),
    })
    const byDate = (date: string) => days.find(day => day.ds === date)?.cls
    expect(byDate('2026-11-04')).toContain('off')
    expect(byDate('2026-11-06')).toContain('csel')
    expect(byDate('2026-11-07')).toContain('off')
    expect(byDate('2026-11-08')).toContain('off')
  })

  it('détecte les chevauchements en tenant compte de la durée minimale', () => {
    const bookings = [{ slot: '10:30', duration: 45 }]
    expect(overlapsBookedSlot('10:00', 35, bookings)).toBe(true)
    expect(overlapsBookedSlot('11:00', 30, bookings)).toBe(true)
    expect(overlapsBookedSlot('11:30', 30, bookings)).toBe(false)
  })
})
