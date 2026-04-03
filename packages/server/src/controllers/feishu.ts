import { Context } from 'koa'
import { SyncLogModel } from '../models'

/**
 * 飞书 Webhook 回调
 */
export async function webhook(ctx: Context) {
  const body = ctx.request.body as any

  // TODO: 验证飞书签名
  // TODO: 根据 webhook 事件处理飞书数据变更
  // TODO: 同步到本地数据库

  ctx.body = { code: 0, message: 'ok', data: null }
}

/**
 * 手动触发同步
 */
export async function manualSync(ctx: Context) {
  const { merchantId } = ctx.params

  // TODO: 从本地同步到飞书

  ctx.body = { code: 0, message: '同步已触发', data: null }
}
