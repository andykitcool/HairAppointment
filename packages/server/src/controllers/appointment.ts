import { Context } from 'koa'
import { AdminModel, AppointmentModel, ServiceModel, StaffModel, MerchantModel, TransactionModel, UserModel } from '../models/index.js'
import { generateShortId, isTimeOverlap, generateTimeline, getBusyRanges, timeToMinutes, generateTimeSlots, formatDate } from '../../../shared/dist/index.js'

const WEEK_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

function getShanghaiNow() {
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(new Date())
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value])) as Record<string, string>
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    minutes: Number(map.hour) * 60 + Number(map.minute),
  }
}

async function resolveOwnerRealName(ownerId?: string, fallbackName?: string) {
  if (!ownerId) return fallbackName || '店长'
  const ownerAdmin = await AdminModel.findById(ownerId).lean()
  return ownerAdmin?.real_name || fallbackName || '店长'
}

async function normalizeAppointmentStaffName(appointment: any) {
  if (!appointment?.merchant_id || !appointment?.staff_id) return appointment

  const merchant = await MerchantModel.findOne({ merchant_id: appointment.merchant_id }).lean()
  if (!merchant) return appointment

  const defaultOwnerStaffId = merchant.owner_id || `${appointment.merchant_id}_owner`
  if (appointment.staff_id !== defaultOwnerStaffId) return appointment

  const ownerName = await resolveOwnerRealName(merchant.owner_id, merchant.name)
  return {
    ...appointment,
    staff_name: ownerName,
  }
}

function getBusinessIntervalsForDate(date: string, businessHours: any): Array<{ start: string; end: string }> {
  if (!businessHours || typeof businessHours !== 'object') {
    return [{ start: '09:00', end: '21:00' }]
  }

  const day = new Date(date)
  if (Number.isNaN(day.getTime())) {
    return [{ start: '09:00', end: '21:00' }]
  }
  const dayKey = WEEK_KEYS[day.getDay()]
  const dayConfig = businessHours[dayKey]
  if (!dayConfig || dayConfig.is_open === false) {
    return []
  }

  const intervals: Array<{ start: string; end: string }> = []
  const slots = ['morning', 'afternoon', 'evening']
  for (const slotKey of slots) {
    const slot = dayConfig[slotKey]
    if (!slot || slot.is_open === false || !slot.open || !slot.close) continue
    if (timeToMinutes(slot.open) >= timeToMinutes(slot.close)) continue
    intervals.push({ start: slot.open, end: slot.close })
  }
  if (intervals.length > 0) {
    return intervals
  }

  // 兼容旧版结构
  if (typeof businessHours.start === 'string' && typeof businessHours.end === 'string') {
    return [{ start: businessHours.start, end: businessHours.end }]
  }

  return intervals
}

/**
 * 查询可用时间段
 */
