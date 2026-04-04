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
const adminController = __importStar(require("../controllers/admin"));
const session_1 = require("../middleware/session");
const router = new koa_router_1.default({ prefix: '/api/admin' });
// Web 后台超管专用（session 认证）
router.get('/merchants', session_1.sessionAuthMiddleware, adminController.getMerchants);
router.post('/merchants', session_1.sessionAuthMiddleware, adminController.createMerchant);
router.put('/merchants/:id/status', session_1.sessionAuthMiddleware, adminController.updateMerchantStatus);
router.get('/stats', session_1.sessionAuthMiddleware, adminController.getPlatformStats);
router.get('/applications', session_1.sessionAuthMiddleware, adminController.getApplications);
router.put('/applications/:id/status', session_1.sessionAuthMiddleware, adminController.reviewApplication);
exports.default = router;
//# sourceMappingURL=admin.js.map