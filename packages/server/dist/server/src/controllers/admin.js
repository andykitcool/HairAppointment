"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewApplication = exports.getApplications = exports.getPlatformStats = exports.updateMerchantStatus = exports.createMerchant = exports.getMerchants = void 0;
const models_1 = require("../models");
const index_1 = require("../../../shared/src/index");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * 获取所有门店列表
 */
async function getMerchants(ctx) {
    const { page = '1', pageSize = '20', status } = ctx.query;
    const query = {};
    if (status)
        query.status = status;
    const total = await models_1.MerchantModel.countDocuments(query);
    const list = await models_1.MerchantModel.find(query)
        .sort({ create_time: -1 })
        .skip((Number(page) - 1) * Number(pageSize))
        .limit(Number(pageSize));
    ctx.body = {
        code: 0,
        message: 'ok',
        data: { list, total, page: Number(page), pageSize: Number(pageSize) },
    };
}
exports.getMerchants = getMerchants;
/**
 * 手动添加门店
 */
async function createMerchant(ctx) {
    const { name, phone, address, description, owner_name, owner_password, owner_phone } = ctx.request.body;
    if (!name || !phone) {
        ctx.body = { code: 400, message: '缺少必填字段', data: null };
        return;
    }
    try {
        // 检查店长电话是否已存在
        if (owner_phone) {
            const existingMerchant = await models_1.MerchantModel.findOne({ phone: owner_phone });
            if (existingMerchant) {
                ctx.body = { code: 400, message: '该店长电话已绑定其他门店', data: null };
                return;
            }
        }
        // 创建商户
        const merchant = await models_1.MerchantModel.create({
            merchant_id: index_1.generateShortId('M'),
            name,
            phone,
            address,
            description,
            status: 'active',
            owner_id: '',
            business_hours: { start: '09:00', end: '21:00' },
            daily_counter: 0,
            counter_date: '',
        });
        // 创建预设服务
        for (const preset of index_1.PRESET_SERVICES) {
            await (await Promise.resolve().then(() => __importStar(require('../models')))).ServiceModel.create({
                service_id: index_1.generateShortId('S'),
                merchant_id: merchant.merchant_id,
                ...preset,
                is_active: true,
                sort_order: index_1.PRESET_SERVICES.indexOf(preset),
            });
        }
        // 如果有店长信息，创建 admin 账号和 user 记录
        let adminAccount = null;
        if (owner_name && owner_password) {
            const passwordHash = await bcryptjs_1.default.hash(owner_password, 10);
            const admin = await models_1.AdminModel.create({
                username: owner_name,
                password_hash: passwordHash,
                real_name: owner_name,
                role: 'owner',
                type: 'merchant',
                is_active: true,
            });
            await models_1.MerchantModel.updateOne({ merchant_id: merchant.merchant_id }, { owner_id: admin._id.toString() });
            adminAccount = {
                username: owner_name,
                password: owner_password
            };
        }
        ctx.body = { code: 0, message: '创建成功', data: { merchant_id: merchant.merchant_id, admin_account: adminAccount } };
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = { code: 500, message: err.message, data: null };
    }
}
exports.createMerchant = createMerchant;
/**
 * 审核门店状态
 */
async function updateMerchantStatus(ctx) {
    const { id } = ctx.params;
    const { status } = ctx.request.body;
    if (!['active', 'inactive', 'rejected'].includes(status)) {
        ctx.body = { code: 400, message: '无效状态', data: null };
        return;
    }
    await models_1.MerchantModel.updateOne({ merchant_id: id }, { status });
    // 如果审核通过，创建预设服务
    if (status === 'active') {
        const merchant = await models_1.MerchantModel.findOne({ merchant_id: id });
        const existingServices = await (await Promise.resolve().then(() => __importStar(require('../models')))).ServiceModel.countDocuments({ merchant_id: id });
        if (existingServices === 0) {
            for (const preset of index_1.PRESET_SERVICES) {
                await (await Promise.resolve().then(() => __importStar(require('../models')))).ServiceModel.create({
                    service_id: index_1.generateShortId('S'),
                    merchant_id: id,
                    ...preset,
                    is_active: true,
                    sort_order: index_1.PRESET_SERVICES.indexOf(preset),
                });
            }
        }
        // 更新用户的 role 为 owner
        if (merchant?.owner_id) {
            await models_1.UserModel.findByIdAndUpdate(merchant.owner_id, { role: 'owner', merchant_id: id });
        }
    }
    ctx.body = { code: 0, message: '更新成功', data: null };
}
exports.updateMerchantStatus = updateMerchantStatus;
/**
 * 更新门店信息
 */
