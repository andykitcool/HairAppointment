import Router from 'koa-router'
import {
  getWechatConfigs,
  getWechatConfigById,
  createWechatConfig,
  updateWechatConfig,
  deleteWechatConfig,
} from '../controllers/wechatConfig'
import { authMiddleware } from '../middleware/auth'

const router = new Router({ prefix: '/api/wechat-config' })

// 所有接口都需要登录
router.get('/', authMiddleware, getWechatConfigs)
router.get('/:id', authMiddleware, getWechatConfigById)
router.post('/', authMiddleware, createWechatConfig)
router.put('/:id', authMiddleware, updateWechatConfig)
router.delete('/:id', authMiddleware, deleteWechatConfig)

export default router
