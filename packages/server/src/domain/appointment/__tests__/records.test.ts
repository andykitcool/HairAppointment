import { describe, expect, it } from 'vitest'
import { buildPendingAppointmentRecord, buildWalkInAppointmentRecord } from '../records.js'

describe('appointment record builders', () => {
  it('builds pending appointment payload for mini program flow', () => {
    const payload = buildPendingAppointmentRecord(
      {
        appointmentId: '20260409-001',
        merchantId: 'M001',
        staffId: 'S001',
        staffName: 'Tony',
        serviceId: 'SV001',
        serviceName: '剪发',
        date: '2026-04-09',
        startTime: '10:00',
        endTime: '10:30',
        timeline: [{ stage_name: '剪发' }],
        sequenceNumber: 1,
      },
      {
        customerId: 'U001',
        customerName: '张三',
        customerPhone: '13800000000',
      },
      '备注',
    )

    expect(payload).toEqual({
      appointment_id: '20260409-001',
      merchant_id: 'M001',
      customer_id: 'U001',
      customer_name: '张三',
      customer_phone: '13800000000',
      staff_id: 'S001',
      staff_name: 'Tony',
      service_id: 'SV001',
      service_name: '剪发',
      date: '2026-04-09',
      start_time: '10:00',
      end_time: '10:30',
      status: 'pending',
      source: 'mini_program',
      timeline: [{ stage_name: '剪发' }],
      note: '备注',
      sequence_num: 1,
    })
  })

  it('builds walk-in payload and applies default customer name', () => {
    const payload = buildWalkInAppointmentRecord(
      {
        appointmentId: '20260409-002',
        merchantId: 'M001',
        staffId: 'S002',
        staffName: 'Lily',
        serviceId: 'SV002',
        serviceName: '烫发',
        date: '2026-04-09',
        startTime: '11:00',
        endTime: '12:00',
        timeline: [{ stage_name: '烫发' }],
        sequenceNumber: 2,
      },
      {
        customerPhone: '13900000000',
      },
    )

    expect(payload.customer_name).toBe('散客')
    expect(payload.status).toBe('in_progress')
    expect(payload.source).toBe('coze')
    expect(payload.sequence_num).toBe(2)
  })

  it('keeps provided walk-in customer name when present', () => {
    const payload = buildWalkInAppointmentRecord(
      {
        appointmentId: '20260409-003',
        merchantId: 'M001',
        staffId: 'S003',
        staffName: 'Ann',
        serviceId: 'SV003',
        serviceName: '染发',
        date: '2026-04-09',
        startTime: '13:00',
        endTime: '14:00',
        timeline: [],
        sequenceNumber: 3,
      },
      {
        customerName: '王五',
      },
    )

    expect(payload.customer_name).toBe('王五')
  })
})
