import type { ServiceCategory } from './enums';
/** 服务阶段 */
export interface IServiceStage {
    name: string;
    duration: number;
    staff_busy: boolean;
}
/** 服务项目 */
export interface IService {
    _id?: string;
    service_id: string;
    merchant_id: string;
    name: string;
    category: ServiceCategory;
    price: number;
    total_duration: number;
    staff_busy_duration: number;
    stages: IServiceStage[];
    description?: string;
    is_active: boolean;
    sort_order: number;
    create_time: Date;
    update_time: Date;
}
/** 预约时间线阶段 */
export interface ITimeLineStage {
    stage_name: string;
    start: string;
    end: string;
    staff_busy: boolean;
}
/** 预约记录 */
export interface IAppointment {
    _id?: string;
    appointment_id: string;
    merchant_id: string;
    customer_id?: string;
    customer_name: string;
    customer_phone?: string;
    staff_id: string;
    staff_name: string;
    service_id: string;
    service_name: string;
    date: string;
    start_time: string;
    end_time: string;
    status: string;
    source: string;
    timeline: ITimeLineStage[];
    actual_duration?: number;
    note?: string;
    sequence_num: number;
    _sync_source?: string;
    create_time: Date;
    update_time: Date;
}
/** 交易明细项 */
export interface ITransactionItem {
    service_name: string;
    amount: number;
    quantity: number;
}
/** 交易记录 */
export interface ITransaction {
    _id?: string;
    transaction_id: string;
    merchant_id: string;
    appointment_id?: string;
    customer_id?: string;
    customer_name: string;
    staff_id: string;
    staff_name: string;
    total_amount: number;
    items: ITransactionItem[];
    payment_method: string;
    source: string;
    note?: string;
    transaction_date: string;
    _sync_source?: string;
    create_time: Date;
    update_time: Date;
}
/** 用户 */
export interface IUser {
    _id?: string;
    openid: string;
    union_id?: string;
    nickname: string;
    avatar_url: string;
    phone: string;
    real_name?: string;
    role: string;
    merchant_id?: string;
    customer_note?: string;
    merchant_note?: string;
    visit_count: number;
    total_spending: number;
    last_visit_time?: Date;
    create_time: Date;
    update_time: Date;
}
/** 超级管理员 */
export interface IAdmin {
    _id?: string;
    username: string;
    password_hash: string;
    real_name: string;
    is_active: boolean;
    create_time: Date;
    update_time: Date;
}
/** 员工/发型师 */
export interface IStaff {
    _id?: string;
    staff_id: string;
    merchant_id: string;
    user_id?: string;
    name: string;
    title?: string;
    avatar_url?: string;
    phone?: string;
    service_ids: string[];
    is_active: boolean;
    create_time: Date;
    update_time: Date;
}
/** 营业时间 */
export interface IBusinessHours {
    start: string;
    end: string;
}
/** 延长营业时间配置 */
export interface IExtendedHours {
    start_date: string;
    end_date: string;
    extended_end: string;
}
/** COZE 配置 */
export interface ICozeConfig {
    bot_id: string;
    api_key: string;
    api_endpoint: string;
}
/** 飞书配置 */
export interface IFeishuConfig {
    app_id: string;
    app_secret: string;
    table_tokens: Record<string, string>;
}
/** 短信配置 */
export interface ISmsConfig {
    provider: string;
    access_key_id: string;
    access_key_secret: string;
    sign_name: string;
    template_code: string;
}
/** 消息通知配置 */
export interface INotifyConfig {
    channel: string;
    sms_config?: ISmsConfig;
    wechat_template_ids?: Record<string, string>;
}
/** 飞书同步绑定关系 */
export interface ISyncBinding {
    collection: string;
    table_token: string;
    enabled: boolean;
}
/** 飞书同步配置 */
export interface ISyncConfig {
    enabled: boolean;
    bindings: ISyncBinding[];
}
/** 商户/门店 */
export interface IMerchant {
    _id?: string;
    merchant_id: string;
    name: string;
    address?: string;
    phone: string;
    business_hours: IBusinessHours;
    status: string;
    description?: string;
    cover_image?: string;
    owner_id: string;
    daily_counter: number;
    counter_date: string;
    extended_hours?: IExtendedHours[];
    coze_config?: ICozeConfig;
    feishu_config?: IFeishuConfig;
    notify_config?: INotifyConfig;
    sync_config?: ISyncConfig;
    create_time: Date;
    update_time: Date;
}
/** 打烊/休息时段 */
export interface IShopClosedPeriod {
    _id?: string;
    merchant_id: string;
    date: string;
    type: string;
    start_time?: string;
    end_time?: string;
    reason?: string;
    cancel_appointments?: boolean;
    notify_customers?: boolean;
    created_by: string;
    create_time: Date;
}
/** 同步日志 */
export interface ISyncLog {
    _id?: string;
    merchant_id: string;
    direction: string;
    collection: string;
    action: string;
    record_id: string;
    payload: Record<string, any>;
    status: string;
    retry_count: number;
    error_message?: string;
    create_time: Date;
}
//# sourceMappingURL=models.d.ts.map