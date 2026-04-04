import { Context } from 'koa';
/**
 * 飞书 Webhook 回调
 */
export declare function webhook(ctx: Context): Promise<void>;
/**
 * 手动触发同步
 */
export declare function manualSync(ctx: Context): Promise<void>;
//# sourceMappingURL=feishu.d.ts.map