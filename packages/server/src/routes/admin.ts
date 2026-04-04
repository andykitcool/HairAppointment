import Router from 'koa-router'
import * as adminController from '../controllers/admin'
import { authMiddleware } from '../middleware/auth'
import { sessionAuthMiddleware } from '../middleware/session'

const router = new Router({ prefix: '/api/admin' })

// Web 后台超管专用（session 认证）
// 门店管理
router.get('/merchants', sessionAuthMiddleware, adminController.getMerchants)
router.post('/merchants', sessionAuthMiddleware, adminController.createMerchant)
router.put('/merchants/:id/status', sessionAuthMiddleware, adminController.updateMerchantStatus)
router.post('/merchants/:id/reset-password', sessionAuthMiddleware, adminController.resetMerchantAdminPassword)

// 入驻审核
router.get('/applications', sessionAuthMiddleware, adminController.getApplications)
router.post('/merchants/:id/review', sessionAuthMiddleware, adminController.reviewApplication)

// 平台统计
router.get('/stats', sessionAuthMiddleware, adminController.getPlatformStats)

export default router