export async function getAvailableSlots(ctx: Context) {
  const { merchant_id, staff_id, date, service_id } = ctx.query as any
  if (!merchant_id || !date) {
    ctx.body = { code: 400, message: '缺少 merchant_id 或 date', data: null }
    return
  }

  try {
    // 获取营业时间
    const merchant = await MerchantModel.findOne({ merchant_id })
    if (!merchant) {
      ctx.body = { code: 404, message: '商户不存在', data: null }
      return
    }

    const businessIntervals = getBusinessIntervalsForDate(date, merchant.business_hours)
    if (businessIntervals.length === 0) {
      ctx.body = { code: 0, message: 'ok', data: { slots: [], closed: true, business_hours: null } }
      return
    }

    const finalIntervals = [...businessIntervals]

    const primaryStaff = await StaffModel.findOne({ merchant_id, is_active: true }).sort({ create_time: 1 })
    const resolvedStaffId = staff_id || primaryStaff?.staff_id || merchant.owner_id || `${merchant_id}_owner`

    // 获取该发型师当天已有预约
    const existingAppointments = await AppointmentModel.find({
      merchant_id,
      staff_id: resolvedStaffId,
      date,
      status: { $in: ['confirmed', 'in_progress'] },
    })

    // 获取服务信息计算时长
    let serviceDuration = 30 // 默认 30 分钟
    if (service_id) {
      const service = await ServiceModel.findOne({ service_id })
      if (service) serviceDuration = service.total_duration
    }

    // 生成时间 slots（每 30 分钟一个）
    let slots = finalIntervals.flatMap((itv) => generateTimeSlots(itv.start, itv.end, 30))

    // 当天已过时间直接不返回，前端既不显示也不可点击。
    const shanghaiNow = getShanghaiNow()
    if (date === shanghaiNow.date) {
      slots = slots.filter((slot) => timeToMinutes(slot.start) > shanghaiNow.minutes)
    }

    // 标记每个 slot 是否可用
    const availableSlots = slots.map((slot) => {
      let available = true

      // 检查是否与已有预约冲突
      if (available) {
        for (const apt of existingAppointments) {
          // 新预约结束时间
          const newEndMinutes = timeToMinutes(slot.start) + serviceDuration
          const newEndTime = `${String(Math.floor(newEndMinutes / 60)).padStart(2, '0')}:${String(newEndMinutes % 60).padStart(2, '0')}`

          // 只检查忙碌阶段
          for (const stage of apt.timeline) {
            if (!stage.staff_busy) continue
            if (isTimeOverlap(slot.start, newEndTime, stage.start, stage.end)) {
              available = false
              break
            }
          }
          if (!available) break
        }
      }

      return { ...slot, available }
    })

    ctx.body = {
      code: 0,
      message: 'ok',
      data: { slots: availableSlots, closed: false, business_hours: finalIntervals },
    }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}

/**
 * 创建预约
 */
export async function createAppointment(ctx: Context) {
  const { merchant_id, service_id, date, start_time, customer_id, customer_name, customer_phone, note } = ctx.request.body as any
  const userId = ctx.state.user._id

  if (!merchant_id || !service_id || !date || !start_time) {
    ctx.body = { code: 400, message: '缺少必填字段', data: null }
    return
  }

  try {
    const merchant = await MerchantModel.findOne({ merchant_id })
    if (!merchant) {
      ctx.body = { code: 404, message: '商户不存在', data: null }
      return
    }

    const service = await ServiceModel.findOne({ service_id })
    if (!service) {
      ctx.body = { code: 404, message: '服务不存在', data: null }
      return
    }

    // 获取发型师（Phase 1 默认店长本人）
    const staff = await StaffModel.findOne({ merchant_id, is_active: true }).sort({ create_time: 1 })
    const staffId = staff?.staff_id || merchant.owner_id || `${merchant_id}_owner`
    const ownerName = await resolveOwnerRealName(merchant.owner_id, merchant.name)
    const staffName = staff?.name || ownerName

    // 生成时间线
    const timeline = generateTimeline(service.stages.map(s => ({ name: s.name, duration: s.duration, staff_busy: s.staff_busy })), start_time)
    const endTime = timeline[timeline.length - 1]?.end || start_time

    // 冲突检测：检查忙碌阶段
    const busyRanges = getBusyRanges(timeline)
    for (const busy of busyRanges) {
      const existing = await AppointmentModel.find({
        merchant_id,
        staff_id: staffId,
        date,
        status: { $in: ['confirmed', 'in_progress'] },
      })

      for (const apt of existing) {
        for (const stage of apt.timeline) {
          if (!stage.staff_busy) continue
          if (isTimeOverlap(busy.start, busy.end, stage.start, stage.end)) {
            ctx.body = { code: 409, message: `与预约 ${apt.appointment_id} 时间冲突`, data: null }
            return
          }
        }
      }
    }

    // 原子生成 appointment_id
    const today = date
    const prefix = today.replace(/-/g, '')

    // 重置计数器（如果日期不匹配）
    if (merchant.counter_date !== today) {
      await MerchantModel.updateOne(
        { merchant_id },
        { $set: { counter_date: today, daily_counter: 0 } },
      )
    }

    const incremented = await MerchantModel.findOneAndUpdate(
      { merchant_id, counter_date: today },
      { $inc: { daily_counter: 1 } },
      { returnDocument: 'after' },
    )

    const seqNum = incremented?.daily_counter || 1
    const appointmentId = `${prefix}-${String(seqNum).padStart(3, '0')}`

    // 获取顾客信息
    let custName = customer_name
    let custId = customer_id
    let custPhone = customer_phone
    if (!custName && userId) {
      const user = await UserModel.findById(userId)
      custName = user?.nickname || '顾客'
      custId = userId.toString()
      custPhone = user?.phone
    }

    await AppointmentModel.create({
      appointment_id: appointmentId,
      merchant_id,
      customer_id: custId,
      customer_name: custName || '顾客',
      customer_phone: custPhone,
      staff_id: staffId,
      staff_name: staffName,
      service_id,
      service_name: service.name,
      date,
      start_time,
      end_time: endTime,
      status: 'pending',
      source: 'mini_program',
      timeline,
      note,
      sequence_num: seqNum,
    })

    ctx.body = { code: 0, message: '预约创建成功', data: { appointment_id: appointmentId, status: 'pending' } }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}

/**
 * 获取预约列表
 */
export async function getAppointments(ctx: Context) {
  const { merchant_id, date, status, page = '1', pageSize = '20' } = ctx.query as any
  const user = ctx.state.user
  const role = user?.role || ''

  const query: Record<string, any> = {}
  if (merchant_id) query.merchant_id = merchant_id
  else if (user.merchant_id) query.merchant_id = user.merchant_id
  else if (role === 'super_admin') {
    // 超管未指定 merchant_id 时查看全量预约
  } else if (['owner', 'merchant_admin', 'admin', 'staff'].includes(role)) {
    ctx.body = { code: 400, message: '当前账号未绑定门店', data: null }
    return
  } else {
    query.customer_id = user._id
  }

  if (date) query.date = date
  if (status) query.status = status

  const total = await AppointmentModel.countDocuments(query)
  const list = await AppointmentModel.find(query)
    .sort({ create_time: -1 })
    .skip((Number(page) - 1) * Number(pageSize))
    .limit(Number(pageSize))

  const normalizedList = await Promise.all(list.map((item: any) => normalizeAppointmentStaffName(item.toObject ? item.toObject() : item)))

  ctx.body = {
    code: 0,
    message: 'ok',
    data: { list: normalizedList, total, page: Number(page), pageSize: Number(pageSize) },
  }
}

/**
 * 获取预约详情
 */
export async function getAppointmentDetail(ctx: Context) {
  const { id } = ctx.params
  const apt = await AppointmentModel.findOne({ appointment_id: id })

  if (!apt) {
    ctx.body = { code: 404, message: '预约不存在', data: null }
    return
  }

  const normalizedAppointment = await normalizeAppointmentStaffName(apt.toObject ? apt.toObject() : apt)
  ctx.body = { code: 0, message: 'ok', data: normalizedAppointment }
}

/**
 * 修改预约
 */
export async function updateAppointment(ctx: Context) {
  const { id } = ctx.params
  const body = ctx.request.body as any
  const user = ctx.state.user

  const apt = await AppointmentModel.findOne({ appointment_id: id })
  if (!apt) {
    ctx.body = { code: 404, message: '预约不存在', data: null }
    return
  }

  // 权限检查：顾客只能修改自己的预约
  if (user.role === 'customer' && apt.customer_id?.toString() !== user._id?.toString()) {
    ctx.body = { code: 403, message: '无权操作', data: null }
    return
  }

  // 只有 pending/confirmed 可修改
  if (!['pending', 'confirmed'].includes(apt.status)) {
    ctx.body = { code: 400, message: '当前状态不可修改', data: null }
    return
  }

  // 如果修改了时间或服务，需要重新生成 timeline
  const updateData: Record<string, any> = { ...body }
  if (body.service_id || body.start_time) {
    const service = body.service_id
      ? await ServiceModel.findOne({ service_id: body.service_id })
      : await ServiceModel.findOne({ service_id: apt.service_id })
    const newStartTime = body.start_time || apt.start_time

    if (service) {
      updateData.service_id = service.service_id
      updateData.service_name = service.name
      updateData.timeline = generateTimeline(
        service.stages.map(s => ({ name: s.name, duration: s.duration, staff_busy: s.staff_busy })),
        newStartTime,
      )
      updateData.end_time = updateData.timeline[updateData.timeline.length - 1]?.end || newStartTime
      updateData.start_time = newStartTime
    }
  }

  // 修改后状态重置为 pending
  updateData.status = 'pending'

  await AppointmentModel.updateOne({ appointment_id: id }, updateData)
  ctx.body = { code: 0, message: '预约已修改', data: null }
}

/**
 * 取消预约
 */
export async function cancelAppointment(ctx: Context) {
  const { id } = ctx.params
  const user = ctx.state.user

  const apt = await AppointmentModel.findOne({ appointment_id: id })
  if (!apt) {
    ctx.body = { code: 404, message: '预约不存在', data: null }
    return
  }

  if (user.role === 'customer' && apt.customer_id?.toString() !== user._id?.toString()) {
    ctx.body = { code: 403, message: '无权操作', data: null }
    return
  }

  if (!['pending', 'confirmed'].includes(apt.status)) {
    ctx.body = { code: 400, message: '当前状态不可取消', data: null }
    return
  }

  await AppointmentModel.updateOne(
    { appointment_id: id },
    { status: 'cancelled' },
  )

  // TODO: 发送取消通知

  ctx.body = { code: 0, message: '预约已取消', data: null }
}

/**
 * 确认预约
 */
export async function confirmAppointment(ctx: Context) {
  const { id } = ctx.params

  const apt = await AppointmentModel.findOne({ appointment_id: id })
  if (!apt) {
    ctx.body = { code: 404, message: '预约不存在', data: null }
    return
  }

  if (apt.status !== 'pending') {
    ctx.body = { code: 400, message: '只有待确认的预约可以确认', data: null }
    return
  }

  await AppointmentModel.updateOne({ appointment_id: id }, { status: 'confirmed' })

  // TODO: 发送确认通知给顾客

  ctx.body = { code: 0, message: '预约已确认', data: null }
}

/**
 * 散客登记（COZE）
 */
export async function walkIn(ctx: Context) {
  const { merchant_id, service_name, customer_name, customer_phone } = ctx.request.body as any

  // 模糊匹配服务
  const service = await ServiceModel.findOne({
    merchant_id,
    name: { $regex: service_name, $options: 'i' },
    is_active: true,
  })

  if (!service) {
    ctx.body = { code: 404, message: '服务不存在', data: null }
    return
  }

  const now = new Date()
  const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const date = formatDate(now)

  const timeline = generateTimeline(
    service.stages.map(s => ({ name: s.name, duration: s.duration, staff_busy: s.staff_busy })),
    startTime,
  )
  const endTime = timeline[timeline.length - 1]?.end || startTime

  // 生成 appointment_id
  const prefix = date.replace(/-/g, '')
  const merchant = await MerchantModel.findOne({ merchant_id })
  if (merchant?.counter_date !== date) {
    await MerchantModel.updateOne({ merchant_id }, { $set: { counter_date: date, daily_counter: 0 } })
  }
  const incremented = await MerchantModel.findOneAndUpdate(
    { merchant_id, counter_date: date },
    { $inc: { daily_counter: 1 } },
    { returnDocument: 'after' },
  )
  const seqNum = incremented?.daily_counter || 1

  const staff = await StaffModel.findOne({ merchant_id, is_active: true }).sort({ create_time: 1 })
  const defaultStaffId = staff?.staff_id || merchant?.owner_id || `${merchant_id}_owner`
  const ownerName = await resolveOwnerRealName(merchant?.owner_id, merchant?.name)
  const defaultStaffName = staff?.name || ownerName

  const apt = await AppointmentModel.create({
    appointment_id: `${prefix}-${String(seqNum).padStart(3, '0')}`,
    merchant_id,
    customer_name: customer_name || '散客',
    customer_phone,
    staff_id: defaultStaffId,
    staff_name: defaultStaffName,
    service_id: service.service_id,
    service_name: service.name,
    date,
    start_time: startTime,
    end_time: endTime,
    status: 'in_progress',
    source: 'coze',
    timeline,
    sequence_num: seqNum,
  })

  ctx.body = { code: 0, message: '散客登记成功', data: { appointment_id: apt.appointment_id } }
}

/**
 * 开始服务（COZE）
 */
export async function startService(ctx: Context) {
  const { id } = ctx.params
  const body = (ctx.request.body as any) || {}
  const { duration } = body

  const apt = await AppointmentModel.findOne({ appointment_id: id })
  if (!apt) {
    ctx.body = { code: 404, message: '预约不存在', data: null }
    return
  }

  if (apt.status !== 'confirmed') {
    ctx.body = { code: 400, message: '只有已确认的预约可以开始服务', data: null }
    return
  }

  const updateData: Record<string, any> = { status: 'in_progress' }
  if (duration) {
    updateData.actual_duration = duration
    // 重新计算 timeline
    const service = await ServiceModel.findOne({ service_id: apt.service_id })
    if (service) {
      const ratio = duration / service.total_duration
      const adjustedStages = service.stages.map(s => ({
        stage_name: s.name,
        duration: s.duration,
        start: apt.start_time,
        end: apt.start_time,
        staff_busy: s.staff_busy,
      }))
      // 简单处理：按比例调整
      let currentMinutes = timeToMinutes(apt.start_time)
      for (const stage of adjustedStages) {
        stage.start = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`
        currentMinutes += Math.round(stage.duration * ratio) || stage.duration
        stage.end = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`
      }
      updateData.timeline = adjustedStages
      updateData.end_time = adjustedStages[adjustedStages.length - 1]?.end || apt.end_time
    }
  }

  await AppointmentModel.updateOne({ appointment_id: id }, updateData)

  // TODO: 检查是否影响后续预约并发送通知

  ctx.body = { code: 0, message: '服务已开始', data: null }
}

/**
 * 完成服务并记账（COZE）
 */
export async function completeService(ctx: Context) {
  const { id } = ctx.params
  const body = (ctx.request.body as any) || {}
  const { total_amount, payment_method, items, note } = body

  const apt = await AppointmentModel.findOne({ appointment_id: id })
  if (!apt) {
    ctx.body = { code: 404, message: '预约不存在', data: null }
    return
  }

  if (apt.status !== 'in_progress') {
    ctx.body = { code: 400, message: '只有服务中的预约可以完成', data: null }
    return
  }

  // 更新预约状态
  await AppointmentModel.updateOne({ appointment_id: id }, { status: 'completed' })

  // 创建交易记录
  const txItems = items || [{ service_name: apt.service_name, amount: total_amount || 0, quantity: 1 }]
  await TransactionModel.create({
    transaction_id: generateShortId('TX'),
    merchant_id: apt.merchant_id,
    appointment_id: apt.appointment_id,
    customer_id: apt.customer_id,
    customer_name: apt.customer_name,
    staff_id: apt.staff_id,
    staff_name: apt.staff_name,
    total_amount: total_amount || 0,
    items: txItems,
    payment_method: payment_method || 'wechat',
    source: 'coze',
    note,
    transaction_date: apt.date,
  })

  // 更新顾客消费统计
  if (apt.customer_id) {
    await UserModel.findByIdAndUpdate(apt.customer_id, {
      $inc: { visit_count: 1, total_spending: total_amount || 0 },
      $set: { last_visit_time: new Date() },
    })
  }

  ctx.body = { code: 0, message: '服务完成，已记账', data: null }
}

/**
 * 标记未到店（COZE）
 */
export async function markNoShow(ctx: Context) {
  const { id } = ctx.params

  const apt = await AppointmentModel.findOne({ appointment_id: id })
  if (!apt) {
    ctx.body = { code: 404, message: '预约不存在', data: null }
    return
  }

  if (apt.status !== 'confirmed') {
    ctx.body = { code: 400, message: '只有已确认的预约可以标记未到', data: null }
    return
  }

  await AppointmentModel.updateOne({ appointment_id: id }, { status: 'no_show' })
  ctx.body = { code: 0, message: '已标记未到店', data: null }
}
