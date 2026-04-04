import type { Context, Next } from 'koa'

export function errorHandler(ctx: Context, next: Next) {
  return next().catch((err: any) => {
    console.error('[Error]', err.message, err.stack)
    const status = err.status || err.statusCode || 500
    ctx.status = status
    ctx.body = {
      code: status,
      message: err.message || 'Internal Server Error',
      data: process.env.NODE_ENV === 'development' ? err.stack : null
    }
  })
}
