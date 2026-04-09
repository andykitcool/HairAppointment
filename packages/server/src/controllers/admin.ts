import { Context } from 'koa'
import { MerchantModel, AdminModel, AppointmentModel, TransactionModel, UserModel, ServiceModel, StaffModel, PlatformAdModel, PlatformConfigModel, AiUsageLogModel } from '../models/index.js'
import { generateShortId, PRESET_SERVICES } from '../../../shared/dist/index.js'
import bcrypt from 'bcryptjs'
import { initializeMerchant } from './merchant.js'

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

function parsePort(port: unknown): number {
  const value = Number(port)
  if (!Number.isFinite(value) || value <= 0) return 465
  return Math.floor(value)
}

function formatLocalDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date): Date {
  const d = startOfDay(date)
  d.setDate(d.getDate() + 1)
  return d
}

function parseRegionFromAddress(address: string): string {
  const raw = String(address || '').trim()
  if (!raw) return '未标注地区'

  if (raw.includes('北京市')) return '北京市'
  if (raw.includes('上海市')) return '上海市'
  if (raw.includes('天津市')) return '天津市'
  if (raw.includes('重庆市')) return '重庆市'

  const provinceMatch = raw.match(/^(.*?(省|自治区|特别行政区))/)
  if (provinceMatch?.[1]) return provinceMatch[1]

  const cityMatch = raw.match(/^(.*?市)/)
  if (cityMatch?.[1]) return cityMatch[1]

  return '其他地区'
}

function fillDailyTrend(
  startDate: Date,
  days: number,
  valueMap: Map<string, number>,
): Array<{ date: string; count: number }> {
  const list: Array<{ date: string; count: number }> = []
  for (let i = 0; i < days; i++) {
    const current = new Date(startDate)
    current.setDate(startDate.getDate() + i)
    const key = formatLocalDate(current)
    list.push({
      date: key,
      count: valueMap.get(key) || 0,
    })
  }
  return list
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
    owner_id
  } = ctx.request.body as any

  if (!name || !phone) {
    ctx.body = { code: 400, message: '缺少必填字段（门店名称、电话）', data: null }
    return
  }

  // 如果传入了店长ID，检查店长信息
  let owner = null
  if (owner_id) {
    owner = await UserModel.findOne({ user_id: owner_id })
    if (!owner) {
      ctx.body = { code: 404, message: '店长不存在', data: null }
      return
    }

    if (owner.role !== 'owner') {
      ctx.body = { code: 400, message: '该用户不是店长', data: null }
      return
    }

    if (owner.merchant_id) {
      ctx.body = { code: 400, message: '该店长已绑定其他门店', data: null }
      return
    }
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
        applicant_name: owner?.real_name || owner?.nickname || '',
        applicant_phone: owner?.phone || '',
        applicant_wx_openid: owner?.openid || '',
        apply_time: new Date(),
        reviewer_id: reviewerId,
        review_time: new Date(),
      }
    })

    // 2. 如果绑定了店长，创建店长管理员账号并更新关联
    let adminAccount = null
    if (owner) {
      adminAccount = await createMerchantAdmin(
        merchantId, 
        owner.phone, 
        owner.real_name || owner.nickname,
        reviewerId
      )

      // 3. 更新店长的 merchant_id
      await UserModel.findByIdAndUpdate(owner._id, { merchant_id: merchantId })
    }

    // 4. 初始化门店配置（默认服务、员工）
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
 * 平台广告列表
 */
export async function getPlatformAds(ctx: Context) {
  const { page = '1', pageSize = '20' } = ctx.query as any
  const total = await PlatformAdModel.countDocuments({})
  const list = await PlatformAdModel.find({})
    .sort({ sort_order: -1, create_time: -1 })
    .skip((Number(page) - 1) * Number(pageSize))
    .limit(Number(pageSize))
    .lean()

  ctx.body = {
    code: 0,
    message: 'ok',
    data: { list, total, page: Number(page), pageSize: Number(pageSize) },
  }
}

/**
 * 创建平台广告
 */
export async function createPlatformAd(ctx: Context) {
  const { title, image_url, link_url = '', sort_order = 0, status = 'active', start_time, end_time } = ctx.request.body as any

  if (!title || !image_url) {
    ctx.body = { code: 400, message: '缺少必填字段（标题、图片）', data: null }
    return
  }

  const ad = await PlatformAdModel.create({
    ad_id: generateShortId('AD'),
    title,
    image_url,
    link_url,
    sort_order: Number(sort_order) || 0,
    status,
    start_time: start_time ? new Date(start_time) : null,
    end_time: end_time ? new Date(end_time) : null,
  })

  ctx.body = { code: 0, message: '创建成功', data: ad }
}

