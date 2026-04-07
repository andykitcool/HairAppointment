import Router from 'koa-router'
import * as staffController from '../controllers/staff.js'
import { authMiddleware, requireOwner, requireStaffOrOwner } from '../middleware/auth.js'

const router = new Router({ prefix: '/api/staff' })

// 员工管理
router.get('/', authMiddleware, requireStaffOrOwner, staffController.getStaffList)
router.post('/', authMiddleware, requireOwner, staffController.createStaff)
router.put('/:id', authMiddleware, requireOwner, staffController.updateStaff)
router.delete('/:id', authMiddleware, requireOwner, staffController.deleteStaff)

export default router
