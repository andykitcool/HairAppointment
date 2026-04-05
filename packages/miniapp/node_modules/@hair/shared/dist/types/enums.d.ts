/** 用户角色 */
export declare enum UserRole {
    CUSTOMER = "customer",
    PENDING_OWNER = "pending_owner",
    OWNER = "owner",
    STAFF = "staff"
}
/** 管理员角色 */
export declare enum AdminRole {
    SUPER_ADMIN = "super_admin",
    OWNER = "owner"
}
/** 管理员账号类型 */
export declare enum AdminType {
    SYSTEM = "system",
    MERCHANT = "merchant"
}
/** 商户状态 */
export declare enum MerchantStatus {
    PENDING = "pending",
    APPLYING = "applying",
    ACTIVE = "active",
    INACTIVE = "inactive",
    REJECTED = "rejected"
}
/** 预约状态 */
export declare enum AppointmentStatus {
    PENDING = "pending",
    CONFIRMED = "confirmed",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    NO_SHOW = "no_show"
}
/** 预约来源 */
export declare enum AppointmentSource {
    MINI_PROGRAM = "mini_program",
    COZE = "coze",
    FEISHU = "feishu",
    WEB = "web"
}
/** 服务分类 */
export declare enum ServiceCategory {
    CUT = "cut",
    PERM = "perm",
    DYE = "dye",
    CARE = "care"
}
/** 支付方式 */
export declare enum PaymentMethod {
    WECHAT = "wechat",
    ALIPAY = "alipay",
    CASH = "cash",
    STORED_VALUE = "stored_value",
    PUNCH_CARD = "punch_card",
    OTHER = "other"
}
/** 通知渠道 */
export declare enum NotifyChannel {
    WECHAT_SUBSCRIBE = "wechat_subscribe",
    SMS = "sms",
    BOTH = "both"
}
/** 打烊类型 */
export declare enum ClosedPeriodType {
    FULL_DAY = "full_day",
    TIME_RANGE = "time_range"
}
/** 同步方向 */
export declare enum SyncDirection {
    OUTBOUND = "outbound",
    INBOUND = "inbound"
}
/** 同步状态 */
export declare enum SyncStatus {
    PENDING = "pending",
    SUCCESS = "success",
    FAILED = "failed"
}
/** 同步操作类型 */
export declare enum SyncAction {
    CREATE = "create",
    UPDATE = "update",
    DELETE = "delete"
}
//# sourceMappingURL=enums.d.ts.map