/**
 * 更新平台广告
 */
export async function updatePlatformAd(ctx: Context) {
  const { id } = ctx.params
  const { title, image_url, link_url, sort_order, status, start_time, end_time } = ctx.request.body as any

  const patch: Record<string, any> = {
    update_time: new Date(),
  }
  if (title !== undefined) patch.title = title
  if (image_url !== undefined) patch.image_url = image_url
  if (link_url !== undefined) patch.link_url = link_url
  if (sort_order !== undefined) patch.sort_order = Number(sort_order) || 0
  if (status !== undefined) patch.status = status
  if (start_time !== undefined) patch.start_time = start_time ? new Date(start_time) : null
  if (end_time !== undefined) patch.end_time = end_time ? new Date(end_time) : null

  await PlatformAdModel.updateOne({ ad_id: id }, patch)
  ctx.body = { code: 0, message: '更新成功', data: null }
}

/**
 * 删除平台广告
 */
export async function deletePlatformAd(ctx: Context) {
  const { id } = ctx.params
  await PlatformAdModel.deleteOne({ ad_id: id })
  ctx.body = { code: 0, message: '删除成功', data: null }
}

/**
 * 获取平台 COZE 配置
 */
export async function getPlatformCozeConfig(ctx: Context) {
  let config = await PlatformConfigModel.findOne({ config_key: 'platform_default' })
  if (!config) {
    config = await PlatformConfigModel.create({ config_key: 'platform_default' })
  }
  if (!config) {
    ctx.body = { code: 500, message: '平台配置初始化失败', data: null }
    return
  }
  const saved = (config.coze_config || {}) as any
  ctx.body = {
    code: 0,
    message: 'ok',
    data: {
      enabled: !!saved.enabled,
      api_key: saved.api_key || '',
      model: saved.model || 'doubao-seedream-5-0-260128',
      prompt: saved.prompt || '',
      size: saved.size || '2K',
    },
  }
}

/**
 * 更新平台 COZE 配置
 */
export async function updatePlatformCozeConfig(ctx: Context) {
  const {
    enabled = false,
    api_key = '',
    model = 'doubao-seedream-5-0-260128',
    prompt = '',
    size = '2K',
  } = ctx.request.body as any
  await PlatformConfigModel.updateOne(
    { config_key: 'platform_default' },
    {
      $set: {
        coze_config: {
          enabled: !!enabled,
          api_key,
          model,
          prompt,
          size,
        },
        update_time: new Date(),
      },
      $setOnInsert: {
        config_key: 'platform_default',
        create_time: new Date(),
      },
    },
    { upsert: true }
  )
  ctx.body = { code: 0, message: '保存成功', data: null }
}

/**
 * 获取高德开放平台配置
 */
export async function getAmapConfig(ctx: Context) {
  let config = await PlatformConfigModel.findOne({ config_key: 'platform_default' })
  if (!config) {
    config = await PlatformConfigModel.create({ config_key: 'platform_default' })
  }
  if (!config) {
    ctx.body = { code: 500, message: '平台配置初始化失败', data: null }
    return
  }

  const saved = (config.amap_config || {}) as any
  ctx.body = {
    code: 0,
    message: 'ok',
    data: {
      enabled: !!saved.enabled,
      js_api_key: saved.js_api_key || '',
      security_js_code: saved.security_js_code || '',
      service_host: saved.service_host || '',
      web_service_key: saved.web_service_key || '',
    },
  }
}

/**
 * 更新高德开放平台配置
 */
export async function updateAmapConfig(ctx: Context) {
  const body = (ctx.request.body || {}) as any
  const enabled = !!body.enabled
  const jsApiKey = String(body.js_api_key || '').trim()
  const securityJsCode = String(body.security_js_code || '').trim()
  const serviceHost = String(body.service_host || '').trim()
  const webServiceKey = String(body.web_service_key || '').trim()

  if (enabled && !jsApiKey) {
    ctx.body = { code: 400, message: '启用高德时 Web JS API Key 不能为空', data: null }
    return
  }

  await PlatformConfigModel.updateOne(
    { config_key: 'platform_default' },
    {
      $set: {
        amap_config: {
          enabled,
          js_api_key: jsApiKey,
          security_js_code: securityJsCode,
          service_host: serviceHost,
          web_service_key: webServiceKey,
        },
        update_time: new Date(),
      },
      $setOnInsert: {
        config_key: 'platform_default',
        create_time: new Date(),
      },
    },
    { upsert: true }
  )

  ctx.body = { code: 0, message: '保存成功', data: null }
}

