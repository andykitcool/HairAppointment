import { Context } from 'koa'
import crypto from 'crypto'
import { getActiveServiceConfig } from './wechatConfig'
import { handleWechatScanEvent, handleWechatBindEvent } from './auth'

/**
 * 验证微信服务器签名（用于服务器配置时的验证）
 * GET /api/wechat/message
 */
export async function verifyWechatServer(ctx: Context) {
  const { signature, timestamp, nonce, echostr } = ctx.query as {
    signature: string
    timestamp: string
    nonce: string
    echostr: string
  }

  const config = await getActiveServiceConfig()
  if (!config || !config.token) {
    ctx.body = '未配置服务号或Token'
    return
  }

  // 验证签名
  const tmpStr = [config.token, timestamp, nonce].sort().join('')
  const hash = crypto.createHash('sha1').update(tmpStr).digest('hex')

  if (hash === signature) {
    ctx.body = echostr // 返回echostr表示验证成功
  } else {
    ctx.body = '验证失败'
  }
}

/**
 * 接收微信消息和事件推送
 * POST /api/wechat/message
 */
export async function receiveWechatMessage(ctx: Context) {
  const { signature, timestamp, nonce } = ctx.query as {
    signature: string
    timestamp: string
    nonce: string
  }

  const config = await getActiveServiceConfig()
  if (!config || !config.token) {
    ctx.body = 'success' // 微信要求返回success
    return
  }

  // 验证签名
  const tmpStr = [config.token, timestamp, nonce].sort().join('')
  const hash = crypto.createHash('sha1').update(tmpStr).digest('hex')

  if (hash !== signature) {
    ctx.body = 'success'
    return
  }

  // 解析XML消息体
  const xmlBody = ctx.request.body as string
  if (!xmlBody) {
    ctx.body = 'success'
    return
  }

  try {
    // 简单解析XML（生产环境建议使用xml2js库）
    const msgType = getXmlValue(xmlBody, 'MsgType')
    const fromUser = getXmlValue(xmlBody, 'FromUserName')
    const event = getXmlValue(xmlBody, 'Event')
    const eventKey = getXmlValue(xmlBody, 'EventKey')

    console.log(`[WechatMessage] Type: ${msgType}, Event: ${event}, From: ${fromUser}, Key: ${eventKey}`)

    // 处理扫码事件
    if (msgType === 'event' && (event === 'SCAN' || event === 'subscribe')) {
      // EventKey 格式为: qrscene_scene值 或 scene值
      let scene = eventKey
      if (event === 'subscribe' && scene.startsWith('qrscene_')) {
        scene = scene.substring(8) // 去掉 qrscene_ 前缀
      }

      if (scene && scene.startsWith('login_')) {
        // 这是登录扫码
        const result = await handleWechatScanEvent(scene, fromUser)
        console.log(`[WechatScan] Login result:`, result)
      } else if (scene && scene.startsWith('bind_')) {
        // 这是绑定扫码
        const result = await handleWechatBindEvent(scene, fromUser)
        console.log(`[WechatScan] Bind result:`, result)
      }
    }

    ctx.body = 'success'
  } catch (err: any) {
    console.error('[WechatMessage] Error:', err)
    ctx.body = 'success' // 即使出错也返回success，避免微信重试
  }
}

/**
 * 从XML中提取值（简单实现）
 */
function getXmlValue(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}><!\\[CDATA\\[(.*?)\\]\\]></${tag}>|<${tag}>(.*?)</${tag}>`, 'i')
  const match = xml.match(regex)
  return match ? (match[1] || match[2] || '') : ''
}
