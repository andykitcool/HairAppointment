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
const serviceController = __importStar(require("../controllers/service"));
const auth_1 = require("../middleware/auth");
const router = new koa_router_1.default({ prefix: '/api/services' });
// 查询服务列表 - 仅需登录（顾客也需要查看服务）
router.get('/', auth_1.authMiddleware, serviceController.getServices);
// 服务管理（增删改）- 只有店长和超管可以操作，店员不能操作
router.post('/', auth_1.authMiddleware, auth_1.requireOwner, serviceController.createService);
router.put('/:id', auth_1.authMiddleware, auth_1.requireOwner, serviceController.updateService);
router.delete('/:id', auth_1.authMiddleware, auth_1.requireOwner, serviceController.deleteService);
exports.default = router;
//# sourceMappingURL=service.js.map