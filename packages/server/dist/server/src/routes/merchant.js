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
const merchantController = __importStar(require("../controllers/merchant"));
const auth_1 = require("../middleware/auth");
const router = new koa_router_1.default({ prefix: '/api/merchants' });
// 公开/需认证的查询
router.get('/:id', auth_1.authMiddleware, merchantController.getMerchant);
router.put('/:id', auth_1.authMiddleware, auth_1.requireOwner, merchantController.updateMerchant);
// 打烊管理
router.post('/:id/closed-periods', auth_1.authMiddleware, auth_1.requireOwner, merchantController.createClosedPeriod);
router.get('/:id/closed-periods', auth_1.authMiddleware, merchantController.getClosedPeriods);
router.delete('/:id/closed-periods/:periodId', auth_1.authMiddleware, auth_1.requireOwner, merchantController.deleteClosedPeriod);
// 延长营业时间
router.post('/:id/extended-hours', auth_1.authMiddleware, auth_1.requireOwner, merchantController.setExtendedHours);
router.put('/:id/extended-hours/:index', auth_1.authMiddleware, auth_1.requireOwner, merchantController.updateExtendedHours);
router.delete('/:id/extended-hours/:index', auth_1.authMiddleware, auth_1.requireOwner, merchantController.deleteExtendedHours);
exports.default = router;
//# sourceMappingURL=merchant.js.map