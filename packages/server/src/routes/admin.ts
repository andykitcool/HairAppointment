import Router from 'koa-router'
import * as adminController from '../controllers/admin.js'
import { sessionAuthMiddleware } from '../middleware/session.js'

const router = new Router({ prefix: '/api/admin' })

// Web 后台超管专用（session 认证）
// 门店管理
router.get('/merchants', sessionAuthMiddleware, adminController.getMerchants)
router.post('/merchants', sessionAuthMiddleware, adminController.createMerchant)
router.put('/merchants/:id/status', sessionAuthMiddleware, adminController.updateMerchantStatus)
router.post('/merchants/:id/reset-password', sessionAuthMiddleware, adminController.resetMerchantAdminPassword)
router.delete('/merchants/:id', sessionAuthMiddleware, adminController.deleteMerchant)

// 入驻审核
router.get('/applications', sessionAuthMiddleware, adminController.getApplications)
router.post('/merchants/:id/review', sessionAuthMiddleware, adminController.reviewApplication)

// 平台统计
router.get('/stats', sessionAuthMiddleware, adminController.getPlatformStats)

// 平台广告管理
router.get('/ads', sessionAuthMiddleware, adminController.getPlatformAds)
router.post('/ads', sessionAuthMiddleware, adminController.createPlatformAd)
router.put('/ads/:id', sessionAuthMiddleware, adminController.updatePlatformAd)
router.delete('/ads/:id', sessionAuthMiddleware, adminController.deletePlatformAd)

// 平台 COZE 配置
router.get('/platform-coze', sessionAuthMiddleware, adminController.getPlatformCozeConfig)
router.put('/platform-coze', sessionAuthMiddleware, adminController.updatePlatformCozeConfig)

// 高德开放平台配置
router.get('/amap-config', sessionAuthMiddleware, adminController.getAmapConfig)
router.put('/amap-config', sessionAuthMiddleware, adminController.updateAmapConfig)

// 系统邮件配置
router.get('/system-email', sessionAuthMiddleware, adminController.getSystemEmailConfig)
router.put('/system-email', sessionAuthMiddleware, adminController.updateSystemEmailConfig)

// 店长管理
router.get('/owners', sessionAuthMiddleware, adminController.getOwners)
router.post('/owners', sessionAuthMiddleware, adminController.addOwner)
router.put('/owners/:userId', sessionAuthMiddleware, adminController.updateOwner)
router.delete('/owners/:userId', sessionAuthMiddleware, adminController.removeOwner)

export default router
