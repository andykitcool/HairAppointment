import { Context } from 'koa'
import { AdminModel, AppointmentModel, ServiceModel, StaffModel, MerchantModel, TransactionModel, UserModel } from '../models/index.js'
import { generateShortId, generateTimeline, generateTimeSlots, formatDate } from '../../../shared/dist/index.js'
import { validateCustomerAppointmentAccess, validateMerchantBinding } from '../domain/appointment/access.js'
import { filterPastSlotsForDate, getBusinessIntervalsForDate, markSlotsAvailability } from '../domain/appointment/availability.js'
import { buildCompleteServiceTransaction, buildCustomerConsumptionUpdate } from '../domain/appointment/billing.js'
import { buildDailyCounterResetUpdate, resolveDailySequenceNumber, shouldResetDailyCounter } from '../domain/appointment/counter.js'
import { findConflictingAppointmentId, formatAppointmentId, resolveAppointmentCustomer } from '../domain/appointment/creation.js'
import { buildPendingAppointmentRecord, buildWalkInAppointmentRecord } from '../domain/appointment/records.js'
import { recalculateTimelineByActualDuration } from '../domain/appointment/timeline.js'
import {
  getAppointmentActionSuccessMessage,
  getAppointmentNextStatus,
  validateAppointmentTransition,
} from '../domain/appointment/transitions.js'

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

function respondError(ctx: Context, code: number, message: string) {
  ctx.body = { code, message, data: null }
}

function respondAppointmentNotFound(ctx: Context) {
  respondError(ctx, 404, '预约不存在')
}

function respondMerchantNotFound(ctx: Context) {
  respondError(ctx, 404, '商户不存在')
}

function respondServiceNotFound(ctx: Context) {
  respondError(ctx, 404, '服务不存在')
}

function respondForbidden(ctx: Context, message = '无权操作') {
  respondError(ctx, 403, message)
}

