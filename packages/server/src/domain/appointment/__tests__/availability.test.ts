import { describe, expect, it } from 'vitest'
import { filterPastSlotsForDate, getBusinessIntervalsForDate, markSlotsAvailability } from '../availability.js'

describe('appointment availability rules', () => {
  it('returns default business interval when config is missing', () => {
    expect(getBusinessIntervalsForDate('2026-04-06', null)).toEqual([
      { start: '09:00', end: '21:00' },
    ])
  })

  it('returns no intervals for closed day in weekly config', () => {
    const businessHours = {
      monday: { is_open: false },
    }

    expect(getBusinessIntervalsForDate('2026-04-06', businessHours)).toEqual([])
  })

  it('expands morning afternoon evening intervals from weekly config', () => {
    const businessHours = {
      monday: {
        is_open: true,
        morning: { is_open: true, open: '09:00', close: '12:00' },
        afternoon: { is_open: true, open: '13:00', close: '18:00' },
        evening: { is_open: false, open: '', close: '' },
      },
    }

    expect(getBusinessIntervalsForDate('2026-04-06', businessHours)).toEqual([
      { start: '09:00', end: '12:00' },
      { start: '13:00', end: '18:00' },
    ])
  })

  it('falls back to legacy start end structure', () => {
    const businessHours = {
      start: '10:00',
      end: '20:00',
    }

    expect(getBusinessIntervalsForDate('2026-04-06', businessHours)).toEqual([
      { start: '10:00', end: '20:00' },
    ])
  })

  it('skips invalid intervals where open time is not earlier than close time', () => {
    const businessHours = {
      monday: {
        is_open: true,
        morning: { is_open: true, open: '12:00', close: '12:00' },
        afternoon: { is_open: true, open: '14:00', close: '18:00' },
      },
    }

    expect(getBusinessIntervalsForDate('2026-04-06', businessHours)).toEqual([
      { start: '14:00', end: '18:00' },
    ])
  })

  it('filters out past slots only for current Shanghai date', () => {
    const slots = [
      { start: '09:00', end: '09:30' },
      { start: '10:00', end: '10:30' },
      { start: '11:00', end: '11:30' },
    ]

    expect(
      filterPastSlotsForDate('2026-04-06', slots, { date: '2026-04-06', minutes: 600 }),
    ).toEqual([
      { start: '11:00', end: '11:30' },
    ])

    expect(
      filterPastSlotsForDate('2026-04-07', slots, { date: '2026-04-06', minutes: 600 }),
    ).toEqual(slots)
  })

  it('marks slots unavailable when overlap with busy appointment stages', () => {
    const slots = [
      { start: '10:00', end: '10:30' },
      { start: '10:30', end: '11:00' },
      { start: '11:30', end: '12:00' },
    ]

    const existingAppointments = [
      {
        timeline: [
          { start: '10:40', end: '11:10', staff_busy: true },
          { start: '11:10', end: '11:30', staff_busy: false },
        ],
      },
    ]

    expect(markSlotsAvailability(slots, existingAppointments, 30)).toEqual([
      { start: '10:00', end: '10:30', available: true },
      { start: '10:30', end: '11:00', available: false },
      { start: '11:30', end: '12:00', available: true },
    ])

    expect(markSlotsAvailability([{ start: '10:00', end: '10:30' }], existingAppointments, 60)).toEqual([
      { start: '10:00', end: '10:30', available: false },
    ])
  })
})