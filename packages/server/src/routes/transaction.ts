import Router from '@koa/router'
import * as transactionController from '../controllers/transaction'
import * as statsController from '../controllers/stats'
import { authMiddleware, requireOwner } from '../middleware/auth'
import { cozeAuthMiddleware } from '../middleware/auth'

const router = new Router({ prefix: '/api' })

// 交易记录
router.post('/transactions', authMiddleware, transactionController.createTransaction)
router.get('/transactions', authMiddleware, transactionController.getTransactions)

// 营收统计
router.get('/stats/revenue', authMiddleware, statsController.getRevenueStats)

export default router
