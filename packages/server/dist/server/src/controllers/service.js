"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteService = exports.updateService = exports.createService = exports.getServices = void 0;
const models_1 = require("../models");
const index_1 = require("../../../shared/src/index");
/**
 * 获取服务列表
 */
async function getServices(ctx) {
    const { merchant_id } = ctx.query;
    if (!merchant_id) {
        ctx.body = { code: 400, message: '缺少 merchant_id', data: null };
        return;
    }
    const list = await models_1.ServiceModel.find({ merchant_id, is_active: true }).sort({ sort_order: 1 });
    ctx.body = { code: 0, message: 'ok', data: list };
}
exports.getServices = getServices;
/**
 * 创建服务
 */
async function createService(ctx) {
    const { merchant_id, name, category, price, total_duration, staff_busy_duration, stages, description } = ctx.request.body;
    if (!merchant_id || !name || !category || !price) {
        ctx.body = { code: 400, message: '缺少必填字段', data: null };
        return;
    }
    try {
        const count = await models_1.ServiceModel.countDocuments({ merchant_id });
        const service = await models_1.ServiceModel.create({
            service_id: index_1.generateShortId('S'),
            merchant_id,
            name,
            category,
            price,
            total_duration: total_duration || 30,
            staff_busy_duration: staff_busy_duration || total_duration || 30,
            stages: stages || [{ name: name, duration: total_duration || 30, staff_busy: true }],
            description,
            is_active: true,
            sort_order: count,
        });
        ctx.body = { code: 0, message: '创建成功', data: { service_id: service.service_id } };
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = { code: 500, message: err.message, data: null };
    }
}
exports.createService = createService;
/**
 * 更新服务
 */
async function updateService(ctx) {
    const { id } = ctx.params;
    const body = ctx.request.body;
    await models_1.ServiceModel.updateOne({ service_id: id }, body);
    ctx.body = { code: 0, message: '更新成功', data: null };
}
exports.updateService = updateService;
/**
 * 删除服务（软删除）
 */
async function deleteService(ctx) {
    const { id } = ctx.params;
    await models_1.ServiceModel.updateOne({ service_id: id }, { is_active: false });
    ctx.body = { code: 0, message: '已下架', data: null };
}
exports.deleteService = deleteService;
//# sourceMappingURL=service.js.map