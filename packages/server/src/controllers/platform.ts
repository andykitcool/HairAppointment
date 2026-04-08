import { Context } from 'koa'
import http from 'http'
import https from 'https'
import fs from 'fs'
import path from 'path'
import { PlatformAdModel, PlatformConfigModel, PlatformAiSnapshotModel, AiUsageLogModel, MerchantModel } from '../models/index.js'
import { UserModel } from '../models/index.js'
import { verifyJwt } from '../middleware/auth.js'

type AiTaskStatus = 'processing' | 'done' | 'failed'

interface AiTask {
  task_id: string
  client_id?: string
  status: AiTaskStatus
  progress: number
  message: string
  input_image_url?: string
  image_url?: string
  reason?: string
  error_message?: string
  created_at: number
  updated_at: number
}

const aiTaskStore = new Map<string, AiTask>()

async function getOptionalUserContext(ctx: Context): Promise<{ userId: string; merchantId: string }> {
  const authHeader = String(ctx.headers.authorization || '')
  if (!authHeader.startsWith('Bearer ')) return { userId: '', merchantId: '' }
  const payload = verifyJwt(authHeader.slice(7))
  if (!payload?.user_id || payload.type === 'admin') return { userId: '', merchantId: '' }
  const user = await UserModel.findById(payload.user_id).lean()
  return {
    userId: user?._id ? String(user._id) : '',
    merchantId: user?.merchant_id ? String(user.merchant_id) : '',
  }
}

function getPeriodRange(period: 'day' | 'month') {
  const start = new Date()
  if (period === 'month') {
    start.setDate(1)
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setMonth(end.getMonth() + 1)
    return { start, end }
  }

  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

function getUploadedFile(ctx: Context): any {
  const files = (ctx.request as any).files || {}
  const photo = files.photo || files.file
  if (Array.isArray(photo)) return photo[0]
  return photo
}

function pruneOldTasks() {
  const now = Date.now()
  for (const [taskId, task] of aiTaskStore.entries()) {
    if (now - task.created_at > 30 * 60 * 1000) {
      aiTaskStore.delete(taskId)
    }
  }
}

function buildUploadPublicUrl(ctx: Context, fileName: string) {
  const proto = String((ctx.headers['x-forwarded-proto'] as string) || ctx.protocol || 'http')
  const host = String(ctx.headers.host || 'localhost:3100')
  return `${proto}://${host}/uploads/${fileName}`
}

function isLocalUploadUrl(rawUrl: string) {
  return String(rawUrl || '').includes('/uploads/')
}

function inferImageExtByContentType(contentType: string) {
  const ct = String(contentType || '').toLowerCase()
  if (ct.includes('png')) return '.png'
  if (ct.includes('webp')) return '.webp'
  if (ct.includes('jpeg') || ct.includes('jpg')) return '.jpg'
  return '.jpg'
}

function inferImageExtByUrl(rawUrl: string) {
  try {
    const u = new URL(rawUrl)
    const ext = path.extname(u.pathname || '').toLowerCase()
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) return ext === '.jpeg' ? '.jpg' : ext
    return '.jpg'
  } catch {
    return '.jpg'
  }
}

async function requestBinaryWithRedirect(rawUrl: string, maxRedirects = 3): Promise<{ data: Buffer; contentType: string }> {
  return new Promise((resolve, reject) => {
    const doRequest = (url: string, redirectsLeft: number) => {
      const urlObj = new URL(url)
      const lib = urlObj.protocol === 'https:' ? https : http
      const req = lib.request(
        {
          protocol: urlObj.protocol,
          hostname: urlObj.hostname,
          port: urlObj.port,
          path: `${urlObj.pathname}${urlObj.search}`,
          method: 'GET',
          headers: {
            'User-Agent': 'HairAppointment-AI-Image-Persist/1.0',
          },
        },
        (res) => {
          const status = Number(res.statusCode || 0)
          const location = String(res.headers.location || '')
          if ([301, 302, 303, 307, 308].includes(status) && location) {
            if (redirectsLeft <= 0) {
              reject(new Error('下载 AI 图片失败：重定向次数过多'))
              return
            }
            const nextUrl = new URL(location, urlObj).toString()
            res.resume()
            doRequest(nextUrl, redirectsLeft - 1)
            return
          }
          if (status < 200 || status >= 300) {
            res.resume()
            reject(new Error(`下载 AI 图片失败：HTTP ${status}`))
            return
          }

          const chunks: Buffer[] = []
          res.on('data', (chunk) => {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
          })
          res.on('end', () => {
            resolve({
              data: Buffer.concat(chunks),
              contentType: String(res.headers['content-type'] || ''),
            })
          })
        },
      )

      req.on('error', reject)
      req.setTimeout(60000, () => {
        req.destroy(new Error('下载 AI 图片超时'))
      })
      req.end()
    }

    doRequest(rawUrl, maxRedirects)
  })
}

