import { Context } from 'koa'
import { WechatConfigModel } from '../models/index.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

function ensureMiniProgramCiNodePath() {
  const expectedNodePath = '/usr/local/bin/node'
  if (fs.existsSync(expectedNodePath)) {
    return
  }

  const actualNodePath = process.execPath
  if (!actualNodePath || !fs.existsSync(actualNodePath)) {
    throw new Error('无法定位当前 Node.js 可执行文件')
  }

  const expectedDir = path.dirname(expectedNodePath)
  if (!fs.existsSync(expectedDir)) {
    fs.mkdirSync(expectedDir, { recursive: true })
  }

  try {
    fs.symlinkSync(actualNodePath, expectedNodePath)
  } catch (err: any) {
    if (err?.code !== 'EEXIST') {
      throw err
    }
  }
}

function resolveMiniProgramProjectPath() {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const candidates = [
    path.join(__dirname, '..', '..', '..', '..', 'packages', 'miniapp', 'dist', 'build', 'mp-weixin'),
    path.join(__dirname, '..', '..', '..', '..', 'packages', 'miniapp', 'dist', 'dev', 'mp-weixin'),
    path.join(process.cwd(), 'packages', 'miniapp', 'dist', 'build', 'mp-weixin'),
    path.join(process.cwd(), 'packages', 'miniapp', 'dist', 'dev', 'mp-weixin'),
    path.join(process.cwd(), 'miniapp', 'dist', 'build', 'mp-weixin'),
    path.join(process.cwd(), 'miniapp', 'dist', 'dev', 'mp-weixin'),
  ]

  for (const projectPath of candidates) {
    if (fs.existsSync(path.join(projectPath, 'app.json'))) {
      return projectPath
    }
  }

  return ''
}

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
        app_secret: c.app_secret ? '***已设置***' : '',
        token: c.token ? '***已设置***' : '',
        encoding_aes_key: c.encoding_aes_key ? '***已设置***' : '',
        upload_key: c.upload_key ? '***已设置***' : '',
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
        upload_key: config.upload_key || '',
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
    const { app_secret, token, encoding_aes_key, upload_key, is_active } = ctx.request.body as {
      app_secret?: string
      token?: string
      encoding_aes_key?: string
      upload_key?: string
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
    if (upload_key !== undefined) updateData.upload_key = upload_key
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

/**
 * 上传小程序代码
 */
export async function uploadMiniProgram(ctx: Context) {
  try {
    const { id } = ctx.params
    const { version, desc } = ctx.request.body as { version?: string; desc?: string }

    const config = await WechatConfigModel.findById(id)
    if (!config) {
      ctx.body = { code: 404, message: '配置不存在', data: null }
      return
    }

    if (config.type !== 'mp') {
      ctx.body = { code: 400, message: '仅支持小程序配置', data: null }
      return
    }

    if (!config.upload_key) {
      ctx.body = { code: 400, message: '未配置上传密钥', data: null }
      return
    }

    try {
      ensureMiniProgramCiNodePath()
    } catch (err: any) {
      ctx.body = { code: 500, message: `运行环境缺少 Node 执行入口: ${err.message}`, data: null }
      return
    }

    // 动态导入 miniprogram-ci
    let ci: any
    try {
      const ciModule = await import('miniprogram-ci')
      ci = ciModule.default || ciModule
    } catch {
      ctx.body = { code: 500, message: '请先安装 miniprogram-ci: npm install miniprogram-ci', data: null }
      return
    }

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const projectPath = resolveMiniProgramProjectPath()
    if (!projectPath) {
      ctx.body = { code: 500, message: '未找到可上传的小程序构建目录，请先执行小程序构建（需存在 dist/build/mp-weixin/app.json）', data: null }
      return
    }

    const privateKeyPath = path.join(__dirname, '..', '..', 'temp', `${config.appid}.key`)

    // 确保 temp 目录存在
    const tempDir = path.dirname(privateKeyPath)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // 将密钥写入临时文件
    fs.writeFileSync(privateKeyPath, config.upload_key)

    try {
      const project = new ci.Project({
        appid: config.appid,
        type: 'miniProgram',
        projectPath: projectPath,
        privateKeyPath: privateKeyPath,
        ignores: ['node_modules/**/*'],
      })

      const result = await ci.upload({
        project,
        version: version || '1.0.0',
        desc: desc || '自动上传',
        setting: {
          es6: true,
          es7: true,
          minify: true,
          minifyJS: true,
          minifyWXML: true,
          minifyWXSS: true,
        },
      })

      ctx.body = {
        code: 0,
        message: '上传成功',
        data: result,
      }
    } finally {
      // 清理临时密钥文件
      if (fs.existsSync(privateKeyPath)) {
        fs.unlinkSync(privateKeyPath)
      }
    }
  } catch (err: any) {
    console.error('[uploadMiniProgram Error]', err)
    ctx.status = 500
    ctx.body = { code: 500, message: err.message || '上传失败', data: null }
  }
}

/**
 * 提交小程序审核并发布
 */
export async function submitMiniProgram(ctx: Context) {
  try {
    const { id } = ctx.params

    const config = await WechatConfigModel.findById(id)
    if (!config) {
      ctx.body = { code: 404, message: '配置不存在', data: null }
      return
    }

    if (config.type !== 'mp') {
      ctx.body = { code: 400, message: '仅支持小程序配置', data: null }
      return
    }

    if (!config.upload_key) {
      ctx.body = { code: 400, message: '未配置上传密钥', data: null }
      return
    }

    try {
      ensureMiniProgramCiNodePath()
    } catch (err: any) {
      ctx.body = { code: 500, message: `运行环境缺少 Node 执行入口: ${err.message}`, data: null }
      return
    }

    // 动态导入 miniprogram-ci
    let ci: any
    try {
      const ciModule = await import('miniprogram-ci')
      ci = ciModule.default || ciModule
    } catch {
      ctx.body = { code: 500, message: '请先安装 miniprogram-ci: npm install miniprogram-ci', data: null }
      return
    }

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const projectPath = resolveMiniProgramProjectPath()
    if (!projectPath) {
      ctx.body = { code: 500, message: '未找到可上传的小程序构建目录，请先执行小程序构建（需存在 dist/build/mp-weixin/app.json）', data: null }
      return
    }

    const privateKeyPath = path.join(__dirname, '..', '..', 'temp', `${config.appid}.key`)

    // 确保 temp 目录存在
    const tempDir = path.dirname(privateKeyPath)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // 将密钥写入临时文件
    fs.writeFileSync(privateKeyPath, config.upload_key)

    try {
      // 获取上传的版本列表
      const project = new ci.Project({
        appid: config.appid,
        type: 'miniProgram',
        projectPath,
        privateKeyPath: privateKeyPath,
        ignores: [],
      })

      // 提交审核
      const result = await ci.submitAudit({
        project,
        item_list: [
          {
            address: 'pages/index/index',
            tag: '预约 美发',
            first_class: '生活服务',
            second_class: '美容/美发',
            first_id: 304,
            second_id: 321,
            title: '首页',
          },
        ],
      })

      ctx.body = {
        code: 0,
        message: '提交审核成功',
        data: result,
      }
    } finally {
      // 清理临时密钥文件
      if (fs.existsSync(privateKeyPath)) {
        fs.unlinkSync(privateKeyPath)
      }
    }
  } catch (err: any) {
    console.error('[submitMiniProgram Error]', err)
    ctx.status = 500
    ctx.body = { code: 500, message: err.message || '提交审核失败', data: null }
  }
}

/**
 * 发布小程序（审核通过后）
 */
export async function releaseMiniProgram(ctx: Context) {
  try {
    const { id } = ctx.params

    const config = await WechatConfigModel.findById(id)
    if (!config) {
      ctx.body = { code: 404, message: '配置不存在', data: null }
      return
    }

    if (config.type !== 'mp') {
      ctx.body = { code: 400, message: '仅支持小程序配置', data: null }
      return
    }

    if (!config.upload_key) {
      ctx.body = { code: 400, message: '未配置上传密钥', data: null }
      return
    }

    try {
      ensureMiniProgramCiNodePath()
    } catch (err: any) {
      ctx.body = { code: 500, message: `运行环境缺少 Node 执行入口: ${err.message}`, data: null }
      return
    }

    // 动态导入 miniprogram-ci
    let ci: any
    try {
      const ciModule = await import('miniprogram-ci')
      ci = ciModule.default || ciModule
    } catch {
      ctx.body = { code: 500, message: '请先安装 miniprogram-ci: npm install miniprogram-ci', data: null }
      return
    }

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)
    const projectPath = resolveMiniProgramProjectPath()
    if (!projectPath) {
      ctx.body = { code: 500, message: '未找到可上传的小程序构建目录，请先执行小程序构建（需存在 dist/build/mp-weixin/app.json）', data: null }
      return
    }

    const privateKeyPath = path.join(__dirname, '..', '..', 'temp', `${config.appid}.key`)

    // 确保 temp 目录存在
    const tempDir = path.dirname(privateKeyPath)
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // 将密钥写入临时文件
    fs.writeFileSync(privateKeyPath, config.upload_key)

    try {
      const project = new ci.Project({
        appid: config.appid,
        type: 'miniProgram',
        projectPath,
        privateKeyPath: privateKeyPath,
        ignores: [],
      })

      // 发布
      await ci.release({ project })

      ctx.body = {
        code: 0,
        message: '发布成功',
        data: null,
      }
    } finally {
      // 清理临时密钥文件
      if (fs.existsSync(privateKeyPath)) {
        fs.unlinkSync(privateKeyPath)
      }
    }
  } catch (err: any) {
    console.error('[releaseMiniProgram Error]', err)
    ctx.status = 500
    ctx.body = { code: 500, message: err.message || '发布失败', data: null }
  }
}
