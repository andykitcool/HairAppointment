"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markNoShow = exports.completeService = exports.startService = exports.walkIn = exports.confirmAppointment = exports.cancelAppointment = exports.updateAppointment = exports.getAppointmentDetail = exports.getAppointments = exports.createAppointment = exports.getAvailableSlots = void 0;
const models_1 = require("../models");
const index_1 = require("../../../shared/src/index");
/**
 * 查询可用时间段
 */
async function getAvailableSlots(ctx) {
    const { merchant_id, staff_id, date, service_id } = ctx.query;
    if (!merchant_id || !date) {
        ctx.body = { code: 400, message: '缺少 merchant_id 或 date', data: null };
        return;
    }
    try {
        // 获取营业时间
        const merchant = await models_1.MerchantModel.findOne({ merchant_id });
        if (!merchant) {
            ctx.body = { code: 404, message: '商户不存在', data: null };
            return;
        }
        // 检查全天打烊
        const fullDayClosed = await models_1.ShopClosedPeriodModel.findOne({
            merchant_id,
            date,
            type: 'full_day',
        });
        if (fullDayClosed) {
            ctx.body = { code: 0, message: 'ok', data: { slots: [], closed: true } };
            return;
        }
        // 计算有效营业时间（含延长）
        let endHour = merchant.business_hours.end;
        if (merchant.extended_hours) {
            const ext = merchant.extended_hours.find((e) => date >= e.start_date && date <= e.end_date);
            if (ext && ext.extended_end > endHour) {
                endHour = ext.extended_end;
            }
        }
        // 获取段打烊
        const timeRanges = await models_1.ShopClosedPeriodModel.find({
            merchant_id,
            date,
            type: 'time_range',
        });
        // 获取该发型师当天已有预约
        const existingAppointments = await models_1.AppointmentModel.find({
            merchant_id,
            staff_id: staff_id || merchant.owner_id,
            date,
            status: { $in: ['confirmed', 'in_progress'] },
        });
        // 获取服务信息计算时长
        let serviceDuration = 30; // 默认 30 分钟
        if (service_id) {
            const service = await models_1.ServiceModel.findOne({ service_id });
            if (service)
                serviceDuration = service.total_duration;
        }
        // 生成时间 slots（每 15 分钟一个）
        const slots = index_1.generateTimeSlots(merchant.business_hours.start, endHour, 15);
        // 标记每个 slot 是否可用
        const availableSlots = slots.map((slot) => {
            let available = true;
            // 检查是否在段打烊时间内
            for (const range of timeRanges) {
                if (index_1.isTimeOverlap(slot.start, slot.end, range.start_time, range.end_time)) {
                    available = false;
                    break;
                }
            }
            // 检查是否与已有预约冲突
            if (available) {
                for (const apt of existingAppointments) {
                    // 预约结束时间
                    const aptEndTime = apt.end_time;
                    // 新预约结束时间
                    const newEndMinutes = index_1.timeToMinutes(slot.start) + serviceDuration;
                    const newEndTime = `${String(Math.floor(newEndMinutes / 60)).padStart(2, '0')}:${String(newEndMinutes % 60).padStart(2, '0')}`;
                    // 只检查忙碌阶段
                    for (const stage of apt.timeline) {
                        if (!stage.staff_busy)
                            continue;
                        if (index_1.isTimeOverlap(slot.start, newEndTime, stage.start, stage.end)) {
                            available = false;
                            break;
                        }
                    }
                    if (!available)
                        break;
                }
            }
            // 检查是否已过当前时间
            if (available && date === index_1.formatDate(new Date())) {
                const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
                if (index_1.timeToMinutes(slot.start) <= nowMinutes) {
                    available = false;
                }
            }
            return { ...slot, available };
        });
        ctx.body = {
            code: 0,
            message: 'ok',
            data: { slots: availableSlots, closed: false, business_hours: { start: merchant.business_hours.start, end: endHour } },
        };
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = { code: 500, message: err.message, data: null };
    }
}
exports.getAvailableSlots = getAvailableSlots;
/**
 * 创建预约
 */
