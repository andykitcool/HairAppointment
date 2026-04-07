import { Context } from 'koa'
import { UserModel } from '../models/index.js'

/**
 * 获取顾客列表
 */
export async function getCustomers(ctx: Context) {
  const { merchant_id, page = '1', pageSize = '20', keyword } = ctx.query as any
  const user = ctx.state.user
  const mid = merchant_id || user.merchant_id

  const query: Record<string, any> = { role: 'customer' }
  if (keyword) {
    query.$or = [
      { nickname: { $regex: keyword, $options: 'i' } },
      { phone: { $regex: keyword } },
      { real_name: { $regex: keyword, $options: 'i' } },
    ]
  }

  const total = await UserModel.countDocuments(query)
  const list = await UserModel.find(query)
    .select('-openid -union_id')
    .sort({ last_visit_time: -1 })
    .skip((Number(page) - 1) * Number(pageSize))
    .limit(Number(pageSize))

  ctx.body = {
    code: 0,
    message: 'ok',
    data: { list, total, page: Number(page), pageSize: Number(pageSize) },
  }
}

/**
 * 更新店家备注
 */
export async function updateMerchantNote(ctx: Context) {
  const { id } = ctx.params
  const { merchant_note } = ctx.request.body as { merchant_note: string }

  await UserModel.findByIdAndUpdate(id, { merchant_note })
  ctx.body = { code: 0, message: '更新成功', data: null }
}

/**
 * 更新顾客资料
 */
export async function updateCustomer(ctx: Context) {
  const { id } = ctx.params
  const body = (ctx.request.body as any) || {}
  const updateData = {
    nickname: body.nickname ?? '',
    real_name: body.real_name ?? '',
    phone: body.phone ?? '',
    gender: body.gender ?? 'unknown',
    age: Number(body.age ?? 0),
    birthday: body.birthday ?? '',
    points: Number(body.points ?? 0),
    membership_level: body.membership_level ?? 'normal',
    punch_card_remaining: Number(body.punch_card_remaining ?? 0),
    stored_value_balance: Number(body.stored_value_balance ?? 0),
    customer_note: body.customer_note ?? '',
    merchant_note: body.merchant_note ?? '',
  }

  const updated = await UserModel.updateOne({ _id: id, role: 'customer' }, updateData)
  if (!updated.matchedCount) {
    ctx.body = { code: 404, message: '顾客不存在', data: null }
    return
  }

  ctx.body = { code: 0, message: '更新成功', data: null }
}

/**
 * 删除顾客
 */
export async function deleteCustomer(ctx: Context) {
  const { id } = ctx.params

  const deleted = await UserModel.deleteOne({ _id: id, role: 'customer' })
  if (!deleted.deletedCount) {
    ctx.body = { code: 404, message: '顾客不存在', data: null }
    return
  }

  ctx.body = { code: 0, message: '删除成功', data: null }
}
