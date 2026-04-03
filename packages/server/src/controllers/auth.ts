import { Context } from 'koa'
import { UserModel, MerchantModel, StaffModel, ServiceModel } from '../models'
import { signJwt, verifyJwt } from '../middleware/auth'
import { PRESET_SERVICES, generateShortId } from '@hair/shared'
import axios from 'axios'

/**
 * 微信登录
 */
export async function wechatLogin(ctx: Context) {
  const { code } = ctx.request.body as { code: string }
  if (!code) {
    ctx.body = { code: 400, message: '缺少 code', data: null }
    return
  }

  try {
    // 通过 code 换取 openid
    const wxRes = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: process.env.WX_APPID,
        secret: process.env.WX_APP_SECRET,
        js_code: code,
        grant_type: 'authorization_code',
      },
    })

    const { openid, session_key, unionid } = wxRes.data
    if (!openid) {
      ctx.body = { code: 400, message: '微信登录失败', data: wxRes.data }
      return
    }

    // 查找或创建用户
    let user = await UserModel.findOne({ openid })
    if (!user) {
      user = await UserModel.create({
        openid,
        union_id: unionid,
        nickname: '微信用户',
        avatar_url: '',
        phone: '',
        role: 'customer',
      })
    }

    // 生成 JWT
    const token = signJwt({
      user_id: user._id.toString(),
      openid: user.openid,
      role: user.role,
      merchant_id: user.merchant_id,
    })

    ctx.body = {
      code: 0,
      message: 'ok',
      data: {
        token,
        user: {
          _id: user._id,
          openid: user.openid,
          nickname: user.nickname,
          avatar_url: user.avatar_url,
          phone: user.phone,
          role: user.role,
          merchant_id: user.merchant_id,
        },
      },
    }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}

/**
 * 获取手机号
 */
