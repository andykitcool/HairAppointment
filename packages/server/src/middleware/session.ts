import type { Context, Next } from 'koa'

declare module 'koa' {
  interface Context {
    session?: {
      adminId?: string
      role?: string
      merchantId?: string
    }
  }
}

/**
 * Web 后台 Session 认证中间件
 */
export function sessionAuthMiddleware(ctx: Context, next: Next) {
  if (!ctx.session?.adminId) {
    ctx.status = 401
    ctx.body = { code: 401, message: '未登录', data: null }
    return
  }
  ctx.state.webUser = {
    adminId: ctx.session.adminId,
    role: ctx.session.role,
    merchantId: ctx.session.merchantId,
  }
  return next()
}
