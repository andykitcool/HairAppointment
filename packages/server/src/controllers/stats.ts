import { Context } from 'koa'
import { TransactionModel, AppointmentModel } from '../models/index.js'
import { buildRevenueStatsData, resolveStatsDateRange } from '../domain/stats/rules.js'

/**
 * 营收统计
 */
export async function getRevenueStats(ctx: Context) {
  const { merchant_id, start_date, end_date } = ctx.query as any
  const user = ctx.state.user
  const role = String(user?.role || '')
  const mid = role === 'super_admin' ? (merchant_id || user.merchant_id) : (user.merchant_id || merchant_id)

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

    const paymentDistribution = await TransactionModel.aggregate([
      { $match: { merchant_id: mid, transaction_date: { $gte: start, $lte: end } } },
      { $group: { _id: '$payment_method', count: { $sum: 1 }, amount: { $sum: '$total_amount' } } },
      { $sort: { amount: -1 } },
    ])

    const dailyAppointments = await AppointmentModel.aggregate([
      { $match: { merchant_id: mid, date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: '$date',
          appointmentCount: { $sum: 1 },
          completedCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0],
            },
          },
          cancelCount: {
            $sum: {
              $cond: [{ $in: ['$status', ['cancelled', 'no_show']] }, 1, 0],
            },
          },
        },
      },
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

    const domainData = buildRevenueStatsData(revenueResult, aptResult, dailyRevenue, serviceRanking)

    const dailyRevenueMap = new Map<string, number>()
    dailyRevenue.forEach((item: any) => {
      dailyRevenueMap.set(String(item._id || ''), Number(item.revenue || 0))
    })

    const dailyAppointmentMap = new Map<
      string,
      { appointmentCount: number; completedCount: number; cancelCount: number }
    >()
    dailyAppointments.forEach((item: any) => {
      dailyAppointmentMap.set(String(item._id || ''), {
        appointmentCount: Number(item.appointmentCount || 0),
        completedCount: Number(item.completedCount || 0),
        cancelCount: Number(item.cancelCount || 0),
      })
    })

    const dailyDateSet = new Set<string>([
      ...Array.from(dailyRevenueMap.keys()),
      ...Array.from(dailyAppointmentMap.keys()),
    ])

    const daily = Array.from(dailyDateSet)
      .sort()
      .map((date) => {
        const apt = dailyAppointmentMap.get(date) || {
          appointmentCount: 0,
          completedCount: 0,
          cancelCount: 0,
        }

        return {
          date,
          amount: dailyRevenueMap.get(date) || 0,
          appointmentCount: apt.appointmentCount,
          completedCount: apt.completedCount,
          cancelCount: apt.cancelCount,
        }
      })

    const summary = {
      totalRevenue: Number(domainData.total_revenue || 0),
      transactionCount: Number(domainData.total_transactions || 0),
      appointmentCount: Number(domainData.total_appointments || 0),
      completedCount: Number(domainData.completed_appointments || 0),
      cancelCount: Number(domainData.cancelled_appointments || 0),
    }

    const serviceRankingCompat = (domainData.service_ranking || []).map((item: any) => ({
      service_name: item.service_name,
      count: Number(item.count || 0),
      amount: Number(item.revenue || 0),
      revenue: Number(item.revenue || 0),
    }))

    const paymentDistributionCompat = paymentDistribution.map((item: any) => ({
      method: String(item._id || 'other'),
      count: Number(item.count || 0),
      amount: Number(item.amount || 0),
    }))

    ctx.body = {
      code: 0,
      message: 'ok',
      data: {
        summary,
        paymentDistribution: paymentDistributionCompat,
        serviceRanking: serviceRankingCompat,
        daily,
        // 兼容新旧字段命名
        ...domainData,
        daily_revenue: domainData.daily_revenue,
        service_ranking: domainData.service_ranking,
      },
    }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}
