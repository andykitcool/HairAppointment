import Router from 'koa-router'
import authRoutes from './auth'
import appointmentRoutes from './appointment'
import transactionRoutes from './transaction'
import serviceRoutes from './service'
import merchantRoutes from './merchant'
import customerRoutes from './customer'
import notificationRoutes from './notification'
import adminRoutes from './admin'
import feishuRoutes from './feishu'

export function registerRoutes(app: any) {
  const apiRouter = new Router()

  // 注册各业务路由
  apiRouter.use(authRoutes.routes(), authRoutes.allowedMethods())
  apiRouter.use(appointmentRoutes.routes(), appointmentRoutes.allowedMethods())
  apiRouter.use(transactionRoutes.routes(), transactionRoutes.allowedMethods())
  apiRouter.use(serviceRoutes.routes(), serviceRoutes.allowedMethods())
  apiRouter.use(merchantRoutes.routes(), merchantRoutes.allowedMethods())
  apiRouter.use(customerRoutes.routes(), customerRoutes.allowedMethods())
  apiRouter.use(notificationRoutes.routes(), notificationRoutes.allowedMethods())
  apiRouter.use(adminRoutes.routes(), adminRoutes.allowedMethods())
  apiRouter.use(feishuRoutes.routes(), feishuRoutes.allowedMethods())

  app.use(apiRouter.routes())
  app.use(apiRouter.allowedMethods())

  // 健康检查
  app.use(async (ctx: any) => {
    if (ctx.url === '/health') {
      ctx.body = { status: 'ok', timestamp: new Date().toISOString() }
    }
  })
}
