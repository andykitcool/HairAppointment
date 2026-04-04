"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactions = exports.createTransaction = void 0;
const models_1 = require("../models");
const index_1 = require("../../../shared/src/index");
const index_2 = require("../../../shared/src/index");
/**
 * 创建交易记录
 */
async function createTransaction(ctx) {
    const { merchant_id, appointment_id, customer_id, customer_name, staff_id, total_amount, items, payment_method, note, } = ctx.request.body;
    if (!merchant_id || !customer_name || !staff_id || !total_amount) {
        ctx.body = { code: 400, message: '缺少必填字段', data: null };
        return;
    }
    try {
        const tx = await models_1.TransactionModel.create({
            transaction_id: index_1.generateShortId('TX'),
            merchant_id,
            appointment_id,
            customer_id,
            customer_name,
            staff_id,
            staff_name: ctx.request.body.staff_name || '',
            total_amount,
            items: items || [],
            payment_method: payment_method || 'wechat',
            source: ctx.request.body.source || 'mini_program',
            note,
            transaction_date: ctx.request.body.transaction_date || index_2.formatDate(new Date()),
        });
        ctx.body = { code: 0, message: '记账成功', data: { transaction_id: tx.transaction_id } };
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = { code: 500, message: err.message, data: null };
    }
}
exports.createTransaction = createTransaction;
/**
 * 获取交易列表
 */
async function getTransactions(ctx) {
    const { merchant_id, date, page = '1', pageSize = '20' } = ctx.query;
    const user = ctx.state.user;
    const query = {};
    if (merchant_id)
        query.merchant_id = merchant_id;
    else if (user.merchant_id)
        query.merchant_id = user.merchant_id;
    if (date)
        query.transaction_date = date;
    const total = await models_1.TransactionModel.countDocuments(query);
    const list = await models_1.TransactionModel.find(query)
        .sort({ create_time: -1 })
        .skip((Number(page) - 1) * Number(pageSize))
        .limit(Number(pageSize));
    ctx.body = {
        code: 0,
        message: 'ok',
        data: { list, total, page: Number(page), pageSize: Number(pageSize) },
    };
}
exports.getTransactions = getTransactions;
//# sourceMappingURL=transaction.js.map