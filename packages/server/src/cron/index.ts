import cron from 'node-cron'
import { AppointmentModel, MerchantModel } from '../models'
import { AUTO_CONFIRM_TIMEOUT, SYNC_MAX_RETRY, SyncStatus } from '../../../shared/src/index'

let isRunning = false

/**
 * 初始化定时任务
 */
export function initCronJobs() {
  // 每分钟：自动确认超时预约（5 分钟未操作的 pending 预约）
  cron.schedule('* * * * *', async () => {
    if (isRunning) return
    isRunning = true
    try {
      const fiveMinutesAgo = new Date(Date.now() - AUTO_CONFIRM_TIMEOUT)

      const result = await AppointmentModel.updateMany(
        {
          status: 'pending',
          create_time: { $lte: fiveMinutesAgo },
        },
        { status: 'confirmed' },
      )

      if (result.modifiedCount > 0) {
        console.log(`[Cron] 自动确认了 ${result.modifiedCount} 个预约`)
        // TODO: 发送确认通知给顾客
      }
    } catch (err) {
      console.error('[Cron] 自动确认任务失败:', err)
    } finally {
      isRunning = false
    }
  })

  // 每小时：标记未到店（已过结束时间的 confirmed 预约）
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date()
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

      const result = await AppointmentModel.updateMany(
        {
          status: 'confirmed',
          date: { $lt: today },
        },
        { status: 'no_show' },
      )

      if (result.modifiedCount > 0) {
        console.log(`[Cron] 标记了 ${result.modifiedCount} 个未到店预约`)
      }
    } catch (err) {
      console.error('[Cron] 标记未到店任务失败:', err)
    }
  })

  // 每小时：预约提醒（2 小时内即将开始的预约）
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date()
      const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000)
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
      const in2HoursTime = `${String(in2Hours.getHours()).padStart(2, '0')}:${String(in2Hours.getMinutes()).padStart(2, '0')}`

      const upcomingApts = await AppointmentModel.find({
        status: 'confirmed',
        date: today,
        start_time: { $lte: in2HoursTime },
      })

      // TODO: 发送提醒通知
      if (upcomingApts.length > 0) {
        console.log(`[Cron] 有 ${upcomingApts.length} 个预约即将开始`)
      }
    } catch (err) {
      console.error('[Cron] 预约提醒任务失败:', err)
    }
  })

  // 每日 00:00：重置所有商户的预约计数器
  cron.schedule('0 0 * * *', async () => {
    try {
      await MerchantModel.updateMany(
        {},
        { $set: { daily_counter: 0 } },
      )
      console.log('[Cron] 已重置所有商户的预约计数器')
    } catch (err) {
      console.error('[Cron] 重置计数器任务失败:', err)
    }
  })

  // 每 10 分钟：重试失败的飞书同步
  cron.schedule('*/10 * * * *', async () => {
    try {
      const { SyncLogModel } = await import('../models')
      const failedLogs = await SyncLogModel.find({
        status: SyncStatus.FAILED,
        retry_count: { $lt: SYNC_MAX_RETRY },
      }).limit(50)

      for (const log of failedLogs) {
        // TODO: 重试同步逻辑
        await SyncLogModel.updateOne(
          { _id: log._id },
          { $inc: { retry_count: 1 } },
        )
      }

      if (failedLogs.length > 0) {
        console.log(`[Cron] 重试了 ${failedLogs.length} 个失败的同步任务`)
      }
    } catch (err) {
      console.error('[Cron] 同步重试任务失败:', err)
    }
  })

  console.log('[Cron] 定时任务已初始化')
}
