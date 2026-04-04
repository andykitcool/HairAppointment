"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
function logger(ctx, next) {
    const start = Date.now();
    return next().then(() => {
        const ms = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${ctx.method} ${ctx.url} - ${ctx.status} (${ms}ms)`);
    });
}
exports.logger = logger;
//# sourceMappingURL=logger.js.map