import Router from 'koa-router'
import * as merchantController from '../controllers/merchant.js'
import { authMiddleware, requireOwner } from '../middleware/auth.js'

const router = new Router({ prefix: '/api/merchants' })

// 店长申请入驻（小程序端）
router.post('/apply', authMiddleware, merchantController.applyMerchant)
router.get('/apply-status', authMiddleware, merchantController.getApplyStatus)

// 公开搜索（必须在 /:id 之前注册，避免路由冲突）
router.get('/search', merchantController.searchMerchants)
router.get('/nearby', merchantController.getNearbyMerchants)

// 公开/需认证的查询
router.get('/:id', authMiddleware, merchantController.getMerchant)
router.put('/:id', authMiddleware, requireOwner, merchantController.updateMerchant)

// 门店展示设置
router.get('/:id/display-settings', merchantController.getDisplaySettings)
router.put('/:id/display-settings', authMiddleware, requireOwner, merchantController.updateDisplaySettings)

// 顾客设置（会员级别字典）
router.get('/:id/customer-settings', authMiddleware, merchantController.getCustomerSettings)
router.put('/:id/customer-settings', authMiddleware, requireOwner, merchantController.updateCustomerSettings)

// 数据备份
router.post('/:id/backup/send-email', authMiddleware, requireOwner, merchantController.sendBackupEmail)

export default router
