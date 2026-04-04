import { Context } from 'koa';
/**
 * 获取微信配置列表
 */
export declare function getWechatConfigs(ctx: Context): Promise<void>;
/**
 * 获取单个微信配置
 */
export declare function getWechatConfigById(ctx: Context): Promise<void>;
/**
 * 创建微信配置
 */
export declare function createWechatConfig(ctx: Context): Promise<void>;
/**
 * 更新微信配置
 */
export declare function updateWechatConfig(ctx: Context): Promise<void>;
/**
 * 删除微信配置
 */
export declare function deleteWechatConfig(ctx: Context): Promise<void>;
/**
 * 获取当前激活的服务号配置（内部使用）
 */
export declare function getActiveServiceConfig(): Promise<{
    appid: string;
    app_secret: string;
    token: string;
} | null>;
/**
 * 获取当前激活的小程序配置（内部使用）
 */
export declare function getActiveMpConfig(): Promise<{
    appid: string;
    app_secret: string;
} | null>;
//# sourceMappingURL=wechatConfig.d.ts.map