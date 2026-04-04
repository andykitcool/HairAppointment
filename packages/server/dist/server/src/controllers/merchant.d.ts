import { Context } from 'koa';
/**
 * 获取商户信息
 */
export declare function getMerchant(ctx: Context): Promise<void>;
/**
 * 更新商户信息
 */
export declare function updateMerchant(ctx: Context): Promise<void>;
/**
 * 创建打烊时段
 */
export declare function createClosedPeriod(ctx: Context): Promise<void>;
/**
 * 获取打烊时段列表
 */
export declare function getClosedPeriods(ctx: Context): Promise<void>;
/**
 * 删除打烊时段
 */
export declare function deleteClosedPeriod(ctx: Context): Promise<void>;
/**
 * 设置延长营业时间
 */
export declare function setExtendedHours(ctx: Context): Promise<void>;
/**
 * 修改延长营业配置
 */
export declare function updateExtendedHours(ctx: Context): Promise<void>;
/**
 * 取消延长营业
 */
export declare function deleteExtendedHours(ctx: Context): Promise<void>;
//# sourceMappingURL=merchant.d.ts.map