import { Context } from 'koa'
import { MerchantModel, AdminModel, AppointmentModel, TransactionModel, UserModel, ServiceModel, StaffModel } from '../models'
import { generateShortId, PRESET_SERVICES, UserRole } from '../../../shared/src/index'
import bcrypt from 'bcryptjs'
import { initializeMerchant } from './merchant'

/**
 * 生成临时密码
 */
function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

/**
 * 创建门店管理员账号
 */
async function createMerchantAdmin(
  merchantId: string, 
  ownerPhone: string, 
  ownerName: string,
  reviewerId?: string
): Promise<{ username: string; temp_password: string }> {
  // 生成用户名和临时密码
  const username = `owner_${merchantId.slice(-6)}`
  const tempPassword = generateTempPassword()
  const passwordHash = await bcrypt.hash(tempPassword, 10)

  // 创建管理员账号
  const admin = await AdminModel.create({
    username,
    password_hash: passwordHash,
    real_name: ownerName,
    phone: ownerPhone,
    role: 'owner',
    merchant_id: merchantId,
    type: 'merchant',
    is_active: true,
  })

  // 更新门店 owner_id
  await MerchantModel.updateOne(
    { merchant_id: merchantId },
    { 
      owner_id: admin._id.toString(),
      'application_info.reviewer_id': reviewerId,
      'application_info.review_time': new Date()
    }
  )

  // TODO: 发送短信通知店长
  console.log(`[CreateMerchantAdmin] Admin created for merchant ${merchantId}: ${username} / ${tempPassword}`)

  return { username, temp_password: tempPassword }
}

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
 * 手动添加门店（超管直接创建）
 * POST /api/admin/merchants
 */
export async function createMerchant(ctx: Context) {
  const { 
    name, 
    phone, 
    address, 
    description, 
    business_hours_start = '09:00',
    business_hours_end = '21:00',
    owner_phone, 
    owner_name 
  } = ctx.request.body as any

  if (!name || !phone || !owner_phone || !owner_name) {
    ctx.body = { code: 400, message: '缺少必填字段（门店名称、电话、店长手机号、店长姓名）', data: null }
    return
  }

  try {
    const merchantId = generateShortId('M')
    const reviewerId = ctx.state.user?._id?.toString()

    // 1. 创建门店
    const merchant = await MerchantModel.create({
      merchant_id: merchantId,
      name,
      phone,
      address,
      description,
      status: 'active', // 直接激活
      business_hours: { start: business_hours_start, end: business_hours_end },
      owner_id: '', // 稍后更新
      daily_counter: 0,
      counter_date: new Date().toISOString().slice(0, 10),
      application_info: {
        applicant_name: owner_name,
        applicant_phone: owner_phone,
        applicant_wx_openid: '',
        apply_time: new Date(),
        reviewer_id: reviewerId,
        review_time: new Date(),
      }
    })

    // 2. 创建店长管理员账号
    const adminAccount = await createMerchantAdmin(
      merchantId, 
      owner_phone, 
      owner_name,
      reviewerId
    )

    // 3. 初始化门店配置（默认服务、员工）
    const initResult = await initializeMerchant(merchantId, '')
    if (!initResult.success) {
      console.warn('[CreateMerchant] Initialize warning:', initResult.message)
    }

    ctx.body = { 
      code: 0, 
      message: '门店创建成功', 
      data: { 
        merchant_id: merchant.merchant_id,
        admin_account: adminAccount
      } 
    }
  } catch (err: any) {
    console.error('[CreateMerchant] Error:', err)
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
    const existingServices = await ServiceModel.countDocuments({ merchant_id: id })
    if (existingServices === 0) {
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
  const { page = '1', pageSize = '20', status = 'applying' } = ctx.query as any

  const query: Record<string, any> = {}
  if (status) {
    query.status = status
  } else {
    query.status = { $in: ['applying', 'pending'] }
  }

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
 * 审核入驻申请
 * POST /api/admin/merchants/:id/review
 */
export async function reviewApplication(ctx: Context) {
  const { id } = ctx.params
  const { action, note } = ctx.request.body as { action: 'approve' | 'reject'; note?: string }

  if (!['approve', 'reject'].includes(action)) {
    ctx.body = { code: 400, message: '无效操作', data: null }
    return
  }

  const merchant = await MerchantModel.findOne({ merchant_id: id })
  if (!merchant) {
    ctx.body = { code: 404, message: '申请不存在', data: null }
    return
  }

  if (!['applying', 'pending'].includes(merchant.status)) {
    ctx.body = { code: 400, message: '该申请已被处理', data: null }
    return
  }

  const reviewerId = ctx.state.user?._id?.toString()
  const applyInfo = merchant.application_info

  if (action === 'approve') {
    // 通过审核
    try {
      // 1. 创建店长管理员账号
      const adminAccount = await createMerchantAdmin(
        id,
        applyInfo?.applicant_phone || '',
        applyInfo?.applicant_name || '店长',
        reviewerId
      )

      // 2. 更新门店状态为 active
      await MerchantModel.updateOne(
        { merchant_id: id },
        { 
          status: 'active',
          'application_info.review_note': note,
          'application_info.reviewer_id': reviewerId,
          'application_info.review_time': new Date()
        }
      )

      // 3. 初始化门店配置
      const initResult = await initializeMerchant(id, merchant.owner_id)
      if (!initResult.success) {
        console.warn('[ReviewApplication] Initialize warning:', initResult.message)
      }

      // 4. 更新用户角色为 owner
      if (merchant.owner_id) {
        await UserModel.findByIdAndUpdate(merchant.owner_id, { 
          role: 'owner', 
          merchant_id: id 
        })
      }

      ctx.body = { 
        code: 0, 
        message: '审核通过', 
        data: { 
          admin_account: adminAccount 
        } 
      }
    } catch (err: any) {
      console.error('[ReviewApplication] Approve error:', err)
      ctx.status = 500
      ctx.body = { code: 500, message: err.message, data: null }
    }
  } else {
    // 拒绝审核
    await MerchantModel.updateOne(
      { merchant_id: id },
      { 
        status: 'rejected',
        'application_info.review_note': note,
        'application_info.reviewer_id': reviewerId,
        'application_info.review_time': new Date()
      }
    )

    // 更新用户角色回 customer
    if (merchant.owner_id) {
      await UserModel.findByIdAndUpdate(merchant.owner_id, { 
        role: 'customer',
        $unset: { merchant_id: 1 }
      })
    }

    ctx.body = { code: 0, message: '已拒绝', data: null }
  }
}

/**
 * 重置店长密码
 * POST /api/admin/merchants/:id/reset-password
 */
export async function resetMerchantAdminPassword(ctx: Context) {
  const { id } = ctx.params

  const merchant = await MerchantModel.findOne({ merchant_id: id })
  if (!merchant) {
    ctx.body = { code: 404, message: '门店不存在', data: null }
    return
  }

  if (!merchant.owner_id) {
    ctx.body = { code: 400, message: '该门店未绑定店长', data: null }
    return
  }

  try {
    // 生成新密码
    const newPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // 更新管理员密码
    await AdminModel.findByIdAndUpdate(merchant.owner_id, {
      password_hash: passwordHash
    })

    ctx.body = { 
      code: 0, 
      message: '密码重置成功', 
      data: { 
        new_password: newPassword 
      } 
    }
  } catch (err: any) {
    console.error('[ResetPassword] Error:', err)
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}
