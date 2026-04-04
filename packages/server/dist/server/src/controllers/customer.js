"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMerchantNote = exports.getCustomers = void 0;
const models_1 = require("../models");
/**
 * 获取顾客列表
 */
async function getCustomers(ctx) {
    const { merchant_id, page = '1', pageSize = '20', keyword } = ctx.query;
    const user = ctx.state.user;
    const mid = merchant_id || user.merchant_id;
    const query = { role: 'customer' };
    if (keyword) {
        query.$or = [
            { nickname: { $regex: keyword, $options: 'i' } },
            { phone: { $regex: keyword } },
            { real_name: { $regex: keyword, $options: 'i' } },
        ];
    }
    const total = await models_1.UserModel.countDocuments(query);
    const list = await models_1.UserModel.find(query)
        .select('-openid -union_id')
        .sort({ last_visit_time: -1 })
        .skip((Number(page) - 1) * Number(pageSize))
        .limit(Number(pageSize));
    ctx.body = {
        code: 0,
        message: 'ok',
        data: { list, total, page: Number(page), pageSize: Number(pageSize) },
    };
}
exports.getCustomers = getCustomers;
/**
 * 更新店家备注
 */
async function updateMerchantNote(ctx) {
    const { id } = ctx.params;
    const { merchant_note } = ctx.request.body;
    await models_1.UserModel.findByIdAndUpdate(id, { merchant_note });
    ctx.body = { code: 0, message: '更新成功', data: null };
}
exports.updateMerchantNote = updateMerchantNote;
//# sourceMappingURL=customer.js.map