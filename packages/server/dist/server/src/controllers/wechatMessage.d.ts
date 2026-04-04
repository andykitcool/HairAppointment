import { Context } from 'koa';
/**
 * 验证微信服务器签名（用于服务器配置时的验证）
 * GET /api/wechat/message
 */
export declare function verifyWechatServer(ctx: Context): Promise<void>;
/**
 * 接收微信消息和事件推送
 * POST /api/wechat/message
 */
export declare function receiveWechatMessage(ctx: Context): Promise<void>;
//# sourceMappingURL=wechatMessage.d.ts.map