import Router from 'koa-router'
import { verifyWechatServer, receiveWechatMessage } from '../controllers/wechatMessage'

const router = new Router({ prefix: '/api/wechat' })

// 微信服务器验证（GET）和消息接收（POST）使用同一个接口
router.get('/message', verifyWechatServer)
router.post('/message', receiveWechatMessage)

export default router