async function persistRemoteImageToLocal(ctx: Context, rawUrl: string) {
  const payload = await requestBinaryWithRedirect(rawUrl)
  if (!payload.data?.length) {
    throw new Error('下载 AI 图片失败：内容为空')
  }

  const extByType = inferImageExtByContentType(payload.contentType)
  const extByUrl = inferImageExtByUrl(rawUrl)
  const safeExt = extByType || extByUrl || '.jpg'

  const fileName = `ai_result_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${safeExt}`
  const uploadDir = path.join(process.cwd(), 'uploads')
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true })
  }
  fs.writeFileSync(path.join(uploadDir, fileName), payload.data)

  return buildUploadPublicUrl(ctx, fileName)
}

async function requestArkImage(apiKey: string, payloadObj: any): Promise<string> {
  const payload = JSON.stringify(payloadObj)
  return new Promise<string>((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'ark.cn-beijing.volces.com',
        path: '/api/v3/images/generations',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (res) => {
        let raw = ''
        res.on('data', (chunk) => { raw += chunk })
        res.on('end', () => {
          try {
            const json = JSON.parse(raw)
            const url = json?.data?.[0]?.url
            if (url) {
              resolve(url)
            } else {
              reject(new Error(json?.error?.message || 'AI 生图失败'))
            }
          } catch (e: any) {
            reject(e)
          }
        })
      },
    )
    req.on('error', reject)
    req.setTimeout(90000, () => { req.destroy(new Error('生图请求超时')) })
    req.write(payload)
    req.end()
  })
}

/**
 * 小程序平台首页广告（公开）
 * GET /api/platform/ads
 */
