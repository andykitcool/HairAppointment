"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_router_1 = __importDefault(require("koa-router"));
const appointmentController = __importStar(require("../controllers/appointment"));
const auth_1 = require("../middleware/auth");
const auth_2 = require("../middleware/auth");
const router = new koa_router_1.default({ prefix: '/api' });
// 查询可用时间段（公开，小程序和 COZE 均可访问）
router.get('/slots/available', appointmentController.getAvailableSlots);
// 预约 CRUD（小程序）
router.post('/appointments', auth_1.authMiddleware, appointmentController.createAppointment);
router.get('/appointments', auth_1.authMiddleware, appointmentController.getAppointments);
router.get('/appointments/:id', auth_1.authMiddleware, appointmentController.getAppointmentDetail);
router.put('/appointments/:id', auth_1.authMiddleware, appointmentController.updateAppointment);
router.delete('/appointments/:id', auth_1.authMiddleware, appointmentController.cancelAppointment);
router.post('/appointments/:id/confirm', auth_1.authMiddleware, auth_1.requireOwner, appointmentController.confirmAppointment);
// COZE 专用
router.post('/appointments/walk-in', auth_2.cozeAuthMiddleware, appointmentController.walkIn);
router.post('/appointments/:id/start', auth_2.cozeAuthMiddleware, appointmentController.startService);
router.post('/appointments/:id/complete', auth_2.cozeAuthMiddleware, appointmentController.completeService);
router.post('/appointments/:id/no-show', auth_2.cozeAuthMiddleware, appointmentController.markNoShow);
exports.default = router;
//# sourceMappingURL=appointment.js.map