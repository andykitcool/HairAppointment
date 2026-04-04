import { Context } from 'koa'
import { MerchantModel, AdminModel, AppointmentModel, TransactionModel, UserModel } from '../models'
import { generateShortId, PRESET_SERVICES, ServiceCategory } from '../../../shared/src/index'
import bcrypt from 'bcryptjs'

/**
 * 获取所有门店列表
 */
export async function getMerchants(ctx: Context) {
  const { page = '1', pageSize = '20', status } = ctx.query as any

  const query: Record<string, any> = {}
  if (status) query.status = status

  const total = await MerchantModel.countDocuments(query)
  const list = await MerchantModel.find(query)
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
 * 手动添加门店
 */
export async function createMerchant(ctx: Context) {
  const { name, phone, address, description, owner_name, owner_password } = ctx.request.body as any

  if (!name || !phone) {
    ctx.body = { code: 400, message: '缺少必填字段', data: null }
    return
  }

  try {
    // 创建商户
    const merchant = await MerchantModel.create({
      merchant_id: generateShortId('M'),
      name,
      phone,
      address,
      description,
      status: 'active',
      owner_id: '',
      business_hours: { start: '09:00', end: '21:00' },
      daily_counter: 0,
      counter_date: '',
    })

    // 创建预设服务
    for (const preset of PRESET_SERVICES) {
      await (await import('../models')).ServiceModel.create({
        service_id: generateShortId('S'),
        merchant_id: merchant.merchant_id,
        ...preset,
        is_active: true,
        sort_order: PRESET_SERVICES.indexOf(preset),
      })
    }

    // 如果有店长信息，创建 admin 账号和 user 记录
    if (owner_name && owner_password) {
      const passwordHash = await bcrypt.hash(owner_password, 10)
      const admin = await AdminModel.create({
        username: owner_name,
        password_hash: passwordHash,
        real_name: owner_name,
        is_active: true,
      })
      await MerchantModel.updateOne(
        { merchant_id: merchant.merchant_id },
        { owner_id: admin._id.toString() },
      )
    }

    ctx.body = { code: 0, message: '创建成功', data: { merchant_id: merchant.merchant_id } }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}

/**
 * 审核门店状态
 */
export async function updateMerchantStatus(ctx: Context) {
  const { id } = ctx.params
  const { status } = ctx.request.body as { status: string }

  if (!['active', 'inactive', 'rejected'].includes(status)) {
    ctx.body = { code: 400, message: '无效状态', data: null }
    return
  }

  await MerchantModel.updateOne({ merchant_id: id }, { status })

  // 如果审核通过，创建预设服务
  if (status === 'active') {
    const merchant = await MerchantModel.findOne({ merchant_id: id })
    const existingServices = await (await import('../models')).ServiceModel.countDocuments({ merchant_id: id })
    if (existingServices === 0) {
      for (const preset of PRESET_SERVICES) {
        await (await import('../models')).ServiceModel.create({
          service_id: generateShortId('S'),
          merchant_id: id,
          ...preset,
          is_active: true,
          sort_order: PRESET_SERVICES.indexOf(preset),
        })
      }
    }

    // 更新用户的 role 为 owner
    if (merchant?.owner_id) {
      await UserModel.findByIdAndUpdate(merchant.owner_id, { role: 'owner', merchant_id: id })
    }
  }

  ctx.body = { code: 0, message: '更新成功', data: null }
}

/**
 * 平台级统计
 */
export async function getPlatformStats(ctx: Context) {
  const totalMerchants = await MerchantModel.countDocuments({ status: 'active' })
  const totalCustomers = await UserModel.countDocuments({ role: 'customer' })
  const totalAppointments = await AppointmentModel.countDocuments()
  const totalRevenue = await TransactionModel.aggregate([
    { $group: { _id: null, total: { $sum: '$total_amount' } } },
  ])

  ctx.body = {
    code: 0,
    message: 'ok',
    data: {
      total_merchants: totalMerchants,
      total_customers: totalCustomers,
      total_appointments: totalAppointments,
      total_revenue: totalRevenue[0]?.total || 0,
    },
  }
}

/**
 * 获取入驻申请列表
 */
export async function getApplications(ctx: Context) {
  const { page = '1', pageSize = '20' } = ctx.query as any

  const total = await MerchantModel.countDocuments({ status: 'pending' })
  const list = await MerchantModel.find({ status: 'pending' })
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
 * 审核入驻申请
 */
export async function reviewApplication(ctx: Context) {
  const { id } = ctx.params
  const { status, reason } = ctx.request.body as { status: string; reason?: string }

  if (!['active', 'rejected'].includes(status)) {
    ctx.body = { code: 400, message: '无效状态', data: null }
    return
  }

  const merchant = await MerchantModel.findOne({ merchant_id: id })
  if (!merchant) {
    ctx.body = { code: 404, message: '申请不存在', data: null }
    return
  }

  await MerchantModel.updateOne({ merchant_id: id }, { status })

  if (status === 'active') {
    // 创建预设服务
    const { ServiceModel } = await import('../models')
    const existingCount = await ServiceModel.countDocuments({ merchant_id: id })
    if (existingCount === 0) {
      for (const preset of PRESET_SERVICES) {
        await ServiceModel.create({
          service_id: generateShortId('S'),
          merchant_id: id,
          ...preset,
          is_active: true,
          sort_order: PRESET_SERVICES.indexOf(preset),
        })
      }
    }

    // 更新用户角色
    if (merchant.owner_id) {
      await UserModel.findByIdAndUpdate(merchant.owner_id, { role: 'owner', merchant_id: id })
    }
  }

  ctx.body = { code: 0, message: status === 'active' ? '审核通过' : '已拒绝', data: null }
}
