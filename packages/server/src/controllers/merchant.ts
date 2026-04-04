import { Context } from 'koa'
import { MerchantModel, ShopClosedPeriodModel } from '../models'
import { AppointmentModel } from '../models'
import { AppointmentStatus } from '../../../shared/src/index'

/**
 * 获取商户信息
 */
export async function getMerchant(ctx: Context) {
  const { id } = ctx.params
  const merchant = await MerchantModel.findOne({ merchant_id: id })

  if (!merchant) {
    ctx.body = { code: 404, message: '商户不存在', data: null }
    return
  }

  ctx.body = { code: 0, message: 'ok', data: merchant }
}

/**
 * 更新商户信息
 */
export async function updateMerchant(ctx: Context) {
  const { id } = ctx.params
  const body = ctx.request.body as any

  await MerchantModel.updateOne({ merchant_id: id }, body)
  ctx.body = { code: 0, message: '更新成功', data: null }
}

/**
 * 创建打烊时段
 */
export async function createClosedPeriod(ctx: Context) {
  const { id } = ctx.params
  const { date, type, start_time, end_time, reason, cancel_appointments, notify_customers } = ctx.request.body as any
  const userId = ctx.state.user._id

  if (!date || !type) {
    ctx.body = { code: 400, message: '缺少必填字段', data: null }
    return
  }

  const period = await ShopClosedPeriodModel.create({
    merchant_id: id,
    date,
    type,
    start_time,
    end_time,
    reason,
    cancel_appointments: cancel_appointments || false,
    notify_customers: notify_customers || false,
    created_by: userId.toString(),
  })

  // 如果需要自动取消预约
  if (cancel_appointments) {
    const query: Record<string, any> = {
      merchant_id: id,
      date,
      status: { $in: ['pending', 'confirmed'] },
    }
    if (type === 'time_range' && start_time && end_time) {
      query.start_time = { $gte: start_time, $lt: end_time }
    }
    await AppointmentModel.updateMany(query, { status: 'cancelled' })

    // TODO: 发送取消通知
  }

  ctx.body = { code: 0, message: '设置成功', data: { _id: period._id } }
}

/**
 * 获取打烊时段列表
 */
export async function getClosedPeriods(ctx: Context) {
  const { id } = ctx.params
  const { start_date, end_date } = ctx.query as any

  const query: Record<string, any> = { merchant_id: id }
  if (start_date) query.date = { ...query.date, $gte: start_date }
  if (end_date) query.date = { ...query.date, $lte: end_date }

  const list = await ShopClosedPeriodModel.find(query).sort({ date: 1 })
  ctx.body = { code: 0, message: 'ok', data: list }
}

/**
 * 删除打烊时段
 */
export async function deleteClosedPeriod(ctx: Context) {
  const { id, periodId } = ctx.params
  await ShopClosedPeriodModel.findByIdAndDelete(periodId)
  ctx.body = { code: 0, message: '已取消打烊', data: null }
}

/**
 * 设置延长营业时间
 */
export async function setExtendedHours(ctx: Context) {
  const { id } = ctx.params
  const { start_date, end_date, extended_end } = ctx.request.body as any

  if (!start_date || !end_date || !extended_end) {
    ctx.body = { code: 400, message: '缺少必填字段', data: null }
    return
  }

  await MerchantModel.updateOne(
    { merchant_id: id },
    { $push: { extended_hours: { start_date, end_date, extended_end } } },
  )

  ctx.body = { code: 0, message: '设置成功', data: null }
}

/**
 * 修改延长营业配置
 */
export async function updateExtendedHours(ctx: Context) {
  const { id, index } = ctx.params
  const body = ctx.request.body as any
  const idx = Number(index)

  const merchant = await MerchantModel.findOne({ merchant_id: id })
  if (!merchant?.extended_hours || !merchant.extended_hours[idx]) {
    ctx.body = { code: 404, message: '配置不存在', data: null }
    return
  }

  const key = `extended_hours.${idx}`
  await MerchantModel.updateOne(
    { merchant_id: id },
    { $set: { [`${key}.start_date`]: body.start_date || merchant.extended_hours[idx].start_date,
              [`${key}.end_date`]: body.end_date || merchant.extended_hours[idx].end_date,
              [`${key}.extended_end`]: body.extended_end || merchant.extended_hours[idx].extended_end } },
  )

  ctx.body = { code: 0, message: '更新成功', data: null }
}

/**
 * 取消延长营业
 */
export async function deleteExtendedHours(ctx: Context) {
  const { id, index } = ctx.params
  const idx = Number(index)

  await MerchantModel.updateOne(
    { merchant_id: id },
    { $pull: { extended_hours: { $exists: true } } },
  )
  // 使用数组位置删除
  const merchant = await MerchantModel.findOne({ merchant_id: id })
  if (merchant?.extended_hours) {
    merchant.extended_hours.splice(idx, 1)
    await merchant.save()
  }

  ctx.body = { code: 0, message: '已取消延长营业', data: null }
}
