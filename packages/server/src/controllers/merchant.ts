import { Context } from 'koa'
import { MerchantModel, UserModel, ServiceModel, StaffModel, AppointmentModel, TransactionModel, AdminModel } from '../models/index.js'
import { AppointmentStatus, generateShortId, PRESET_SERVICES } from '../../../shared/dist/index.js'

const DEFAULT_MEMBERSHIP_LEVELS = ['普通会员', '银卡会员', '金卡会员', '钻石会员']

function normalizeMembershipLevels(levels: unknown): string[] {
  if (!Array.isArray(levels)) return DEFAULT_MEMBERSHIP_LEVELS
  const normalized = levels
    .map((item) => String(item || '').trim())
    .filter(Boolean)

  const deduped = Array.from(new Set(normalized))
  return deduped.length > 0 ? deduped : DEFAULT_MEMBERSHIP_LEVELS
}

function ensureOwnerMerchantAccess(ctx: Context, merchantId: string): boolean {
  const role = ctx.state.user?.role
  const currentMerchantId = ctx.state.user?.merchant_id
  if (role === 'owner' && currentMerchantId && currentMerchantId !== merchantId) {
    ctx.status = 403
    ctx.body = { code: 403, message: '无权访问其他门店数据', data: null }
    return false
  }
  return true
}

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

  // 允许更新的字段白名单
  const allowedFields = [
    'name', 'phone', 'address', 'description', 'business_hours',
    'display_settings', 'latitude', 'longitude', 'notify_config', 'ai_image_settings'
  ]
  
  const updateData: Record<string, any> = {}
  for (const key of allowedFields) {
    if (body[key] !== undefined) {
      updateData[key] = body[key]
    }
  }

  await MerchantModel.updateOne({ merchant_id: id }, updateData)
  ctx.body = { code: 0, message: '更新成功', data: null }
}

/**
 * 获取门店展示设置
 */
export async function getDisplaySettings(ctx: Context) {
  const { id } = ctx.params
  
  const merchant = await MerchantModel.findOne(
    { merchant_id: id },
    { display_settings: 1, name: 1, phone: 1, address: 1 }
  )
  
  if (!merchant) {
    ctx.body = { code: 404, message: '门店不存在', data: null }
    return
  }
  
  ctx.body = { 
    code: 0, 
    message: 'ok', 
    data: {
      name: merchant.name,
      phone: merchant.phone,
      address: merchant.address,
      display_settings: merchant.display_settings || {
        hero_image: '',
        owner_avatar: '',
        owner_title: '店长',
        theme_color: '#1890ff',
        welcome_text: '欢迎预约，我们将为您提供专业服务',
      }
    } 
  }
}

/**
 * 更新门店展示设置
 */
export async function updateDisplaySettings(ctx: Context) {
  const { id } = ctx.params
  const { hero_image, owner_avatar, owner_title, theme_color, welcome_text } = ctx.request.body as any
  
  const merchant = await MerchantModel.findOne({ merchant_id: id })
  if (!merchant) {
    ctx.body = { code: 404, message: '门店不存在', data: null }
    return
  }
  
  const displaySettings = {
    hero_image: hero_image ?? merchant.display_settings?.hero_image ?? '',
    owner_avatar: owner_avatar ?? merchant.display_settings?.owner_avatar ?? '',
    owner_title: owner_title ?? merchant.display_settings?.owner_title ?? '店长',
    theme_color: theme_color ?? merchant.display_settings?.theme_color ?? '#1890ff',
    welcome_text: welcome_text ?? merchant.display_settings?.welcome_text ?? '欢迎预约，我们将为您提供专业服务',
  }
  
  await MerchantModel.updateOne(
    { merchant_id: id },
    { display_settings: displaySettings }
  )
  
  ctx.body = { code: 0, message: '设置已保存', data: displaySettings }
}

/**
 * 获取顾客设置（会员级别字典）
 */
