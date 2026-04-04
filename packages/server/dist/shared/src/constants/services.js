"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SYNC_MAX_RETRY = exports.APPOINTMENT_REMIND_BEFORE = exports.AUTO_CONFIRM_TIMEOUT = exports.DEFAULT_BUSINESS_HOURS = exports.USER_ROLE_LABELS = exports.MERCHANT_STATUS_LABELS = exports.PAYMENT_METHOD_LABELS = exports.APPOINTMENT_STATUS_LABELS = exports.SERVICE_CATEGORY_LABELS = exports.PRESET_SERVICES = void 0;
/** 预设服务数据 */
exports.PRESET_SERVICES = [
    {
        name: '儿童剪发',
        category: 'cut',
        price: 2000,
        total_duration: 20,
        staff_busy_duration: 20,
        stages: [
            { name: '剪发', duration: 20, staff_busy: true },
        ],
        description: '儿童专属剪发服务',
    },
    {
        name: '男士剪发',
        category: 'cut',
        price: 3000,
        total_duration: 25,
        staff_busy_duration: 25,
        stages: [
            { name: '剪发', duration: 25, staff_busy: true },
        ],
        description: '男士精剪服务',
    },
    {
        name: '女士剪发',
        category: 'cut',
        price: 5000,
        total_duration: 30,
        staff_busy_duration: 30,
        stages: [
            { name: '剪发', duration: 30, staff_busy: true },
        ],
        description: '女士精剪造型服务',
    },
    {
        name: '染发',
        category: 'dye',
        price: 15000,
        total_duration: 80,
        staff_busy_duration: 40,
        stages: [
            { name: '前期准备', duration: 20, staff_busy: true },
            { name: '静置等待', duration: 40, staff_busy: false },
            { name: '洗剪吹收尾', duration: 20, staff_busy: true },
        ],
        description: '专业染发服务，含洗剪吹',
    },
    {
        name: '烫发',
        category: 'perm',
        price: 20000,
        total_duration: 75,
        staff_busy_duration: 50,
        stages: [
            { name: '前期准备', duration: 30, staff_busy: true },
            { name: '冷却定型', duration: 25, staff_busy: false },
            { name: '收尾造型', duration: 20, staff_busy: true },
        ],
        description: '专业烫发服务，含造型',
    },
];
/** 服务分类中文映射 */
exports.SERVICE_CATEGORY_LABELS = {
    cut: '剪发',
    perm: '烫发',
    dye: '染发',
    care: '养护',
};
/** 预约状态中文映射 */
exports.APPOINTMENT_STATUS_LABELS = {
    pending: '待确认',
    confirmed: '已确认',
    in_progress: '服务中',
    completed: '已完成',
    cancelled: '已取消',
    no_show: '未到店',
};
/** 支付方式中文映射 */
exports.PAYMENT_METHOD_LABELS = {
    wechat: '微信支付',
    alipay: '支付宝',
    cash: '现金',
    stored_value: '储值卡',
    punch_card: '次卡',
    other: '其他',
};
/** 商户状态中文映射 */
exports.MERCHANT_STATUS_LABELS = {
    pending: '待审核',
    active: '营业中',
    inactive: '已停业',
    rejected: '已拒绝',
};
/** 用户角色中文映射 */
exports.USER_ROLE_LABELS = {
    customer: '顾客',
    owner: '店长',
    staff: '店员',
};
/** 默认营业时间 */
exports.DEFAULT_BUSINESS_HOURS = {
    start: '09:00',
    end: '21:00',
};
/** 自动确认超时时间（毫秒） */
exports.AUTO_CONFIRM_TIMEOUT = 5 * 60 * 1000; // 5 分钟
/** 预约提醒提前时间（毫秒） */
exports.APPOINTMENT_REMIND_BEFORE = 2 * 60 * 60 * 1000; // 2 小时
/** 同步最大重试次数 */
exports.SYNC_MAX_RETRY = 3;
//# sourceMappingURL=services.js.map