function respondSuccess(ctx: Context, message: string, data: any = null) {
  ctx.body = { code: 0, message, data }
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
      respondMerchantNotFound(ctx)
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
    slots = filterPastSlotsForDate(date, slots, shanghaiNow)

    // 标记每个 slot 是否可用
    const availableSlots = markSlotsAvailability(slots, existingAppointments as any[], serviceDuration)

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
      respondMerchantNotFound(ctx)
      return
    }

    const service = await ServiceModel.findOne({ service_id })
    if (!service) {
      respondServiceNotFound(ctx)
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
    const existing = await AppointmentModel.find({
      merchant_id,
      staff_id: staffId,
      date,
      status: { $in: ['confirmed', 'in_progress'] },
    })
    const conflictingAppointmentId = findConflictingAppointmentId(timeline as any[], existing as any[])
    if (conflictingAppointmentId) {
      respondError(ctx, 409, `与预约 ${conflictingAppointmentId} 时间冲突`)
      return
    }

    // 原子生成 appointment_id
    const today = date

    // 重置计数器（如果日期不匹配）
    if (shouldResetDailyCounter(merchant.counter_date, today)) {
      await MerchantModel.updateOne(
        { merchant_id },
        buildDailyCounterResetUpdate(today),
      )
    }

    const incremented = await MerchantModel.findOneAndUpdate(
      { merchant_id, counter_date: today },
      { $inc: { daily_counter: 1 } },
      { returnDocument: 'after' },
    )

    const seqNum = resolveDailySequenceNumber(incremented?.daily_counter)
    const appointmentId = formatAppointmentId(today, seqNum)

    // 获取顾客信息
    let fallbackUser
    if (!customer_name && userId) {
      const user = await UserModel.findById(userId)
      fallbackUser = { userId: userId.toString(), nickname: user?.nickname, phone: user?.phone }
    }
    const resolvedCustomer = resolveAppointmentCustomer(
      { customer_id, customer_name, customer_phone },
      fallbackUser,
    )

    await AppointmentModel.create(
      buildPendingAppointmentRecord(
        {
          appointmentId,
          merchantId: merchant_id,
          staffId,
          staffName,
          serviceId: service_id,
          serviceName: service.name,
          date,
          startTime: start_time,
          endTime,
          timeline,
          sequenceNumber: seqNum,
        },
        {
          customerId: resolvedCustomer.customerId,
          customerName: resolvedCustomer.customerName,
          customerPhone: resolvedCustomer.customerPhone,
        },
        note,
      ),
    )

    respondSuccess(ctx, '预约创建成功', { appointment_id: appointmentId, status: 'pending' })
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
  const merchantBindingCheck = validateMerchantBinding(role, merchant_id, user.merchant_id)
  if (!merchantBindingCheck.allowed) {
    respondError(ctx, merchantBindingCheck.code!, merchantBindingCheck.message!)
    return
  }

  if (merchant_id) query.merchant_id = merchant_id
  else if (user.merchant_id) query.merchant_id = user.merchant_id
  else if (role === 'super_admin') {
    // 超管未指定 merchant_id 时查看全量预约
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
    respondAppointmentNotFound(ctx)
    return
  }

  const normalizedAppointment = await normalizeAppointmentStaffName(apt.toObject ? apt.toObject() : apt)
  respondSuccess(ctx, 'ok', normalizedAppointment)
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
    respondAppointmentNotFound(ctx)
    return
  }

  // 权限检查：顾客只能修改自己的预约
  const updateAccessCheck = validateCustomerAppointmentAccess(user.role, apt.customer_id?.toString(), user._id?.toString())
  if (!updateAccessCheck.allowed) {
    respondForbidden(ctx, updateAccessCheck.message)
    return
  }

  const updateCheck = validateAppointmentTransition('update', apt.status)
  if (!updateCheck.allowed) {
    respondError(ctx, updateCheck.code!, updateCheck.message!)
    return
  }

  // 如果修改了时间或服务，需要重新生成 timeline
  const updateData: Record<string, any> = { ...body }
  if (body.service_id || body.start_time) {
    const service = body.service_id
      ? await ServiceModel.findOne({ service_id: body.service_id })
      : await ServiceModel.findOne({ service_id: apt.service_id })
    const newStartTime = body.start_time || apt.start_time

    if (!service) {
      respondServiceNotFound(ctx)
      return
    }

    updateData.service_id = service.service_id
    updateData.service_name = service.name
    updateData.timeline = generateTimeline(
      service.stages.map(s => ({ name: s.name, duration: s.duration, staff_busy: s.staff_busy })),
      newStartTime,
    )
    updateData.end_time = updateData.timeline[updateData.timeline.length - 1]?.end || newStartTime
    updateData.start_time = newStartTime
  }

  // 修改后状态重置为 pending
  updateData.status = getAppointmentNextStatus('update')

  await AppointmentModel.updateOne({ appointment_id: id }, updateData)
  respondSuccess(ctx, getAppointmentActionSuccessMessage('update'))
}

/**
 * 取消预约
 */
export async function cancelAppointment(ctx: Context) {
  const { id } = ctx.params
  const user = ctx.state.user

  const apt = await AppointmentModel.findOne({ appointment_id: id })
  if (!apt) {
    respondAppointmentNotFound(ctx)
    return
  }

  const cancelAccessCheck = validateCustomerAppointmentAccess(user.role, apt.customer_id?.toString(), user._id?.toString())
  if (!cancelAccessCheck.allowed) {
    respondForbidden(ctx, cancelAccessCheck.message)
    return
  }

  const cancelCheck = validateAppointmentTransition('cancel', apt.status)
  if (!cancelCheck.allowed) {
    respondError(ctx, cancelCheck.code!, cancelCheck.message!)
    return
  }

  await AppointmentModel.updateOne(
    { appointment_id: id },
    { status: getAppointmentNextStatus('cancel') },
  )

  // TODO: 发送取消通知

  respondSuccess(ctx, getAppointmentActionSuccessMessage('cancel'))
}

/**
 * 确认预约
 */
