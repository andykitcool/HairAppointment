import { describe, expect, it } from 'vitest'
import {
  buildCompleteServiceTransaction,
  buildCustomerConsumptionUpdate,
  resolveChargeAmount,
  resolveTransactionItems,
} from '../billing.js'

describe('appointment billing rules', () => {
  it('uses zero as default amount', () => {
    expect(resolveChargeAmount(undefined)).toBe(0)
    expect(resolveChargeAmount(0)).toBe(0)
    expect(resolveChargeAmount(128)).toBe(128)
  })

  it('falls back to single service item when items are missing', () => {
    expect(resolveTransactionItems('剪发', 88, undefined)).toEqual([
      { service_name: '剪发', amount: 88, quantity: 1 },
    ])
    expect(resolveTransactionItems('剪发', 88, [])).toEqual([
      { service_name: '剪发', amount: 88, quantity: 1 },
    ])
  })

  it('keeps provided items and payment method when present', () => {
    const tx = buildCompleteServiceTransaction(
      'TX-001',
      {
        merchant_id: 'M001',
        appointment_id: 'A001',
        customer_id: 'C001',
        customer_name: '张三',
        staff_id: 'S001',
        staff_name: '小王',
        service_name: '烫发',
        date: '2026-04-09',
      },
      {
        total_amount: 268,
        payment_method: 'cash',
        items: [{ service_name: '烫发', amount: 268, quantity: 1 }],
        note: '老客优惠',
      },
    )

    expect(tx).toEqual({
      transaction_id: 'TX-001',
      merchant_id: 'M001',
      appointment_id: 'A001',
      customer_id: 'C001',
      customer_name: '张三',
      staff_id: 'S001',
      staff_name: '小王',
      total_amount: 268,
      items: [{ service_name: '烫发', amount: 268, quantity: 1 }],
      payment_method: 'cash',
      source: 'coze',
      note: '老客优惠',
      transaction_date: '2026-04-09',
    })
  })

  it('uses defaults for missing payment and items', () => {
    const tx = buildCompleteServiceTransaction(
      'TX-002',
      {
        merchant_id: 'M002',
        appointment_id: 'A002',
        customer_name: '李四',
        service_name: '洗剪吹',
        date: '2026-04-10',
      },
      {
        total_amount: undefined,
      },
    )

    expect(tx.payment_method).toBe('wechat')
    expect(tx.total_amount).toBe(0)
    expect(tx.items).toEqual([{ service_name: '洗剪吹', amount: 0, quantity: 1 }])
  })

  it('builds customer consumption update with deterministic timestamp', () => {
    const now = new Date('2026-04-09T12:00:00.000Z')
    expect(buildCustomerConsumptionUpdate(99, now)).toEqual({
      $inc: { visit_count: 1, total_spending: 99 },
      $set: { last_visit_time: now },
    })
  })
})
