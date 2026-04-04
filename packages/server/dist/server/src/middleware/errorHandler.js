"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
function errorHandler(ctx, next) {
    return next().catch((err) => {
        console.error('[Error]', err.message, err.stack);
        const status = err.status || err.statusCode || 500;
        ctx.status = status;
        ctx.body = {
            code: status,
            message: err.message || 'Internal Server Error',
            data: process.env.NODE_ENV === 'development' ? err.stack : null
        };
    });
}
exports.errorHandler = errorHandler;
//# sourceMappingURL=errorHandler.js.map