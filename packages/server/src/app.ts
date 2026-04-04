import Koa from 'koa'
import koaBody from 'koa-body'
import cors from '@koa/cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from './config/index.js'
import { connectDatabase } from './config/database.js'
import { connectRedis } from './config/redis.js'
import { errorHandler } from './middleware/errorHandler.js'
import { logger } from './middleware/logger.js'
import { registerRoutes } from './routes/index.js'
import { initCronJobs } from './cron/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function bootstrap() {
  await connectDatabase()
  await connectRedis()

  const app = new Koa()

  app.use(errorHandler)
  app.use(logger)
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  }))

  // 微信域名验证文件（业务域名配置用）
  app.use(async (ctx, next) => {
    if (ctx.path.startsWith('/MP_verify_')) {
      // 从项目根目录查找验证文件
      const filePath = path.join(process.cwd(), 'packages', 'server', ctx.path)
      if (fs.existsSync(filePath)) {
        ctx.type = 'text/plain'
        ctx.body = fs.readFileSync(filePath, 'utf-8')
        return
      }
    }
    await next()
  })

  // 微信消息接收需要原始XML body
  app.use(async (ctx, next) => {
    if (ctx.path === '/api/wechat/message' && ctx.method === 'POST') {
      let rawBody = ''
      ctx.req.on('data', (chunk) => {
        rawBody += chunk
      })
      ctx.req.on('end', () => {
        ctx.request.body = rawBody
      })
      // 等待数据接收完成
      await new Promise<void>((resolve) => {
        ctx.req.on('end', resolve)
        ctx.req.on('error', resolve)
      })
    }
    await next()
  })

  app.use(koaBody({
    multipart: true,
    jsonLimit: '10mb',
    formLimit: '10mb',
  }))

  registerRoutes(app)
  initCronJobs()

  app.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`)
  })
}

bootstrap().catch(console.error)
