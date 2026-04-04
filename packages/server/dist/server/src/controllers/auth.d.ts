import { Context } from 'koa';
/**
 * 微信登录
 */
export declare function wechatLogin(ctx: Context): Promise<void>;
/**
 * 获取手机号
 */
export declare function getPhone(ctx: Context): Promise<void>;
/**
 * Web 后台登录（超管/店长）
 */
export declare function adminLogin(ctx: Context): Promise<void>;
/**
 * 申请成为店长
 */
export declare function applyOwner(ctx: Context): Promise<void>;
/**
 * 获取当前用户信息
 */
export declare function getProfile(ctx: Context): Promise<void>;
/**
 * 更新用户信息
 */
export declare function updateProfile(ctx: Context): Promise<void>;
/**
 * 获取店长的管理信息（商户信息+员工列表）
 */
export declare function getAdminInfo(ctx: Context): Promise<void>;
/**
 * 管理员修改密码
 */
export declare function changeAdminPassword(ctx: Context): Promise<void>;
/**
 * 管理员绑定手机号
 */
export declare function bindAdminPhone(ctx: Context): Promise<void>;
/**
 * 获取当前管理员信息
 */
export declare function getAdminProfile(ctx: Context): Promise<void>;
/**
 * 生成微信扫码登录二维码（服务号带参数二维码）
 */
export declare function getWechatLoginQR(ctx: Context): Promise<void>;
/**
 * 查询扫码登录状态（前端轮询使用）
 */
export declare function checkLoginStatus(ctx: Context): Promise<void>;
/**
 * 微信扫码登录回调（由服务号消息推送触发）
 * 这是内部方法，由微信消息接收接口调用
 */
export declare function handleWechatScanEvent(scene: string, openid: string): Promise<{
    success: boolean;
    message: any;
}>;
/**
 * 管理员绑定微信号
 */
export declare function bindAdminWechat(ctx: Context): Promise<void>;
//# sourceMappingURL=auth.d.ts.map