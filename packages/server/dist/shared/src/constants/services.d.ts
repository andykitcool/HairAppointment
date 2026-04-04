import type { ServiceCategory } from '../types/enums';
import type { IServiceStage } from '../types/models';
export interface IPresetService {
    name: string;
    category: ServiceCategory;
    price: number;
    total_duration: number;
    staff_busy_duration: number;
    stages: IServiceStage[];
    description: string;
}
/** 预设服务数据 */
export declare const PRESET_SERVICES: IPresetService[];
/** 服务分类中文映射 */
export declare const SERVICE_CATEGORY_LABELS: Record<string, string>;
/** 预约状态中文映射 */
export declare const APPOINTMENT_STATUS_LABELS: Record<string, string>;
/** 支付方式中文映射 */
export declare const PAYMENT_METHOD_LABELS: Record<string, string>;
/** 商户状态中文映射 */
export declare const MERCHANT_STATUS_LABELS: Record<string, string>;
/** 用户角色中文映射 */
export declare const USER_ROLE_LABELS: Record<string, string>;
/** 默认营业时间 */
export declare const DEFAULT_BUSINESS_HOURS: {
    start: string;
    end: string;
};
/** 自动确认超时时间（毫秒） */
export declare const AUTO_CONFIRM_TIMEOUT: number;
/** 预约提醒提前时间（毫秒） */
export declare const APPOINTMENT_REMIND_BEFORE: number;
/** 同步最大重试次数 */
export declare const SYNC_MAX_RETRY = 3;
//# sourceMappingURL=services.d.ts.map