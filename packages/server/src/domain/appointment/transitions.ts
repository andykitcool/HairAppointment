export type AppointmentAction = 'update' | 'cancel' | 'confirm' | 'start_service' | 'complete_service' | 'mark_no_show'

export interface AppointmentTransitionRule {
  allowedStatuses: string[]
  nextStatus: string
  invalidMessage: string
  successMessage: string
}

export interface AppointmentTransitionCheckResult {
  allowed: boolean
  code?: number
  message?: string
}

const TRANSITION_RULES: Record<AppointmentAction, AppointmentTransitionRule> = {
  update: {
    allowedStatuses: ['pending', 'confirmed'],
    nextStatus: 'pending',
    invalidMessage: '当前状态不可修改',
    successMessage: '预约已修改',
  },
  cancel: {
    allowedStatuses: ['pending', 'confirmed'],
    nextStatus: 'cancelled',
    invalidMessage: '当前状态不可取消',
    successMessage: '预约已取消',
  },
  confirm: {
    allowedStatuses: ['pending'],
    nextStatus: 'confirmed',
    invalidMessage: '只有待确认的预约可以确认',
    successMessage: '预约已确认',
  },
  start_service: {
    allowedStatuses: ['confirmed'],
    nextStatus: 'in_progress',
    invalidMessage: '只有已确认的预约可以开始服务',
    successMessage: '服务已开始',
  },
  complete_service: {
    allowedStatuses: ['in_progress'],
    nextStatus: 'completed',
    invalidMessage: '只有服务中的预约可以完成',
    successMessage: '服务完成，已记账',
  },
  mark_no_show: {
    allowedStatuses: ['confirmed'],
    nextStatus: 'no_show',
    invalidMessage: '只有已确认的预约可以标记未到',
    successMessage: '已标记未到店',
  },
}

export function validateAppointmentTransition(action: AppointmentAction, currentStatus: string): AppointmentTransitionCheckResult {
  const rule = TRANSITION_RULES[action]
  if (!rule.allowedStatuses.includes(currentStatus)) {
    return { allowed: false, code: 400, message: rule.invalidMessage }
  }
  return { allowed: true }
}

export function getAppointmentNextStatus(action: AppointmentAction): string {
  return TRANSITION_RULES[action].nextStatus
}

export function getAppointmentActionSuccessMessage(action: AppointmentAction): string {
  return TRANSITION_RULES[action].successMessage
}
