import Router from '@koa/router'
import * as merchantController from '../controllers/merchant'
import { authMiddleware, requireOwner } from '../middleware/auth'
import { cozeAuthMiddleware } from '../middleware/auth'

const router = new Router({ prefix: '/api/merchants' })

// 公开/需认证的查询
router.get('/:id', authMiddleware, merchantController.getMerchant)
router.put('/:id', authMiddleware, requireOwner, merchantController.updateMerchant)

// 打烊管理
router.post('/:id/closed-periods', authMiddleware, requireOwner, merchantController.createClosedPeriod)
router.get('/:id/closed-periods', authMiddleware, merchantController.getClosedPeriods)
router.delete('/:id/closed-periods/:periodId', authMiddleware, requireOwner, merchantController.deleteClosedPeriod)

// 延长营业时间
router.post('/:id/extended-hours', authMiddleware, requireOwner, merchantController.setExtendedHours)
router.put('/:id/extended-hours/:index', authMiddleware, requireOwner, merchantController.updateExtendedHours)
router.delete('/:id/extended-hours/:index', authMiddleware, requireOwner, merchantController.deleteExtendedHours)

export default router
