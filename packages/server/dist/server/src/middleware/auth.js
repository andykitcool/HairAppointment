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
exports.cozeAuthMiddleware = exports.requireOwner = exports.authMiddleware = exports.verifyJwt = exports.signJwt = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const JWT_SECRET = process.env.JWT_SECRET || 'hair-appointment-jwt-secret';
/**
 * 生成 JWT Token
 */
function signJwt(payload) {
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
exports.signJwt = signJwt;
/**
 * 验证 JWT Token
 */
function verifyJwt(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch {
        return null;
    }
}
exports.verifyJwt = verifyJwt;
/**
 * 小程序 JWT 认证中间件（支持用户和管理员）
 */
async function authMiddleware(ctx, next) {
    const authHeader = ctx.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        ctx.status = 401;
        ctx.body = { code: 401, message: '未登录或 token 已过期', data: null };
        return;
    }
    const token = authHeader.slice(7);
    const payload = verifyJwt(token);
    if (!payload) {
        ctx.status = 401;
        ctx.body = { code: 401, message: 'token 无效', data: null };
        return;
    }
    // 根据类型查找用户（支持 admin 和 customer/owner）
    let user = null;
    if (payload.type === 'admin') {
        user = await models_1.AdminModel.findById(payload.user_id);
    }
    else {
        user = await models_1.UserModel.findById(payload.user_id);
    }
    if (!user) {
        ctx.status = 401;
        ctx.body = { code: 401, message: '用户不存在', data: null };
        return;
    }
    ctx.state.user = {
        _id: user._id,
        openid: user.openid,
        role: payload.type === 'admin' ? 'super_admin' : user.role,
        merchant_id: user.merchant_id,
    };
    ctx.state.jwtPayload = payload;
    await next();
}
exports.authMiddleware = authMiddleware;
/**
 * 要求店长或超管权限（店员不允许）
 */
function requireOwner(ctx, next) {
    const role = ctx.state.user?.role;
    const allowedRoles = ['owner', 'super_admin'];
    if (!allowedRoles.includes(role)) {
        ctx.status = 403;
        ctx.body = { code: 403, message: '需要店长权限', data: null };
        return;
    }
    return next();
}
exports.requireOwner = requireOwner;

/**
 * 要求店员或店长权限
 * 用于：交易记账等店员可操作的功能
 */
function requireStaffOrOwner(ctx, next) {
    const role = ctx.state.user?.role;
    const allowedRoles = ['staff', 'owner', 'super_admin'];
    if (!allowedRoles.includes(role)) {
        ctx.status = 403;
        ctx.body = { code: 403, message: '需要员工权限', data: null };
        return;
    }
    return next();
}
exports.requireStaffOrOwner = requireStaffOrOwner;
/**
 * COZE API Key 认证中间件
 */
async function cozeAuthMiddleware(ctx, next) {
    const merchantId = ctx.headers['x-merchant-id'];
    const apiKey = ctx.headers['x-api-key'];
    if (!merchantId || !apiKey) {
        ctx.status = 401;
        ctx.body = { code: 401, message: '缺少 merchant_id 或 api_key', data: null };
        return;
    }
    // 验证 API Key（从商户的 coze_config 中获取）
    const { MerchantModel } = await Promise.resolve().then(() => __importStar(require('../models')));
    const merchant = await MerchantModel.findOne({ merchant_id: merchantId });
    if (!merchant || merchant.coze_config?.api_key !== apiKey) {
        ctx.status = 401;
        ctx.body = { code: 401, message: 'api_key 无效', data: null };
        return;
    }
    ctx.state.merchantId = merchantId;
    ctx.state.merchant = merchant;
    await next();
}
exports.cozeAuthMiddleware = cozeAuthMiddleware;
//# sourceMappingURL=auth.js.map