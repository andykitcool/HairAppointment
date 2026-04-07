import Router from 'koa-router'
import * as serviceController from '../controllers/service.js'
import { authMiddleware, requireOwner } from '../middleware/auth.js'

const router = new Router({ prefix: '/api/services' })

// 查询服务列表 - 仅需登录（顾客也需要查看服务）
router.get('/', authMiddleware, serviceController.getServices)

// 服务管理（增删改）- 只有店长和超管可以操作，店员不能操作
router.post('/', authMiddleware, requireOwner, serviceController.createService)
router.put('/:id', authMiddleware, requireOwner, serviceController.updateService)
router.delete('/:id', authMiddleware, requireOwner, serviceController.deleteService)

export default router