async function updateMerchant(ctx) {
    const { id } = ctx.params;
    const { name, phone, address, description, business_hours } = ctx.request.body;
    try {
        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (address !== undefined) updateData.address = address;
        if (description !== undefined) updateData.description = description;
        if (business_hours) updateData.business_hours = business_hours;
        await models_1.MerchantModel.updateOne({ merchant_id: id }, updateData);
        ctx.body = { code: 0, message: '更新成功', data: null };
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = { code: 500, message: err.message, data: null };
    }
}
exports.updateMerchant = updateMerchant;
/**
 * 删除门店
 */
async function deleteMerchant(ctx) {
    const { id } = ctx.params;
    try {
        // 检查门店是否存在
        const merchant = await models_1.MerchantModel.findOne({ merchant_id: id });
        if (!merchant) {
            ctx.body = { code: 404, message: '门店不存在', data: null };
            return;
        }
        // 只有已停用或已拒绝的门店可以删除
        if (merchant.status !== 'inactive' && merchant.status !== 'rejected') {
            ctx.body = { code: 400, message: '只有已停用或已拒绝的门店可以删除', data: null };
            return;
        }
        // 删除关联数据
        await models_1.ServiceModel.deleteMany({ merchant_id: id });
        await models_1.StaffModel.deleteMany({ merchant_id: id });
        await models_1.AppointmentModel.deleteMany({ merchant_id: id });
        await models_1.TransactionModel.deleteMany({ merchant_id: id });
        // 删除门店
        await models_1.MerchantModel.deleteOne({ merchant_id: id });
        // 删除关联的管理员账号
        if (merchant.owner_id) {
            await models_1.AdminModel.deleteOne({ _id: merchant.owner_id });
        }
        ctx.body = { code: 0, message: '删除成功', data: null };
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = { code: 500, message: err.message, data: null };
    }
}
exports.deleteMerchant = deleteMerchant;
/**
 * 平台级统计
 */
async function getPlatformStats(ctx) {
    const totalMerchants = await models_1.MerchantModel.countDocuments({ status: 'active' });
    const totalCustomers = await models_1.UserModel.countDocuments({ role: 'customer' });
    const totalAppointments = await models_1.AppointmentModel.countDocuments();
    const totalRevenue = await models_1.TransactionModel.aggregate([
        { $group: { _id: null, total: { $sum: '$total_amount' } } },
    ]);
    ctx.body = {
        code: 0,
        message: 'ok',
        data: {
            total_merchants: totalMerchants,
            total_customers: totalCustomers,
            total_appointments: totalAppointments,
            total_revenue: totalRevenue[0]?.total || 0,
        },
    };
}
exports.getPlatformStats = getPlatformStats;
/**
 * 获取入驻申请列表
 */
async function getApplications(ctx) {
    const { page = '1', pageSize = '20' } = ctx.query;
    const total = await models_1.MerchantModel.countDocuments({ status: 'pending' });
    const list = await models_1.MerchantModel.find({ status: 'pending' })
        .sort({ create_time: -1 })
        .skip((Number(page) - 1) * Number(pageSize))
        .limit(Number(pageSize));
    ctx.body = {
        code: 0,
        message: 'ok',
        data: { list, total, page: Number(page), pageSize: Number(pageSize) },
    };
}
exports.getApplications = getApplications;
/**
 * 审核入驻申请
 */
async function reviewApplication(ctx) {
    const { id } = ctx.params;
    const { status, reason } = ctx.request.body;
    if (!['active', 'rejected'].includes(status)) {
        ctx.body = { code: 400, message: '无效状态', data: null };
        return;
    }
    const merchant = await models_1.MerchantModel.findOne({ merchant_id: id });
    if (!merchant) {
        ctx.body = { code: 404, message: '申请不存在', data: null };
        return;
    }
    await models_1.MerchantModel.updateOne({ merchant_id: id }, { status });
    if (status === 'active') {
        // 创建预设服务
        const { ServiceModel } = await Promise.resolve().then(() => __importStar(require('../models')));
        const existingCount = await ServiceModel.countDocuments({ merchant_id: id });
        if (existingCount === 0) {
            for (const preset of index_1.PRESET_SERVICES) {
                await ServiceModel.create({
                    service_id: index_1.generateShortId('S'),
                    merchant_id: id,
                    ...preset,
                    is_active: true,
                    sort_order: index_1.PRESET_SERVICES.indexOf(preset),
                });
            }
        }
        // 更新用户角色
        if (merchant.owner_id) {
            await models_1.UserModel.findByIdAndUpdate(merchant.owner_id, { role: 'owner', merchant_id: id });
        }
    }
    ctx.body = { code: 0, message: status === 'active' ? '审核通过' : '已拒绝', data: null };
}
exports.reviewApplication = reviewApplication;
//# sourceMappingURL=admin.js.map