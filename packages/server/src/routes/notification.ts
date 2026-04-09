import Router from 'koa-router'
import * as notificationController from '../controllers/notification.js'
import { authMiddleware, requireOwner } from '../middleware/auth.js'

const router = new Router({ prefix: '/api/notifications' })

router.post('/broadcast', authMiddleware, requireOwner, notificationController.broadcast)

export default router
