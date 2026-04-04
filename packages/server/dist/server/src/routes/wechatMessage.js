"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_router_1 = __importDefault(require("koa-router"));
const wechatMessage_1 = require("../controllers/wechatMessage");
const router = new koa_router_1.default({ prefix: '/api/wechat' });
// 微信服务器验证（GET）和消息接收（POST）使用同一个接口
router.get('/message', wechatMessage_1.verifyWechatServer);
router.post('/message', wechatMessage_1.receiveWechatMessage);
exports.default = router;
//# sourceMappingURL=wechatMessage.js.map