export async function getCustomerSettings(ctx: Context) {
  const { id } = ctx.params
  const merchant = await MerchantModel.findOne({ merchant_id: id }, { customer_settings: 1 })

  if (!merchant) {
    ctx.body = { code: 404, message: '门店不存在', data: null }
    return
  }

  const membershipLevels = normalizeMembershipLevels(merchant.customer_settings?.membership_levels)
  ctx.body = {
    code: 0,
    message: 'ok',
    data: {
      membership_levels: membershipLevels,
    },
  }
}

/**
 * 更新顾客设置（会员级别字典）
 */
export async function updateCustomerSettings(ctx: Context) {
  const { id } = ctx.params
  if (!ensureOwnerMerchantAccess(ctx, id)) return

  const body = (ctx.request.body || {}) as any
  const membershipLevels = normalizeMembershipLevels(body.membership_levels)

  const merchant = await MerchantModel.findOne({ merchant_id: id })
  if (!merchant) {
    ctx.body = { code: 404, message: '门店不存在', data: null }
    return
  }

  await MerchantModel.updateOne(
    { merchant_id: id },
    { customer_settings: { membership_levels: membershipLevels } }
  )

  ctx.body = {
    code: 0,
    message: '顾客设置已保存',
    data: {
      membership_levels: membershipLevels,
    },
  }
}

/**
 * 发送门店数据备份到店长邮箱
 */
