"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRevenueStats = void 0;
const models_1 = require("../models");
/**
 * 营收统计
 */
async function getRevenueStats(ctx) {
    const { merchant_id, start_date, end_date } = ctx.query;
    const user = ctx.state.user;
    const mid = merchant_id || user.merchant_id;
    if (!mid) {
        ctx.body = { code: 400, message: '缺少 merchant_id', data: null };
        return;
    }
    try {
        const today = new Date();
        const todayStr = today.toISOString().slice(0, 10);
        const start = start_date || todayStr;
        const end = end_date || todayStr;
        // 总营收
        const revenueResult = await models_1.TransactionModel.aggregate([
            { $match: { merchant_id: mid, transaction_date: { $gte: start, $lte: end } } },
            { $group: { _id: null, total: { $sum: '$total_amount' }, count: { $sum: 1 } } },
        ]);
        const total_revenue = revenueResult[0]?.total || 0;
        const total_transactions = revenueResult[0]?.count || 0;
        // 预约统计
        const aptResult = await models_1.AppointmentModel.aggregate([
            { $match: { merchant_id: mid, date: { $gte: start, $lte: end } } },
            { $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                } },
        ]);
        const total_appointments = aptResult.reduce((sum, r) => sum + r.count, 0);
        const completed_appointments = aptResult.find((r) => r._id === 'completed')?.count || 0;
        const cancelled_appointments = aptResult.find((r) => r._id === 'cancelled')?.count || 0;
        // 每日营收
        const dailyRevenue = await models_1.TransactionModel.aggregate([
            { $match: { merchant_id: mid, transaction_date: { $gte: start, $lte: end } } },
            { $group: { _id: '$transaction_date', revenue: { $sum: '$total_amount' } } },
            { $sort: { _id: 1 } },
        ]);
        // 服务排行
        const serviceRanking = await models_1.TransactionModel.aggregate([
            { $match: { merchant_id: mid, transaction_date: { $gte: start, $lte: end } } },
            { $unwind: '$items' },
            { $group: {
                    _id: '$items.service_name',
                    count: { $sum: '$items.quantity' },
                    revenue: { $sum: '$items.amount' },
                } },
            { $sort: { revenue: -1 } },
        ]);
        ctx.body = {
            code: 0,
            message: 'ok',
            data: {
                total_revenue,
                total_transactions,
                total_appointments,
                completed_appointments,
                cancelled_appointments,
                daily_revenue: dailyRevenue.map((r) => ({ date: r._id, revenue: r.revenue })),
                service_ranking: serviceRanking.map((r) => ({
                    service_name: r._id,
                    count: r.count,
                    revenue: r.revenue,
                })),
            },
        };
    }
    catch (err) {
        ctx.status = 500;
        ctx.body = { code: 500, message: err.message, data: null };
    }
}
exports.getRevenueStats = getRevenueStats;
//# sourceMappingURL=stats.js.map