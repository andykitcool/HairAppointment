import Router from '@koa/router'
import * as authController from '../controllers/auth'
import { authMiddleware, requireOwner } from '../middleware/auth'

const router = new Router({ prefix: '/api/auth' })

// 公开接口
router.post('/wechat-login', authController.wechatLogin)
router.post('/phone', authController.getPhone)
router.post('/admin-login', authController.adminLogin)
router.post('/apply-owner', authController.applyOwner)

// 需要登录的接口
router.get('/profile', authMiddleware, authController.getProfile)
router.put('/profile', authMiddleware, authController.updateProfile)

// 需要 owner 权限
router.get('/admin-info', authMiddleware, requireOwner, authController.getAdminInfo)

export default router
