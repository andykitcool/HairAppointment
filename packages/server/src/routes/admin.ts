import Router from 'koa-router'
import * as adminController from '../controllers/admin'
import { authMiddleware } from '../middleware/auth'
import { sessionAuthMiddleware } from '../middleware/session'

const router = new Router({ prefix: '/api/admin' })

// Web 后台超管专用（session 认证）
router.get('/merchants', sessionAuthMiddleware, adminController.getMerchants)
router.post('/merchants', sessionAuthMiddleware, adminController.createMerchant)
router.put('/merchants/:id/status', sessionAuthMiddleware, adminController.updateMerchantStatus)
router.get('/stats', sessionAuthMiddleware, adminController.getPlatformStats)
router.get('/applications', sessionAuthMiddleware, adminController.getApplications)
router.put('/applications/:id/status', sessionAuthMiddleware, adminController.reviewApplication)

export default router
