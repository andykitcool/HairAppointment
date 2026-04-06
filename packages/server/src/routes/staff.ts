import Router from 'koa-router'
import * as staffController from '../controllers/staff.js'
import { authMiddleware, requireStaffOrOwner } from '../middleware/auth.js'

const router = new Router({ prefix: '/api/staff' })

// 员工管理
router.get('/', authMiddleware, requireStaffOrOwner, staffController.getStaffList)
router.post('/', authMiddleware, requireStaffOrOwner, staffController.createStaff)
router.put('/:id', authMiddleware, requireStaffOrOwner, staffController.updateStaff)
router.delete('/:id', authMiddleware, requireStaffOrOwner, staffController.deleteStaff)

export default router
