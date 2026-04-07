import { Context } from 'koa'
import { ServiceModel } from '../models/index.js'
import { generateShortId, PRESET_SERVICES } from '../../../shared/dist/index.js'

function normalizeStages(stages: any, fallbackName: string, fallbackDuration: number) {
  const normalized = Array.isArray(stages)
    ? stages
        .map((stage: any) => ({
          name: (stage?.name || '').trim() || fallbackName,
          duration: Number(stage?.duration) || fallbackDuration,
          staff_busy: stage?.staff_busy !== false,
        }))
        .filter((stage: any) => stage.name)
    : []

  return normalized.length > 0
    ? normalized
    : [{ name: fallbackName, duration: fallbackDuration, staff_busy: true }]
}

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
    const fallbackDuration = Number(total_duration) || 30
    const normalizedStages = normalizeStages(stages, name, fallbackDuration)
    const service = await ServiceModel.create({
      service_id: generateShortId('S'),
      merchant_id,
      name,
      category,
      price,
      total_duration: fallbackDuration,
      staff_busy_duration: Number(staff_busy_duration) || fallbackDuration,
      stages: normalizedStages,
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

  if (Array.isArray(body.stages) || body.name || body.total_duration) {
    const current = await ServiceModel.findOne({ service_id: id }).lean()
    if (!current) {
      ctx.body = { code: 404, message: '服务不存在', data: null }
      return
    }

    const nextName = body.name || current.name
    const nextDuration = Number(body.total_duration) || current.total_duration || 30

    if (Array.isArray(body.stages)) {
      body.stages = normalizeStages(body.stages, nextName, nextDuration)
    }
  }

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