/**
 * 获取系统邮件配置
 */
export async function getSystemEmailConfig(ctx: Context) {
  let config = await PlatformConfigModel.findOne({ config_key: 'platform_default' })
  if (!config) {
    config = await PlatformConfigModel.create({ config_key: 'platform_default' })
  }
  if (!config) {
    ctx.body = { code: 500, message: '平台配置初始化失败', data: null }
    return
  }

  const saved = (config.email_config || {}) as any
  ctx.body = {
    code: 0,
    message: 'ok',
    data: {
      enabled: !!saved.enabled,
      host: saved.host || '',
      port: parsePort(saved.port),
      secure: saved.secure !== undefined ? !!saved.secure : true,
      user: saved.user || '',
      pass: saved.pass || '',
      from_name: saved.from_name || '',
      from_email: saved.from_email || '',
    },
  }
}

/**
 * 更新系统邮件配置
 */
export async function updateSystemEmailConfig(ctx: Context) {
  const body = (ctx.request.body || {}) as any
  const host = String(body.host || '').trim()
  const user = String(body.user || '').trim()
  const fromEmail = String(body.from_email || '').trim()
  const enabled = !!body.enabled

  if (enabled && !host) {
    ctx.body = { code: 400, message: '启用邮件时 SMTP Host 不能为空', data: null }
    return
  }

  if (enabled && !user) {
    ctx.body = { code: 400, message: '启用邮件时 SMTP 用户名不能为空', data: null }
    return
  }

  if (enabled && !fromEmail) {
    ctx.body = { code: 400, message: '启用邮件时发件邮箱不能为空', data: null }
    return
  }

  await PlatformConfigModel.updateOne(
    { config_key: 'platform_default' },
    {
      $set: {
        email_config: {
          enabled,
          host,
          port: parsePort(body.port),
          secure: body.secure !== undefined ? !!body.secure : true,
          user,
          pass: String(body.pass || ''),
          from_name: String(body.from_name || '').trim(),
          from_email: fromEmail,
        },
        update_time: new Date(),
      },
      $setOnInsert: {
        config_key: 'platform_default',
        create_time: new Date(),
      },
    },
    { upsert: true }
  )

  ctx.body = { code: 0, message: '保存成功', data: null }
}

/**
 * 平台级统计
 */
