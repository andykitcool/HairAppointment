import Router from '@koa/router'
import * as serviceController from '../controllers/service'
import { authMiddleware } from '../middleware/auth'

const router = new Router({ prefix: '/api/services' })

router.get('/', authMiddleware, serviceController.getServices)
router.post('/', authMiddleware, serviceController.createService)
router.put('/:id', authMiddleware, serviceController.updateService)
router.delete('/:id', authMiddleware, serviceController.deleteService)

export default router
