/** 用户角色 */
export var UserRole;
(function (UserRole) {
    UserRole["CUSTOMER"] = "customer";
    UserRole["PENDING_OWNER"] = "pending_owner";
    UserRole["OWNER"] = "owner";
    UserRole["STAFF"] = "staff";
})(UserRole || (UserRole = {}));
/** 管理员角色 */
export var AdminRole;
(function (AdminRole) {
    AdminRole["SUPER_ADMIN"] = "super_admin";
    AdminRole["OWNER"] = "owner";
})(AdminRole || (AdminRole = {}));
/** 管理员账号类型 */
export var AdminType;
(function (AdminType) {
    AdminType["SYSTEM"] = "system";
    AdminType["MERCHANT"] = "merchant";
})(AdminType || (AdminType = {}));
/** 商户状态 */
export var MerchantStatus;
(function (MerchantStatus) {
    MerchantStatus["PENDING"] = "pending";
    MerchantStatus["APPLYING"] = "applying";
    MerchantStatus["ACTIVE"] = "active";
    MerchantStatus["INACTIVE"] = "inactive";
    MerchantStatus["REJECTED"] = "rejected";
})(MerchantStatus || (MerchantStatus = {}));
/** 预约状态 */
export var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["PENDING"] = "pending";
    AppointmentStatus["CONFIRMED"] = "confirmed";
    AppointmentStatus["IN_PROGRESS"] = "in_progress";
    AppointmentStatus["COMPLETED"] = "completed";
    AppointmentStatus["CANCELLED"] = "cancelled";
    AppointmentStatus["NO_SHOW"] = "no_show";
})(AppointmentStatus || (AppointmentStatus = {}));
/** 预约来源 */
export var AppointmentSource;
(function (AppointmentSource) {
    AppointmentSource["MINI_PROGRAM"] = "mini_program";
    AppointmentSource["COZE"] = "coze";
    AppointmentSource["FEISHU"] = "feishu";
    AppointmentSource["WEB"] = "web";
})(AppointmentSource || (AppointmentSource = {}));
/** 服务分类 */
export var ServiceCategory;
(function (ServiceCategory) {
    ServiceCategory["CUT"] = "cut";
    ServiceCategory["PERM"] = "perm";
    ServiceCategory["DYE"] = "dye";
    ServiceCategory["CARE"] = "care";
})(ServiceCategory || (ServiceCategory = {}));
/** 支付方式 */
export var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["WECHAT"] = "wechat";
    PaymentMethod["ALIPAY"] = "alipay";
    PaymentMethod["CASH"] = "cash";
    PaymentMethod["STORED_VALUE"] = "stored_value";
    PaymentMethod["PUNCH_CARD"] = "punch_card";
    PaymentMethod["OTHER"] = "other";
})(PaymentMethod || (PaymentMethod = {}));
/** 通知渠道 */
export var NotifyChannel;
(function (NotifyChannel) {
    NotifyChannel["WECHAT_SUBSCRIBE"] = "wechat_subscribe";
    NotifyChannel["SMS"] = "sms";
    NotifyChannel["BOTH"] = "both";
})(NotifyChannel || (NotifyChannel = {}));
/** 打烊类型 */
export var ClosedPeriodType;
(function (ClosedPeriodType) {
    ClosedPeriodType["FULL_DAY"] = "full_day";
    ClosedPeriodType["TIME_RANGE"] = "time_range";
})(ClosedPeriodType || (ClosedPeriodType = {}));
/** 同步方向 */
export var SyncDirection;
(function (SyncDirection) {
    SyncDirection["OUTBOUND"] = "outbound";
    SyncDirection["INBOUND"] = "inbound";
})(SyncDirection || (SyncDirection = {}));
/** 同步状态 */
export var SyncStatus;
(function (SyncStatus) {
    SyncStatus["PENDING"] = "pending";
    SyncStatus["SUCCESS"] = "success";
    SyncStatus["FAILED"] = "failed";
})(SyncStatus || (SyncStatus = {}));
/** 同步操作类型 */
export var SyncAction;
(function (SyncAction) {
    SyncAction["CREATE"] = "create";
    SyncAction["UPDATE"] = "update";
    SyncAction["DELETE"] = "delete";
})(SyncAction || (SyncAction = {}));
//# sourceMappingURL=enums.js.map