async function createAppointment(ctx) {
    const { merchant_id, service_id, date, start_time, customer_id, customer_name, customer_phone, note } = ctx.request.body;
    const userId = ctx.state.user._id;
    if (!merchant_id || !service_id || !date || !start_time) {
        ctx.body = { code: 400, message: '缺少必填字段', data: null };
        return;
    }
    try {
        const merchant = await models_1.MerchantModel.findOne({ merchant_id });
        if (!merchant) {
            ctx.body = { code: 404, message: '商户不存在', data: null };
            return;
        }
        const service = await models_1.ServiceModel.findOne({ service_id });
        if (!service) {
            ctx.body = { code: 404, message: '服务不存在', data: null };
            return;
        }
        // 获取发型师（Phase 1 默认店长本人）
        const staff = await models_1.StaffModel.findOne({ merchant_id, is_active: true }).sort({ create_time: 1 });
        const staffId = staff?.staff_id || '';
        const staffName = staff?.name || merchant.name;
        // 生成时间线
        const timeline = index_1.generateTimeline(service.stages.map(s => ({ name: s.name, duration: s.duration, staff_busy: s.staff_busy })), start_time);
        const endTime = timeline[timeline.length - 1]?.end || start_time;
        // 冲突检测：检查忙碌阶段
        const busyRanges = index_1.getBusyRanges(timeline);
        for (const busy of busyRanges) {
            const existing = await models_1.AppointmentModel.find({
                merchant_id,
                staff_id: staffId,
                date,
                status: { $in: ['confirmed', 'in_progress'] },
            });
            for (const apt of existing) {
                for (const stage of apt.timeline) {
                    if (!stage.staff_busy)
                        continue;
                    if (index_1.isTimeOverlap(busy.start, busy.end, stage.start, stage.end)) {
                        ctx.body = { code: 409, message: `与预约 ${apt.appointment_id} 时间冲突`, data: null };
                        return;
                    }
                }
            }
        }
        // 原子生成 appointment_id
        const today = date;
        const prefix = today.replace(/-/g, '');
        // 重置计数器（如果日期不匹配）
        if (merchant.counter_date !== today) {
            await models_1.MerchantModel.updateOne({ merchant_id }, { $set: { counter_date: today, daily_counter: 0 } });
        }
        const incremented = await models_1.MerchantModel.findOneAndUpdate({ merchant_id, counter_date: today }, { $inc: { daily_counter: 1 } }, { returnDocument: 'after' });
        const seqNum = incremented?.daily_counter || 1;
        const appointmentId = `${prefix}-${String(seqNum).padStart(3, '0')}`;
        // 获取顾客信息
        let custName = customer_name;
        let custId = customer_id;
        let custPhone = customer_phone;
        if (!custName && userId) {
            const user = await models_1.UserModel.findById(userId);
            custName = user?.nickname || '顾客';
            custId = userId.toString();
            custPhone = user?.phone;
        }
        const appointment = await models_1.AppointmentModel.create({
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
        });
        ctx.body = { code: 0, message: '预约创建成功', data: { appointment_id: appointmentId, status: 'pending' } };
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = { code: 500, message: err.message, data: null };
    }
}
exports.createAppointment = createAppointment;
/**
 * 获取预约列表
 */
async function getAppointments(ctx) {
    const { merchant_id, date, status, page = '1', pageSize = '20' } = ctx.query;
    const user = ctx.state.user;
    const query = {};
    if (merchant_id)
        query.merchant_id = merchant_id;
    else if (user.merchant_id)
        query.merchant_id = user.merchant_id;
    else
        query.customer_id = user._id;
    if (date)
        query.date = date;
    if (status)
        query.status = status;
    const total = await models_1.AppointmentModel.countDocuments(query);
    const list = await models_1.AppointmentModel.find(query)
        .sort({ create_time: -1 })
        .skip((Number(page) - 1) * Number(pageSize))
        .limit(Number(pageSize));
    ctx.body = {
        code: 0,
        message: 'ok',
        data: { list, total, page: Number(page), pageSize: Number(pageSize) },
    };
}
exports.getAppointments = getAppointments;
/**
 * 获取预约详情
 */
async function getAppointmentDetail(ctx) {
    const { id } = ctx.params;
    const apt = await models_1.AppointmentModel.findOne({ appointment_id: id });
    if (!apt) {
        ctx.body = { code: 404, message: '预约不存在', data: null };
        return;
    }
    ctx.body = { code: 0, message: 'ok', data: apt };
}
exports.getAppointmentDetail = getAppointmentDetail;
/**
 * 修改预约
 */
