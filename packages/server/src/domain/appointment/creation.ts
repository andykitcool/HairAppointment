export interface TimelineStageLike {
  start: string
  end: string
  staff_busy: boolean
}

export interface ExistingAppointmentLike {
  appointment_id: string
  timeline?: TimelineStageLike[]
}

export interface CustomerInput {
  customer_id?: string
  customer_name?: string
  customer_phone?: string
}

export interface FallbackUserInput {
  userId?: string
  nickname?: string
  phone?: string
}

export interface ResolvedCustomerInfo {
  customerId?: string
  customerName: string
  customerPhone?: string
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

function isTimeOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
  return timeToMinutes(start1) < timeToMinutes(end2) && timeToMinutes(start2) < timeToMinutes(end1)
}

function getBusyRanges(timeline: TimelineStageLike[]): TimelineStageLike[] {
  return timeline.filter((stage) => stage.staff_busy)
}

export function findConflictingAppointmentId(
  timeline: TimelineStageLike[],
  existingAppointments: ExistingAppointmentLike[],
): string | null {
  const busyRanges = getBusyRanges(timeline)
  for (const busy of busyRanges) {
    for (const apt of existingAppointments) {
      for (const stage of apt.timeline || []) {
        if (!stage.staff_busy) continue
        if (isTimeOverlap(busy.start, busy.end, stage.start, stage.end)) {
          return apt.appointment_id
        }
      }
    }
  }

  return null
}

export function formatAppointmentId(date: string, sequenceNumber: number): string {
  const prefix = date.replace(/-/g, '')
  return `${prefix}-${String(sequenceNumber).padStart(3, '0')}`
}

export function resolveAppointmentCustomer(input: CustomerInput, fallbackUser?: FallbackUserInput): ResolvedCustomerInfo {
  if (input.customer_name) {
    return {
      customerId: input.customer_id,
      customerName: input.customer_name,
      customerPhone: input.customer_phone,
    }
  }

  if (fallbackUser?.userId) {
    return {
      customerId: fallbackUser.userId,
      customerName: fallbackUser.nickname || '顾客',
      customerPhone: fallbackUser.phone,
    }
  }

  return {
    customerId: input.customer_id,
    customerName: '顾客',
    customerPhone: input.customer_phone,
  }
}
