export interface AccessCheckResult {
  allowed: boolean
  code?: number
  message?: string
}

export function validateCustomerAppointmentAccess(
  role: string | undefined,
  appointmentCustomerId: string | undefined,
  operatorUserId: string | undefined,
): AccessCheckResult {
  if (role !== 'customer') {
    return { allowed: true }
  }

  if (appointmentCustomerId && operatorUserId && appointmentCustomerId === operatorUserId) {
    return { allowed: true }
  }

  return { allowed: false, code: 403, message: '无权操作' }
}

export function validateMerchantBinding(
  role: string | undefined,
  explicitMerchantId: string | undefined,
  boundMerchantId: string | undefined,
): AccessCheckResult {
  if (explicitMerchantId || boundMerchantId) {
    return { allowed: true }
  }

  if (role === 'super_admin') {
    return { allowed: true }
  }

  if (['owner', 'merchant_admin', 'admin', 'staff'].includes(role || '')) {
    return { allowed: false, code: 400, message: '当前账号未绑定门店' }
  }

  return { allowed: true }
}