export async function sendBackupEmail(ctx: Context) {
  const { id } = ctx.params
  if (!ensureOwnerMerchantAccess(ctx, id)) return

  const adminId = ctx.state.user?._id
  if (!adminId) {
    ctx.body = { code: 401, message: '未登录', data: null }
    return
  }

  const admin = await AdminModel.findById(adminId)
  if (!admin) {
    ctx.body = { code: 404, message: '管理员不存在', data: null }
    return
  }

  if (!admin.email) {
    ctx.body = { code: 400, message: '请先在个人设置中绑定邮箱', data: null }
    return
  }

  const merchant = await MerchantModel.findOne({ merchant_id: id }).lean()
  if (!merchant) {
    ctx.body = { code: 404, message: '门店不存在', data: null }
    return
  }

  const [staff, services, appointments, transactions] = await Promise.all([
    StaffModel.find({ merchant_id: id }).lean(),
    ServiceModel.find({ merchant_id: id }).lean(),
    AppointmentModel.find({ merchant_id: id }).lean(),
    TransactionModel.find({ merchant_id: id }).lean(),
  ])

  const customerIds = Array.from(new Set(
    appointments
      .map((item: any) => String(item.customer_id || ''))
      .filter(Boolean)
  ))

  const customers = customerIds.length > 0
    ? await UserModel.find({ _id: { $in: customerIds } }).lean()
    : []

  const backupPayload = {
    version: '1.0.0',
    export_time: new Date().toISOString(),
    merchant_id: id,
    merchant,
    staff,
    services,
    appointments,
    transactions,
    customers,
  }

  const smtpHost = process.env.SMTP_HOST || ''
  const smtpPort = Number(process.env.SMTP_PORT || 465)
  const smtpUser = process.env.SMTP_USER || ''
  const smtpPass = process.env.SMTP_PASS || ''
  const smtpFrom = process.env.SMTP_FROM || smtpUser

  if (!smtpHost || !smtpUser || !smtpPass || !smtpFrom) {
    ctx.body = { code: 500, message: '邮箱服务未配置（缺少 SMTP_HOST/SMTP_USER/SMTP_PASS/SMTP_FROM）', data: null }
    return
  }

  const nodemailer = await import('nodemailer')
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  })

  const now = new Date()
  const dateText = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`
  const fileName = `backup_${id}_${dateText}.json`

  await transporter.sendMail({
    from: smtpFrom,
    to: admin.email,
    subject: `【美发预约系统】门店数据备份 - ${merchant.name || id}`,
    text: `您好，\n\n附件为门店 ${merchant.name || id} 的数据备份文件。\n导出时间：${new Date().toLocaleString('zh-CN')}\n\n请妥善保存。`,
    attachments: [
      {
        filename: fileName,
        content: JSON.stringify(backupPayload, null, 2),
        contentType: 'application/json; charset=utf-8',
      },
    ],
  })

  ctx.body = {
    code: 0,
    message: `备份已发送至 ${admin.email}`,
    data: {
      to: admin.email,
      file_name: fileName,
    },
  }
}

/**
 * 初始化门店配置（创建默认服务和员工）
 */
export async function initializeMerchant(merchantId: string, ownerId: string) {
  try {
    // 1. 创建默认服务
    const existingServices = await ServiceModel.countDocuments({ merchant_id: merchantId })
    if (existingServices === 0) {
      for (const preset of PRESET_SERVICES) {
        await ServiceModel.create({
          service_id: generateShortId('S'),
          merchant_id: merchantId,
          ...preset,
          is_active: true,
          sort_order: PRESET_SERVICES.indexOf(preset),
        })
      }
    }

    // 2. 创建默认员工（店长）
    const existingStaff = await StaffModel.countDocuments({ merchant_id: merchantId })
    if (existingStaff === 0) {
      await StaffModel.create({
        staff_id: generateShortId('ST'),
        merchant_id: merchantId,
        user_id: ownerId,
        name: '店长',
        title: '店长',
        is_active: true,
        service_ids: [],
      })
    }

    return { success: true }
  } catch (err: any) {
    console.error('[InitializeMerchant] Error:', err)
    return { success: false, message: err.message }
  }
}

/**
 * 店长申请入驻
 * POST /api/merchant/apply
 */
export async function applyMerchant(ctx: Context) {
  const { 
    name, 
    address, 
    phone, 
    business_hours_start, 
    business_hours_end, 
    description,
    applicant_name,
    applicant_phone 
  } = ctx.request.body as any

  // 参数校验
  if (!name || !address || !phone || !business_hours_start || !business_hours_end || !applicant_name || !applicant_phone) {
    ctx.body = { code: 400, message: '缺少必填字段', data: null }
    return
  }

  // 检查手机号是否已申请
  const existingApplication = await MerchantModel.findOne({
    'application_info.applicant_phone': applicant_phone,
    status: { $in: ['applying', 'pending', 'active'] }
  })
  if (existingApplication) {
    ctx.body = { code: 400, message: '该手机号已有正在处理的申请', data: null }
    return
  }

  try {
    // 获取当前用户（小程序端登录的用户）
    const userId = ctx.state.user?.user_id || ctx.state.user?._id
    const wxOpenid = ctx.state.user?.openid

    // 创建门店申请
    const merchant = await MerchantModel.create({
      merchant_id: generateShortId('M'),
      name,
      address,
      phone,
      business_hours: { start: business_hours_start, end: business_hours_end },
      status: 'applying',
      description,
      owner_id: userId?.toString() || '',
      daily_counter: 0,
      counter_date: new Date().toISOString().slice(0, 10),
      application_info: {
        applicant_name,
        applicant_phone,
        applicant_wx_openid: wxOpenid || '',
        apply_time: new Date(),
      }
    })

    // 更新用户角色为 pending_owner
    if (userId) {
      await UserModel.findByIdAndUpdate(userId, { 
        role: 'pending_owner',
        merchant_id: merchant.merchant_id 
      })
    }

    ctx.body = { 
      code: 0, 
      message: '申请已提交，请等待审核', 
      data: { 
        merchant_id: merchant.merchant_id,
        status: 'applying'
      } 
    }
  } catch (err: any) {
    console.error('[ApplyMerchant] Error:', err)
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}

/**
 * 查询申请状态
 * GET /api/merchant/apply-status
 */
export async function getApplyStatus(ctx: Context) {
  const userId = ctx.state.user?.user_id || ctx.state.user?._id
  
  if (!userId) {
    ctx.body = { code: 401, message: '未登录', data: null }
    return
  }

  try {
    const merchant = await MerchantModel.findOne({ owner_id: userId.toString() })
      .sort({ create_time: -1 })
    
    if (!merchant) {
      ctx.body = { code: 0, message: 'ok', data: { has_application: false } }
      return
    }

    ctx.body = { 
      code: 0, 
      message: 'ok', 
      data: { 
        has_application: true,
        merchant_id: merchant.merchant_id,
        status: merchant.status,
        name: merchant.name,
        application_info: merchant.application_info,
        review_note: merchant.application_info?.review_note
      } 
    }
  } catch (err: any) {
    console.error('[GetApplyStatus] Error:', err)
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}

/**
 * 搜索商户（按名称关键词）
 * GET /api/merchants/search?name=xxx&page=1&limit=10
 */
export async function searchMerchants(ctx: Context) {
  try {
    const { name = '', page = '1', limit = '10' } = ctx.query as Record<string, string>
    const pageNum = Math.max(1, parseInt(page))
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)))
    const skip = (pageNum - 1) * limitNum

    const query: Record<string, any> = { status: 'active' }
    if (name.trim()) {
      query.name = { $regex: name.trim(), $options: 'i' }
    }

    const [merchants, total] = await Promise.all([
      MerchantModel.find(query, {
        merchant_id: 1, name: 1, address: 1, phone: 1,
        description: 1, cover_image: 1, display_settings: 1,
        latitude: 1, longitude: 1, business_hours: 1
      }).skip(skip).limit(limitNum).lean(),
      MerchantModel.countDocuments(query)
    ])

    ctx.body = {
      code: 0, message: 'ok',
      data: { list: merchants, total, page: pageNum, limit: limitNum }
    }
  } catch (err: any) {
    console.error('[SearchMerchants] Error:', err)
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}

/**
 * 获取附近商户（基于 Haversine 公式，默认半径 3km）
 * GET /api/merchants/nearby?lat=31.23&lng=121.47&radius=3
 */
export async function getNearbyMerchants(ctx: Context) {
  try {
    const { lat, lng, radius = '3' } = ctx.query as Record<string, string>

    if (!lat || !lng) {
      ctx.body = { code: 400, message: '缺少 lat 或 lng 参数', data: null }
      return
    }

    const userLat = parseFloat(lat)
    const userLng = parseFloat(lng)
    const maxRadius = parseFloat(radius)

    if (isNaN(userLat) || isNaN(userLng) || isNaN(maxRadius)) {
      ctx.body = { code: 400, message: '坐标或半径参数无效', data: null }
      return
    }

    // 先筛出有坐标的活跃商户
    const merchants = await MerchantModel.find(
      { status: 'active', latitude: { $ne: null }, longitude: { $ne: null } },
      {
        merchant_id: 1, name: 1, address: 1, phone: 1,
        description: 1, cover_image: 1, display_settings: 1,
        latitude: 1, longitude: 1, business_hours: 1
      }
    ).lean()

    // Haversine 公式计算距离（km）
    const R = 6371
    const toRad = (deg: number) => (deg * Math.PI) / 180

    const nearby = merchants
      .map((m) => {
        const dLat = toRad((m.latitude as number) - userLat)
        const dLng = toRad((m.longitude as number) - userLng)
        const a =
          Math.sin(dLat / 2) ** 2 +
          Math.cos(toRad(userLat)) * Math.cos(toRad(m.latitude as number)) * Math.sin(dLng / 2) ** 2
        const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return { ...m, distance: Math.round(distance * 100) / 100 }
      })
      .filter((m) => m.distance <= maxRadius)
      .sort((a, b) => a.distance - b.distance)

    ctx.body = { code: 0, message: 'ok', data: { list: nearby, total: nearby.length } }
  } catch (err: any) {
    console.error('[GetNearbyMerchants] Error:', err)
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}
