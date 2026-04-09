import { describe, expect, it } from 'vitest'
import {
  buildCreateTransactionPayload,
  buildTransactionListQuery,
  buildUpdateTransactionPayload,
  validateCreateTransactionInput,
} from '../rules.js'

describe('transaction domain rules', () => {
  it('validates required fields and walk-in naming rules', () => {
    expect(validateCreateTransactionInput({})).toEqual({
      valid: false,
      code: 400,
      message: '缺少必填字段',
    })

    expect(
      validateCreateTransactionInput({
        merchant_id: 'M001',
        total_amount: 100,
        customer_source: 'walk_in',
      }),
    ).toEqual({
      valid: false,
      code: 400,
      message: '直接到店的顾客需要填写姓名',
    })

    expect(
      validateCreateTransactionInput({
        merchant_id: 'M001',
        total_amount: 100,
        customer_source: 'walk_in',
        customer_name: '张三',
      }),
    ).toEqual({ valid: true })
  })

  it('builds create payload with defaults', () => {
    const payload = buildCreateTransactionPayload(
      'TX001',
      {
        merchant_id: 'M001',
        total_amount: 99,
      },
      {
        staff_id: 'S001',
        staff_name: 'Tony',
      },
      '2026-04-09',
    )

    expect(payload).toEqual({
      transaction_id: 'TX001',
      merchant_id: 'M001',
      appointment_id: undefined,
      customer_id: undefined,
      customer_name: undefined,
      customer_source: 'walk_in',
      staff_id: 'S001',
      staff_name: 'Tony',
      total_amount: 99,
      items: [],
      payment_method: 'wechat',
      source: 'mini_program',
      note: undefined,
      transaction_date: '2026-04-09',
    })
  })

  it('builds update payload with fallback to existing values', () => {
    const payload = buildUpdateTransactionPayload(
      {
        customer_name: '旧名字',
        total_amount: 50,
        items: [{ service_name: '洗发', amount: 50, quantity: 1 }],
        payment_method: 'wechat',
        note: '旧备注',
        transaction_date: '2026-04-08',
      },
      {
        total_amount: 88,
      },
      {
        staff_id: 'S002',
        staff_name: 'Lily',
      },
    )

    expect(payload).toEqual({
      customer_name: '旧名字',
      total_amount: 88,
      items: [{ service_name: '洗发', amount: 50, quantity: 1 }],
      payment_method: 'wechat',
      note: '旧备注',
      transaction_date: '2026-04-08',
      staff_id: 'S002',
      staff_name: 'Lily',
    })
  })

  it('builds transaction list query from params and user scope', () => {
    expect(buildTransactionListQuery({ merchant_id: 'M001', date: '2026-04-09' }, 'M999')).toEqual({
      merchant_id: 'M001',
      transaction_date: '2026-04-09',
    })

    expect(buildTransactionListQuery({ transaction_date: '2026-04-10' }, 'M002')).toEqual({
      merchant_id: 'M002',
      transaction_date: '2026-04-10',
    })
  })
})
