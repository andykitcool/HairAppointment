import { Context } from 'koa'
import { AdminModel, MerchantModel, TransactionModel } from '../models/index.js'
import { generateShortId } from '../../../shared/dist/index.js'
import { formatDate } from '../../../shared/dist/index.js'
import {
  buildCreateTransactionPayload,
  buildTransactionListQuery,
  buildUpdateTransactionPayload,
  validateCreateTransactionInput,
} from '../domain/transaction/rules.js'

async function resolveOwnerRealName(ownerId?: string, fallbackName?: string) {
  if (!ownerId) return fallbackName || '店长'
  const ownerAdmin = await AdminModel.findById(ownerId).lean()
  return ownerAdmin?.real_name || fallbackName || '店长'
}

async function resolveTransactionStaffInfo(merchant_id: string, staff_id?: string, staff_name?: string) {
  const merchant = await MerchantModel.findOne({ merchant_id }).lean()
  const defaultStaffId = merchant?.owner_id || `${merchant_id}_owner`
  const ownerName = await resolveOwnerRealName(merchant?.owner_id, merchant?.name)

  return {
    staff_id: staff_id || defaultStaffId,
    staff_name: staff_name || ownerName,
  }
}

/**
 * 创建交易记录
 */
export async function createTransaction(ctx: Context) {
  const body = (ctx.request.body as any) || {}
  const validation = validateCreateTransactionInput(body)
  if (!validation.valid) {
    ctx.body = { code: validation.code, message: validation.message, data: null }
    return
  }

  try {
    const resolvedStaff = await resolveTransactionStaffInfo(body.merchant_id, body.staff_id, body.staff_name)
    const tx = await TransactionModel.create(
      buildCreateTransactionPayload(generateShortId('TX'), body, resolvedStaff, formatDate(new Date())),
    )

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
  const { merchant_id, date, transaction_date, page = '1', pageSize = '20' } = ctx.query as any
  const user = ctx.state.user

  const query = buildTransactionListQuery({ merchant_id, date, transaction_date }, user.merchant_id)

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

/**
 * 获取交易详情
 */
export async function getTransactionDetail(ctx: Context) {
  const { id } = ctx.params
  const tx = await TransactionModel.findOne({ transaction_id: id })

  if (!tx) {
    ctx.body = { code: 404, message: '交易不存在', data: null }
    return
  }

  ctx.body = { code: 0, message: 'ok', data: tx }
}

/**
 * 更新交易
 */
export async function updateTransaction(ctx: Context) {
  const { id } = ctx.params
  const body = (ctx.request.body as any) || {}
  const existing = await TransactionModel.findOne({ transaction_id: id })

  if (!existing) {
    ctx.body = { code: 404, message: '交易不存在', data: null }
    return
  }

  const resolvedStaff = await resolveTransactionStaffInfo(
    existing.merchant_id,
    body.staff_id || existing.staff_id,
    body.staff_name || existing.staff_name,
  )

  const updateData = buildUpdateTransactionPayload(existing, body, resolvedStaff)

  await TransactionModel.updateOne({ transaction_id: id }, updateData)
  ctx.body = { code: 0, message: '更新成功', data: null }
}

/**
 * 删除交易
 */
export async function deleteTransaction(ctx: Context) {
  const { id } = ctx.params
  const deleted = await TransactionModel.deleteOne({ transaction_id: id })

  if (!deleted.deletedCount) {
    ctx.body = { code: 404, message: '交易不存在', data: null }
    return
  }

  ctx.body = { code: 0, message: '删除成功', data: null }
}
