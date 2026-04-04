import { Context } from 'koa'
import { TransactionModel } from '../models'
import { generateShortId } from '../../../shared/src/index'
import { formatDate } from '../../../shared/src/index'

/**
 * 创建交易记录
 */
export async function createTransaction(ctx: Context) {
  const {
    merchant_id, appointment_id, customer_id, customer_name,
    staff_id, total_amount, items, payment_method, note,
  } = ctx.request.body as any

  if (!merchant_id || !customer_name || !staff_id || !total_amount) {
    ctx.body = { code: 400, message: '缺少必填字段', data: null }
    return
  }

  try {
    const tx = await TransactionModel.create({
      transaction_id: generateShortId('TX'),
      merchant_id,
      appointment_id,
      customer_id,
      customer_name,
      staff_id,
      staff_name: ctx.request.body.staff_name || '',
      total_amount,
      items: items || [],
      payment_method: payment_method || 'wechat',
      source: ctx.request.body.source || 'mini_program',
      note,
      transaction_date: ctx.request.body.transaction_date || formatDate(new Date()),
    })

    ctx.body = { code: 0, message: '记账成功', data: { transaction_id: tx.transaction_id } }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}

/**
 * 获取交易列表
 */
export async function getTransactions(ctx: Context) {
  const { merchant_id, date, page = '1', pageSize = '20' } = ctx.query as any
  const user = ctx.state.user

  const query: Record<string, any> = {}
  if (merchant_id) query.merchant_id = merchant_id
  else if (user.merchant_id) query.merchant_id = user.merchant_id

  if (date) query.transaction_date = date

  const total = await TransactionModel.countDocuments(query)
  const list = await TransactionModel.find(query)
    .sort({ create_time: -1 })
    .skip((Number(page) - 1) * Number(pageSize))
    .limit(Number(pageSize))

  ctx.body = {
    code: 0,
    message: 'ok',
    data: { list, total, page: Number(page), pageSize: Number(pageSize) },
  }
}