export async function getPublicAds(ctx: Context) {
  try {
    const now = new Date()
    const query: Record<string, any> = {
      status: 'active',
      $and: [
        { $or: [{ start_time: { $exists: false } }, { start_time: null }, { start_time: { $lte: now } }] },
        { $or: [{ end_time: { $exists: false } }, { end_time: null }, { end_time: { $gte: now } }] },
      ],
    }

    const list = await PlatformAdModel.find(query)
      .sort({ sort_order: -1, create_time: -1 })
      .lean()

    ctx.body = { code: 0, message: 'ok', data: { list } }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}

/**
 * AI 发型推荐生图
 * POST /api/platform/hairstyle-recommend
 * body: { prompt_extra?: string }
 */
export async function hairstyleRecommend(ctx: Context) {
  try {
    pruneOldTasks()
    const config = await PlatformConfigModel.findOne({ config_key: 'platform_default' }).lean()
    const coze = config?.coze_config as any
    if (!coze?.enabled) {
      ctx.status = 403
      ctx.body = { code: 403, message: '平台暂未开启 AI 发型推荐', data: null }
      return
    }
    const { api_key, model, prompt, size } = coze
    if (!api_key) {
      ctx.status = 500
      ctx.body = { code: 500, message: '平台 API Key 未配置', data: null }
      return
    }
    const bodyData = (ctx.request.body || {}) as any
    const clientId = String(bodyData.client_id || '').trim().slice(0, 64) || 'global'
    const { userId, merchantId: userMerchantId } = await getOptionalUserContext(ctx)
    const merchantId = String(bodyData.merchant_id || '').trim() || userMerchantId

    if (userId && merchantId) {
      const merchant = await MerchantModel.findOne({ merchant_id: merchantId }, { ai_image_settings: 1 }).lean()
      const aiSettings = merchant?.ai_image_settings as any
      const enabled = !!aiSettings?.enabled
      const period: 'day' | 'month' = aiSettings?.period === 'day' ? 'day' : 'month'
      const maxCount = Math.max(1, Number(aiSettings?.max_count || 0))

      if (enabled) {
        const { start, end } = getPeriodRange(period)
        const usedCount = await AiUsageLogModel.countDocuments({
          merchant_id: merchantId,
          user_id: userId,
          create_time: { $gte: start, $lt: end },
        })

        if (usedCount >= maxCount) {
          ctx.status = 429
          ctx.body = {
            code: 429,
            message: `本${period === 'day' ? '日' : '月'} AI 发型推荐次数已达上限（${maxCount}次）`,
            data: {
              period,
              max_count: maxCount,
              used_count: usedCount,
            },
          }
          return
        }

        await AiUsageLogModel.create({
          merchant_id: merchantId,
          user_id: userId,
          period,
        })
      }
    }

    const file = getUploadedFile(ctx)
    const tempPath = file?.filepath || file?.path
    if (!tempPath || !fs.existsSync(tempPath)) {
      ctx.status = 400
      ctx.body = { code: 400, message: '请上传照片后再试', data: null }
      return
    }

    const ext = path.extname(file?.originalFilename || '').toLowerCase() || '.jpg'
    const safeExt = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext) ? ext : '.jpg'
    const fileName = `ai_input_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${safeExt}`
    const uploadDir = path.join(process.cwd(), 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    fs.copyFileSync(tempPath, path.join(uploadDir, fileName))

    const inputImageUrl = buildUploadPublicUrl(ctx, fileName)
    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const initialTask: AiTask = {
      task_id: taskId,
      client_id: clientId,
      status: 'processing',
      progress: 10,
      message: '照片上传成功，准备调用 AI 生图',
      input_image_url: inputImageUrl,
      created_at: Date.now(),
      updated_at: Date.now(),
    }
    aiTaskStore.set(taskId, initialTask)

    await PlatformAiSnapshotModel.findOneAndUpdate(
      userId ? { user_id: userId } : { client_id: clientId },
      {
        $set: {
          client_id: clientId,
          user_id: userId,
          task_id: taskId,
          status: 'processing',
          progress: 10,
          message: '照片上传成功，准备调用 AI 生图',
          input_image_url: inputImageUrl,
          image_url: '',
          error_message: '',
          update_time: new Date(),
        },
        $setOnInsert: {
          create_time: new Date(),
        },
      },
      { upsert: true },
    )

    void (async () => {
      try {
        const basePrompt = String(prompt || '生成专业美发风格的单人写真，突出发型层次、质感与脸型协调性')
          .replace(/https?:\/\/\S+/g, '')
          .replace(/[{}<>`]/g, '')
          .slice(0, 300)
        const finalPrompt = `${basePrompt}。保留用户原有脸型与五官特征，仅调整发型。禁止在图中出现任何文字、水印、海报排版。`

        aiTaskStore.set(taskId, {
          ...initialTask,
          status: 'processing',
          progress: 45,
          message: 'AI 正在分析照片并生成推荐效果图',
          updated_at: Date.now(),
        })
        await PlatformAiSnapshotModel.findOneAndUpdate(
          userId ? { user_id: userId } : { client_id: clientId },
          {
            $set: {
              user_id: userId,
              task_id: taskId,
              status: 'processing',
              progress: 45,
              message: 'AI 正在分析照片并生成推荐效果图',
              update_time: new Date(),
            },
          },
        )

        const normalizedModel = model === 'doubao-seedream-4.0' ? 'doubao-seedream-4-0-250828' : model

        const commonPayload = {
          model: normalizedModel || 'doubao-seedream-5-0-260128',
          prompt: finalPrompt,
          size: size || '2K',
          response_format: 'url',
          watermark: false,
          n: 1,
        }

        let imageUrl = ''
        try {
          // 优先尝试参考图字段（若模型支持，将显著提高与用户照片一致性）
          imageUrl = await requestArkImage(api_key, {
            ...commonPayload,
            image: inputImageUrl,
          })
        } catch {
          try {
            imageUrl = await requestArkImage(api_key, {
              ...commonPayload,
              reference_image: inputImageUrl,
            })
          } catch {
            // 回退到纯文本生图，但不再把 URL 拼进 prompt，避免叠字乱图
            imageUrl = await requestArkImage(api_key, commonPayload)
          }
        }

        // 统一转存到本地 uploads，避免外部签名链接过期导致历史结果无法访问
        const persistedImageUrl = await persistRemoteImageToLocal(ctx, imageUrl)

        aiTaskStore.set(taskId, {
          ...initialTask,
          status: 'done',
          progress: 100,
          message: '推荐完成',
          image_url: persistedImageUrl,
          reason: '推荐理由：该发型更强调顶部层次与两侧线条平衡，能提升脸部轮廓立体感，同时保留日常打理的便利性。',
          updated_at: Date.now(),
        })
        await PlatformAiSnapshotModel.findOneAndUpdate(
          userId ? { user_id: userId } : { client_id: clientId },
          {
            $set: {
              user_id: userId,
              task_id: taskId,
              status: 'done',
              progress: 100,
              message: '推荐完成',
              image_url: persistedImageUrl,
              error_message: '',
              update_time: new Date(),
            },
          },
        )
      } catch (e: any) {
        aiTaskStore.set(taskId, {
          ...initialTask,
          status: 'failed',
          progress: 100,
          message: '推荐失败',
          error_message: e?.message || 'AI 生图服务异常',
          updated_at: Date.now(),
        })
        await PlatformAiSnapshotModel.findOneAndUpdate(
          userId ? { user_id: userId } : { client_id: clientId },
          {
            $set: {
              user_id: userId,
              task_id: taskId,
              status: 'failed',
              progress: 100,
              message: '推荐失败',
              error_message: e?.message || 'AI 生图服务异常',
              update_time: new Date(),
            },
          },
        )
      }
    })()

    ctx.body = { code: 0, message: 'ok', data: { task_id: taskId, input_image_url: inputImageUrl } }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message || '生图服务异常', data: null }
  }
}

/**
 * 获取某客户端最近一次 AI 发型推荐结果
 * GET /api/platform/hairstyle-recommend/latest?client_id=xxx
 */
export async function getLatestHairstyleRecommend(ctx: Context) {
  try {
    const clientId = String((ctx.query as any)?.client_id || '').trim().slice(0, 64) || 'global'
    const { userId } = await getOptionalUserContext(ctx)
    let latest = userId
      ? await PlatformAiSnapshotModel.findOne({ user_id: userId }).sort({ update_time: -1 }).lean()
      : null
    if (!latest && clientId) {
      latest = await PlatformAiSnapshotModel.findOne({ client_id: clientId }).sort({ update_time: -1 }).lean()
    }
    if (!latest && userId) {
      const total = await PlatformAiSnapshotModel.countDocuments()
      if (total === 1) {
        latest = await PlatformAiSnapshotModel.findOne({}).sort({ update_time: -1 }).lean()
        if (latest?._id) {
          await PlatformAiSnapshotModel.updateOne({ _id: latest._id }, { $set: { user_id: userId } })
        }
      }
    }
    if (!latest) {
      ctx.body = { code: 0, message: 'ok', data: null }
      return
    }

    let outputImageUrl = String(latest.image_url || '')
    if (outputImageUrl && !isLocalUploadUrl(outputImageUrl)) {
      try {
        const persistedImageUrl = await persistRemoteImageToLocal(ctx, outputImageUrl)
        outputImageUrl = persistedImageUrl
        await PlatformAiSnapshotModel.updateOne(
          { _id: latest._id },
          {
            $set: {
              image_url: persistedImageUrl,
              update_time: new Date(),
            },
          },
        )
      } catch {
        // 历史外链可能已过期，转存失败时保留原值，避免影响主流程
      }
    }

    ctx.body = {
      code: 0,
      message: 'ok',
      data: {
        task_id: latest.task_id || '',
        status: latest.status || '',
        progress: latest.progress || 0,
        message: latest.message || '',
        input_image_url: latest.input_image_url || '',
        image_url: outputImageUrl,
        error_message: latest.error_message || '',
      },
    }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message || '读取最近记录失败', data: null }
  }
}

/**
 * 查询 AI 发型推荐任务进度
 * GET /api/platform/hairstyle-recommend/:taskId
 */
export async function getHairstyleRecommendTask(ctx: Context) {
  try {
    pruneOldTasks()
    const { taskId } = ctx.params as any
    const task = aiTaskStore.get(String(taskId || ''))
    if (!task) {
      ctx.status = 404
      ctx.body = { code: 404, message: '任务不存在或已过期', data: null }
      return
    }
    ctx.body = {
      code: 0,
      message: 'ok',
      data: {
        task_id: task.task_id,
        status: task.status,
        progress: task.progress,
        message: task.message,
        input_image_url: task.input_image_url || '',
        image_url: task.image_url || '',
        reason: task.reason || '',
        error_message: task.error_message || '',
      },
    }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message || '查询任务失败', data: null }
  }
}

/**
 * 小程序平台 COZE 配置（公开，隐藏敏感信息）
 * GET /api/platform/coze-config
 */
export async function getPublicCozeConfig(ctx: Context) {
  try {
    const config = await PlatformConfigModel.findOne({ config_key: 'platform_default' }).lean()
    const coze = config?.coze_config || { enabled: false, model: '', size: '' }

    ctx.body = {
      code: 0,
      message: 'ok',
      data: {
        enabled: !!coze.enabled,
        model: coze.model || '',
        size: coze.size || '2K',
      },
    }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}
