import { Context } from 'koa'
import { MerchantModel, ShopClosedPeriodModel, UserModel, ServiceModel, StaffModel } from '../models'
import { AppointmentModel } from '../models'
import { AppointmentStatus, generateShortId, PRESET_SERVICES } from '../../../shared/src/index'

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
