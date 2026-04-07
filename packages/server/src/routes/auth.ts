import Router from 'koa-router'
import * as authController from '../controllers/auth.js'
import { authMiddleware, requireOwner } from '../middleware/auth.js'

const router = new Router({ prefix: '/api/auth' })

// 公开接口
router.post('/wechat-login', authController.wechatLogin)
router.post('/phone', authController.getPhone)
router.post('/admin-login', authController.adminLogin)
router.post('/apply-owner', authController.applyOwner)

// 微信扫码登录相关（公开接口）
router.get('/wechat-login-qr', authController.getWechatLoginQR)
router.get('/wechat-login-status', authController.checkLoginStatus)

// 微信绑定相关（需要登录）
router.get('/wechat-bind-qr', authMiddleware, authController.getWechatBindQR)
router.get('/wechat-bind-status', authMiddleware, authController.checkBindStatus)

// 需要登录的接口
router.get('/profile', authMiddleware, authController.getProfile)
router.put('/profile', authMiddleware, authController.updateProfile)

// 需要 owner 权限
router.get('/admin-info', authMiddleware, requireOwner, authController.getAdminInfo)

// 管理员专用接口
router.get('/admin/profile', authMiddleware, authController.getAdminProfile)
router.put('/admin/password', authMiddleware, authController.changeAdminPassword)
router.put('/admin/phone', authMiddleware, authController.bindAdminPhone)
router.put('/admin/email', authMiddleware, authController.bindAdminEmail)
router.put('/admin/wechat', authMiddleware, authController.bindAdminWechat)

export default router
