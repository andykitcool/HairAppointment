"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.manualSync = exports.webhook = void 0;
/**
 * 飞书 Webhook 回调
 */
async function webhook(ctx) {
    const body = ctx.request.body;
    // TODO: 验证飞书签名
    // TODO: 根据 webhook 事件处理飞书数据变更
    // TODO: 同步到本地数据库
    ctx.body = { code: 0, message: 'ok', data: null };
}
exports.webhook = webhook;
/**
 * 手动触发同步
 */
async function manualSync(ctx) {
    const { merchantId } = ctx.params;
    // TODO: 从本地同步到飞书
    ctx.body = { code: 0, message: '同步已触发', data: null };
}
exports.manualSync = manualSync;
//# sourceMappingURL=feishu.js.map