async function updateAppointment(ctx) {
    const { id } = ctx.params;
    const body = ctx.request.body;
    const user = ctx.state.user;
    const apt = await models_1.AppointmentModel.findOne({ appointment_id: id });
    if (!apt) {
        ctx.body = { code: 404, message: '预约不存在', data: null };
        return;
    }
    // 权限检查：顾客只能修改自己的预约
    if (user.role === 'customer' && apt.customer_id?.toString() !== user._id?.toString()) {
        ctx.body = { code: 403, message: '无权操作', data: null };
        return;
    }
    // 只有 pending/confirmed 可修改
    if (!['pending', 'confirmed'].includes(apt.status)) {
        ctx.body = { code: 400, message: '当前状态不可修改', data: null };
        return;
    }
    // 如果修改了时间或服务，需要重新生成 timeline
    let updateData = { ...body };
    if (body.service_id || body.start_time) {
        const service = body.service_id
            ? await models_1.ServiceModel.findOne({ service_id: body.service_id })
            : await models_1.ServiceModel.findOne({ service_id: apt.service_id });
        const newStartTime = body.start_time || apt.start_time;
        if (service) {
            updateData.service_id = service.service_id;
            updateData.service_name = service.name;
            updateData.timeline = index_1.generateTimeline(service.stages.map(s => ({ name: s.name, duration: s.duration, staff_busy: s.staff_busy })), newStartTime);
            updateData.end_time = updateData.timeline[updateData.timeline.length - 1]?.end || newStartTime;
            updateData.start_time = newStartTime;
        }
    }
    // 修改后状态重置为 pending
    updateData.status = 'pending';
    await models_1.AppointmentModel.updateOne({ appointment_id: id }, updateData);
    ctx.body = { code: 0, message: '预约已修改', data: null };
}
exports.updateAppointment = updateAppointment;
/**
 * 取消预约
 */
async function cancelAppointment(ctx) {
    const { id } = ctx.params;
    const user = ctx.state.user;
    const apt = await models_1.AppointmentModel.findOne({ appointment_id: id });
    if (!apt) {
        ctx.body = { code: 404, message: '预约不存在', data: null };
        return;
    }
    if (user.role === 'customer' && apt.customer_id?.toString() !== user._id?.toString()) {
        ctx.body = { code: 403, message: '无权操作', data: null };
        return;
    }
    if (!['pending', 'confirmed'].includes(apt.status)) {
        ctx.body = { code: 400, message: '当前状态不可取消', data: null };
        return;
    }
    await models_1.AppointmentModel.updateOne({ appointment_id: id }, { status: 'cancelled' });
    // TODO: 发送取消通知
    ctx.body = { code: 0, message: '预约已取消', data: null };
}
exports.cancelAppointment = cancelAppointment;
/**
 * 确认预约
 */
async function confirmAppointment(ctx) {
    const { id } = ctx.params;
    const apt = await models_1.AppointmentModel.findOne({ appointment_id: id });
    if (!apt) {
        ctx.body = { code: 404, message: '预约不存在', data: null };
        return;
    }
    if (apt.status !== 'pending') {
        ctx.body = { code: 400, message: '只有待确认的预约可以确认', data: null };
        return;
    }
    await models_1.AppointmentModel.updateOne({ appointment_id: id }, { status: 'confirmed' });
    // TODO: 发送确认通知给顾客
    ctx.body = { code: 0, message: '预约已确认', data: null };
}
exports.confirmAppointment = confirmAppointment;
/**
 * 散客登记（COZE）
 */
async function walkIn(ctx) {
    const { merchant_id, service_name, customer_name, customer_phone, duration } = ctx.request.body;
    // 模糊匹配服务
    const service = await models_1.ServiceModel.findOne({
        merchant_id,
        name: { $regex: service_name, $options: 'i' },
        is_active: true,
    });
    if (!service) {
        ctx.body = { code: 404, message: '服务不存在', data: null };
        return;
    }
    const now = new Date();
    const startTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const date = index_1.formatDate(now);
    const timeline = index_1.generateTimeline(service.stages.map(s => ({ name: s.name, duration: s.duration, staff_busy: s.staff_busy })), startTime);
    const endTime = timeline[timeline.length - 1]?.end || startTime;
    // 生成 appointment_id
    const prefix = date.replace(/-/g, '');
    const merchant = await models_1.MerchantModel.findOne({ merchant_id });
    if (merchant?.counter_date !== date) {
        await models_1.MerchantModel.updateOne({ merchant_id }, { $set: { counter_date: date, daily_counter: 0 } });
    }
    const incremented = await models_1.MerchantModel.findOneAndUpdate({ merchant_id, counter_date: date }, { $inc: { daily_counter: 1 } }, { returnDocument: 'after' });
    const seqNum = incremented?.daily_counter || 1;
    const staff = await models_1.StaffModel.findOne({ merchant_id, is_active: true }).sort({ create_time: 1 });
    const apt = await models_1.AppointmentModel.create({
        appointment_id: `${prefix}-${String(seqNum).padStart(3, '0')}`,
        merchant_id,
        customer_name: customer_name || '散客',
        customer_phone,
        staff_id: staff?.staff_id || '',
        staff_name: staff?.name || '',
        service_id: service.service_id,
        service_name: service.name,
        date,
        start_time: startTime,
        end_time: endTime,
        status: 'in_progress',
        source: 'coze',
        timeline,
        sequence_num: seqNum,
    });
    ctx.body = { code: 0, message: '散客登记成功', data: { appointment_id: apt.appointment_id } };
}
exports.walkIn = walkIn;
/**
 * 开始服务（COZE）
 */
