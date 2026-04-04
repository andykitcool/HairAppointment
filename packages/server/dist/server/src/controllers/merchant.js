"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteExtendedHours = exports.updateExtendedHours = exports.setExtendedHours = exports.deleteClosedPeriod = exports.getClosedPeriods = exports.createClosedPeriod = exports.updateMerchant = exports.getMerchant = void 0;
const models_1 = require("../models");
const models_2 = require("../models");
/**
 * 获取商户信息
 */
async function getMerchant(ctx) {
    const { id } = ctx.params;
    const merchant = await models_1.MerchantModel.findOne({ merchant_id: id });
    if (!merchant) {
        ctx.body = { code: 404, message: '商户不存在', data: null };
        return;
    }
    ctx.body = { code: 0, message: 'ok', data: merchant };
}
exports.getMerchant = getMerchant;
/**
 * 更新商户信息
 */
async function updateMerchant(ctx) {
    const { id } = ctx.params;
    const body = ctx.request.body;
    await models_1.MerchantModel.updateOne({ merchant_id: id }, body);
    ctx.body = { code: 0, message: '更新成功', data: null };
}
exports.updateMerchant = updateMerchant;
/**
 * 创建打烊时段
 */
async function createClosedPeriod(ctx) {
    const { id } = ctx.params;
    const { date, type, start_time, end_time, reason, cancel_appointments, notify_customers } = ctx.request.body;
    const userId = ctx.state.user._id;
    if (!date || !type) {
        ctx.body = { code: 400, message: '缺少必填字段', data: null };
        return;
    }
    const period = await models_1.ShopClosedPeriodModel.create({
        merchant_id: id,
        date,
        type,
        start_time,
        end_time,
        reason,
        cancel_appointments: cancel_appointments || false,
        notify_customers: notify_customers || false,
        created_by: userId.toString(),
    });
    // 如果需要自动取消预约
    if (cancel_appointments) {
        const query = {
            merchant_id: id,
            date,
            status: { $in: ['pending', 'confirmed'] },
        };
        if (type === 'time_range' && start_time && end_time) {
            query.start_time = { $gte: start_time, $lt: end_time };
        }
        await models_2.AppointmentModel.updateMany(query, { status: 'cancelled' });
        // TODO: 发送取消通知
    }
    ctx.body = { code: 0, message: '设置成功', data: { _id: period._id } };
}
exports.createClosedPeriod = createClosedPeriod;
/**
 * 获取打烊时段列表
 */
async function getClosedPeriods(ctx) {
    const { id } = ctx.params;
    const { start_date, end_date } = ctx.query;
    const query = { merchant_id: id };
    if (start_date)
        query.date = { ...query.date, $gte: start_date };
    if (end_date)
        query.date = { ...query.date, $lte: end_date };
    const list = await models_1.ShopClosedPeriodModel.find(query).sort({ date: 1 });
    ctx.body = { code: 0, message: 'ok', data: list };
}
exports.getClosedPeriods = getClosedPeriods;
/**
 * 删除打烊时段
 */
async function deleteClosedPeriod(ctx) {
    const { id, periodId } = ctx.params;
    await models_1.ShopClosedPeriodModel.findByIdAndDelete(periodId);
    ctx.body = { code: 0, message: '已取消打烊', data: null };
}
exports.deleteClosedPeriod = deleteClosedPeriod;
/**
 * 设置延长营业时间
 */
async function setExtendedHours(ctx) {
    const { id } = ctx.params;
    const { start_date, end_date, extended_end } = ctx.request.body;
    if (!start_date || !end_date || !extended_end) {
        ctx.body = { code: 400, message: '缺少必填字段', data: null };
        return;
    }
    await models_1.MerchantModel.updateOne({ merchant_id: id }, { $push: { extended_hours: { start_date, end_date, extended_end } } });
    ctx.body = { code: 0, message: '设置成功', data: null };
}
exports.setExtendedHours = setExtendedHours;
/**
 * 修改延长营业配置
 */
async function updateExtendedHours(ctx) {
    const { id, index } = ctx.params;
    const body = ctx.request.body;
    const idx = Number(index);
    const merchant = await models_1.MerchantModel.findOne({ merchant_id: id });
    if (!merchant?.extended_hours || !merchant.extended_hours[idx]) {
        ctx.body = { code: 404, message: '配置不存在', data: null };
        return;
    }
    const key = `extended_hours.${idx}`;
    await models_1.MerchantModel.updateOne({ merchant_id: id }, { $set: { [`${key}.start_date`]: body.start_date || merchant.extended_hours[idx].start_date,
            [`${key}.end_date`]: body.end_date || merchant.extended_hours[idx].end_date,
            [`${key}.extended_end`]: body.extended_end || merchant.extended_hours[idx].extended_end } });
    ctx.body = { code: 0, message: '更新成功', data: null };
}
exports.updateExtendedHours = updateExtendedHours;
/**
 * 取消延长营业
 */
async function deleteExtendedHours(ctx) {
    const { id, index } = ctx.params;
    const idx = Number(index);
    await models_1.MerchantModel.updateOne({ merchant_id: id }, { $pull: { extended_hours: { $exists: true } } });
    // 使用数组位置删除
    const merchant = await models_1.MerchantModel.findOne({ merchant_id: id });
    if (merchant?.extended_hours) {
        merchant.extended_hours.splice(idx, 1);
        await merchant.save();
    }
    ctx.body = { code: 0, message: '已取消延长营业', data: null };
}
exports.deleteExtendedHours = deleteExtendedHours;
//# sourceMappingURL=merchant.js.map