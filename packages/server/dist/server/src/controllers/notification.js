"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.broadcast = void 0;
/**
 * 群发通知
 */
async function broadcast(ctx) {
    const { merchant_id, message, target, target_ids } = ctx.request.body;
    const user = ctx.state.user;
    // TODO: 实现群发通知逻辑
    // 1. 根据 notify_config 获取通知渠道
    // 2. 根据渠道发送通知（微信订阅消息/短信）
    // 3. 记录发送日志
    ctx.body = { code: 0, message: '通知已发送', data: null };
}
exports.broadcast = broadcast;
//# sourceMappingURL=notification.js.map