async function startService(ctx) {
    const { id } = ctx.params;
    const { duration } = ctx.request.body;
    const apt = await models_1.AppointmentModel.findOne({ appointment_id: id });
    if (!apt) {
        ctx.body = { code: 404, message: '预约不存在', data: null };
        return;
    }
    if (apt.status !== 'confirmed') {
        ctx.body = { code: 400, message: '只有已确认的预约可以开始服务', data: null };
        return;
    }
    const updateData = { status: 'in_progress' };
    if (duration) {
        updateData.actual_duration = duration;
        // 重新计算 timeline
        const service = await models_1.ServiceModel.findOne({ service_id: apt.service_id });
        if (service) {
            const ratio = duration / service.total_duration;
            const adjustedStages = service.stages.map(s => ({
                stage_name: s.name,
                duration: s.duration,
                start: apt.start_time,
                end: apt.start_time,
                staff_busy: s.staff_busy,
            }));
            // 简单处理：按比例调整
            let currentMinutes = index_1.timeToMinutes(apt.start_time);
            for (const stage of adjustedStages) {
                stage.start = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;
                currentMinutes += Math.round(stage.duration * ratio) || stage.duration;
                stage.end = `${String(Math.floor(currentMinutes / 60)).padStart(2, '0')}:${String(currentMinutes % 60).padStart(2, '0')}`;
            }
            updateData.timeline = adjustedStages;
            updateData.end_time = adjustedStages[adjustedStages.length - 1]?.end || apt.end_time;
        }
    }
    await models_1.AppointmentModel.updateOne({ appointment_id: id }, updateData);
    // TODO: 检查是否影响后续预约并发送通知
    ctx.body = { code: 0, message: '服务已开始', data: null };
}
exports.startService = startService;
/**
 * 完成服务并记账（COZE）
 */
async function completeService(ctx) {
    const { id } = ctx.params;
    const { total_amount, payment_method, items, note } = ctx.request.body;
    const apt = await models_1.AppointmentModel.findOne({ appointment_id: id });
    if (!apt) {
        ctx.body = { code: 404, message: '预约不存在', data: null };
        return;
    }
    if (apt.status !== 'in_progress') {
        ctx.body = { code: 400, message: '只有服务中的预约可以完成', data: null };
        return;
    }
    // 更新预约状态
    await models_1.AppointmentModel.updateOne({ appointment_id: id }, { status: 'completed' });
    // 创建交易记录
    const txItems = items || [{ service_name: apt.service_name, amount: total_amount || 0, quantity: 1 }];
    await models_1.TransactionModel.create({
        transaction_id: index_1.generateShortId('TX'),
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
    });
    // 更新顾客消费统计
    if (apt.customer_id) {
        await models_1.UserModel.findByIdAndUpdate(apt.customer_id, {
            $inc: { visit_count: 1, total_spending: total_amount || 0 },
            $set: { last_visit_time: new Date() },
        });
    }
    ctx.body = { code: 0, message: '服务完成，已记账', data: null };
}
exports.completeService = completeService;
/**
 * 标记未到店（COZE）
 */
async function markNoShow(ctx) {
    const { id } = ctx.params;
    const apt = await models_1.AppointmentModel.findOne({ appointment_id: id });
    if (!apt) {
        ctx.body = { code: 404, message: '预约不存在', data: null };
        return;
    }
    if (apt.status !== 'confirmed') {
        ctx.body = { code: 400, message: '只有已确认的预约可以标记未到', data: null };
        return;
    }
    await models_1.AppointmentModel.updateOne({ appointment_id: id }, { status: 'no_show' });
    ctx.body = { code: 0, message: '已标记未到店', data: null };
}
exports.markNoShow = markNoShow;
//# sourceMappingURL=appointment.js.map