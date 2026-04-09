import { describe, expect, it } from 'vitest'
import { validateCustomerAppointmentAccess, validateMerchantBinding } from '../access.js'

describe('appointment access rules', () => {
  it('allows non-customer roles to operate appointments', () => {
    expect(validateCustomerAppointmentAccess('owner', 'C001', 'U001')).toEqual({ allowed: true })
  })

  it('allows customer to operate own appointment only', () => {
    expect(validateCustomerAppointmentAccess('customer', 'U001', 'U001')).toEqual({ allowed: true })
    expect(validateCustomerAppointmentAccess('customer', 'U002', 'U001')).toEqual({
      allowed: false,
      code: 403,
      message: '无权操作',
    })
  })

  it('requires merchant binding for store-side roles when no merchant is specified', () => {
    expect(validateMerchantBinding('owner', undefined, undefined)).toEqual({
      allowed: false,
      code: 400,
      message: '当前账号未绑定门店',
    })
    expect(validateMerchantBinding('staff', undefined, 'M001')).toEqual({ allowed: true })
    expect(validateMerchantBinding('owner', 'M002', undefined)).toEqual({ allowed: true })
  })

  it('allows super admin and customer contexts without bound merchant', () => {
    expect(validateMerchantBinding('super_admin', undefined, undefined)).toEqual({ allowed: true })
    expect(validateMerchantBinding('customer', undefined, undefined)).toEqual({ allowed: true })
  })
})
