import { Context } from 'koa';
/**
 * 查询可用时间段
 */
export declare function getAvailableSlots(ctx: Context): Promise<void>;
/**
 * 创建预约
 */
export declare function createAppointment(ctx: Context): Promise<void>;
/**
 * 获取预约列表
 */
export declare function getAppointments(ctx: Context): Promise<void>;
/**
 * 获取预约详情
 */
export declare function getAppointmentDetail(ctx: Context): Promise<void>;
/**
 * 修改预约
 */
export declare function updateAppointment(ctx: Context): Promise<void>;
/**
 * 取消预约
 */
export declare function cancelAppointment(ctx: Context): Promise<void>;
/**
 * 确认预约
 */
export declare function confirmAppointment(ctx: Context): Promise<void>;
/**
 * 散客登记（COZE）
 */
export declare function walkIn(ctx: Context): Promise<void>;
/**
 * 开始服务（COZE）
 */
export declare function startService(ctx: Context): Promise<void>;
/**
 * 完成服务并记账（COZE）
 */
export declare function completeService(ctx: Context): Promise<void>;
/**
 * 标记未到店（COZE）
 */
export declare function markNoShow(ctx: Context): Promise<void>;
//# sourceMappingURL=appointment.d.ts.map