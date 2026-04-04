"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = void 0;
const koa_router_1 = __importDefault(require("koa-router"));
const auth_js_1 = __importDefault(require("./auth.js"));
const appointment_js_1 = __importDefault(require("./appointment.js"));
const transaction_js_1 = __importDefault(require("./transaction.js"));
const service_js_1 = __importDefault(require("./service.js"));
const merchant_js_1 = __importDefault(require("./merchant.js"));
const customer_js_1 = __importDefault(require("./customer.js"));
const notification_js_1 = __importDefault(require("./notification.js"));
const admin_js_1 = __importDefault(require("./admin.js"));
const feishu_js_1 = __importDefault(require("./feishu.js"));
const wechatConfig_js_1 = __importDefault(require("./wechatConfig.js"));
const wechatMessage_js_1 = __importDefault(require("./wechatMessage.js"));
function registerRoutes(app) {
    const apiRouter = new koa_router_1.default();
    // 注册各业务路由
    apiRouter.use(auth_js_1.default.routes(), auth_js_1.default.allowedMethods());
    apiRouter.use(appointment_js_1.default.routes(), appointment_js_1.default.allowedMethods());
    apiRouter.use(transaction_js_1.default.routes(), transaction_js_1.default.allowedMethods());
    apiRouter.use(service_js_1.default.routes(), service_js_1.default.allowedMethods());
    apiRouter.use(merchant_js_1.default.routes(), merchant_js_1.default.allowedMethods());
    apiRouter.use(customer_js_1.default.routes(), customer_js_1.default.allowedMethods());
    apiRouter.use(notification_js_1.default.routes(), notification_js_1.default.allowedMethods());
    apiRouter.use(admin_js_1.default.routes(), admin_js_1.default.allowedMethods());
    apiRouter.use(feishu_js_1.default.routes(), feishu_js_1.default.allowedMethods());
    apiRouter.use(wechatConfig_js_1.default.routes(), wechatConfig_js_1.default.allowedMethods());
    app.use(apiRouter.routes());
    app.use(apiRouter.allowedMethods());
    // 微信消息接收（单独注册，不需要认证）
    app.use(wechatMessage_js_1.default.routes());
    app.use(wechatMessage_js_1.default.allowedMethods());
    // 健康检查
    app.use(async (ctx) => {
        if (ctx.url === '/health') {
            ctx.body = { status: 'ok', timestamp: new Date().toISOString() };
        }
    });
}
exports.registerRoutes = registerRoutes;
//# sourceMappingURL=index.js.map