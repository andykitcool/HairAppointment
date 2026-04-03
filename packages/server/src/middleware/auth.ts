import jwt from 'jsonwebtoken'
import { UserModel } from '../models'
import type { IJwtPayload } from '@hair/shared'
import type { Context, Next } from 'koa'

const JWT_SECRET = process.env.JWT_SECRET || 'hair-appointment-jwt-secret'

/**
 * 生成 JWT Token
 */
export function signJwt(payload: IJwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

/**
 * 验证 JWT Token
 */
export function verifyJwt(token: string): IJwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as IJwtPayload
  } catch {
    return null
  }
}

/**
 * 小程序 JWT 认证中间件
 */
export async function authMiddleware(ctx: Context, next: Next) {
  const authHeader = ctx.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    ctx.status = 401
    ctx.body = { code: 401, message: '未登录或 token 已过期', data: null }
    return
  }

  const token = authHeader.slice(7)
  const payload = verifyJwt(token)
  if (!payload) {
    ctx.status = 401
    ctx.body = { code: 401, message: 'token 无效', data: null }
    return
  }

  // 查找用户
  const user = await UserModel.findById(payload.user_id)
  if (!user) {
    ctx.status = 401
    ctx.body = { code: 401, message: '用户不存在', data: null }
    return
  }

  ctx.state.user = {
    _id: user._id,
    openid: user.openid,
    role: user.role,
    merchant_id: user.merchant_id,
  }
  ctx.state.jwtPayload = payload

  await next()
}

/**
 * 要求店长或超管权限
 */
export function requireOwner(ctx: Context, next: Next) {
  const role = ctx.state.user?.role
  if (role !== 'owner' && role !== 'staff') {
    ctx.status = 403
    ctx.body = { code: 403, message: '需要店长权限', data: null }
    return
  }
  return next()
}

/**
 * COZE API Key 认证中间件
 */
export async function cozeAuthMiddleware(ctx: Context, next: Next) {
  const merchantId = ctx.headers['x-merchant-id'] as string
  const apiKey = ctx.headers['x-api-key'] as string

  if (!merchantId || !apiKey) {
    ctx.status = 401
    ctx.body = { code: 401, message: '缺少 merchant_id 或 api_key', data: null }
    return
  }

  // 验证 API Key（从商户的 coze_config 中获取）
  const { MerchantModel } = await import('../models')
  const merchant = await MerchantModel.findOne({ merchant_id: merchantId })
  if (!merchant || merchant.coze_config?.api_key !== apiKey) {
    ctx.status = 401
    ctx.body = { code: 401, message: 'api_key 无效', data: null }
    return
  }

  ctx.state.merchantId = merchantId
  ctx.state.merchant = merchant

  await next()
}