export async function getPhone(ctx: Context) {
  const { code } = ctx.request.body as { code: string }
  if (!code) {
    ctx.body = { code: 400, message: '缺少 code', data: null }
    return
  }

  try {
    // 获取微信 access_token
    const tokenRes = await axios.get('https://api.weixin.qq.com/cgi-bin/token', {
      params: {
        grant_type: 'client_credential',
        appid: process.env.WX_APPID,
        secret: process.env.WX_APP_SECRET,
      },
    })

    const accessToken = tokenRes.data.access_token
    const phoneRes = await axios.post(
      `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`,
      { code },
    )

    const phoneInfo = phoneRes.data.phone_info
    if (!phoneInfo) {
      ctx.body = { code: 400, message: '获取手机号失败', data: phoneRes.data }
      return
    }

    // 更新用户手机号
    const userId = ctx.state.user._id
    await UserModel.findByIdAndUpdate(userId, { phone: phoneInfo.phoneNumber })

    ctx.body = { code: 0, message: 'ok', data: { phone: phoneInfo.phoneNumber } }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}

/**
 * Web 后台登录（超管/店长）
 */
export async function adminLogin(ctx: Context) {
  const { username, password } = ctx.request.body as { username: string; password: string }
  if (!username || !password) {
    ctx.body = { code: 400, message: '缺少用户名或密码', data: null }
    return
  }

  try {
    const bcrypt = await import('bcrypt')
    const { AdminModel } = await import('../models')

    // 先查超管
    const admin = await AdminModel.findOne({ username, is_active: true })
    if (admin) {
      const valid = await bcrypt.compare(password, admin.password_hash)
      if (!valid) {
        ctx.body = { code: 400, message: '密码错误', data: null }
        return
      }
      ctx.session!.adminId = admin._id.toString()
      ctx.session!.role = 'super_admin'
      ctx.body = {
        code: 0,
        message: 'ok',
        data: { role: 'super_admin', real_name: admin.real_name },
      }
      return
    }

    // 再查店长（通过关联的 users 表查找）
    // 店长的 web 登录账号存储在 admin 表（role='owner'）或者
    // 使用店长绑定的手机号登录
    // Phase 1: 简化处理，店长也用 admin 表
    const ownerAdmin = await AdminModel.findOne({
      username,
      is_active: true,
    })
    // 如果找到了但密码不对
    if (ownerAdmin) {
      const valid = await bcrypt.compare(password, ownerAdmin.password_hash)
      if (!valid) {
        ctx.body = { code: 400, message: '密码错误', data: null }
        return
      }
      ctx.session!.adminId = ownerAdmin._id.toString()
      ctx.session!.role = 'owner'
      // 查找关联的商户
      const merchant = await MerchantModel.findOne({ owner_id: ownerAdmin._id.toString() })
      ctx.session!.merchantId = merchant?.merchant_id
      ctx.body = {
        code: 0,
        message: 'ok',
        data: {
          role: 'owner',
          real_name: ownerAdmin.real_name,
          merchant_id: merchant?.merchant_id,
        },
      }
      return
    }

    ctx.body = { code: 404, message: '账号不存在', data: null }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}

/**
 * 申请成为店长
 */
export async function applyOwner(ctx: Context) {
  const { shop_name, phone, address, description } = ctx.request.body as {
    shop_name: string
    phone: string
    address?: string
    description?: string
  }
  const userId = ctx.state.user._id

  if (!shop_name || !phone) {
    ctx.body = { code: 400, message: '缺少必填字段', data: null }
    return
  }

  try {
    // 检查是否已申请或已是店长
    const existingMerchant = await MerchantModel.findOne({ owner_id: userId.toString() })
    if (existingMerchant) {
      ctx.body = { code: 400, message: '已有申请或已是店长', data: null }
      return
    }

    // 创建待审核商户
    const merchant = await MerchantModel.create({
      merchant_id: generateShortId('M'),
      name: shop_name,
      phone,
      address,
      description,
      status: 'pending',
      owner_id: userId.toString(),
      business_hours: { start: '09:00', end: '21:00' },
      daily_counter: 0,
      counter_date: '',
    })

    ctx.body = { code: 0, message: '申请已提交，等待审核', data: { merchant_id: merchant.merchant_id } }
  } catch (err: any) {
    ctx.status = 500
    ctx.body = { code: 500, message: err.message, data: null }
  }
}

/**
 * 获取当前用户信息
 */
export async function getProfile(ctx: Context) {
  const userId = ctx.state.user._id
  const user = await UserModel.findById(userId)

  if (!user) {
    ctx.body = { code: 404, message: '用户不存在', data: null }
    return
  }

  ctx.body = {
    code: 0,
    message: 'ok',
    data: {
      _id: user._id,
      openid: user.openid,
      nickname: user.nickname,
      avatar_url: user.avatar_url,
      phone: user.phone,
      real_name: user.real_name,
      role: user.role,
      merchant_id: user.merchant_id,
      customer_note: user.customer_note,
      merchant_note: user.merchant_note,
      visit_count: user.visit_count,
      total_spending: user.total_spending,
      last_visit_time: user.last_visit_time,
    },
  }
}

/**
 * 更新用户信息
 */
export async function updateProfile(ctx: Context) {
  const userId = ctx.state.user._id
  const { nickname, avatar_url, real_name, customer_note } = ctx.request.body as {
    nickname?: string
    avatar_url?: string
    real_name?: string
    customer_note?: string
  }

  const updateData: Record<string, any> = {}
  if (nickname !== undefined) updateData.nickname = nickname
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url
  if (real_name !== undefined) updateData.real_name = real_name
  if (customer_note !== undefined) updateData.customer_note = customer_note

  await UserModel.findByIdAndUpdate(userId, updateData)
  ctx.body = { code: 0, message: '更新成功', data: null }
}

/**
 * 获取店长的管理信息（商户信息+员工列表）
 */
export async function getAdminInfo(ctx: Context) {
  const { merchant_id } = ctx.state.user
  if (!merchant_id) {
    ctx.body = { code: 400, message: '您不是店长', data: null }
    return
  }

  const merchant = await MerchantModel.findOne({ merchant_id })
  const staff = await StaffModel.find({ merchant_id, is_active: true })
  const services = await ServiceModel.find({ merchant_id, is_active: true }).sort({ sort_order: 1 })

  ctx.body = {
    code: 0,
    message: 'ok',
    data: { merchant, staff, services },
  }
}
