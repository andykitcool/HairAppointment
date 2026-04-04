import { Context } from 'koa';
/**
 * 获取所有门店列表
 */
export declare function getMerchants(ctx: Context): Promise<void>;
/**
 * 手动添加门店
 */
export declare function createMerchant(ctx: Context): Promise<void>;
/**
 * 审核门店状态
 */
export declare function updateMerchantStatus(ctx: Context): Promise<void>;
/**
 * 平台级统计
 */
export declare function getPlatformStats(ctx: Context): Promise<void>;
/**
 * 获取入驻申请列表
 */
export declare function getApplications(ctx: Context): Promise<void>;
/**
 * 审核入驻申请
 */
export declare function reviewApplication(ctx: Context): Promise<void>;
//# sourceMappingURL=admin.d.ts.map