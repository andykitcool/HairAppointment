import { Context } from 'koa'
import { UserModel } from '../models'

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
