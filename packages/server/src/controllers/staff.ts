import { Context } from 'koa'
import { AdminModel, MerchantModel, ServiceModel, StaffModel } from '../models/index.js'
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

    if (list.length === 0) {
      const merchant = await MerchantModel.findOne({ merchant_id }).lean()
      if (merchant) {
        const ownerAdmin = merchant.owner_id ? await AdminModel.findById(merchant.owner_id).lean() : null
        const ownerName = ownerAdmin?.real_name || merchant.name || '店长'
        const services = await ServiceModel.find({ merchant_id, is_active: true }).select({ service_id: 1 }).lean()
        const defaultOwnerStaffId = merchant.owner_id || `${merchant_id}_owner`
        const defaultOwnerRow = {
          staff_id: defaultOwnerStaffId,
          merchant_id,
          name: ownerName,
          title: '店长',
          phone: merchant.phone || '',
          is_active: true,
          is_default_owner: true,
          service_ids: services.map((s: any) => s.service_id),
        }
        ctx.body = { code: 0, message: 'ok', data: { list: [defaultOwnerRow] } }
        return
      }
    }

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
    const updated = await StaffModel.updateOne(
      { staff_id: id },
      { name, title, phone, service_ids, is_active }
    )

    if (!updated.matchedCount) {
      ctx.body = { code: 404, message: '员工不存在', data: null }
      return
    }

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
  const { merchant_id } = ctx.query as any

  try {
    const merchant = merchant_id ? await MerchantModel.findOne({ merchant_id }).lean() : null
    if (merchant && id === (merchant.owner_id || `${merchant_id}_owner`)) {
      ctx.body = { code: 400, message: '默认店长员工不可删除', data: null }
      return
    }

    const updated = await StaffModel.updateOne({ staff_id: id }, { is_active: false })
    if (!updated.matchedCount) {
      ctx.body = { code: 404, message: '员工不存在', data: null }
      return
    }

    ctx.body = { code: 0, message: '删除成功', data: null }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}
