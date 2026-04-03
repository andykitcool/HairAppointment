import Router from '@koa/router'
import * as customerController from '../controllers/customer'
import { authMiddleware, requireOwner } from '../middleware/auth'

const router = new Router({ prefix: '/api/customers' })

router.get('/', authMiddleware, requireOwner, customerController.getCustomers)
router.put('/:id/merchant-note', authMiddleware, requireOwner, customerController.updateMerchantNote)

export default router
