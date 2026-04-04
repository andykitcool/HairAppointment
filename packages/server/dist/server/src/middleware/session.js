"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionAuthMiddleware = void 0;
// Session 中间件已废弃，现在使用 JWT 认证
// 保留此文件仅为兼容旧代码引用
function sessionAuthMiddleware(ctx, next) {
    // 此中间件已不再使用，直接放行
    return next();
}
exports.sessionAuthMiddleware = sessionAuthMiddleware;
//# sourceMappingURL=session.js.map