import type { Context, Next } from 'koa'

export async function errorHandler(ctx: Context, next: Next) {
  try {
    await next()
  } catch (err: any) {
    console.error('[Error]', err.message)
    const status = err.status || err.statusCode || 500
    ctx.status = status
    ctx.body = {
      code: status,
      message: err.message || 'Internal Server Error',
      data: null
    }
  }
}
