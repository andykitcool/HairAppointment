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

  console.log('[WechatMessage] Received message, query:', { signature, timestamp, nonce })

  const config = await getActiveServiceConfig()
  if (!config || !config.token) {
    console.log('[WechatMessage] No service config or token found')
    ctx.body = 'success' // 微信要求返回success
    return
  }

  // 验证签名
  const tmpStr = [config.token, timestamp, nonce].sort().join('')
  const hash = crypto.createHash('sha1').update(tmpStr).digest('hex')

  console.log('[WechatMessage] Signature check:', { expected: hash, received: signature, match: hash === signature })

  if (hash !== signature) {
    console.log('[WechatMessage] Signature verification failed')
    ctx.body = 'success'
    return
  }

  // 解析XML消息体
  const xmlBody = ctx.request.body as string
  console.log('[WechatMessage] XML Body:', xmlBody)

  if (!xmlBody) {
    console.log('[WechatMessage] Empty body')
    ctx.body = 'success'
    return
  }

  try {
    // 解析XML字段
    const msgType = getXmlValue(xmlBody, 'MsgType')
    const fromUser = getXmlValue(xmlBody, 'FromUserName')
    const toUser = getXmlValue(xmlBody, 'ToUserName')
    const event = getXmlValue(xmlBody, 'Event')
    const eventKey = getXmlValue(xmlBody, 'EventKey')
    const msgId = getXmlValue(xmlBody, 'MsgId')

    console.log(`[WechatMessage] Parsed:`, {
      msgType,
      fromUser,
      toUser,
      event,
      eventKey,
      msgId,
    })

    // 处理扫码事件
    if (msgType === 'event' && (event === 'SCAN' || event === 'subscribe')) {
      // EventKey 格式为: qrscene_scene值 或 scene值
      let scene = eventKey
      console.log(`[WechatMessage] Processing scan event, raw scene: ${scene}`)

      if (event === 'subscribe' && scene && scene.startsWith('qrscene_')) {
        scene = scene.substring(8) // 去掉 qrscene_ 前缀
        console.log(`[WechatMessage] Removed qrscene_ prefix, scene: ${scene}`)
      }

      if (scene && scene.startsWith('login_')) {
        // 这是登录扫码
        console.log(`[WechatMessage] Detected login scene: ${scene}`)
        const result = await handleWechatScanEvent(scene, fromUser)
        console.log(`[WechatScan] Login result:`, result)
      } else if (scene && scene.startsWith('bind_')) {
        // 这是绑定扫码
        console.log(`[WechatMessage] Detected bind scene: ${scene}`)
        const result = await handleWechatBindEvent(scene, fromUser)
        console.log(`[WechatScan] Bind result:`, result)
      } else {
        console.log(`[WechatMessage] Unknown scene format: ${scene}`)
      }
    } else {
      console.log(`[WechatMessage] Not a scan event. msgType=${msgType}, event=${event}`)
    }

    ctx.body = 'success'
  } catch (err: any) {
    console.error('[WechatMessage] Error:', err)
    ctx.body = 'success' // 即使出错也返回success，避免微信重试
  }
}

/**
 * 从XML中提取值（增强版，支持CDATA和普通标签）
 */
function getXmlValue(xml: string, tag: string): string {
  // 尝试匹配 CDATA 格式: <tag><![CDATA[...]]></tag>
  const cdataRegex = new RegExp(`<${tag}>\\s*<!\\[CDATA\\[(.*?)\\]\\]>\\s*</${tag}>`, 'is')
  const cdataMatch = xml.match(cdataRegex)
  if (cdataMatch && cdataMatch[1]) {
    return cdataMatch[1].trim()
  }

  // 尝试匹配普通格式: <tag>...</tag>
  const normalRegex = new RegExp(`<${tag}>(.*?)</${tag}>`, 'is')
  const normalMatch = xml.match(normalRegex)
  if (normalMatch && normalMatch[1]) {
    return normalMatch[1].trim()
  }

  // 尝试匹配自闭合标签: <tag />
  const selfCloseRegex = new RegExp(`<${tag}\\s*/>`, 'i')
  if (selfCloseRegex.test(xml)) {
    return ''
  }

  return ''
}
