import { describe, expect, it } from 'vitest'
import {
  getAppointmentActionSuccessMessage,
  getAppointmentNextStatus,
  validateAppointmentTransition,
} from '../transitions.js'

describe('appointment transition rules', () => {
  it('allows valid transitions for supported actions', () => {
    expect(validateAppointmentTransition('update', 'pending')).toEqual({ allowed: true })
    expect(validateAppointmentTransition('update', 'confirmed')).toEqual({ allowed: true })
    expect(validateAppointmentTransition('cancel', 'pending')).toEqual({ allowed: true })
    expect(validateAppointmentTransition('cancel', 'confirmed')).toEqual({ allowed: true })
    expect(validateAppointmentTransition('confirm', 'pending')).toEqual({ allowed: true })
    expect(validateAppointmentTransition('start_service', 'confirmed')).toEqual({ allowed: true })
    expect(validateAppointmentTransition('complete_service', 'in_progress')).toEqual({ allowed: true })
    expect(validateAppointmentTransition('mark_no_show', 'confirmed')).toEqual({ allowed: true })
  })

  it('returns stable error payload for invalid statuses', () => {
    expect(validateAppointmentTransition('update', 'completed')).toEqual({
      allowed: false,
      code: 400,
      message: '当前状态不可修改',
    })
    expect(validateAppointmentTransition('cancel', 'completed')).toEqual({
      allowed: false,
      code: 400,
      message: '当前状态不可取消',
    })
    expect(validateAppointmentTransition('confirm', 'completed')).toEqual({
      allowed: false,
      code: 400,
      message: '只有待确认的预约可以确认',
    })
    expect(validateAppointmentTransition('start_service', 'pending')).toEqual({
      allowed: false,
      code: 400,
      message: '只有已确认的预约可以开始服务',
    })
    expect(validateAppointmentTransition('complete_service', 'confirmed')).toEqual({
      allowed: false,
      code: 400,
      message: '只有服务中的预约可以完成',
    })
    expect(validateAppointmentTransition('mark_no_show', 'completed')).toEqual({
      allowed: false,
      code: 400,
      message: '只有已确认的预约可以标记未到',
    })
  })

  it('exposes next status mapping', () => {
    expect(getAppointmentNextStatus('update')).toBe('pending')
    expect(getAppointmentNextStatus('cancel')).toBe('cancelled')
    expect(getAppointmentNextStatus('confirm')).toBe('confirmed')
    expect(getAppointmentNextStatus('start_service')).toBe('in_progress')
    expect(getAppointmentNextStatus('complete_service')).toBe('completed')
    expect(getAppointmentNextStatus('mark_no_show')).toBe('no_show')
  })

  it('exposes success messages used by controllers', () => {
    expect(getAppointmentActionSuccessMessage('update')).toBe('预约已修改')
    expect(getAppointmentActionSuccessMessage('cancel')).toBe('预约已取消')
    expect(getAppointmentActionSuccessMessage('confirm')).toBe('预约已确认')
    expect(getAppointmentActionSuccessMessage('start_service')).toBe('服务已开始')
    expect(getAppointmentActionSuccessMessage('complete_service')).toBe('服务完成，已记账')
    expect(getAppointmentActionSuccessMessage('mark_no_show')).toBe('已标记未到店')
  })
})
