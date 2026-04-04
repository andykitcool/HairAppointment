import type { Context, Next } from 'koa'

// Session 中间件已废弃，现在使用 JWT 认证
// 保留此文件仅为兼容旧代码引用
export function sessionAuthMiddleware(ctx: Context, next: Next) {
  // 此中间件已不再使用，直接放行
  return next()
}
