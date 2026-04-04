import Router from 'koa-router'
import authRoutes from './auth.js'
import appointmentRoutes from './appointment.js'
import transactionRoutes from './transaction.js'
import serviceRoutes from './service.js'
import merchantRoutes from './merchant.js'
import customerRoutes from './customer.js'
import notificationRoutes from './notification.js'
import adminRoutes from './admin.js'
import feishuRoutes from './feishu.js'
import wechatConfigRoutes from './wechatConfig.js'
import wechatMessageRoutes from './wechatMessage.js'

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
  apiRouter.use(wechatConfigRoutes.routes(), wechatConfigRoutes.allowedMethods())

  app.use(apiRouter.routes())
  app.use(apiRouter.allowedMethods())

  // 微信消息接收（单独注册，不需要认证）
  app.use(wechatMessageRoutes.routes())
  app.use(wechatMessageRoutes.allowedMethods())

  // 健康检查
  app.use(async (ctx: any) => {
    if (ctx.url === '/health') {
      ctx.body = { status: 'ok', timestamp: new Date().toISOString() }
    }
  })
}
