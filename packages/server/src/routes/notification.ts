import Router from 'koa-router'
import * as notificationController from '../controllers/notification'
import { authMiddleware, requireOwner } from '../middleware/auth'
import { cozeAuthMiddleware } from '../middleware/auth'

const router = new Router({ prefix: '/api/notifications' })

router.post('/broadcast', authMiddleware, requireOwner, notificationController.broadcast)

export default router
