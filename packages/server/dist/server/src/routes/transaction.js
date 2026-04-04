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
const transactionController = __importStar(require("../controllers/transaction"));
const statsController = __importStar(require("../controllers/stats"));
const auth_1 = require("../middleware/auth");
const router = new koa_router_1.default({ prefix: '/api' });
// 交易记录 - 店员和店长都可以创建和查看
router.post('/transactions', auth_1.authMiddleware, auth_1.requireStaffOrOwner, transactionController.createTransaction);
router.get('/transactions', auth_1.authMiddleware, auth_1.requireStaffOrOwner, transactionController.getTransactions);
// 营收统计 - 店员和店长都可以查看
router.get('/stats/revenue', auth_1.authMiddleware, auth_1.requireStaffOrOwner, statsController.getRevenueStats);
exports.default = router;
//# sourceMappingURL=transaction.js.map