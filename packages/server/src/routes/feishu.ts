import Router from 'koa-router'
import * as feishuController from '../controllers/feishu.js'
import { cozeAuthMiddleware } from '../middleware/auth.js'

const router = new Router({ prefix: '/api/feishu' })

router.post('/webhook', feishuController.webhook)
router.post('/sync/:merchantId', feishuController.manualSync)

export default router
