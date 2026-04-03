import { Context } from 'koa'
import { ServiceModel } from '../models'
import { generateShortId, PRESET_SERVICES } from '@hair/shared'

/**
 * 获取服务列表
 */
export async function getServices(ctx: Context) {
  const { merchant_id } = ctx.query as any
  if (!merchant_id) {
    ctx.body = { code: 400, message: '缺少 merchant_id', data: null }
    return
  }

  const list = await ServiceModel.find({ merchant_id, is_active: true }).sort({ sort_order: 1 })
  ctx.body = { code: 0, message: 'ok', data: list }
}

/**
 * 创建服务
 */
export async function createService(ctx: Context) {
  const { merchant_id, name, category, price, total_duration, staff_busy_duration, stages, description } = ctx.request.body as any

  if (!merchant_id || !name || !category || !price) {
    ctx.body = { code: 400, message: '缺少必填字段', data: null }
    return
  }

  try {
    const count = await ServiceModel.countDocuments({ merchant_id })
    const service = await ServiceModel.create({
      service_id: generateShortId('S'),
      merchant_id,
      name,
      category,
      price,
      total_duration: total_duration || 30,
      staff_busy_duration: staff_busy_duration || total_duration || 30,
      stages: stages || [{ name: name, duration: total_duration || 30, staff_busy: true }],
      description,
      is_active: true,
      sort_order: count,
    })

    ctx.body = { code: 0, message: '创建成功', data: { service_id: service.service_id } }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}

/**
 * 更新服务
 */
export async function updateService(ctx: Context) {
  const { id } = ctx.params
  const body = ctx.request.body as any

  await ServiceModel.updateOne({ service_id: id }, body)
  ctx.body = { code: 0, message: '更新成功', data: null }
}

/**
 * 删除服务（软删除）
 */
export async function deleteService(ctx: Context) {
  const { id } = ctx.params
  await ServiceModel.updateOne({ service_id: id }, { is_active: false })
  ctx.body = { code: 0, message: '已下架', data: null }
}
