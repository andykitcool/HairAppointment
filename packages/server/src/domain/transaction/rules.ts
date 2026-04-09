export interface RuleResult {
  valid: boolean
  code?: number
  message?: string
}

export interface CreateTransactionInput {
  merchant_id?: string
  appointment_id?: string
  customer_id?: string
  customer_name?: string
  customer_source?: string
  staff_id?: string
  staff_name?: string
  total_amount?: number
  items?: any[]
  payment_method?: string
  note?: string
  source?: string
  transaction_date?: string
}

export interface ResolvedStaffInfo {
  staff_id: string
  staff_name: string
}

export function validateCreateTransactionInput(input: CreateTransactionInput): RuleResult {
  if (!input.merchant_id || !input.total_amount) {
    return { valid: false, code: 400, message: '缺少必填字段' }
  }

  if (input.customer_source === 'walk_in' && !input.customer_name) {
    return { valid: false, code: 400, message: '直接到店的顾客需要填写姓名' }
  }

  return { valid: true }
}

export function resolveTransactionSource(source?: string): string {
  return source || 'mini_program'
}

export function resolveCustomerSource(customerSource?: string): string {
  return customerSource || 'walk_in'
}

export function resolveTransactionDate(transactionDate: string | undefined, fallbackDate: string): string {
  return transactionDate || fallbackDate
}

export function buildCreateTransactionPayload(
  transactionId: string,
  input: CreateTransactionInput,
  resolvedStaff: ResolvedStaffInfo,
  fallbackDate: string,
) {
  return {
    transaction_id: transactionId,
    merchant_id: input.merchant_id,
    appointment_id: input.appointment_id,
    customer_id: input.customer_id,
    customer_name: input.customer_name,
    customer_source: resolveCustomerSource(input.customer_source),
    staff_id: resolvedStaff.staff_id,
    staff_name: resolvedStaff.staff_name,
    total_amount: input.total_amount,
    items: input.items || [],
    payment_method: input.payment_method || 'wechat',
    source: resolveTransactionSource(input.source),
    note: input.note,
    transaction_date: resolveTransactionDate(input.transaction_date, fallbackDate),
  }
}

export function buildUpdateTransactionPayload(existing: any, body: any, resolvedStaff: ResolvedStaffInfo) {
  return {
    customer_name: body.customer_name ?? existing.customer_name,
    total_amount: body.total_amount ?? existing.total_amount,
    items: body.items ?? existing.items,
    payment_method: body.payment_method ?? existing.payment_method,
    note: body.note ?? existing.note,
    transaction_date: body.transaction_date ?? existing.transaction_date,
    staff_id: resolvedStaff.staff_id,
    staff_name: resolvedStaff.staff_name,
  }
}

export function buildTransactionListQuery(
  params: { merchant_id?: string; date?: string; transaction_date?: string },
  userMerchantId?: string,
) {
  const query: Record<string, any> = {}
  if (params.merchant_id) query.merchant_id = params.merchant_id
  else if (userMerchantId) query.merchant_id = userMerchantId

  if (params.transaction_date || params.date) query.transaction_date = params.transaction_date || params.date

  return query
}
