import Router from 'koa-router'
import * as customerController from '../controllers/customer.js'
import { authMiddleware, requireOwner } from '../middleware/auth.js'

const router = new Router({ prefix: '/api/customers' })

router.get('/', authMiddleware, requireOwner, customerController.getCustomers)
router.put('/:id', authMiddleware, requireOwner, customerController.updateCustomer)
router.delete('/:id', authMiddleware, requireOwner, customerController.deleteCustomer)
router.put('/:id/merchant-note', authMiddleware, requireOwner, customerController.updateMerchantNote)

export default router
