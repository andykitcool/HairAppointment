import Router from 'koa-router'
import * as appointmentController from '../controllers/appointment.js'
import { authMiddleware, ownerOrCozeAuthMiddleware, requireOwner } from '../middleware/auth.js'
import { cozeAuthMiddleware } from '../middleware/auth.js'

const router = new Router({ prefix: '/api' })

// 查询可用时间段（公开，小程序和 COZE 均可访问）
router.get('/slots/available', appointmentController.getAvailableSlots)

// 预约 CRUD（小程序）
router.post('/appointments', authMiddleware, appointmentController.createAppointment)
router.get('/appointments', authMiddleware, appointmentController.getAppointments)
router.get('/appointments/:id', authMiddleware, appointmentController.getAppointmentDetail)
router.put('/appointments/:id', authMiddleware, appointmentController.updateAppointment)
router.delete('/appointments/:id', authMiddleware, appointmentController.cancelAppointment)
router.post('/appointments/:id/confirm', authMiddleware, requireOwner, appointmentController.confirmAppointment)

// COZE 专用
router.post('/appointments/walk-in', cozeAuthMiddleware, appointmentController.walkIn)
router.post('/appointments/:id/start', ownerOrCozeAuthMiddleware, appointmentController.startService)
router.post('/appointments/:id/complete', ownerOrCozeAuthMiddleware, appointmentController.completeService)
router.post('/appointments/:id/no-show', ownerOrCozeAuthMiddleware, appointmentController.markNoShow)

export default router
