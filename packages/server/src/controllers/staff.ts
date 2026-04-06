import { Context } from 'koa'
import { StaffModel } from '../models/index.js'
import { generateShortId } from '../../../shared/dist/index.js'

/**
 * 获取员工列表
 */
export async function getStaffList(ctx: Context) {
  const { merchant_id } = ctx.query as any

  if (!merchant_id) {
    ctx.body = { code: 400, message: '缺少门店ID', data: null }
    return
  }

  try {
    const list = await StaffModel.find({ merchant_id, is_active: true })
      .sort({ create_time: 1 })
      .lean()

    ctx.body = { code: 0, message: 'ok', data: { list } }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}

/**
 * 创建员工
 */
export async function createStaff(ctx: Context) {
  const { merchant_id, name, title, phone, service_ids } = ctx.request.body as any

  if (!merchant_id || !name) {
    ctx.body = { code: 400, message: '缺少必填字段', data: null }
    return
  }

  try {
    const staff = await StaffModel.create({
      staff_id: generateShortId('ST'),
      merchant_id,
      name,
      title: title || '店员',
      phone: phone || '',
      is_active: true,
      service_ids: service_ids || [],
    })

    ctx.body = { code: 0, message: '创建成功', data: { staff_id: staff.staff_id } }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}

/**
 * 更新员工
 */
export async function updateStaff(ctx: Context) {
  const { id } = ctx.params
  const { name, title, phone, service_ids, is_active } = ctx.request.body as any

  try {
    await StaffModel.updateOne(
      { staff_id: id },
      { name, title, phone, service_ids, is_active }
    )

    ctx.body = { code: 0, message: '更新成功', data: null }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}

/**
 * 删除员工（软删除）
 */
export async function deleteStaff(ctx: Context) {
  const { id } = ctx.params

  try {
    await StaffModel.updateOne({ staff_id: id }, { is_active: false })
    ctx.body = { code: 0, message: '删除成功', data: null }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}