export async function confirmAppointment(ctx: Context) {
  const { id } = ctx.params

  const apt = await AppointmentModel.findOne({ appointment_id: id })
  if (!apt) {
    respondAppointmentNotFound(ctx)
    return
  }

  const confirmCheck = validateAppointmentTransition('confirm', apt.status)
  if (!confirmCheck.allowed) {
    respondError(ctx, confirmCheck.code!, confirmCheck.message!)
    return
  }

  await AppointmentModel.updateOne({ appointment_id: id }, { status: getAppointmentNextStatus('confirm') })

  // TODO: 发送确认通知给顾客

  respondSuccess(ctx, getAppointmentActionSuccessMessage('confirm'))
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
    respondServiceNotFound(ctx)
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
  const merchant = await MerchantModel.findOne({ merchant_id })
  if (shouldResetDailyCounter(merchant?.counter_date, date)) {
    await MerchantModel.updateOne({ merchant_id }, buildDailyCounterResetUpdate(date))
  }
  const incremented = await MerchantModel.findOneAndUpdate(
    { merchant_id, counter_date: date },
    { $inc: { daily_counter: 1 } },
    { returnDocument: 'after' },
  )
  const seqNum = resolveDailySequenceNumber(incremented?.daily_counter)
  const appointmentId = formatAppointmentId(date, seqNum)

  const staff = await StaffModel.findOne({ merchant_id, is_active: true }).sort({ create_time: 1 })
  const defaultStaffId = staff?.staff_id || merchant?.owner_id || `${merchant_id}_owner`
  const ownerName = await resolveOwnerRealName(merchant?.owner_id, merchant?.name)
  const defaultStaffName = staff?.name || ownerName

  const apt = await AppointmentModel.create(
    buildWalkInAppointmentRecord(
      {
        appointmentId,
        merchantId: merchant_id,
        staffId: defaultStaffId,
        staffName: defaultStaffName,
        serviceId: service.service_id,
        serviceName: service.name,
        date,
        startTime,
        endTime,
        timeline,
        sequenceNumber: seqNum,
      },
      {
        customerName: customer_name,
        customerPhone: customer_phone,
      },
    ),
  )

  respondSuccess(ctx, '散客登记成功', { appointment_id: apt.appointment_id })
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
    respondAppointmentNotFound(ctx)
    return
  }

  const startCheck = validateAppointmentTransition('start_service', apt.status)
  if (!startCheck.allowed) {
    respondError(ctx, startCheck.code!, startCheck.message!)
    return
  }

  const updateData: Record<string, any> = { status: getAppointmentNextStatus('start_service') }
  if (duration) {
    updateData.actual_duration = duration
    // 重新计算 timeline
    const service = await ServiceModel.findOne({ service_id: apt.service_id })
    if (service) {
      const recalculated = recalculateTimelineByActualDuration(
        apt.start_time,
        service.stages,
        service.total_duration,
        duration,
        apt.end_time,
      )
      updateData.timeline = recalculated.timeline
      updateData.end_time = recalculated.endTime
    }
  }

  await AppointmentModel.updateOne({ appointment_id: id }, updateData)

  // TODO: 检查是否影响后续预约并发送通知

  respondSuccess(ctx, getAppointmentActionSuccessMessage('start_service'))
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
    respondAppointmentNotFound(ctx)
    return
  }

  const completeCheck = validateAppointmentTransition('complete_service', apt.status)
  if (!completeCheck.allowed) {
    respondError(ctx, completeCheck.code!, completeCheck.message!)
    return
  }

  // 更新预约状态
  await AppointmentModel.updateOne({ appointment_id: id }, { status: getAppointmentNextStatus('complete_service') })

  // 创建交易记录
  await TransactionModel.create(
    buildCompleteServiceTransaction(generateShortId('TX'), apt as any, {
      total_amount,
      payment_method,
      items,
      note,
    }),
  )

  // 更新顾客消费统计
  if (apt.customer_id) {
    await UserModel.findByIdAndUpdate(apt.customer_id, buildCustomerConsumptionUpdate(total_amount))
  }

  respondSuccess(ctx, getAppointmentActionSuccessMessage('complete_service'))
}

/**
 * 标记未到店（COZE）
 */
export async function markNoShow(ctx: Context) {
  const { id } = ctx.params

  const apt = await AppointmentModel.findOne({ appointment_id: id })
  if (!apt) {
    respondAppointmentNotFound(ctx)
    return
  }

  const noShowCheck = validateAppointmentTransition('mark_no_show', apt.status)
  if (!noShowCheck.allowed) {
    respondError(ctx, noShowCheck.code!, noShowCheck.message!)
    return
  }

  await AppointmentModel.updateOne({ appointment_id: id }, { status: getAppointmentNextStatus('mark_no_show') })
  respondSuccess(ctx, getAppointmentActionSuccessMessage('mark_no_show'))
}
