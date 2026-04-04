"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_router_1 = __importDefault(require("koa-router"));
const wechatConfig_1 = require("../controllers/wechatConfig");
const auth_1 = require("../middleware/auth");
const router = new koa_router_1.default({ prefix: '/api/wechat-config' });
// 所有接口都需要登录
router.get('/', auth_1.authMiddleware, wechatConfig_1.getWechatConfigs);
router.get('/:id', auth_1.authMiddleware, wechatConfig_1.getWechatConfigById);
router.post('/', auth_1.authMiddleware, wechatConfig_1.createWechatConfig);
router.put('/:id', auth_1.authMiddleware, wechatConfig_1.updateWechatConfig);
router.delete('/:id', auth_1.authMiddleware, wechatConfig_1.deleteWechatConfig);
exports.default = router;
//# sourceMappingURL=wechatConfig.js.map