export async function getPlatformStats(ctx: Context) {
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)

  const yesterday = new Date(todayStart)
  yesterday.setDate(yesterday.getDate() - 1)

  const sevenDayStart = new Date(todayStart)
  sevenDayStart.setDate(sevenDayStart.getDate() - 6)

  const thirtyDayStart = new Date(todayStart)
  thirtyDayStart.setDate(thirtyDayStart.getDate() - 29)

  const todayStr = formatLocalDate(todayStart)
  const yesterdayStr = formatLocalDate(yesterday)
  const sevenDayStartStr = formatLocalDate(sevenDayStart)
  const thirtyDayStartStr = formatLocalDate(thirtyDayStart)

  const [
    totalCustomers,
    totalAppointments,
    totalRevenueAgg,
    merchantStatusAgg,
    todayAppointments,
    yesterdayAppointments,
    todayRevenueAgg,
    yesterdayRevenueAgg,
    todayAiUsage,
    yesterdayAiUsage,
    appointments7dAgg,
    revenue7dAgg,
    ai7dAgg,
    merchants,
    appointmentByMerchant30d,
    aiByMerchant30d,
    appointmentByMerchantToday,
    aiByMerchantToday,
    revenueByMerchantToday,
  ] = await Promise.all([
    UserModel.countDocuments({ role: 'customer' }),
    AppointmentModel.countDocuments(),
    TransactionModel.aggregate([{ $group: { _id: null, total: { $sum: '$total_amount' } } }]),
    MerchantModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    AppointmentModel.countDocuments({ date: todayStr }),
    AppointmentModel.countDocuments({ date: yesterdayStr }),
    TransactionModel.aggregate([
      { $match: { transaction_date: todayStr } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } },
    ]),
    TransactionModel.aggregate([
      { $match: { transaction_date: yesterdayStr } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } },
    ]),
    AiUsageLogModel.countDocuments({ create_time: { $gte: todayStart, $lt: todayEnd } }),
    AiUsageLogModel.countDocuments({ create_time: { $gte: yesterday, $lt: todayStart } }),
    AppointmentModel.aggregate([
      { $match: { date: { $gte: sevenDayStartStr, $lte: todayStr } } },
      { $group: { _id: '$date', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    TransactionModel.aggregate([
      { $match: { transaction_date: { $gte: sevenDayStartStr, $lte: todayStr } } },
      { $group: { _id: '$transaction_date', total: { $sum: '$total_amount' } } },
      { $sort: { _id: 1 } },
    ]),
    AiUsageLogModel.aggregate([
      { $match: { create_time: { $gte: sevenDayStart, $lt: todayEnd } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$create_time' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    MerchantModel.find({}, { merchant_id: 1, name: 1, status: 1, address: 1 }).lean(),
    AppointmentModel.aggregate([
      { $match: { date: { $gte: thirtyDayStartStr, $lte: todayStr } } },
      { $group: { _id: '$merchant_id', count: { $sum: 1 } } },
    ]),
    AiUsageLogModel.aggregate([
      { $match: { create_time: { $gte: thirtyDayStart, $lt: todayEnd } } },
      { $group: { _id: '$merchant_id', count: { $sum: 1 } } },
    ]),
    AppointmentModel.aggregate([
      { $match: { date: todayStr } },
      { $group: { _id: '$merchant_id', count: { $sum: 1 } } },
    ]),
    AiUsageLogModel.aggregate([
      { $match: { create_time: { $gte: todayStart, $lt: todayEnd } } },
      { $group: { _id: '$merchant_id', count: { $sum: 1 } } },
    ]),
    TransactionModel.aggregate([
      { $match: { transaction_date: todayStr } },
      { $group: { _id: '$merchant_id', total: { $sum: '$total_amount' } } },
    ]),
  ])

  const statusMap = new Map<string, number>()
  merchantStatusAgg.forEach((item: any) => {
    statusMap.set(String(item._id || ''), Number(item.count || 0))
  })

  const merchantStatus = {
    active: statusMap.get('active') || 0,
    inactive: statusMap.get('inactive') || 0,
    pending: statusMap.get('pending') || 0,
    applying: statusMap.get('applying') || 0,
    rejected: statusMap.get('rejected') || 0,
  }

  const totalMerchants =
    merchantStatus.active +
    merchantStatus.inactive +
    merchantStatus.pending +
    merchantStatus.applying +
    merchantStatus.rejected

  const appointmentsMap = new Map<string, number>()
  appointments7dAgg.forEach((item: any) => {
    appointmentsMap.set(String(item._id || ''), Number(item.count || 0))
  })

  const revenueMap = new Map<string, number>()
  revenue7dAgg.forEach((item: any) => {
    revenueMap.set(String(item._id || ''), Number(item.total || 0))
  })

  const aiMap = new Map<string, number>()
  ai7dAgg.forEach((item: any) => {
    aiMap.set(String(item._id || ''), Number(item.count || 0))
  })

  const appointmentMerchant30Map = new Map<string, number>()
  appointmentByMerchant30d.forEach((item: any) => {
    appointmentMerchant30Map.set(String(item._id || ''), Number(item.count || 0))
  })

  const aiMerchant30Map = new Map<string, number>()
  aiByMerchant30d.forEach((item: any) => {
    aiMerchant30Map.set(String(item._id || ''), Number(item.count || 0))
  })

  const appointmentMerchantTodayMap = new Map<string, number>()
  appointmentByMerchantToday.forEach((item: any) => {
    appointmentMerchantTodayMap.set(String(item._id || ''), Number(item.count || 0))
  })

  const aiMerchantTodayMap = new Map<string, number>()
  aiByMerchantToday.forEach((item: any) => {
    aiMerchantTodayMap.set(String(item._id || ''), Number(item.count || 0))
  })

  const revenueMerchantTodayMap = new Map<string, number>()
  revenueByMerchantToday.forEach((item: any) => {
    revenueMerchantTodayMap.set(String(item._id || ''), Number(item.total || 0))
  })

  const regionAccumulator = new Map<
    string,
    { region: string; merchant_count: number; appointment_count_30d: number; ai_usage_count_30d: number }
  >()

  for (const merchant of merchants) {
    if (merchant.status !== 'active') continue
    const region = parseRegionFromAddress(String(merchant.address || ''))
    const current = regionAccumulator.get(region) || {
      region,
      merchant_count: 0,
      appointment_count_30d: 0,
      ai_usage_count_30d: 0,
    }

    const merchantId = String(merchant.merchant_id || '')
    current.merchant_count += 1
    current.appointment_count_30d += appointmentMerchant30Map.get(merchantId) || 0
    current.ai_usage_count_30d += aiMerchant30Map.get(merchantId) || 0
    regionAccumulator.set(region, current)
  }

  const geoDistribution = Array.from(regionAccumulator.values())
    .sort((a, b) => {
      if (b.appointment_count_30d !== a.appointment_count_30d) {
        return b.appointment_count_30d - a.appointment_count_30d
      }
      return b.merchant_count - a.merchant_count
    })
    .slice(0, 10)

  const topMerchants = merchants
    .filter((merchant) => merchant.status === 'active')
    .map((merchant) => {
      const merchantId = String(merchant.merchant_id || '')
      return {
        merchant_id: merchantId,
        merchant_name: String(merchant.name || merchantId),
        today_appointments: appointmentMerchantTodayMap.get(merchantId) || 0,
        ai_usage_today: aiMerchantTodayMap.get(merchantId) || 0,
        revenue_today: revenueMerchantTodayMap.get(merchantId) || 0,
      }
    })
    .sort((a, b) => {
      if (b.today_appointments !== a.today_appointments) {
        return b.today_appointments - a.today_appointments
      }
      if (b.ai_usage_today !== a.ai_usage_today) {
        return b.ai_usage_today - a.ai_usage_today
      }
      return b.revenue_today - a.revenue_today
    })
    .slice(0, 8)

  const appointments7d = fillDailyTrend(sevenDayStart, 7, appointmentsMap)
  const aiUsage7d = fillDailyTrend(sevenDayStart, 7, aiMap)
  const revenue7d = fillDailyTrend(sevenDayStart, 7, revenueMap)

  const todayRevenue = Number(todayRevenueAgg[0]?.total || 0)
  const yesterdayRevenue = Number(yesterdayRevenueAgg[0]?.total || 0)

  ctx.body = {
    code: 0,
    message: 'ok',
    data: {
      summary: {
        total_merchants: totalMerchants,
        active_merchants: merchantStatus.active,
        total_customers: totalCustomers,
        total_appointments: totalAppointments,
        total_revenue: Number(totalRevenueAgg[0]?.total || 0),
      },
      daily: {
        date: todayStr,
        today_appointments: todayAppointments,
        yesterday_appointments: yesterdayAppointments,
        today_revenue: todayRevenue,
        yesterday_revenue: yesterdayRevenue,
        today_ai_usage: todayAiUsage,
        yesterday_ai_usage: yesterdayAiUsage,
      },
      merchant_status: {
        ...merchantStatus,
        total: totalMerchants,
      },
      trends: {
        appointments_7d: appointments7d,
        ai_usage_7d: aiUsage7d,
        revenue_7d: revenue7d,
      },
      geo_distribution: geoDistribution,
      top_merchants: topMerchants,
      // 兼容旧版前端
      total_merchants: totalMerchants,
      total_customers: totalCustomers,
      total_appointments: totalAppointments,
      total_revenue: Number(totalRevenueAgg[0]?.total || 0),
      updated_at: new Date().toISOString(),
    },
  }
}

/**
 * 获取入驻申请列表
 */
export async function getApplications(ctx: Context) {
  const { page = '1', pageSize = '20', status } = ctx.query as any

  const query: Record<string, any> = {}
  if (status === 'applying') {
    query.status = { $in: ['applying', 'pending'] }
  } else if (status && status !== 'all') {
    query.status = status
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

/**
 * 获取店长列表
 * GET /api/admin/owners
 */
export async function getOwners(ctx: Context) {
  const { page = '1', pageSize = '20', keyword, merchant_id, unbound } = ctx.query as any

  const query: Record<string, any> = { role: 'owner', is_active: true }

  // 按门店筛选
  if (merchant_id) {
    query.merchant_id = merchant_id
  }

  // 只查询未绑定门店的店长（用于新建门店时选择）
  if (unbound === 'true') {
    query.$or = [
      { merchant_id: { $exists: false } },
      { merchant_id: null },
      { merchant_id: '' }
    ]
  }

  // 按关键词搜索（姓名或手机号）
  if (keyword) {
    query.$or = [
      { real_name: { $regex: keyword, $options: 'i' } },
      { phone: { $regex: keyword, $options: 'i' } },
      { username: { $regex: keyword, $options: 'i' } }
    ]
  }

  const total = await AdminModel.countDocuments(query)
  const list = await AdminModel.find(query)
    .sort({ create_time: -1 })
    .skip((Number(page) - 1) * Number(pageSize))
    .limit(Number(pageSize))
    .lean()

  // 获取门店名称
  const merchantIds = list.map(u => u.merchant_id).filter(Boolean)
  const merchants = await MerchantModel.find(
    { merchant_id: { $in: merchantIds } },
    { merchant_id: 1, name: 1 }
  ).lean()
  const merchantMap = new Map(merchants.map(m => [m.merchant_id, m.name]))

  // 补充门店名称并返回前端兼容字段
  const listWithMerchantName = list.map(u => ({
    user_id: u._id?.toString(),
    username: u.username,
    real_name: u.real_name,
    phone: u.phone,
    nickname: u.real_name || '',
    role: 'owner',
    merchant_id: u.merchant_id,
    merchant_name: u.merchant_id ? merchantMap.get(u.merchant_id) || null : null,
    create_time: u.create_time,
    update_time: u.update_time,
  }))

  ctx.body = {
    code: 0,
    message: 'ok',
    data: { list: listWithMerchantName, total, page: Number(page), pageSize: Number(pageSize) },
  }
}

/**
 * 手动添加店长
 * POST /api/admin/owners
 */
export async function addOwner(ctx: Context) {
  const { real_name, phone, merchant_id, password } = ctx.request.body as any

  if (!real_name || !phone || !password) {
    ctx.body = { code: 400, message: '缺少必填字段（姓名、手机号、密码）', data: null }
    return
  }

  // 验证手机号格式
  if (!/^1[3-9]\d{9}$/.test(phone)) {
    ctx.body = { code: 400, message: '手机号格式不正确', data: null }
    return
  }

  // 规则：手机号对应的店长只能有一条，防止重复添加
  const existingOwnerAdmin = await AdminModel.findOne({
    phone,
    role: 'owner',
    is_active: true,
  })
  if (existingOwnerAdmin) {
    ctx.body = { code: 400, message: '该手机号已存在店长，请勿重复添加', data: null }
    return
  }

  // 如果传入了门店ID，检查门店
  if (merchant_id) {
    // 检查门店是否存在
    const merchant = await MerchantModel.findOne({ merchant_id })
    if (!merchant) {
      ctx.body = { code: 404, message: '门店不存在', data: null }
      return
    }

    // 检查门店是否已有店长
    const existingOwner = await UserModel.findOne({ merchant_id, role: 'owner' })
    if (existingOwner) {
      ctx.body = { code: 400, message: '该门店已有店长，请先移除现有店长', data: null }
      return
    }
  }

  // 检查手机号是否已注册
  const existingUser = await UserModel.findOne({ phone })
  if (existingUser) {
    // 如果已是店长，返回错误
    if (existingUser.role === 'owner') {
      ctx.body = { code: 400, message: '该用户已是店长', data: null }
      return
    }
    // 更新为店长角色
    await UserModel.findByIdAndUpdate(existingUser._id, {
      role: 'owner',
      merchant_id: merchant_id || null,
      real_name
    })
  } else {
    // 创建新用户
    const userId = generateShortId('U')
    await UserModel.create({
      user_id: userId,
      openid: `manual_${Date.now()}`, // 手动创建的临时openid
      nickname: real_name,
      avatar_url: '',
      phone,
      real_name,
      role: 'owner',
      merchant_id: merchant_id || null,
      visit_count: 0,
      total_spending: 0
    })
  }

  // 创建后台管理员账号
  const username = merchant_id ? `owner_${merchant_id.slice(-6)}` : `owner_${generateShortId('').slice(-6)}`
  const passwordHash = await bcrypt.hash(password, 10)
  
  // 检查是否已有管理员账号（通过phone查找，phone是唯一的）
  const existingAdmin = await AdminModel.findOne({ phone })
  if (existingAdmin) {
    await AdminModel.findByIdAndUpdate(existingAdmin._id, {
      username,
      password_hash: passwordHash,
      real_name,
      merchant_id: merchant_id || null,
      is_active: true
    })
  } else {
    await AdminModel.create({
      username,
      password_hash: passwordHash,
      real_name,
      phone,
      role: 'owner',
      merchant_id: merchant_id || null,
      type: 'merchant',
      is_active: true
    })
  }

  // 如果绑定了门店，更新门店 owner_id（通过phone查找）
  if (merchant_id) {
    const admin = await AdminModel.findOne({ phone })
    if (admin) {
      await MerchantModel.updateOne(
        { merchant_id },
        { owner_id: admin._id.toString() }
      )
    }
  }

  ctx.body = { code: 0, message: '店长添加成功', data: null }
}

/**
 * 移除店长身份
 * DELETE /api/admin/owners/:userId
 */
export async function removeOwner(ctx: Context) {
  const { userId } = ctx.params

  const user = await UserModel.findOne({ user_id: userId })
  if (user && user.role === 'owner') {
    // 更新用户角色为 customer
    await UserModel.findByIdAndUpdate(user._id, {
      role: 'customer',
      $unset: { merchant_id: 1 }
    })

    // 禁用后台管理员账号
    if (user.merchant_id) {
      const username = `owner_${user.merchant_id.slice(-6)}`
      await AdminModel.findOneAndUpdate(
        { username },
        { is_active: false }
      )

      // 清空门店 owner_id
      await MerchantModel.updateOne(
        { merchant_id: user.merchant_id },
        { $unset: { owner_id: 1 } }
      )
    }
  } else {
    // 兼容 Admin-only 店长数据
    const admin = await AdminModel.findById(userId)
    if (!admin || admin.role !== 'owner') {
      ctx.body = { code: 404, message: '店长不存在', data: null }
      return
    }

    await AdminModel.findByIdAndUpdate(admin._id, { is_active: false })
    if (admin.merchant_id) {
      await MerchantModel.updateOne(
        { merchant_id: admin.merchant_id },
        { $unset: { owner_id: 1 } }
      )
      // 若存在同手机号小程序用户，同步降级
      await UserModel.updateMany(
        { phone: admin.phone, role: 'owner' },
        { role: 'customer', $unset: { merchant_id: 1 } }
      )
    }
  }

  ctx.body = { code: 0, message: '已移除店长身份', data: null }
}

/**
 * 更新店长信息
 * PUT /api/admin/owners/:userId
 */
export async function updateOwner(ctx: Context) {
  const { userId } = ctx.params
  const { real_name, phone, merchant_id } = ctx.request.body as any

  const user = await UserModel.findOne({ user_id: userId })
  if (!user) {
    // 兼容 Admin-only 店长数据
    const admin = await AdminModel.findById(userId)
    if (!admin || admin.role !== 'owner') {
      ctx.body = { code: 404, message: '店长不存在', data: null }
      return
    }

    // 验证手机号格式
    if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
      ctx.body = { code: 400, message: '手机号格式不正确', data: null }
      return
    }

    // 检查手机号是否已被其他管理员使用
    if (phone && phone !== admin.phone) {
      const existingAdmin = await AdminModel.findOne({ phone, _id: { $ne: admin._id } })
      if (existingAdmin) {
        ctx.body = { code: 400, message: '该手机号已被其他账号使用', data: null }
        return
      }
    }

    // 如果更换了门店，校验门店存在
    if (merchant_id) {
      const merchant = await MerchantModel.findOne({ merchant_id })
      if (!merchant) {
        ctx.body = { code: 404, message: '门店不存在', data: null }
        return
      }
    }

    // 旧门店解绑
    if (admin.merchant_id && admin.merchant_id !== merchant_id) {
      await MerchantModel.updateOne(
        { merchant_id: admin.merchant_id },
        { $unset: { owner_id: 1 } }
      )
    }

    await AdminModel.findByIdAndUpdate(admin._id, {
      real_name: real_name || admin.real_name,
      phone: phone || admin.phone,
      merchant_id: merchant_id ?? admin.merchant_id,
      username: merchant_id ? `owner_${merchant_id.slice(-6)}` : admin.username,
      is_active: true,
    })

    // 新门店绑定
    if (merchant_id) {
      await MerchantModel.updateOne(
        { merchant_id },
        { owner_id: admin._id.toString() }
      )
    }

    // 同步可能存在的用户资料
    await UserModel.updateMany(
      { phone: admin.phone },
      {
        real_name: real_name || admin.real_name,
        phone: phone || admin.phone,
        role: 'owner',
        merchant_id: merchant_id ?? admin.merchant_id,
      }
    )

    ctx.body = { code: 0, message: '更新成功', data: null }
    return
  }

  if (user.role !== 'owner') {
    ctx.body = { code: 400, message: '该用户不是店长', data: null }
    return
  }

  // 验证手机号格式
  if (phone && !/^1[3-9]\d{9}$/.test(phone)) {
    ctx.body = { code: 400, message: '手机号格式不正确', data: null }
    return
  }

  // 检查手机号是否已被其他用户使用
  if (phone && phone !== user.phone) {
    const existingUser = await UserModel.findOne({ phone, user_id: { $ne: userId } })
    if (existingUser) {
      ctx.body = { code: 400, message: '该手机号已被其他用户使用', data: null }
      return
    }
  }

  // 如果更换了门店
  if (merchant_id && merchant_id !== user.merchant_id) {
    // 检查新门店是否存在
    const merchant = await MerchantModel.findOne({ merchant_id })
    if (!merchant) {
      ctx.body = { code: 404, message: '门店不存在', data: null }
      return
    }

    // 检查新门店是否已有店长
    const existingOwner = await UserModel.findOne({ merchant_id, role: 'owner', user_id: { $ne: userId } })
    if (existingOwner) {
      ctx.body = { code: 400, message: '该门店已有店长', data: null }
      return
    }

    // 解除旧门店绑定
    if (user.merchant_id) {
      const oldUsername = `owner_${user.merchant_id.slice(-6)}`
      await AdminModel.findOneAndUpdate(
        { username: oldUsername },
        { is_active: false }
      )
      await MerchantModel.updateOne(
        { merchant_id: user.merchant_id },
        { $unset: { owner_id: 1 } }
      )
    }

    // 绑定新门店
    const newUsername = `owner_${merchant_id.slice(-6)}`
    await MerchantModel.updateOne(
      { merchant_id },
      { owner_id: user._id.toString() }
    )

    // 更新或创建管理员账号（通过phone查找现有账号）
    const admin = await AdminModel.findOne({ $or: [{ username: newUsername }, { phone: phone || user.phone }] })
    if (admin) {
      await AdminModel.findByIdAndUpdate(admin._id, {
        username: newUsername,
        real_name: real_name || user.real_name,
        phone: phone || user.phone,
        merchant_id,
        is_active: true
      })
    } else {
      await AdminModel.create({
        username: newUsername,
        password_hash: await bcrypt.hash('123456', 10), // 默认密码
        real_name: real_name || user.real_name,
        phone: phone || user.phone,
        role: 'owner',
        merchant_id,
        type: 'merchant',
        is_active: true
      })
    }
  } else {
    // 只是更新基本信息，同步更新管理员账号
    if (user.merchant_id) {
      const username = `owner_${user.merchant_id.slice(-6)}`
      await AdminModel.findOneAndUpdate(
        { username },
        { real_name: real_name || user.real_name, phone: phone || user.phone }
      )
    }
  }

  // 更新用户信息
  await UserModel.findByIdAndUpdate(user._id, {
    real_name: real_name || user.real_name,
    phone: phone || user.phone,
    merchant_id: merchant_id || user.merchant_id
  })

  ctx.body = { code: 0, message: '更新成功', data: null }
}

/**
 * 删除门店
 * DELETE /api/admin/merchants/:id
 */
export async function deleteMerchant(ctx: Context) {
  const { id } = ctx.params

  const merchant = await MerchantModel.findOne({ merchant_id: id })
  if (!merchant) {
    ctx.body = { code: 404, message: '门店不存在', data: null }
    return
  }

  try {
    // 1. 删除门店相关数据
    await ServiceModel.deleteMany({ merchant_id: id })
    await StaffModel.deleteMany({ merchant_id: id })
    await AppointmentModel.deleteMany({ merchant_id: id })
    await TransactionModel.deleteMany({ merchant_id: id })

    // 2. 更新该门店下所有用户的 merchant_id
    await UserModel.updateMany(
      { merchant_id: id },
      { $unset: { merchant_id: 1 }, role: 'customer' }
    )

    // 3. 清除后台管理员账号的门店关联（通过merchant_id查找，清除merchant_id字段）
    await AdminModel.updateMany(
      { merchant_id: id },
      { $unset: { merchant_id: 1 } }
    )

    // 4. 删除门店
    await MerchantModel.deleteOne({ merchant_id: id })

    ctx.body = { code: 0, message: '门店删除成功', data: null }
  } catch (err: any) {
    console.error('[DeleteMerchant] Error:', err)
    ctx.status = 500
    ctx.body = { code: 500, message: err.message || '删除失败', data: null }
  }
}
