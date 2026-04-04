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
const authController = __importStar(require("../controllers/auth"));
const auth_1 = require("../middleware/auth");
const router = new koa_router_1.default({ prefix: '/api/auth' });
// 公开接口
router.post('/wechat-login', authController.wechatLogin);
router.post('/phone', authController.getPhone);
router.post('/admin-login', authController.adminLogin);
router.post('/apply-owner', authController.applyOwner);
// 微信扫码登录相关（公开接口）
router.get('/wechat-login-qr', authController.getWechatLoginQR);
router.get('/wechat-login-status', authController.checkLoginStatus);
// 微信绑定相关（需要登录）
router.get('/wechat-bind-qr', auth_1.authMiddleware, authController.getWechatBindQR);
router.get('/wechat-bind-status', auth_1.authMiddleware, authController.checkBindStatus);
// 需要登录的接口
router.get('/profile', auth_1.authMiddleware, authController.getProfile);
router.put('/profile', auth_1.authMiddleware, authController.updateProfile);
// 需要 owner 权限
router.get('/admin-info', auth_1.authMiddleware, auth_1.requireOwner, authController.getAdminInfo);
// 管理员专用接口
router.get('/admin/profile', auth_1.authMiddleware, authController.getAdminProfile);
router.put('/admin/password', auth_1.authMiddleware, authController.changeAdminPassword);
router.put('/admin/phone', auth_1.authMiddleware, authController.bindAdminPhone);
router.put('/admin/wechat', auth_1.authMiddleware, authController.bindAdminWechat);
exports.default = router;
//# sourceMappingURL=auth.js.map