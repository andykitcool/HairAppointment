import { Context } from 'koa'
import { TransactionModel, AppointmentModel } from '../models/index.js'
import { buildRevenueStatsData, resolveStatsDateRange } from '../domain/stats/rules.js'

/**
 * 营收统计
 */
export async function getRevenueStats(ctx: Context) {
  const { merchant_id, start_date, end_date } = ctx.query as any
  const user = ctx.state.user
  const mid = merchant_id || user.merchant_id

  if (!mid) {
    ctx.body = { code: 400, message: '缺少 merchant_id', data: null }
    return
  }

  try {
    const range = resolveStatsDateRange(start_date, end_date)
    const { start, end } = range

    // 总营收
    const revenueResult = await TransactionModel.aggregate([
      { $match: { merchant_id: mid, transaction_date: { $gte: start, $lte: end } } },
      { $group: { _id: null, total: { $sum: '$total_amount' }, count: { $sum: 1 } } },
    ])
    // 预约统计
    const aptResult = await AppointmentModel.aggregate([
      { $match: { merchant_id: mid, date: { $gte: start, $lte: end } } },
      { $group: {
        _id: '$status',
        count: { $sum: 1 },
      } },
    ])

    // 每日营收
    const dailyRevenue = await TransactionModel.aggregate([
      { $match: { merchant_id: mid, transaction_date: { $gte: start, $lte: end } } },
      { $group: { _id: '$transaction_date', revenue: { $sum: '$total_amount' } } },
      { $sort: { _id: 1 } },
    ])

    // 服务排行
    const serviceRanking = await TransactionModel.aggregate([
      { $match: { merchant_id: mid, transaction_date: { $gte: start, $lte: end } } },
      { $unwind: '$items' },
      { $group: {
        _id: '$items.service_name',
        count: { $sum: '$items.quantity' },
        revenue: { $sum: '$items.amount' },
      } },
      { $sort: { revenue: -1 } },
    ])

    ctx.body = {
      code: 0,
      message: 'ok',
      data: buildRevenueStatsData(revenueResult, aptResult, dailyRevenue, serviceRanking),
    }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}
