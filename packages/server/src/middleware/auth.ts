import jwt from 'jsonwebtoken'
import { UserModel, AdminModel } from '../models/index.js'
import type { IJwtPayload } from '../../../shared/dist/types/index.js'
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
 * 小程序 JWT 认证中间件（支持用户和管理员）
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

  // 根据类型查找用户（支持 admin 和 customer/owner）
  let user: any = null
  if (payload.type === 'admin') {
    user = await AdminModel.findById(payload.user_id)
  } else {
    user = await UserModel.findById(payload.user_id)
  }
  
  if (!user) {
    ctx.status = 401
    ctx.body = { code: 401, message: '用户不存在', data: null }
    return
  }

  const resolvedMerchantId = user.merchant_id || payload.merchant_id || ''

  ctx.state.user = {
    _id: user._id,
    openid: user.openid,
    role: user.role || payload.role,
    merchant_id: resolvedMerchantId,
  }
  ctx.state.jwtPayload = payload

  await next()
}

/**
 * 要求店长或超管权限
 * 支持角色: owner (店长，包括小程序端和Web后台) / super_admin (超级管理员)
 * 注意：店员(staff)不能访问
 */
export function requireOwner(ctx: Context, next: Next) {
  const role = ctx.state.user?.role
  // 支持的角色：owner（店长）、super_admin（超级管理员）
  const allowedRoles = ['owner', 'super_admin']
  if (!allowedRoles.includes(role)) {
    ctx.status = 403
    ctx.body = { code: 403, message: '需要店长权限', data: null }
    return
  }
  return next()
}

/**
 * 要求店员或店长权限
 * 支持角色: staff (店员) / owner (店长) / super_admin (超级管理员)
 * 用于：交易记账等店员可操作的功能
 */
export function requireStaffOrOwner(ctx: Context, next: Next) {
  const role = ctx.state.user?.role
  const allowedRoles = ['staff', 'owner', 'super_admin']
  if (!allowedRoles.includes(role)) {
    ctx.status = 403
    ctx.body = { code: 403, message: '需要员工权限', data: null }
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
  const { MerchantModel } = await import('../models/index.js')
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

/**
 * 店长后台或 COZE 二选一认证
 * 优先使用后台 Bearer Token；没有 Bearer Token 时回退到 COZE API Key。
 */
export async function ownerOrCozeAuthMiddleware(ctx: Context, next: Next) {
  const authHeader = ctx.headers.authorization

  if (authHeader?.startsWith('Bearer ')) {
    return authMiddleware(ctx, async () => requireOwner(ctx, next))
  }

  return cozeAuthMiddleware(ctx, next)
}
