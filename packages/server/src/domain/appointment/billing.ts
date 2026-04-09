export interface AppointmentForBilling {
  merchant_id: string
  appointment_id: string
  customer_id?: string
  customer_name?: string
  staff_id?: string
  staff_name?: string
  service_name: string
  date: string
}

export interface TransactionItem {
  service_name: string
  amount: number
  quantity: number
}

export interface CompleteServiceInput {
  total_amount?: number
  payment_method?: string
  items?: TransactionItem[]
  note?: string
}

export function resolveChargeAmount(totalAmount?: number): number {
  return totalAmount || 0
}

export function resolveTransactionItems(
  serviceName: string,
  totalAmount?: number,
  items?: TransactionItem[],
): TransactionItem[] {
  if (items && items.length > 0) {
    return items
  }
  return [{ service_name: serviceName, amount: resolveChargeAmount(totalAmount), quantity: 1 }]
}

export function buildCompleteServiceTransaction(
  transactionId: string,
  apt: AppointmentForBilling,
  input: CompleteServiceInput,
) {
  const chargeAmount = resolveChargeAmount(input.total_amount)
  return {
    transaction_id: transactionId,
    merchant_id: apt.merchant_id,
    appointment_id: apt.appointment_id,
    customer_id: apt.customer_id,
    customer_name: apt.customer_name,
    staff_id: apt.staff_id,
    staff_name: apt.staff_name,
    total_amount: chargeAmount,
    items: resolveTransactionItems(apt.service_name, input.total_amount, input.items),
    payment_method: input.payment_method || 'wechat',
    source: 'coze',
    note: input.note,
    transaction_date: apt.date,
  }
}

export function buildCustomerConsumptionUpdate(totalAmount?: number, now: Date = new Date()) {
  return {
    $inc: { visit_count: 1, total_spending: resolveChargeAmount(totalAmount) },
    $set: { last_visit_time: now },
  }
}
