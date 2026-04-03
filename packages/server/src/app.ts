import Koa from 'koa'
import koaBody from 'koa-body'
import cors from '@koa/cors'
import session from 'koa-session'
import { config } from './config/index.js'
import { connectDatabase } from './config/database.js'
import { connectRedis } from './config/redis.js'
import { errorHandler } from './middleware/errorHandler.js'
import { logger } from './middleware/logger.js'
import { registerRoutes } from './routes/index.js'
import { initCronJobs } from './cron/index.js'

async function bootstrap() {
  await connectDatabase()
  await connectRedis()

  const app = new Koa()

  // Session 配置（Web 后台登录用）
  app.keys = [config.jwtSecret]
  app.use(session(
    {
      key: 'hair.session',
      maxAge: 24 * 60 * 60 * 1000, // 24 小时
      httpOnly: true,
      signed: true,
    },
    app as any,
  ))

  app.use(errorHandler)
  app.use(logger)
  app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  }))
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
