import Router from 'koa-router'
import {
  getWechatConfigs,
  getWechatConfigById,
  createWechatConfig,
  updateWechatConfig,
  deleteWechatConfig,
  uploadMiniProgram,
  submitMiniProgram,
  releaseMiniProgram,
} from '../controllers/wechatConfig.js'
import { authMiddleware } from '../middleware/auth.js'

const router = new Router({ prefix: '/api/wechat-config' })

// 所有接口都需要登录
router.get('/', authMiddleware, getWechatConfigs)
router.get('/:id', authMiddleware, getWechatConfigById)
router.post('/', authMiddleware, createWechatConfig)
router.put('/:id', authMiddleware, updateWechatConfig)
router.delete('/:id', authMiddleware, deleteWechatConfig)

// 小程序上传和发布
router.post('/:id/upload', authMiddleware, uploadMiniProgram)
router.post('/:id/submit', authMiddleware, submitMiniProgram)
router.post('/:id/release', authMiddleware, releaseMiniProgram)

export default router
