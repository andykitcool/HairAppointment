"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncAction = exports.SyncStatus = exports.SyncDirection = exports.ClosedPeriodType = exports.NotifyChannel = exports.PaymentMethod = exports.ServiceCategory = exports.AppointmentSource = exports.AppointmentStatus = exports.MerchantStatus = exports.UserRole = void 0;
/** 用户角色 */
var UserRole;
(function (UserRole) {
    UserRole["CUSTOMER"] = "customer";
    UserRole["OWNER"] = "owner";
    UserRole["STAFF"] = "staff";
})(UserRole || (exports.UserRole = UserRole = {}));
/** 商户状态 */
var MerchantStatus;
(function (MerchantStatus) {
    MerchantStatus["PENDING"] = "pending";
    MerchantStatus["ACTIVE"] = "active";
    MerchantStatus["INACTIVE"] = "inactive";
    MerchantStatus["REJECTED"] = "rejected";
})(MerchantStatus || (exports.MerchantStatus = MerchantStatus = {}));
/** 预约状态 */
var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["PENDING"] = "pending";
    AppointmentStatus["CONFIRMED"] = "confirmed";
    AppointmentStatus["IN_PROGRESS"] = "in_progress";
    AppointmentStatus["COMPLETED"] = "completed";
    AppointmentStatus["CANCELLED"] = "cancelled";
    AppointmentStatus["NO_SHOW"] = "no_show";
})(AppointmentStatus || (exports.AppointmentStatus = AppointmentStatus = {}));
/** 预约来源 */
var AppointmentSource;
(function (AppointmentSource) {
    AppointmentSource["MINI_PROGRAM"] = "mini_program";
    AppointmentSource["COZE"] = "coze";
    AppointmentSource["FEISHU"] = "feishu";
    AppointmentSource["WEB"] = "web";
})(AppointmentSource || (exports.AppointmentSource = AppointmentSource = {}));
/** 服务分类 */
var ServiceCategory;
(function (ServiceCategory) {
    ServiceCategory["CUT"] = "cut";
    ServiceCategory["PERM"] = "perm";
    ServiceCategory["DYE"] = "dye";
    ServiceCategory["CARE"] = "care";
})(ServiceCategory || (exports.ServiceCategory = ServiceCategory = {}));
/** 支付方式 */
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["WECHAT"] = "wechat";
    PaymentMethod["ALIPAY"] = "alipay";
    PaymentMethod["CASH"] = "cash";
    PaymentMethod["STORED_VALUE"] = "stored_value";
    PaymentMethod["PUNCH_CARD"] = "punch_card";
    PaymentMethod["OTHER"] = "other";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
/** 通知渠道 */
var NotifyChannel;
(function (NotifyChannel) {
    NotifyChannel["WECHAT_SUBSCRIBE"] = "wechat_subscribe";
    NotifyChannel["SMS"] = "sms";
    NotifyChannel["BOTH"] = "both";
})(NotifyChannel || (exports.NotifyChannel = NotifyChannel = {}));
/** 打烊类型 */
var ClosedPeriodType;
(function (ClosedPeriodType) {
    ClosedPeriodType["FULL_DAY"] = "full_day";
    ClosedPeriodType["TIME_RANGE"] = "time_range";
})(ClosedPeriodType || (exports.ClosedPeriodType = ClosedPeriodType = {}));
/** 同步方向 */
var SyncDirection;
(function (SyncDirection) {
    SyncDirection["OUTBOUND"] = "outbound";
    SyncDirection["INBOUND"] = "inbound";
})(SyncDirection || (exports.SyncDirection = SyncDirection = {}));
/** 同步状态 */
var SyncStatus;
(function (SyncStatus) {
    SyncStatus["PENDING"] = "pending";
    SyncStatus["SUCCESS"] = "success";
    SyncStatus["FAILED"] = "failed";
})(SyncStatus || (exports.SyncStatus = SyncStatus = {}));
/** 同步操作类型 */
var SyncAction;
(function (SyncAction) {
    SyncAction["CREATE"] = "create";
    SyncAction["UPDATE"] = "update";
    SyncAction["DELETE"] = "delete";
})(SyncAction || (exports.SyncAction = SyncAction = {}));
//# sourceMappingURL=enums.js.map