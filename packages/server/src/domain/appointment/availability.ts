const WEEK_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

export interface BusinessInterval {
  start: string
  end: string
}

export interface TimeSlot {
  start: string
  end: string
}

export interface AvailableTimeSlot extends TimeSlot {
  available: boolean
}

export interface TimelineStage {
  start: string
  end: string
  staff_busy: boolean
}

export interface ExistingAppointment {
  timeline?: TimelineStage[]
}

export interface ShanghaiNow {
  date: string
  minutes: number
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}

function isTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  return timeToMinutes(start1) < timeToMinutes(end2) && timeToMinutes(start2) < timeToMinutes(end1)
}

export function getBusinessIntervalsForDate(date: string, businessHours: any): BusinessInterval[] {
  const legacyIntervals =
    typeof businessHours?.start === 'string' && typeof businessHours?.end === 'string'
      ? [{ start: businessHours.start, end: businessHours.end }]
      : []

  if (!businessHours || typeof businessHours !== 'object') {
    return [{ start: '09:00', end: '21:00' }]
  }

  const day = new Date(date)
  if (Number.isNaN(day.getTime())) {
    return legacyIntervals.length > 0 ? legacyIntervals : [{ start: '09:00', end: '21:00' }]
  }

  const dayKey = WEEK_KEYS[day.getDay()]
  const dayConfig = businessHours[dayKey]
  if (!dayConfig || dayConfig.is_open === false) {
    return legacyIntervals
  }

  const intervals: BusinessInterval[] = []
  const slots = ['morning', 'afternoon', 'evening']
  for (const slotKey of slots) {
    const slot = dayConfig[slotKey]
    if (!slot || slot.is_open === false || !slot.open || !slot.close) continue
    if (timeToMinutes(slot.open) >= timeToMinutes(slot.close)) continue
    intervals.push({ start: slot.open, end: slot.close })
  }

  if (intervals.length > 0) {
    return intervals
  }

  return legacyIntervals
}

export function filterPastSlotsForDate(date: string, slots: TimeSlot[], now: ShanghaiNow): TimeSlot[] {
  if (date !== now.date) {
    return slots
  }
  return slots.filter((slot) => timeToMinutes(slot.start) > now.minutes)
}

export function markSlotsAvailability(
  slots: TimeSlot[],
  existingAppointments: ExistingAppointment[],
  serviceDuration: number,
): AvailableTimeSlot[] {
  return slots.map((slot) => {
    const newEndMinutes = timeToMinutes(slot.start) + serviceDuration
    const newEndTime = minutesToTime(newEndMinutes)

    let available = true
    for (const apt of existingAppointments) {
      for (const stage of apt.timeline || []) {
        if (!stage.staff_busy) continue
        if (isTimeOverlap(slot.start, newEndTime, stage.start, stage.end)) {
          available = false
          break
        }
      }
      if (!available) break
    }

    return { ...slot, available }
  })
}