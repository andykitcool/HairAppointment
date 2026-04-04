import type { Context, Next } from 'koa'

export function logger(ctx: Context, next: Next) {
  const start = Date.now()
  return next().then(() => {
    const ms = Date.now() - start
    console.log(`[${new Date().toISOString()}] ${ctx.method} ${ctx.url} - ${ctx.status} (${ms}ms)`)
  })
}
