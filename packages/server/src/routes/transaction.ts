import Router from 'koa-router'
import * as transactionController from '../controllers/transaction.js'
import * as statsController from '../controllers/stats.js'
import { authMiddleware, requireStaffOrOwner, requireOwner } from '../middleware/auth.js'

const router = new Router({ prefix: '/api' })

// 交易记录 - 店员和店长都可以创建和查看
router.post('/transactions', authMiddleware, requireStaffOrOwner, transactionController.createTransaction)
router.get('/transactions', authMiddleware, requireStaffOrOwner, transactionController.getTransactions)
router.get('/transactions/:id', authMiddleware, requireStaffOrOwner, transactionController.getTransactionDetail)
router.put('/transactions/:id', authMiddleware, requireOwner, transactionController.updateTransaction)
router.delete('/transactions/:id', authMiddleware, requireOwner, transactionController.deleteTransaction)

// 营收统计 - 店员和店长都可以查看
router.get('/stats/revenue', authMiddleware, requireStaffOrOwner, statsController.getRevenueStats)

export default router
