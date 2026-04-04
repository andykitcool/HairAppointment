import { Context } from 'koa'
import { WechatConfigModel } from '../models'

/**
 * 获取微信配置列表
 */
export async function getWechatConfigs(ctx: Context) {
  try {
    const configs = await WechatConfigModel.find().sort({ type: 1, create_time: -1 })
    ctx.body = {
      code: 0,
      message: 'ok',
      data: configs.map(c => ({
        _id: c._id,
        type: c.type,
        appid: c.appid,
        token: c.token ? '***已设置***' : '',
        encoding_aes_key: c.encoding_aes_key ? '***已设置***' : '',
        is_active: c.is_active,
        create_time: c.create_time,
        update_time: c.update_time,
      })),
    }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}

/**
 * 获取单个微信配置
 */
export async function getWechatConfigById(ctx: Context) {
  try {
    const { id } = ctx.params
    const config = await WechatConfigModel.findById(id)
    if (!config) {
      ctx.body = { code: 404, message: '配置不存在', data: null }
      return
    }
    ctx.body = {
      code: 0,
      message: 'ok',
      data: {
        _id: config._id,
        type: config.type,
        appid: config.appid,
        app_secret: config.app_secret,
        token: config.token || '',
        encoding_aes_key: config.encoding_aes_key || '',
        is_active: config.is_active,
        create_time: config.create_time,
        update_time: config.update_time,
      },
    }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}

/**
 * 创建微信配置
 */
export async function createWechatConfig(ctx: Context) {
  try {
    const { type, appid, app_secret, token, encoding_aes_key } = ctx.request.body as {
      type: 'mp' | 'service'
      appid: string
      app_secret: string
      token?: string
      encoding_aes_key?: string
    }

    if (!type || !appid || !app_secret) {
      ctx.body = { code: 400, message: '缺少必填参数', data: null }
      return
    }

    // 检查是否已存在
    const existing = await WechatConfigModel.findOne({ appid })
    if (existing) {
      ctx.body = { code: 400, message: '该AppID已存在', data: null }
      return
    }

    const config = await WechatConfigModel.create({
      type,
      appid,
      app_secret,
      token: token || '',
      encoding_aes_key: encoding_aes_key || '',
      is_active: true,
    })

    ctx.body = {
      code: 0,
      message: '创建成功',
      data: {
        _id: config._id,
        type: config.type,
        appid: config.appid,
        is_active: config.is_active,
      },
    }
  } catch (err: any) {
    console.error('[createWechatConfig Error]', err)
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}

/**
 * 更新微信配置
 */
export async function updateWechatConfig(ctx: Context) {
  try {
    const { id } = ctx.params
    const { app_secret, token, encoding_aes_key, is_active } = ctx.request.body as {
      app_secret?: string
      token?: string
      encoding_aes_key?: string
      is_active?: boolean
    }

    const config = await WechatConfigModel.findById(id)
    if (!config) {
      ctx.body = { code: 404, message: '配置不存在', data: null }
      return
    }

    const updateData: any = {}
    if (app_secret !== undefined) updateData.app_secret = app_secret
    if (token !== undefined) updateData.token = token
    if (encoding_aes_key !== undefined) updateData.encoding_aes_key = encoding_aes_key
    if (is_active !== undefined) updateData.is_active = is_active
    updateData.update_time = new Date()

    await WechatConfigModel.findByIdAndUpdate(id, updateData)

    ctx.body = { code: 0, message: '更新成功', data: null }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}

/**
 * 删除微信配置
 */
export async function deleteWechatConfig(ctx: Context) {
  try {
    const { id } = ctx.params
    const config = await WechatConfigModel.findById(id)
    if (!config) {
      ctx.body = { code: 404, message: '配置不存在', data: null }
      return
    }

    await WechatConfigModel.findByIdAndDelete(id)
    ctx.body = { code: 0, message: '删除成功', data: null }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}

/**
 * 获取当前激活的服务号配置（内部使用）
 */
export async function getActiveServiceConfig(): Promise<{ appid: string; app_secret: string; token: string } | null> {
  const config = await WechatConfigModel.findOne({ type: 'service', is_active: true })
  if (!config) return null
  return {
    appid: config.appid,
    app_secret: config.app_secret,
    token: config.token || '',
  }
}

/**
 * 获取当前激活的小程序配置（内部使用）
 */
export async function getActiveMpConfig(): Promise<{ appid: string; app_secret: string } | null> {
  const config = await WechatConfigModel.findOne({ type: 'mp', is_active: true })
  if (!config) return null
  return {
    appid: config.appid,
    app_secret: config.app_secret,
  }
}
