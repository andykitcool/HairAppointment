import { describe, expect, it } from 'vitest'
import { findConflictingAppointmentId, formatAppointmentId, resolveAppointmentCustomer } from '../creation.js'

describe('appointment creation rules', () => {
  it('finds conflicting appointment based on busy stages only', () => {
    const conflictId = findConflictingAppointmentId(
      [
        { start: '10:00', end: '10:20', staff_busy: false },
        { start: '10:20', end: '11:00', staff_busy: true },
      ],
      [
        {
          appointment_id: 'A001',
          timeline: [
            { start: '09:00', end: '10:00', staff_busy: true },
            { start: '10:30', end: '11:10', staff_busy: true },
          ],
        },
      ],
    )

    expect(conflictId).toBe('A001')
  })

  it('returns null when no busy-stage conflict exists', () => {
    expect(
      findConflictingAppointmentId(
        [{ start: '10:00', end: '10:30', staff_busy: true }],
        [{ appointment_id: 'A002', timeline: [{ start: '10:30', end: '11:00', staff_busy: true }] }],
      ),
    ).toBeNull()
  })

  it('formats appointment id with zero-padded sequence', () => {
    expect(formatAppointmentId('2026-04-09', 1)).toBe('20260409-001')
    expect(formatAppointmentId('2026-04-09', 27)).toBe('20260409-027')
  })

  it('prefers explicit customer input over fallback user', () => {
    expect(
      resolveAppointmentCustomer(
        { customer_id: 'C001', customer_name: '张三', customer_phone: '13800000000' },
        { userId: 'U001', nickname: '默认昵称', phone: '13900000000' },
      ),
    ).toEqual({
      customerId: 'C001',
      customerName: '张三',
      customerPhone: '13800000000',
    })
  })

  it('falls back to current user when explicit customer name is missing', () => {
    expect(resolveAppointmentCustomer({}, { userId: 'U001', nickname: '小明', phone: '13900000000' })).toEqual({
      customerId: 'U001',
      customerName: '小明',
      customerPhone: '13900000000',
    })
  })

  it('uses generic customer defaults when no explicit or fallback user data exists', () => {
    expect(resolveAppointmentCustomer({ customer_phone: '13700000000' })).toEqual({
      customerId: undefined,
      customerName: '顾客',
      customerPhone: '13700000000',
    })
  })
})
