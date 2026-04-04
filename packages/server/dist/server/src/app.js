"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const koa_1 = __importDefault(require("koa"));
const koa_body_1 = __importDefault(require("koa-body"));
const cors_1 = __importDefault(require("@koa/cors"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const index_js_1 = require("./config/index.js");
const database_js_1 = require("./config/database.js");
const redis_js_1 = require("./config/redis.js");
const errorHandler_js_1 = require("./middleware/errorHandler.js");
const logger_js_1 = require("./middleware/logger.js");
const index_js_2 = require("./routes/index.js");
const index_js_3 = require("./cron/index.js");
async function bootstrap() {
    await database_js_1.connectDatabase();
    await redis_js_1.connectRedis();
    const app = new koa_1.default();
    app.use(errorHandler_js_1.errorHandler);
    app.use(logger_js_1.logger);
    app.use(cors_1.default({
        origin: ['http://localhost:5173', 'http://localhost:5174'],
        credentials: true,
    }));
    // 微信域名验证文件（业务域名配置用）
    app.use(async (ctx, next) => {
        if (ctx.path.startsWith('/MP_verify_')) {
            const filePath = path_1.default.join(process.cwd(), 'packages', 'server', ctx.path);
            if (fs_1.default.existsSync(filePath)) {
                ctx.type = 'text/plain';
                ctx.body = fs_1.default.readFileSync(filePath, 'utf-8');
                return;
            }
        }
        await next();
    });
    // 微信消息接收需要原始XML body（必须在koaBody之前，且不调用next让koaBody处理）
    app.use(async (ctx, next) => {
        if (ctx.path === '/api/wechat/message' && ctx.method === 'POST') {
            let rawBody = '';
            ctx.req.on('data', (chunk) => {
                rawBody += chunk;
            });
            await new Promise((resolve) => {
                ctx.req.on('end', () => {
                    ctx.request.body = rawBody;
                    console.log('[WechatMessage] Raw body received:', rawBody.substring(0, 500));
                    resolve();
                });
                ctx.req.on('error', (err) => {
                    console.error('[WechatMessage] Error receiving body:', err);
                    resolve();
                });
            });
            await next();
            return;
        }
        await next();
    });

    app.use(koa_body_1.default({
        multipart: true,
        jsonLimit: '10mb',
        formLimit: '10mb',
        onError: (err, ctx) => {
            if (ctx.path === '/api/wechat/message') {
                console.log('[WechatMessage] koaBody error ignored for wechat message');
                return;
            }
            throw err;
        },
    }));
    index_js_2.registerRoutes(app);
    index_js_3.initCronJobs();
    app.listen(index_js_1.config.port, () => {
        console.log(`Server running on http://localhost:${index_js_1.config.port}`);
    });
}
bootstrap().catch(console.error);
//# sourceMappingURL=app.js.map